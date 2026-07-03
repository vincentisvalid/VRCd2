/**
 * .greenscreen — chroma-key extraction over a configurable hue threshold,
 * compositing the keyed foreground onto a secondary background image.
 *
 * Filtergraph: the background (input 1) is scaled to the foreground's
 * dimensions via scale2ref, the foreground is keyed with `chromakey`, and
 * the layers are recombined with `overlay`.
 */
import { runEffectPipeline } from './_pipeline.js';
import { runFfmpeg, ffprobe, tmpPath, downloadToTmp } from '../../services/media.js';

const HEX_COLOR = /^#?([0-9a-f]{6})$/i;

export default {
  name: 'greenscreen',
  category: 'Media Effects',
  description: 'Chroma-keys a green (or custom) backdrop out and composites a new background image.',
  usage: '.greenscreen <background_url> [color hex] [similarity 0.01-1] (attach media / reply)',
  aliases: ['chromakey'],
  cooldownMs: 10000,
  options: [
    { name: 'background', type: 'string', description: 'Direct URL of the replacement background image', required: true },
    { name: 'color', type: 'string', description: 'Key colour hex (default 00FF00)', required: false },
    { name: 'similarity', type: 'number', description: 'Key similarity 0.01–1 (default 0.28)', required: false },
    { name: 'media', type: 'attachment', description: 'Foreground video or image', required: false },
  ],
  async execute(ctx) {
    const backgroundUrl = ctx.getOption('background');
    if (!/^https?:\/\//i.test(backgroundUrl)) {
      return ctx.replyError('Invalid background', 'Pass a direct `http(s)` image URL as the background.');
    }
    const colorRaw = ctx.getOption('color', '00FF00');
    const colorMatch = HEX_COLOR.exec(colorRaw);
    if (!colorMatch) return ctx.replyError('Invalid colour', `\`${colorRaw}\` is not a hex colour like \`00FF00\`.`);
    const keyColor = `0x${colorMatch[1].toUpperCase()}`;
    const similarity = Math.min(1, Math.max(0.01, ctx.getOption('similarity', 0.28)));

    await runEffectPipeline(ctx, {
      title: 'Greenscreen composite',
      process: async (input, trash) => {
        const background = await downloadToTmp(backgroundUrl);
        trash.push(background.path);
        if (!background.contentType.startsWith('image/')) {
          throw new Error('The background URL must point to an image.');
        }

        // scale2ref sizes the background to the foreground, chromakey cuts
        // the hue window, overlay recombines. blend=0.08 feathers edges.
        const graph =
          `[1:v][0:v]scale2ref[bg][ref];` +
          `[ref]chromakey=${keyColor}:${similarity.toFixed(3)}:0.08[fg];` +
          `[bg][fg]overlay=shortest=1:format=auto,format=yuv420p[out]`;

        if (input.isVideo) {
          const meta = await ffprobe(input.path).catch(() => null);
          const hasAudio = Boolean(meta?.streams?.some((stream) => stream.codec_type === 'audio'));
          const output = await tmpPath('mp4');
          await runFfmpeg([
            '-i', input.path,
            '-loop', '1', '-i', background.path,
            '-filter_complex', graph,
            '-map', '[out]', ...(hasAudio ? ['-map', '0:a', '-c:a', 'aac'] : []),
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22',
            '-movflags', '+faststart',
            output,
          ]);
          return { path: output, isVideo: true, filename: 'greenscreen.mp4' };
        }

        const output = await tmpPath('png');
        await runFfmpeg([
          '-i', input.path,
          '-i', background.path,
          '-filter_complex', graph,
          '-map', '[out]', '-frames:v', '1',
          output,
        ]);
        return { path: output, isVideo: false, filename: 'greenscreen.png' };
      },
    });
  },
};
