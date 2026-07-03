/**
 * Shared execution harness for every FFmpeg effect command.
 *
 * Wraps the full lifecycle: ffmpeg availability probe → processing embed →
 * source download → user-supplied processing stage → size-limit compression
 * → upload → guaranteed temp-buffer wipe (success or failure).
 */
import {
  assertFfmpegAvailable,
  resolveMediaInput,
  ensureUnderUploadLimit,
  deliverMedia,
  cleanupPaths,
} from '../../services/media.js';
import { processingEmbed, errorEmbed } from '../../core/embeds.js';

/**
 * @param {import('../../core/context.js').CommandContext} ctx
 * @param {object} spec
 * @param {string} spec.title  human label for embeds ("VHS effect")
 * @param {string[]} [spec.kinds] accepted media kinds (default video+image)
 * @param {(input: {path:string,isVideo:boolean,contentType:string,name:string}, trash: string[]) =>
 *         Promise<{path:string, isVideo?:boolean, filename?:string, compress?:boolean}>} spec.process
 *        Receives the downloaded source; pushes any intermediates onto
 *        `trash`; returns the finished artifact descriptor.
 */
export async function runEffectPipeline(ctx, { title, kinds = ['video', 'image'], process }) {
  const trash = [];
  try {
    await assertFfmpegAvailable();
    await ctx.defer();
    await ctx.reply({ embeds: [processingEmbed(title, 'Downloading source and running the FFmpeg graph…')] });

    const input = await resolveMediaInput(ctx, { kinds });
    trash.push(input.path);

    const result = await process(input, trash);
    trash.push(result.path);

    let finalPath = result.path;
    if (result.compress !== false) {
      finalPath = await ensureUnderUploadLimit(result.path, { isVideo: result.isVideo ?? input.isVideo });
      if (finalPath !== result.path) trash.push(finalPath);
    }

    await deliverMedia(ctx, finalPath, { title: `${title} — complete`, filename: result.filename });
  } catch (error) {
    await ctx.edit({ embeds: [errorEmbed(`${title} failed`, error.message)] }).catch(() => {});
  } finally {
    await cleanupPaths(trash);
  }
}
