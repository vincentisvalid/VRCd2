import { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus, 
  StreamType, 
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
  generateDependencyReport
} from '@discordjs/voice';
import { 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  ButtonBuilder,
  ButtonStyle,
  ComponentType 
} from 'discord.js';
import { spawn } from 'child_process';
import { respond, buildEmbed } from '../utils/helpers.js';
import YTDlpWrap from 'yt-dlp-wrap';
import ytSearch from 'yt-search';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate or download the local yt-dlp binary
const binDir = path.join(__dirname, '../../bin');
const localYtDlpPath = path.join(binDir, 'yt-dlp');
// Clean up all stray WAV files in tmp/audio on startup
const audioDir = path.join(process.cwd(), 'tmp/audio');
if (fs.existsSync(audioDir)) {
  try {
    const files = fs.readdirSync(audioDir);
    for (const file of files) {
      if (file.endsWith('.wav')) {
        fs.unlinkSync(path.join(audioDir, file));
      }
    }
    console.log('[Voice Engine] Cleaned up stray WAV files from previous sessions.');
  } catch (err) {
    console.error('[Voice Engine] Failed to clean up audio directory on startup:', err.message);
  }
}

async function ensureYtDlp() {
  if (fs.existsSync(localYtDlpPath)) {
    return localYtDlpPath;
  }

  console.log('[Voice Engine] yt-dlp binary not found. Downloading the latest release from GitHub...');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  try {
    const YTDlpClass = YTDlpWrap.default || YTDlpWrap;
    await YTDlpClass.downloadFromGithub(localYtDlpPath);
    console.log('[Voice Engine] yt-dlp binary downloaded successfully to:', localYtDlpPath);
    fs.chmodSync(localYtDlpPath, '755');
    return localYtDlpPath;
  } catch (err) {
    console.error('[Voice Engine] Failed to download yt-dlp binary:', err.message);
    throw err;
  }
}

// Guild-specific voice connection and player state tracking
const voiceSessions = new Map(); 

// Helper: Get local WAV file path from a video URL/ID
function getAudioFilePath(songUrl) {
  let id = 'audio';
  try {
    const urlObj = new URL(songUrl);
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      id = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
    } else {
      let hash = 0;
      for (let i = 0; i < songUrl.length; i++) {
        hash = (hash << 5) - hash + songUrl.charCodeAt(i);
        hash |= 0;
      }
      id = `hash_${Math.abs(hash)}`;
    }
  } catch (_) {}
  return path.join(process.cwd(), 'tmp/audio', `${id}.wav`);
}

// Helper: Download video stream and convert to WAV file locally with progress feedback
async function downloadToWav(song, onProgress) {
  const filePath = getAudioFilePath(song.url);
  
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    console.log(`[Voice Engine] Reusing cached WAV file: ${filePath}`);
    if (onProgress) onProgress(100);
    return filePath;
  }

  const ytDlpPath = await ensureYtDlp();
  return new Promise((resolve, reject) => {
    console.log(`[Voice Engine] Downloading and converting to WAV: ${song.url}`);
    const ytDlpProcess = spawn(ytDlpPath, [
      '-x', 
      '--audio-format', 'wav',
      '--postprocessor-args', 'ExtractAudio:-ar 48000 -ac 2',
      '--download-sections', '*00:00-03:00',
      '--no-playlist',
      '--js-runtimes', 'node',
      '-o', filePath,
      song.url
    ]);

    let stderr = '';
    ytDlpProcess.stderr.on('data', data => stderr += data.toString());

    ytDlpProcess.stdout.on('data', data => {
      if (onProgress) {
        const match = data.toString().match(/\[download\]\s+(\d+(\.\d+)?)\%/);
        if (match) {
          const pct = parseFloat(match[1]);
          onProgress(pct);
        }
      }
    });

    ytDlpProcess.on('close', code => {
      if (code === 0 && fs.existsSync(filePath)) {
        if (onProgress) onProgress(100);
        resolve(filePath);
      } else {
        reject(new Error(`yt-dlp failed to download WAV (exit code ${code}). Stderr: ${stderr}`));
      }
    });
  });
}

