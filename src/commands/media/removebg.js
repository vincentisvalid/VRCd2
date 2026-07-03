/**
 * .removebg — background removal.
 *
 * Primary path: the remove.bg AI endpoint (when REMOVEBG_API_KEY is set) —
 * true subject segmentation on arbitrary photos.
 * Fallback path: a local FFmpeg `colorkey` filter, which cleanly strips
 * uniform backdrops (defaults to green) into transparency.
 */
import { readFile, writeFile } from 'node:fs/promises';
import axios from 'axios';
import { runEffectPipeline } from './_pipeline.js';
import { runFfmpeg, tmpPath } from '../../services/media.js';
import { config } from '../../core/config.js';

const HEX_COLOR = /^#?([0-9a-f]{6})$/i;

async function removeViaApi(inputPath, outputPath) {
  const form = new FormData();
  const buffer = await readFile(inputPath);
  form.append('image_file', new Blob([buffer]), 'input.png');
  form.append('size', 'auto');

  const response = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
    headers: { 'X-Api-Key': config.env.removeBgApiKey },
    responseType: 'arraybuffer',
    timeout: 60_000,
    validateStatus: (status) => status < 500,
  });
  if (response.status !== 200) {
    const detail = Buffer.from(response.data).toString('utf8').slice(0, 200);
    throw new Error(`remove.bg rejected the request (HTTP ${response.status}): ${detail}`);
  }
  await writeFile(outputPath, Buffer.from(response.data));
}

export default {
  name: 'removebg',
  category: 'Media Effects',
  description: 'Removes the background from an image (AI endpoint, or local colour-key fallback).',
  usage: '.removebg [color hex for local key] (attach an image / reply)',
  aliases: ['nobg'],
  cooldownMs: 10000,
  options: [
    { name: 'color', type: 'string', description: 'Backdrop colour for the local key fallback (default 00FF00)', required: false },
    { name: 'media', type: 'attachment', description: 'Image to process', required: false },
    { name: 'url', type: 'string', description: 'Direct image URL (alternative to attaching)', required: false },
  ],
  async execute(ctx) {
    const colorRaw = ctx.getOption('color', '00FF00');
    const colorMatch = HEX_COLOR.exec(colorRaw);
    if (!colorMatch) return ctx.replyError('Invalid colour', `\`${colorRaw}\` is not a hex colour like \`00FF00\`.`);
    const keyColor = `0x${colorMatch[1].toUpperCase()}`;

    await runEffectPipeline(ctx, {
      title: 'Background removal',
      kinds: ['image'],
      process: async (input) => {
        const output = await tmpPath('png');

        if (config.env.removeBgApiKey) {
          try {
            await removeViaApi(input.path, output);
            return { path: output, isVideo: false, filename: 'removebg.png', compress: false };
          } catch (apiError) {
            // Graceful degradation: fall through to the local colour key.
            await ctx.followUp({
              content: `⚠️ AI endpoint failed (${apiError.message}) — falling back to the local colour key.`,
            }).catch(() => {});
          }
        }

        // Local fallback: strip the (near-)uniform backdrop into alpha.
        await runFfmpeg([
          '-i', input.path,
          '-vf', `colorkey=${keyColor}:0.3:0.1,format=rgba`,
          '-frames:v', '1',
          output,
        ]);
        return { path: output, isVideo: false, filename: 'removebg.png', compress: false };
      },
    });
  },
};
