/**
 * .vredit — flat → stereoscopic VR conversion.
 *
 * Maps a flat landscape asset into dual-barrel fisheye lenses arranged
 * side-by-side for stereoscopic VR viewers:
 *   split      → duplicate the flat source per eye
 *   v360       → gnomonic (flat) input reprojected to a fisheye barrel;
 *                per-eye yaw offset (±1.5°) supplies horizontal parallax
 *   hstack     → left/right barrels composited into the SBS frame
 */
import { runEffectPipeline } from './_pipeline.js';
import { runFfmpeg, ffprobe, tmpPath } from '../../services/media.js';

const EYE_SIZE = 1080; // square barrel per eye
const PARALLAX_YAW = 1.5; // degrees of horizontal separation

function buildGraph() {
  const eye = (yaw, label) =>
    `v360=input=flat:ih_fov=100:iv_fov=100:output=fisheye:h_fov=180:v_fov=180` +
    `:w=${EYE_SIZE}:h=${EYE_SIZE}:yaw=${yaw}[${label}]`;
  return (
    `[0:v]format=yuv420p,split=2[le][re];` +
    `[le]${eye(-PARALLAX_YAW, 'l')};` +
    `[re]${eye(PARALLAX_YAW, 'r')};` +
    `[l][r]hstack=inputs=2[out]`
  );
}

export default {
  name: 'vredit',
  category: 'Media Effects',
  description: 'Converts flat media into side-by-side dual-fisheye stereoscopic VR format.',
  usage: '.vredit (attach video/image / reply / URL)',
  aliases: ['vr180'],
  cooldownMs: 12000,
  options: [
    { name: 'media', type: 'attachment', description: 'Flat video or image to convert', required: false },
    { name: 'url', type: 'string', description: 'Direct media URL (alternative to attaching)', required: false },
  ],
  async execute(ctx) {
    await runEffectPipeline(ctx, {
      title: 'VR stereoscopic edit',
      process: async (input) => {
        const graph = buildGraph();

        if (input.isVideo) {
          const meta = await ffprobe(input.path).catch(() => null);
          const hasAudio = Boolean(meta?.streams?.some((stream) => stream.codec_type === 'audio'));
          const output = await tmpPath('mp4');
          await runFfmpeg([
            '-i', input.path,
            '-filter_complex', graph,
            '-map', '[out]', ...(hasAudio ? ['-map', '0:a', '-c:a', 'copy'] : []),
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            output,
          ]);
          return { path: output, isVideo: true, filename: 'vredit-sbs.mp4' };
        }

        const output = await tmpPath('png');
        await runFfmpeg(['-i', input.path, '-filter_complex', graph, '-map', '[out]', '-frames:v', '1', output]);
        return { path: output, isVideo: false, filename: 'vredit-sbs.png' };
      },
    });
  },
};