// Helper: Locate the actual PCM data offset in a WAV file by walking its RIFF chunks.
// yt-dlp/ffmpeg's ExtractAudio postprocessor embeds a LIST/INFO metadata chunk (e.g. an
// ISFT software tag) after the "fmt " chunk, so the canonical 44-byte header assumption
// does not hold. Worse, since that chunk's size is not a multiple of the 4-byte stereo
// 16-bit frame size, skipping a fixed 44 bytes shifts every subsequent sample's byte
// alignment for the rest of the file (not just a brief click), corrupting the entire
// track into noise instead of just clipping a few leading milliseconds.
async function findWavDataOffset(filePath) {
  const fh = await fsp.open(filePath, 'r');
  try {
    const header = Buffer.alloc(12);
    await fh.read(header, 0, 12, 0);
    if (header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WAVE') {
      return 44; // Not a RIFF/WAVE file; fall back to the canonical minimal header size.
    }

    let offset = 12;
    const chunkHeader = Buffer.alloc(8);
    for (let i = 0; i < 64; i++) { // bounded scan to avoid looping forever on a malformed file
      const { bytesRead } = await fh.read(chunkHeader, 0, 8, offset);
      if (bytesRead < 8) break;
      const chunkId = chunkHeader.toString('ascii', 0, 4);
      const chunkSize = chunkHeader.readUInt32LE(4);
      if (chunkId === 'data') {
        return offset + 8;
      }
      offset += 8 + chunkSize + (chunkSize % 2); // RIFF chunks are word-aligned/padded
    }
    return 44;
  } finally {
    await fh.close();
  }
}

// Helper: Delete a WAV file safely
function deleteWavFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`[Voice Engine] Cleaned up WAV file: ${filePath}`);
    } catch (err) {
      console.error(`[Voice Engine] Failed to delete WAV file: ${err.message}`);
    }
  }
}

export default [
  {
    name: 'play',
    description: 'Play a YouTube query or URL.',
    category: 'Voice',
    aliases: ['p', 'stream'],
    options: [
      {
        name: 'query',
        type: 3, // String
        description: 'YouTube search query or video URL',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return respond(message, { content: 'Please provide a valid YouTube search query or URL.' });
      }
      const voiceChannel = message.member?.voice?.channel;
      if (!voiceChannel) {
        return respond(message, { content: 'You must be in a voice channel to play music.' });
      }
      const query = args.join(' ');
      return handlePlayResolution(message, voiceChannel, query);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const voiceChannel = interaction.member?.voice?.channel;
      if (!voiceChannel) {
        return respond(interaction, { content: 'You must be in a voice channel to play music.' });
      }
      const query = interaction.options.getString('query');
      return handlePlayResolution(interaction, voiceChannel, query);
    }
  },
  {
    name: 'pause',
    description: 'Pause or resume the current audio playback.',
    category: 'Voice',
    aliases: ['hold', 'resume'],
    async execute(message, args, client) {
      return executePause(message);
    },
    async executeSlash(interaction, client) {
      return executePause(interaction);
    }
  },
  {
    name: 'stop',
    description: 'Stop playing, clear the queue, and disconnect from voice.',
    category: 'Voice',
    aliases: ['leave', 'disconnect', 'dc'],
    async execute(message, args, client) {
      return executeStop(message);
    },
    async executeSlash(interaction, client) {
      return executeStop(interaction);
    }
  },
  {
    name: 'skip',
    description: 'Skip the current playing song.',
    category: 'Voice',
    aliases: ['s', 'next'],
    async execute(message, args, client) {
      return executeSkip(message);
    },
    async executeSlash(interaction, client) {
      return executeSkip(interaction);
    }
  },
  {
    name: 'queue',
    description: 'Display the server song queue.',
    category: 'Voice',
    aliases: ['q', 'list'],
    async execute(message, args, client) {
      return executeQueue(message);
    },
    async executeSlash(interaction, client) {
      return executeQueue(interaction);
    }
  },
  {
    name: 'volume',
    description: 'Adjust the music player volume level (0-100).',
    category: 'Voice',
    aliases: ['vol'],
    options: [
      {
        name: 'level',
        type: 4, // Integer
        description: 'Volume level between 0 and 100',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.volume <0-100>`' });
      return executeVolume(message, parseInt(args[0]));
    },
    async executeSlash(interaction, client) {
      return executeVolume(interaction, interaction.options.getInteger('level'));
    }
  },
  {
    name: 'np',
    description: 'Display the currently playing song.',
    category: 'Voice',
    aliases: ['nowplaying'],
    async execute(message, args, client) {
      return executeNowPlaying(message);
    },
    async executeSlash(interaction, client) {
      return executeNowPlaying(interaction);
    }
  },
  {
    name: 'clearqueue',
    description: 'Clear all queued songs.',
    category: 'Voice',
    aliases: ['clearq'],
    async execute(message, args, client) {
      return executeClearQueue(message);
    },
    async executeSlash(interaction, client) {
      return executeClearQueue(interaction);
    }
  },
  {
    name: 'voicedebug',
    description: 'Check voice dependencies status and diagnostics.',
    category: 'Voice',
    aliases: ['vdebug', 'voicedeps'],
    async execute(message, args, client) {
      const report = generateDependencyReport();
      return respond(message, { content: `\`\`\`\n${report}\n\`\`\`` });
    },
    async executeSlash(interaction, client) {
      const report = generateDependencyReport();
      return respond(interaction, { content: `\`\`\`\n${report}\n\`\`\`` });
    }
  },
  {
    name: 'reconnect',
    description: 'Re-establish and recover the voice channel connection.',
    category: 'Voice',
    aliases: ['rc', 'joinagain'],
    async execute(message, args, client) {
      return executeReconnect(message);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return executeReconnect(interaction);
    }
  }
];

