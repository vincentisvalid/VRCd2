/**
 * .cut — precise segment extraction WITHOUT re-encoding.
 *
 * Parses `HH:MM:SS`, `MM:SS`, or plain-seconds boundaries and stream-copies
 * the window (`-c copy`), so the untouched streams pass through bit-exact.
 * Note: with stream copy the actual start snaps to the nearest preceding
 * keyframe — the standard trade-off for zero-generation-loss cutting.
 */
import path from 'node:path';
import { runEffectPipeline } from './_pipeline.js';
import { runFfmpeg, tmpPath } from '../../services/media.js';
import { parseTimestamp, toFfmpegTimestamp } from '../../utils/time.js';

export default {
  name: 'cut',
  category: 'Media Effects',
  description: 'Cuts a video segment between two timestamps without re-encoding.',
  usage: '.cut <start HH:MM:SS|MM:SS> <end HH:MM:SS|MM:SS> (attach video / reply / URL)',
  aliases: ['trim'],
  cooldownMs: 8000,
  options: [
    { name: 'start', type: 'string', description: 'Segment start (HH:MM:SS, MM:SS, or seconds)', required: true },
    { name: 'end', type: 'string', description: 'Segment end (HH:MM:SS, MM:SS, or seconds)', required: true },
    { name: 'media', type: 'attachment', description: 'Video to cut', required: false },
    { name: 'url', type: 'string', description: 'Direct video URL (alternative to attaching)', required: false },
  ],
  async execute(ctx) {
    const startSeconds = parseTimestamp(ctx.getOption('start'));
    const endSeconds = parseTimestamp(ctx.getOption('end'));

    if (startSeconds === null || endSeconds === null) {
      return ctx.replyError('Invalid timestamps', 'Use `HH:MM:SS`, `MM:SS`, or plain seconds — e.g. `.cut 00:15 01:30`.');
    }
    if (endSeconds <= startSeconds) {
      return ctx.replyError('Invalid range', 'The end timestamp must come after the start timestamp.');
    }

    await runEffectPipeline(ctx, {
      title: 'Cut',
      kinds: ['video'],
      process: async (input) => {
        const extension = (path.extname(input.name).slice(1) || 'mp4').toLowerCase();
        const output = await tmpPath(extension === 'gif' ? 'mp4' : extension);
        await runFfmpeg([
          '-ss', toFfmpegTimestamp(startSeconds),
          '-to', toFfmpegTimestamp(endSeconds),
          '-i', input.path,
          '-c', 'copy', // no re-encode: unaffected streams pass through untouched
          '-avoid_negative_ts', 'make_zero',
          output,
        ]);
        return { path: output, isVideo: true, filename: `cut.${path.extname(output).slice(1)}` };
      },
    });
  },
};
