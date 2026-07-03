/**
 * .glitch — digital datamoshing / bitstream corrupter.
 *
 * Three-stage design:
 *   1. Re-encode the source with a very long GOP (one keyframe) so induced
 *      errors smear across P-frames — the classic datamosh look.
 *   2. Corrupt the intermediate at the BIT level in JS: random byte flips
 *      across the payload region, deliberately sparing the container header
 *      so the file stays demuxable.
 *   3. Decode with error concealment (`-err_detect ignore_err`) into a
 *      clean, universally playable H.264 artifact.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { randomInt } from 'node:crypto';
import { runEffectPipeline } from './_pipeline.js';
import { runFfmpeg, tmpPath } from '../../services/media.js';

/** Flips random bits in-place, skipping the header guard region. */
function corruptBuffer(buffer, intensity) {
  const guard = Math.min(8192, Math.floor(buffer.length * 0.02)); // protect container boxes
  const corruptible = buffer.length - guard;
  if (corruptible <= 0) return;
  // ~1 corruption per 400 KB at intensity 1, scaling linearly to 10.
  const hits = Math.max(4, Math.floor((corruptible / 400_000) * intensity));
  for (let i = 0; i < hits; i += 1) {
    const offset = guard + randomInt(corruptible);
    buffer[offset] ^= 1 << randomInt(8); // single random bit flip
  }
}

export default {
  name: 'glitch',
  category: 'Media Effects',
  description: 'Datamoshes a video or image with real bitstream corruption.',
  usage: '.glitch [intensity 1-10] (attach media / reply / URL)',
  aliases: ['datamosh'],
  cooldownMs: 10000,
  options: [
    { name: 'intensity', type: 'integer', description: 'Corruption intensity 1–10 (default 4)', required: false },
    { name: 'media', type: 'attachment', description: 'Video or image to glitch', required: false },
    { name: 'url', type: 'string', description: 'Direct media URL (alternative to attaching)', required: false },
  ],
  async execute(ctx) {
    const intensity = Math.min(10, Math.max(1, ctx.getOption('intensity', 4)));

    await runEffectPipeline(ctx, {
      title: 'Glitch',
      process: async (input, trash) => {
        if (input.isVideo) {
          // Stage 1 — long-GOP intermediate.
          const longGop = await tmpPath('mp4');
          trash.push(longGop);
          await runFfmpeg([
            '-i', input.path,
            '-c:v', 'libx264', '-preset', 'veryfast', '-g', '9999', '-bf', '0',
            '-pix_fmt', 'yuv420p', '-c:a', 'aac',
            longGop,
          ]);

          // Stage 2 — bit-level corruption.
          const buffer = await readFile(longGop);
          corruptBuffer(buffer, intensity);
          const corrupted = await tmpPath('mp4');
          trash.push(corrupted);
          await writeFile(corrupted, buffer);

          // Stage 3 — error-concealed decode into a playable artifact.
          const output = await tmpPath('mp4');
          await runFfmpeg([
            '-err_detect', 'ignore_err', '-fflags', '+genpts+discardcorrupt',
            '-i', corrupted,
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-movflags', '+faststart',
            output,
          ]);
          return { path: output, isVideo: true, filename: 'glitch.mp4' };
        }

        // Image path: corrupt a baseline JPEG's scan data, then decode with concealment.
        const jpeg = await tmpPath('jpg');
        trash.push(jpeg);
        await runFfmpeg(['-i', input.path, '-q:v', '4', jpeg]);
        const buffer = await readFile(jpeg);
        corruptBuffer(buffer, intensity * 2); // stills tolerate (and need) more hits
        const corrupted = await tmpPath('jpg');
        trash.push(corrupted);
        await writeFile(corrupted, buffer);

        const output = await tmpPath('png');
        await runFfmpeg(['-err_detect', 'ignore_err', '-i', corrupted, output]);
        return { path: output, isVideo: false, filename: 'glitch.png' };
      },
    });
  },
};
