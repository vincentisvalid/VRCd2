/**
 * Media processing engine.
 *
 * Shared pipeline for every FFmpeg-backed effect command:
 *   1. resolveMediaInput()  — locate the source (uploaded attachment, slash
 *      attachment option, replied-to message, or URL argument) and stream it
 *      to a temp buffer under ./tmp with a hard download cap.
 *   2. runFfmpeg()/ffprobe() — execute the binary in a child process so the
 *      main event loop is never blocked; enforced wall-clock timeout.
 *   3. ensureUnderUploadLimit() — adaptive re-encode passes to squeeze the
 *      result under the Discord attachment threshold.
 *   4. deliverMedia() + cleanupPaths() — upload the artifact and wipe all
 *      temporary disk buffers regardless of success or failure.
 */
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import axios from 'axios';
import { AttachmentBuilder } from 'discord.js';
import { config, PROJECT_ROOT } from '../core/config.js';
import { successEmbed } from '../core/embeds.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('media');
const TMP_DIR = path.join(PROJECT_ROOT, config.media.tmpDir);

let ffmpegChecked = null;

/** Verifies the ffmpeg binary exists on PATH (cached after first probe). */
export async function assertFfmpegAvailable() {
  if (ffmpegChecked === null) {
    ffmpegChecked = await new Promise((resolve) => {
      const probe = spawn('ffmpeg', ['-version']);
      probe.once('error', () => resolve(false));
      probe.once('close', (code) => resolve(code === 0));
    });
  }
  if (!ffmpegChecked) {
    throw new Error('FFmpeg is not installed on this host — media effects are unavailable. See the README for setup.');
  }
}

/** Allocates a unique temp file path (does not create the file). */
export async function tmpPath(extension) {
  await mkdir(TMP_DIR, { recursive: true });
  return path.join(TMP_DIR, `${randomUUID()}.${extension.replace(/^\./, '')}`);
}

/**
 * Streams a remote URL into the temp dir, aborting the moment the byte
 * count exceeds the configured download cap.
 */
export async function downloadToTmp(url, { maxBytes = config.media.maxDownloadBytes, extension } = {}) {
  // Derive a clean extension from the URL path when the caller didn't supply one.
  const derivedExt = (new URL(url).pathname.split('.').pop() || 'bin').slice(0, 5).replace(/[^a-z0-9]/gi, '') || 'bin';
  const guessedExt = extension ?? derivedExt;
  const destination = await tmpPath(guessedExt);

  const response = await axios.get(url, { responseType: 'stream', timeout: 60_000, maxRedirects: 5 });
  const declared = Number.parseInt(response.headers['content-length'] ?? '0', 10);
  if (declared > maxBytes) {
    response.data.destroy();
    throw new Error(`Source file is too large (${(declared / 1048576).toFixed(1)} MB > ${(maxBytes / 1048576).toFixed(0)} MB cap).`);
  }

  await new Promise((resolve, reject) => {
    const sink = createWriteStream(destination);
    let received = 0;
    response.data.on('data', (chunk) => {
      received += chunk.length;
      if (received > maxBytes) {
        response.data.destroy();
        sink.destroy();
        reject(new Error('Download exceeded the size cap mid-stream — aborted.'));
      }
    });
    response.data.on('error', reject);
    sink.on('error', reject);
    sink.on('finish', resolve);
    response.data.pipe(sink);
  });

  return { path: destination, contentType: response.headers['content-type'] ?? 'application/octet-stream' };
}

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'mkv', 'avi', 'gif', 'm4v']);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff']);

/**
 * Locates and downloads the media the caller wants processed.
 * Search order: slash attachment option → invoking-message uploads →
 * replied-to message uploads → `url` string option.
 *
 * @returns {Promise<{path:string, contentType:string, isVideo:boolean, name:string}>}
 */