// Helper: Fetch video details asynchronously via yt-search and yt-dlp
async function getSongInfo(query) {
  // If it's a search query, search using yt-search first for high performance and clean URL
  if (!query.startsWith('http://') && !query.startsWith('https://')) {
    try {
      const searchResult = await ytSearch(query);
      const video = searchResult.videos?.[0];
      if (video) {
        return {
          title: video.title,
          duration: video.duration.timestamp || 'Unknown',
          url: video.url
        };
      }
    } catch (err) {
      console.error('[yt-search Error]:', err.message);
    }
  }

  // Fallback to yt-dlp metadata query (useful for direct URLs or search fallbacks)
  const ytDlpPath = await ensureYtDlp();
  return new Promise((resolve) => {
    const target = query.startsWith('http') ? query : `ytsearch1:${query}`;
    // --print with an explicit delimiter guarantees field order; the previous code assumed
    // stdout lines came out in --get-title/--get-duration/--get-id flag order, but yt-dlp
    // actually always prints title, then id, then duration regardless of flag order — so
    // "duration" was getting the video ID and "id" was getting the duration string, which
    // built a broken URL like watch?v=3:33 and silently failed to play direct-URL requests.
    const process = spawn(ytDlpPath, ['--no-playlist', '--js-runtimes', 'node', '--print', '%(title)s|||%(id)s|||%(duration_string)s', target]);
    let stdout = '';
    process.stdout.on('data', data => stdout += data.toString());
    process.on('close', () => {
      const [title, id, duration] = stdout.trim().split('|||');
      const songUrl = id ? `https://www.youtube.com/watch?v=${id}` : query;
      resolve({
        title: title || query,
        duration: duration || 'Unknown',
        url: songUrl
      });
    });
  });
}

// Helper: Reset idle timer
function resetIdleTimer(session) {
  if (session.idleTimer) {
    clearTimeout(session.idleTimer);
    session.idleTimer = null;
  }
}

// Helper: Start idle timer
function startIdleTimer(session, guildId) {
  resetIdleTimer(session); // Clear any existing just in case

  session.idleTimer = setTimeout(() => {
    const activeSession = voiceSessions.get(guildId);
    if (activeSession) {
      if (activeSession.textChannel) {
        activeSession.textChannel.send({
          embeds: [buildEmbed('Voice Subsystem', 'Disconnected from voice channel due to inactivity.', [], 0xffa500)]
        }).catch(() => {});
      }
      try {
        activeSession.connection.destroy();
      } catch (err) {
        console.error('[Idle Auto-disconnect Error]:', err.message);
      }
    }
  }, 180000); // 3 minutes of inactivity
}

