/**
 * .ascii — converts the spatial luminance channel of an image (or a frame
 * of a video) into a monospace ASCII matrix.
 *
 * Implementation: FFmpeg extracts a downscaled single frame as RAW 8-bit
 * grayscale pixels; JS maps each luma byte onto a density ramp. Character
 * cells are ~2× taller than wide, so vertical resolution is halved to keep
 * aspect ratio believable.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { AttachmentBuilder } from 'discord.js';
import {
  assertFfmpegAvailable,
  resolveMediaInput,
  runFfmpeg,
  ffprobe,
  tmpPath,
  cleanupPaths,
} from '../../services/media.js';
import { processingEmbed, errorEmbed, successEmbed } from '../../core/embeds.js';
import { codeBlock } from '../../utils/text.js';

const DENSITY_RAMP = ' .:-=+*#%@'; // dark → bright luminance buckets

export default {
  name: 'ascii',
  category: 'Media Effects',
  description: 'Renders an image (or video frame) as ASCII art.',
  usage: '.ascii [width 20-120] (attach media / reply / URL)',
  aliases: ['asciify'],
  cooldownMs: 8000,
  options: [
    { name: 'width', type: 'integer', description: 'Output width in characters, 20–120 (default 56)', required: false },
    { name: 'media', type: 'attachment', description: 'Image or video to convert', required: false },
    { name: 'url', type: 'string', description: 'Direct media URL (alternative to attaching)', required: false },
  ],
  async execute(ctx) {
    const width = Math.min(120, Math.max(20, ctx.getOption('width', 56)));
    const trash = [];
    try {
      await assertFfmpegAvailable();
      await ctx.defer();
      await ctx.reply({ embeds: [processingEmbed('ASCII conversion', 'Sampling luminance matrix…')] });

      const input = await resolveMediaInput(ctx);
      trash.push(input.path);

      // Probe source dimensions to preserve aspect (char cells ≈ 2:1 tall).
      const meta = await ffprobe(input.path);
      const stream = meta.streams?.find((s) => s.codec_type === 'video');
      if (!stream?.width || !stream?.height) throw new Error('Could not read the source dimensions.');
      const height = Math.max(4, Math.round((stream.height / stream.width) * width * 0.5));

      const raw = await tmpPath('gray');
      trash.push(raw);
      await runFfmpeg([
        '-i', input.path,
        '-vf', `scale=${width}:${height}:flags=area`,
        '-frames:v', '1',
        '-f', 'rawvideo', '-pix_fmt', 'gray',
        raw,
      ]);

      const pixels = await readFile(raw);
      const lines = [];
      for (let y = 0; y < height; y += 1) {
        let line = '';
        for (let x = 0; x < width; x += 1) {
          const luma = pixels[y * width + x] ?? 0;
          line += DENSITY_RAMP[Math.min(DENSITY_RAMP.length - 1, Math.floor((luma / 256) * DENSITY_RAMP.length))];
        }
        lines.push(line);
      }
      const art = lines.join('\n');

      // Small enough → inline code block; otherwise ship as a text file.
      if (art.length <= 1900) {
        await ctx.edit({ content: codeBlock(art), embeds: [] });
      } else {
        const txt = await tmpPath('txt');
        trash.push(txt);
        await writeFile(txt, art, 'utf8');
        await ctx.edit({
          embeds: [successEmbed('ASCII conversion — complete', `Matrix too large for chat (${width}×${height}) — attached as a file.`)],
          files: [new AttachmentBuilder(txt, { name: 'ascii.txt' })],
        });
      }
    } catch (error) {
      await ctx.edit({ embeds: [errorEmbed('ASCII conversion failed', error.message)] }).catch(() => {});
    } finally {
      await cleanupPaths(trash);
    }
  },
};
