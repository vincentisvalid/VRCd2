/**
 * .vhs — NTSC tape aesthetic.
 *
 * Video filtergraph anatomy (in order):
 *   scale/pad → 640×480 NTSC frame
 *   chromashift → chrominance mis-registration (colour bleeding)
 *   noise      → temporal analogue grain
 *   curves     → faded vintage transfer curve
 *   gblur      → slight optical softness
 *   drawgrid   → horizontal tracking/scanline structure
 *   vignette   → CRT edge falloff
 * Audio chain: band-limit to tape response + vibrato pitch warble.
 */
import { runEffectPipeline } from './_pipeline.js';
import { runFfmpeg, ffprobe, tmpPath } from '../../services/media.js';

const VIDEO_GRAPH = [
  'scale=640:480:force_original_aspect_ratio=decrease',
  'pad=640:480:(ow-iw)/2:(oh-ih)/2',
  'format=yuv420p',
  'chromashift=cbh=5:cbv=1:crh=-5:crv=-1',
  'noise=alls=11:allf=t+u',
  'curves=preset=vintage',
  'gblur=sigma=0.45:steps=1',
  'drawgrid=w=iw:h=3:t=1:c=black@0.18',
  'vignette=PI/5',
].join(',');

const AUDIO_GRAPH = 'highpass=f=90,lowpass=f=6200,vibrato=f=3.8:d=0.25,aresample=44100';

export default {
  name: 'vhs',
  category: 'Media Effects',
  description: 'Overlays NTSC colour bleeding, tracking lines, grain, and audio warble.',
  usage: '.vhs (attach media / reply / URL)',
  aliases: ['tape'],
  cooldownMs: 10000,
  options: [
    { name: 'media', type: 'attachment', description: 'Video or image to VHS-ify', required: false },
    { name: 'url', type: 'string', description: 'Direct media URL (alternative to attaching)', required: false },
  ],
  async execute(ctx) {
    await runEffectPipeline(ctx, {
      title: 'VHS effect',
      process: async (input) => {
        if (input.isVideo) {
          // Only wire the audio warble chain when the source actually has audio.
          const meta = await ffprobe(input.path).catch(() => null);
          const hasAudio = Boolean(meta?.streams?.some((stream) => stream.codec_type === 'audio'));

          const output = await tmpPath('mp4');
          await runFfmpeg([
            '-i', input.path,
            '-vf', VIDEO_GRAPH,
            ...(hasAudio ? ['-af', AUDIO_GRAPH, '-c:a', 'aac', '-b:a', '128k'] : ['-an']),
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22',
            '-movflags', '+faststart',
            output,
          ]);
          return { path: output, isVideo: true, filename: 'vhs.mp4' };
        }
        // Stills: same visual chain, single frame out.
        const output = await tmpPath('jpg');
        await runFfmpeg(['-i', input.path, '-vf', VIDEO_GRAPH, '-frames:v', '1', '-q:v', '4', output]);
        return { path: output, isVideo: false, filename: 'vhs.jpg' };
      },
    });
  },
};