// Helper: Resolve Play query and manage Search Selection numbering list with pagination
async function handlePlayResolution(ctx, voiceChannel, query) {
  // If it's a direct URL, play immediately
  if (query.startsWith('http://') || query.startsWith('https://')) {
    const song = await getSongInfo(query);
    return playSong(ctx, voiceChannel, song);
  }

  // Otherwise, it's a search query
  try {
    const searchResult = await ytSearch(query);
    const videos = searchResult.videos?.slice(0, 15) || []; // retrieve top 15 results (3 pages of 5)
    if (videos.length === 0) {
      return respond(ctx, { content: 'No search results found on YouTube.' });
    }

    let currentPage = 0;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(videos.length / itemsPerPage);

    // Helper: generate message options for a given page index
    function generatePageOptions(pageIndex) {
      const startIdx = pageIndex * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const pageVideos = videos.slice(startIdx, endIdx);

      // Build numbered description list
      const description = pageVideos.map((video, idx) => {
        const absoluteNumber = startIdx + idx + 1;
        return `**${absoluteNumber}.** [${video.title}](${video.url}) (${video.duration.timestamp || 'Unknown'})`;
      }).join('\n\n');

      const embed = buildEmbed(
        '🔍 YouTube Search Results',
        `Showing page **${pageIndex + 1}/${totalPages}** for query: \`${query}\`:\n\n${description}`,
        [],
        0x1e90ff
      );

      // Build select menu for the current page
      const select = new StringSelectMenuBuilder()
        .setCustomId('youtube_search_select')
        .setPlaceholder('Choose a video from this page...')
        .addOptions(
          pageVideos.map((video, idx) => {
            const absoluteIndex = startIdx + idx;
            return new StringSelectMenuOptionBuilder()
              .setLabel(`${startIdx + idx + 1}. ${video.title.substring(0, 80)}`)
              .setValue(absoluteIndex.toString())
              .setDescription(`Duration: ${video.duration.timestamp || 'Unknown'}`);
          })
        );

      // Build navigation buttons
      const prevButton = new ButtonBuilder()
        .setCustomId('youtube_search_prev')
        .setLabel('⬅️ Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageIndex === 0);

      const nextButton = new ButtonBuilder()
        .setCustomId('youtube_search_next')
        .setLabel('Next ➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageIndex === totalPages - 1);

      const menuRow = new ActionRowBuilder().addComponents(select);
      const buttonRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

      return {
        embeds: [embed],
        components: [menuRow, buttonRow]
      };
    }

    const userId = ctx.author ? ctx.author.id : ctx.user.id;
    const initialPayload = generatePageOptions(currentPage);
    const response = await respond(ctx, initialPayload);

    // Component Collector that accepts both Select Menu and Buttons
    const filter = i => (i.customId === 'youtube_search_select' || i.customId === 'youtube_search_prev' || i.customId === 'youtube_search_next') && i.user.id === userId;
    const collector = response.createMessageComponentCollector({
      filter,
      time: 60000 // 60 seconds since pagination takes a bit longer
    });

    collector.on('collect', async i => {
      if (i.customId === 'youtube_search_select') {
        const selectedIndex = parseInt(i.values[0]);
        const video = videos[selectedIndex];
        
        const song = {
          title: video.title,
          duration: video.duration.timestamp || 'Unknown',
          url: video.url
        };

        const sessionExists = voiceSessions.has(ctx.guild.id);
        const statusText = sessionExists 
          ? `Selected: **[${song.title}](${song.url})**\n\n🎵 *Adding to queue...*`
          : `Selected: **[${song.title}](${song.url})**\n\n🔄 *Joining VC...*`;

        const confirmEmbed = buildEmbed(
          '✅ Song Selected',
          statusText,
          [],
          0x32cd32
        );
        
        await i.update({ embeds: [confirmEmbed], components: [] });
        collector.stop('selected');
        await playSong(ctx, voiceChannel, song);

      } else if (i.customId === 'youtube_search_prev') {
        if (currentPage > 0) {
          currentPage--;
          const payload = generatePageOptions(currentPage);
          await i.update(payload);
        }
      } else if (i.customId === 'youtube_search_next') {
        if (currentPage < totalPages - 1) {
          currentPage++;
          const payload = generatePageOptions(currentPage);
          await i.update(payload);
        }
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = buildEmbed(
          '⌛ Search Timeout',
          'Search selection timed out after 60 seconds.',
          [],
          0xff0000
        );
        if (ctx.editReply) {
          await ctx.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        } else {
          await response.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        }
      }
    });

  } catch (err) {
    console.error('[Search Resolution Error]:', err.message);
    return respond(ctx, { content: `Search failed: ${err.message}` });
  }
}

// Helper: Setup Connection & Queue/Play Song
async function playSong(ctx, voiceChannel, song) {
  const guildId = ctx.guild.id;
  let session = voiceSessions.get(guildId);

  if (!session) {
    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
      });

      const player = createAudioPlayer();
      connection.subscribe(player);

      session = { 
        connection, 
        player, 
        childProcess: null, 
        queue: [], 
        currentSong: null,
        currentSongFile: null,
        volume: 0.5,
        idleTimer: null,
        textChannel: ctx.channel
      };
      
      voiceSessions.set(guildId, session);

      // Listen for voice connection lifecycle status transitions
      connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
        try {
          // Attempt to reconnect if temporarily disconnected (e.g. moved channels)
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5000),
          ]);
        } catch (error) {
          // Real disconnect - destroy connection
          console.log(`[Voice Connection] Lost connection in guild ${guildId}, destroying...`);
          try {
            connection.destroy();
          } catch (_) {}
        }
      });

      connection.on(VoiceConnectionStatus.Destroyed, () => {
        console.log(`[Voice Connection] Destroyed/Left channel in guild ${guildId}. Cleaning up session.`);
        const activeSession = voiceSessions.get(guildId);
        if (activeSession) {
          if (activeSession.reconnecting) {
            console.log(`[Voice Connection] Reconnect flag is active. Preserving session player and queue.`);
            return;
          }
          resetIdleTimer(activeSession);
          if (activeSession.currentSongFile) {
            deleteWavFile(activeSession.currentSongFile);
          }
          if (activeSession.childProcess) {
            try {
              activeSession.childProcess.kill();
            } catch (_) {}
          }
          try {
            activeSession.player.stop(true);
          } catch (_) {}
          voiceSessions.delete(guildId);
        }
      });

      player.on('error', err => {
        console.error('[Audio Player Error]:', err.message);
        const activeSession = voiceSessions.get(guildId);
        if (activeSession && activeSession.textChannel) {
          activeSession.textChannel.send({
            embeds: [buildEmbed('⚠️ Playback Error', `An error occurred during audio playback: **${err.message}**`, [], 0xff0000)]
          }).catch(() => {});
        }
      });

      player.on(AudioPlayerStatus.Idle, () => {
        playNext(guildId);
      });

    } catch (err) {
      console.error('[Voice Connection Join Error]:', err.message);
      return respond(ctx, { content: `Failed to join voice channel: ${err.message}` });
    }
  } else {
    // Update text channel context
    session.textChannel = ctx.channel;
  }

  // Check if player is playing a resource
  if (session.player.state.status === AudioPlayerStatus.Playing || session.currentSong) {
    session.queue.push(song);
    const queueEmbed = buildEmbed(
      '🎵 Song Queued',
      `Added **[${song.title}](${song.url})** to the queue.\nPosition: **#${session.queue.length}** | Duration: **${song.duration}**`,
      [],
      0x32cd32
    );
    if (ctx.followUp) {
      await ctx.followUp({ embeds: [queueEmbed] }).catch(() => {});
    } else {
      await ctx.channel.send({ embeds: [queueEmbed] }).catch(() => {});
    }
  } else {
    return startPlayback(ctx, guildId, song);
  }
}

