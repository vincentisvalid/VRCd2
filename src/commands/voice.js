import { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus, 
  StreamType, 
  getVoiceConnection 
} from '@discordjs/voice';
import { spawn } from 'child_process';
import { respond, buildEmbed } from '../utils/helpers.js';

// Guild-specific voice connection and player state tracking
const voiceSessions = new Map(); 

export default [
  {
    name: 'play',
    description: 'Play a YouTube URL or add it to the server queue.',
    category: 'Voice',
    aliases: ['p', 'stream'],
    options: [
      {
        name: 'url',
        type: 3, // String
        description: 'YouTube link URL',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return respond(message, { content: 'Please provide a valid YouTube stream URL.' });
      }
      const voiceChannel = message.member?.voice?.channel;
      if (!voiceChannel) {
        return respond(message, { content: 'You must be in a voice channel to play music.' });
      }
      return handlePlayCommand(message, voiceChannel, args[0]);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const voiceChannel = interaction.member?.voice?.channel;
      if (!voiceChannel) {
        return respond(interaction, { content: 'You must be in a voice channel to play music.' });
      }
      const url = interaction.options.getString('url');
      return handlePlayCommand(interaction, voiceChannel, url);
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
    aliases: ['leave', 'disconnect'],
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
  }
];

// Helper: Fetch video details asynchronously via yt-dlp
function getSongInfo(url) {
  return new Promise((resolve) => {
    const process = spawn('yt-dlp', ['--get-title', '--get-duration', '--no-playlist', url]);
    let stdout = '';
    process.stdout.on('data', data => stdout += data.toString());
    process.on('close', () => {
      const lines = stdout.trim().split('\n');
      resolve({
        title: lines[0] || url,
        duration: lines[1] || 'Unknown',
        url
      });
    });
  });
}

// Helper: Handle Play Command & Queueing
async function handlePlayCommand(ctx, voiceChannel, url) {
  const guildId = ctx.guild.id;
  let session = voiceSessions.get(guildId);

  // Parse details
  const song = await getSongInfo(url);

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
        volume: 0.5 
      };
      
      voiceSessions.set(guildId, session);

      player.on('error', err => {
        console.error('[Audio Player Error]:', err.message);
      });

      player.on(AudioPlayerStatus.Idle, () => {
        playNext(guildId);
      });

    } catch (err) {
      console.error('[Voice Connection Join Error]:', err.message);
      return respond(ctx, { content: `Failed to join voice channel: ${err.message}` });
    }
  }

  // Check if player is playing a resource
  if (session.player.state.status === AudioPlayerStatus.Playing || session.currentSong) {
    session.queue.push(song);
    return respond(ctx, { 
      embeds: [buildEmbed('🎵 Song Queued', `Added **[${song.title}](${song.url})** to the queue.\nPosition: **#${session.queue.length}** | Duration: **${song.duration}**`, [], 0x32cd32)] 
    });
  } else {
    return startPlayback(ctx, guildId, song);
  }
}

// Helper: Start Audio Stream Playback
async function startPlayback(ctx, guildId, song) {
  const session = voiceSessions.get(guildId);
  if (!session) return;

  session.currentSong = song;

  try {
    if (session.childProcess) {
      session.childProcess.kill();
    }

    const ytDlpProcess = spawn('yt-dlp', [
      '-o', '-', 
      '-f', 'bestaudio',
      '--no-playlist',
      song.url
    ]);

    session.childProcess = ytDlpProcess;

    const resource = createAudioResource(ytDlpProcess.stdout, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true
    });
    
    resource.volume.setVolume(session.volume);
    session.player.play(resource);

    return respond(ctx, { 
      embeds: [buildEmbed('🎶 Now Playing', `Now streaming: **[${song.title}](${song.url})**\nDuration: **${song.duration}** | Volume: **${Math.round(session.volume * 100)}%**`, [], 0x1e90ff)] 
    });

  } catch (err) {
    console.error('[Playback Start Error]:', err.message);
    return respond(ctx, { content: `Failed to start stream playback: ${err.message}` });
  }
}

// Helper: Play next song in queue
function playNext(guildId) {
  const session = voiceSessions.get(guildId);
  if (!session) return;

  if (session.queue.length > 0) {
    const nextSong = session.queue.shift();
    
    // Trigger playback
    if (session.childProcess) {
      session.childProcess.kill();
    }

    const ytDlpProcess = spawn('yt-dlp', [
      '-o', '-', 
      '-f', 'bestaudio',
      '--no-playlist',
      nextSong.url
    ]);

    session.childProcess = ytDlpProcess;
    session.currentSong = nextSong;

    const resource = createAudioResource(ytDlpProcess.stdout, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true
    });
    
    resource.volume.setVolume(session.volume);
    session.player.play(resource);
  } else {
    session.currentSong = null;
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
      connection.destroy();
      return respond(ctx, { content: 'Disconnected orphan voice channel connection.' });
    }
    return respond(ctx, { content: 'No voice session active.' });
  }

  try {
    session.queue = [];
    session.player.stop();
    if (session.childProcess) {
      session.childProcess.kill();
    }
    session.connection.destroy();
    voiceSessions.delete(guildId);

    return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', 'Music player stopped. Queue cleared, disconnected.', [], 0xff4500)] });
  } catch (err) {
    return respond(ctx, { content: `Failed to disconnect voice session: ${err.message}` });
  }
}
