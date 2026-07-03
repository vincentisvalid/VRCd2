/**
 * Voice subsystem — per-guild audio stream controllers.
 *
 * Architecture: one GuildPlayer per guild holding the @discordjs/voice
 * connection, an AudioPlayer, and a FIFO track queue. Audio is sourced by
 * spawning yt-dlp (auto-downloaded on first use via yt-dlp-wrap) and piping
 * its bestaudio stdout into an Arbitrary-type audio resource; prism-media
 * transparently transcodes to Opus through the host's ffmpeg binary.
 */
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
  StreamType,
} from '@discordjs/voice';
import ytDlpModule from 'yt-dlp-wrap';
import { config, PROJECT_ROOT } from '../core/config.js';
import { createLogger } from '../core/logger.js';

// yt-dlp-wrap ships CJS; normalise the interop shape.
const YTDlpWrap = ytDlpModule.default ?? ytDlpModule;

const log = createLogger('player');
const BIN_DIR = path.join(PROJECT_ROOT, config.voice.ytdlpBinaryDir);
const YTDLP_PATH = path.join(BIN_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

/** guildId → GuildPlayer */
const players = new Map();

let ytDlpReady = null;

/** Lazily provisions the yt-dlp binary (one download, cached on disk). */
async function ensureYtDlp() {
  if (!ytDlpReady) {
    ytDlpReady = (async () => {
      mkdirSync(BIN_DIR, { recursive: true });
      if (!existsSync(YTDLP_PATH)) {
        log.info('Downloading yt-dlp binary…');
        await YTDlpWrap.downloadFromGithub(YTDLP_PATH);
      }
      return new YTDlpWrap(YTDLP_PATH);
    })().catch((error) => {
      ytDlpReady = null; // allow a retry on the next request
      throw new Error(`Failed to provision yt-dlp: ${error.message}`);
    });
  }
  return ytDlpReady;
}

class GuildPlayer {
  constructor(guildId) {
    this.guildId = guildId;
    this.connection = null;
    this.queue = [];
    this.current = null;
    this.idleTimer = null;
    this.audioPlayer = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.current = null;
      this.playNext().catch((error) => log.error(`Queue advance failed in ${this.guildId}:`, error.message));
    });
    this.audioPlayer.on('error', (error) => {
      log.error(`Audio player error in ${this.guildId}:`, error.message);
      this.current = null;
      this.playNext().catch(() => {});
    });
  }

  async connect(voiceChannel) {
    if (this.connection && this.connection.state.status !== VoiceConnectionStatus.Destroyed) return;
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    this.connection.subscribe(this.audioPlayer);
    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
    } catch (error) {
      this.destroy();
      throw new Error('Timed out establishing the voice connection.');
    }
    this.connection.on(VoiceConnectionStatus.Disconnected, () => {
      // Give Discord a moment to auto-reconnect (region moves etc.), then tear down.
      Promise.race([
        entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
      ]).catch(() => this.destroy());
    });
  }

  async enqueue(track) {
    this.queue.push(track);
    if (!this.current) await this.playNext();
    return this.queue.length;
  }

  async playNext() {
    clearTimeout(this.idleTimer);
    const next = this.queue.shift();
    if (!next) {
      // Nothing queued — schedule an idle disconnect to free resources.
      this.idleTimer = setTimeout(() => this.destroy(), config.voice.idleDisconnectMs);
      this.idleTimer.unref?.();
      return;
    }
    const ytDlp = await ensureYtDlp();
    // Pipe compressed bestaudio straight to stdout; prism/ffmpeg handles PCM.
    const stream = ytDlp.execStream([next.url, '-f', 'bestaudio/best', '--no-playlist', '-o', '-']);
    stream.on('error', (error) => log.error(`yt-dlp stream error in ${this.guildId}:`, error.message));
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
    this.current = next;
    this.audioPlayer.play(resource);
  }

  /** Toggles pause state; returns the new paused flag. */
  togglePause() {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
      this.audioPlayer.unpause();
      return false;
    }
    this.audioPlayer.pause(true);
    return true;
  }

  destroy() {
    clearTimeout(this.idleTimer);
    this.queue = [];
    this.current = null;
    try {
      this.audioPlayer.stop(true);
    } catch { /* already stopped */ }
    if (this.connection && this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
      try {
        this.connection.destroy();
      } catch { /* already destroyed */ }
    }
    players.delete(this.guildId);
  }
}

/** Fetch-or-create the player bound to a guild. */
export function getGuildPlayer(guildId, { create = false } = {}) {
  if (!players.has(guildId) && create) players.set(guildId, new GuildPlayer(guildId));
  return players.get(guildId) ?? null;
}

/** Best-effort title lookup so queue messages are human-friendly. */
export async function probeTrackTitle(url) {
  try {
    const ytDlp = await ensureYtDlp();
    const raw = await ytDlp.execPromise(['--dump-json', '--no-playlist', '--skip-download', url]);
    return JSON.parse(raw)?.title ?? url;
  } catch {
    return url;
  }
}