// Helper: Start Audio Stream Playback by downloading/converting to WAV locally first
async function startPlayback(ctx, guildId, song) {
  const session = voiceSessions.get(guildId);
  if (!session) return;

  session.currentSong = song;
  session.textChannel = ctx.channel;
  resetIdleTimer(session);

  let statusMsg = null;
  try {
    // Send preparing embed
    const prepEmbed = buildEmbed(
      '📥 Preparing Audio',
      `Downloading and converting track: **[${song.title}](${song.url})**\n\n⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ **0.0%**`,
      [],
      0xffa500
    );
    statusMsg = await respond(ctx, { embeds: [prepEmbed] });

    // Delete previous song file if it exists to preserve space
    if (session.currentSongFile) {
      deleteWavFile(session.currentSongFile);
    }

    // Progress updates to prevent rate-limiting (throttle edits)
    let lastUpdate = 0;
    const progressCallback = async (pct) => {
      const now = Date.now();
      if (now - lastUpdate > 1500 || pct === 100) {
        lastUpdate = now;
        const totalBlocks = 10;
        const filled = Math.round((pct / 100) * totalBlocks);
        const empty = totalBlocks - filled;
        const bar = '🟩'.repeat(filled) + '⬛'.repeat(empty);

        const progressEmbed = buildEmbed(
          '📥 Preparing Audio',
          `Downloading and converting track: **[${song.title}](${song.url})**\n\n${bar} **${pct.toFixed(1)}%**`,
          [],
          0xffa500
        );

        if (ctx.editReply) {
          await ctx.editReply({ embeds: [progressEmbed] }).catch(() => {});
        } else if (statusMsg && statusMsg.edit) {
          await statusMsg.edit({ embeds: [progressEmbed] }).catch(() => {});
        }
      }
    };

    // Download/convert to WAV
    const filePath = await downloadToWav(song, progressCallback);
    session.currentSongFile = filePath;

    // Create audio resource from local WAV file read stream, skipping the real header
    // (detected dynamically — see findWavDataOffset for why a fixed 44 bytes is wrong)
    const dataOffset = await findWavDataOffset(filePath);
    const resource = createAudioResource(fs.createReadStream(filePath, { start: dataOffset }), {
      inputType: StreamType.Raw,
      inlineVolume: true
    });

    resource.volume.setVolume(session.volume);
    session.player.play(resource);

    // Update with Now Playing status
    const nowPlayingEmbed = buildEmbed(
      '🎶 Now Playing',
      `Now streaming: **[${song.title}](${song.url})**\nDuration: **${song.duration}** | Volume: **${Math.round(session.volume * 100)}%**`,
      [],
      0x1e90ff
    );

    if (ctx.editReply) {
      await ctx.editReply({ embeds: [nowPlayingEmbed] }).catch(() => {});
    } else if (statusMsg && statusMsg.edit) {
      await statusMsg.edit({ embeds: [nowPlayingEmbed] }).catch(() => {});
    } else {
      await respond(ctx, { embeds: [nowPlayingEmbed] }).catch(() => {});
    }

  } catch (err) {
    console.error('[Playback Start Error]:', err.message);
    const failEmbed = buildEmbed('⚠️ Playback Failed', `Failed to download or transcode audio: **${err.message}**`, [], 0xff0000);
    if (ctx.editReply) {
      await ctx.editReply({ embeds: [failEmbed] }).catch(() => {});
    } else if (statusMsg && statusMsg.edit) {
      await statusMsg.edit({ embeds: [failEmbed] }).catch(() => {});
    } else {
      await respond(ctx, { embeds: [failEmbed] }).catch(() => {});
    }
  }
}