export async function resolveMediaInput(ctx, { kinds = ['video', 'image'] } = {}) {
  const candidates = [];

  for (const attachment of ctx.attachments) {
    candidates.push({ url: attachment.url, name: attachment.name ?? 'input', contentType: attachment.contentType ?? '' });
  }

  if (!candidates.length && !ctx.isSlash && ctx.message.reference?.messageId) {
    try {
      const referenced = await ctx.channel.messages.fetch(ctx.message.reference.messageId);
      for (const attachment of referenced.attachments.values()) {
        candidates.push({ url: attachment.url, name: attachment.name ?? 'input', contentType: attachment.contentType ?? '' });
      }
    } catch {
      /* reply target unavailable — fall through to URL option */
    }
  }

  const urlOption = ctx.getOption('url');
  if (!candidates.length && urlOption && /^https?:\/\//i.test(urlOption)) {
    candidates.push({ url: urlOption, name: 'input', contentType: '' });
  }

  if (!candidates.length) {
    throw new Error('No media found — attach a file, reply to a message containing one, or pass a direct URL.');
  }

  const source = candidates[0];
  const extension = (source.name.split('.').pop() ?? '').toLowerCase();
  const downloaded = await downloadToTmp(source.url, { extension: extension || undefined });

  const contentType = source.contentType || downloaded.contentType;
  const isVideo = contentType.startsWith('video/') || VIDEO_EXTENSIONS.has(extension);
  const isImage = contentType.startsWith('image/') || IMAGE_EXTENSIONS.has(extension);

  if (isVideo && !kinds.includes('video')) throw new Error('This effect only accepts images.');
  if (isImage && !isVideo && !kinds.includes('image')) throw new Error('This effect only accepts videos.');
  if (!isVideo && !isImage) throw new Error(`Unsupported media type (\`${contentType || extension || 'unknown'}\`).`);

  return { path: downloaded.path, contentType, isVideo, name: source.name };
}

/**
 * Spawns ffmpeg with the given argument vector. Rejects with the stderr
 * tail on non-zero exit; SIGKILLs the process past the wall-clock timeout.
 */
export function runFfmpeg(args, { timeoutMs = config.media.ffmpegTimeoutMs, binary = 'ffmpeg' } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, ['-hide_banner', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`${binary} timed out after ${Math.round(timeoutMs / 1000)}s.`));
    }, timeoutMs);

    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-4000); // keep only the tail
    });
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn ${binary}: ${error.message}`));
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`${binary} exited with code ${code}: ${stderr.split('\n').filter(Boolean).slice(-3).join(' | ')}`));
    });
  });
}

/** Structured ffprobe metadata for a local file. */
export function ffprobe(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', filePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.once('error', (error) => reject(new Error(`Failed to spawn ffprobe: ${error.message}`)));
    child.once('close', (code) => {
      if (code !== 0) return reject(new Error(`ffprobe exited with code ${code}.`));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('ffprobe produced unparseable output.'));
      }
    });
  });
}

/**
 * Guarantees the artifact fits under the Discord upload threshold, applying
 * up to two adaptive re-encode passes (bitrate targeting for video, scale +
 * quality reduction for images).
 */
export async function ensureUnderUploadLimit(filePath, { isVideo }) {
  const maxBytes = config.media.maxUploadBytes;
  let currentPath = filePath;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { size } = await stat(currentPath);
    if (size <= maxBytes) return currentPath;

    log.info(`Artifact ${currentPath} is ${(size / 1048576).toFixed(1)} MB — compressing (pass ${attempt + 1}).`);
    if (isVideo) {
      const meta = await ffprobe(currentPath).catch(() => null);
      const duration = Number.parseFloat(meta?.format?.duration ?? '0') || 30;
      // Budget 92% of the cap for video+audio, split 85/15, expressed in kbps.
      const totalKbps = Math.max(96, Math.floor((maxBytes * 8 * 0.92) / duration / 1000));
      const videoKbps = Math.max(64, Math.floor(totalKbps * 0.85) >> attempt);
      const output = await tmpPath('mp4');
      await runFfmpeg([
        '-i', currentPath,
        '-vf', "scale='min(1280,iw)':-2",
        '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', `${videoKbps}k`, '-maxrate', `${videoKbps}k`, '-bufsize', `${videoKbps * 2}k`,
        '-c:a', 'aac', '-b:a', '96k',
        '-movflags', '+faststart',
        output,
      ]);
      if (currentPath !== filePath) await cleanupPaths([currentPath]);
      currentPath = output;
    } else {
      const output = await tmpPath('jpg');
      await runFfmpeg(['-i', currentPath, '-vf', "scale='min(1920,iw)':-2", '-q:v', String(6 + attempt * 6), output]);
      if (currentPath !== filePath) await cleanupPaths([currentPath]);
      currentPath = output;
    }
  }

  const { size } = await stat(currentPath);
  if (size > maxBytes) throw new Error('Could not compress the result under the Discord upload limit.');
  return currentPath;
}

/** Uploads the finished artifact alongside a branded success embed. */
export async function deliverMedia(ctx, filePath, { title = 'Processing complete', filename } = {}) {
  const finalName = filename ?? path.basename(filePath);
  const attachment = new AttachmentBuilder(filePath, { name: finalName });
  await ctx.edit({ embeds: [successEmbed(title)], files: [attachment] });
}

/** Best-effort removal of temp buffers — never throws. */
export async function cleanupPaths(paths) {
  await Promise.allSettled(paths.filter(Boolean).map((target) => unlink(target)));
}