// Helper: Play next song in queue
async function playNext(guildId) {
  const session = voiceSessions.get(guildId);
  if (!session) return;

  if (session.queue.length > 0) {
    resetIdleTimer(session);
    const nextSong = session.queue.shift();

    let prepMsg = null;
    if (session.textChannel) {
      prepMsg = await session.textChannel.send({
        embeds: [buildEmbed('📥 Preparing Audio', `Downloading and converting next track: **[${nextSong.title}](${nextSong.url})**\n\n⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ **0.0%**`, [], 0xffa500)]
      }).catch(() => {});
    }

    try {
      // Delete previous song file if it exists to preserve space
      if (session.currentSongFile) {
        deleteWavFile(session.currentSongFile);
      }

      // Progress updates to prevent rate-limiting (throttle edits)
      let lastUpdate = 0;
      const progressCallback = async (pct) => {
        const now = Date.now();
        if (now - lastUpdate > 1500 || pct === 100) {
          lastUpdate = now;
          const totalBlocks = 10;
          const filled = Math.round((pct / 100) * totalBlocks);
          const empty = totalBlocks - filled;
          const bar = '🟩'.repeat(filled) + '⬛'.repeat(empty);

          const progressEmbed = buildEmbed(
            '📥 Preparing Audio',
            `Downloading and converting next track: **[${nextSong.title}](${nextSong.url})**\n\n${bar} **${pct.toFixed(1)}%**`,
            [],
            0xffa500
          );

          if (prepMsg && prepMsg.edit) {
            await prepMsg.edit({ embeds: [progressEmbed] }).catch(() => {});
          }
        }
      };

      // Download/convert next track to WAV file
      const filePath = await downloadToWav(nextSong, progressCallback);
      session.currentSongFile = filePath;
      session.currentSong = nextSong;

      // Create audio resource from local WAV file read stream, skipping the real header
      const dataOffset = await findWavDataOffset(filePath);
      const resource = createAudioResource(fs.createReadStream(filePath, { start: dataOffset }), {
        inputType: StreamType.Raw,
        inlineVolume: true
      });
      
      resource.volume.setVolume(session.volume);
      session.player.play(resource);

      const nowPlayingEmbed = buildEmbed(
        '🎶 Now Playing', 
        `Now streaming: **[${nextSong.title}](${nextSong.url})**\nDuration: **${nextSong.duration}** | Volume: **${Math.round(session.volume * 100)}%**`, 
        [], 
        0x1e90ff
      );

      if (prepMsg && prepMsg.edit) {
        await prepMsg.edit({ embeds: [nowPlayingEmbed] }).catch(() => {});
      } else if (session.textChannel) {
        session.textChannel.send({ embeds: [nowPlayingEmbed] }).catch(() => {});
      }
    } catch (err) {
      console.error('[playNext download error]:', err.message);
      const failEmbed = buildEmbed('⚠️ Playback Failed', `Failed to stream next song: **${err.message}**`, [], 0xff0000);
      if (prepMsg && prepMsg.edit) {
        await prepMsg.edit({ embeds: [failEmbed] }).catch(() => {});
      } else if (session.textChannel) {
        session.textChannel.send({ embeds: [failEmbed] }).catch(() => {});
      }
    }
  } else {
    if (session.currentSongFile) {
      deleteWavFile(session.currentSongFile);
    }
    session.currentSong = null;
    session.currentSongFile = null;
    startIdleTimer(session, guildId);
  }
}

// Helper: Pause / Resume
async function executePause(ctx) {
  const session = voiceSessions.get(ctx.guild.id);
  if (!session) return respond(ctx, { content: 'No active voice sessions.' });

  if (session.player.state.status === AudioPlayerStatus.Paused) {
    session.player.unpause();
    return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', 'Playback unpaused and resumed.', [], 0x32cd32)] });
  } else {
    session.player.pause();
    return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', 'Playback paused.', [], 0xffd700)] });
  }
}

// Helper: Skip current song
async function executeSkip(ctx) {
  const session = voiceSessions.get(ctx.guild.id);
  if (!session) return respond(ctx, { content: 'No active voice sessions.' });

  if (session.queue.length === 0) {
    session.player.stop();
    session.currentSong = null;
    return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', 'Skipped song. Queue is empty, stopping playback.', [], 0xffa500)] });
  } else {
    const skippedTitle = session.currentSong ? session.currentSong.title : 'Active Song';
    session.player.stop(); // This triggers Idle event, which triggers playNext automatically!
    return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', `Skipped: **${skippedTitle}**`, [], 0x32cd32)] });
  }
}

// Helper: Get Queue List
async function executeQueue(ctx) {
  const session = voiceSessions.get(ctx.guild.id);
  if (!session) return respond(ctx, { content: 'No active voice sessions.' });

  const current = session.currentSong ? `• **Now Playing:** [${session.currentSong.title}](${session.currentSong.url}) (${session.currentSong.duration})` : '• *No song active*';
  const upcoming = session.queue.map((song, i) => `${i + 1}. **[${song.title}](${song.url})** (${song.duration})`).join('\n') || '*Empty queue*';

  const embed = buildEmbed(
    '📋 Server Music Queue',
    `${current}\n\n**Upcoming Songs:**\n${upcoming}`,
    [],
    0x1e90ff
  );
  return respond(ctx, { embeds: [embed] });
}

// Helper: Set Volume
async function executeVolume(ctx, volumeLevel) {
  const session = voiceSessions.get(ctx.guild.id);
  if (!session) return respond(ctx, { content: 'No active voice sessions.' });

  if (isNaN(volumeLevel) || volumeLevel < 0 || volumeLevel > 100) {
    return respond(ctx, { content: 'Volume level must be an integer between 0 and 100.' });
  }

  const volFloat = volumeLevel / 100;
  session.volume = volFloat;

  if (session.player.state.resource) {
    session.player.state.resource.volume.setVolume(volFloat);
  }

  return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', `Volume adjusted to **${volumeLevel}%**`, [], 0x32cd32)] });
}

// Helper: Show Now Playing
async function executeNowPlaying(ctx) {
  const session = voiceSessions.get(ctx.guild.id);
  if (!session || !session.currentSong) {
    return respond(ctx, { content: 'No music is currently playing.' });
  }

  return respond(ctx, { 
    embeds: [buildEmbed('🎶 Now Playing', `**[${session.currentSong.title}](${session.currentSong.url})**\nDuration: **${session.currentSong.duration}**\nVolume: **${Math.round(session.volume * 100)}%**`, [], 0x1e90ff)] 
  });
}

// Helper: Clear Queue
async function executeClearQueue(ctx) {
  const session = voiceSessions.get(ctx.guild.id);
  if (!session) return respond(ctx, { content: 'No active voice sessions.' });

  session.queue = [];
  return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', 'Server queue cleared successfully.', [], 0xff4500)] });
}

// Helper: Stop & Disconnect
async function executeStop(ctx) {
  const guildId = ctx.guild.id;
  const session = voiceSessions.get(guildId);

  if (!session) {
    const connection = getVoiceConnection(guildId);
    if (connection) {
      try {
        connection.destroy();
      } catch (_) {}
      return respond(ctx, { content: 'Disconnected orphan voice channel connection.' });
    }
    return respond(ctx, { content: 'No voice session active.' });
  }

  try {
    session.queue = [];
    resetIdleTimer(session);
    if (session.childProcess) {
      try {
        session.childProcess.kill();
      } catch (_) {}
    }
    try {
      session.player.stop(true);
    } catch (_) {}
    try {
      session.connection.destroy();
    } catch (_) {}
    // Note: voiceSessions.delete(guildId) is handled by the connection's 'Destroyed' listener

    return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', 'Music player stopped. Queue cleared, disconnected.', [], 0xff4500)] });
  } catch (err) {
    return respond(ctx, { content: `Failed to disconnect voice session: ${err.message}` });
  }
}

// Helper: Re-establish Voice Connection
async function executeReconnect(ctx) {
  const guildId = ctx.guild.id;
  const session = voiceSessions.get(guildId);

  if (!session) {
    // Try to find orphan connection
    const connection = getVoiceConnection(guildId);
    if (connection) {
      try {
        connection.destroy();
      } catch (_) {}
      return respond(ctx, { content: 'Destroyed orphan connection. Please run `.play` to connect fresh.' });
    }
    return respond(ctx, { content: 'No active voice sessions to reconnect.' });
  }

  const voiceChannel = ctx.member?.voice?.channel || ctx.guild.channels.cache.get(session.connection.joinConfig.channelId);
  if (!voiceChannel) {
    return respond(ctx, { content: 'Unable to locate voice channel to reconnect to. Please join a voice channel.' });
  }

  try {
    const response = await respond(ctx, { 
      embeds: [buildEmbed('Voice Subsystem', `🔄 Re-establishing voice connection to **${voiceChannel.name}**...`, [], 0xffa500)] 
    });

    // 1. Set reconnecting flag to preserve session from 'Destroyed' cleanup listener
    session.reconnecting = true;

    // 2. Destroy the old connection completely
    try {
      session.connection.destroy();
    } catch (_) {}

    // Wait a brief moment for cleanup to settle
    await new Promise(resolve => setTimeout(resolve, 200));

    // 3. Create a brand new connection
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    // 4. Bind event listeners to the new connection
    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch (error) {
        console.log(`[Voice Connection] Lost connection in guild ${guildId}, destroying...`);
        try {
          connection.destroy();
        } catch (_) {}
      }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
      console.log(`[Voice Connection] Destroyed/Left channel in guild ${guildId}. Cleaning up session.`);
      const activeSession = voiceSessions.get(guildId);
      if (activeSession) {
        if (activeSession.reconnecting) {
          console.log(`[Voice Connection] Reconnect flag is active. Preserving session player and queue.`);
          return;
        }
        resetIdleTimer(activeSession);
        if (activeSession.childProcess) {
          try {
            activeSession.childProcess.kill();
          } catch (_) {}
        }
        try {
          activeSession.player.stop(true);
        } catch (_) {}
        voiceSessions.delete(guildId);
      }
    });

    // 5. Subscribe player and update session connection
    connection.subscribe(session.player);
    session.connection = connection;
    session.reconnecting = false; // Reset reconnecting flag

    // 6. Wait for the new connection to enter Ready state
    await entersState(connection, VoiceConnectionStatus.Ready, 10000);

    const embed = buildEmbed('Voice Subsystem', `✅ Reconnected successfully to **${voiceChannel.name}**! Playback resumed.`, [], 0x32cd32);
    if (ctx.editReply) {
      await ctx.editReply({ embeds: [embed] }).catch(() => {});
    } else {
      await response.edit({ embeds: [embed] }).catch(() => {});
    }

  } catch (err) {
    session.reconnecting = false; // Reset flag in case of failure
    console.error('[Reconnect Error]:', err.message);
    const failEmbed = buildEmbed('Voice Subsystem', `❌ Reconnection failed: **${err.message}**`, [], 0xff0000);
    if (ctx.editReply) {
      await ctx.editReply({ embeds: [failEmbed] }).catch(() => {});
    } else {
      await response.edit({ embeds: [failEmbed] }).catch(() => {});
    }
  }
}
