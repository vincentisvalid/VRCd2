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
    description: 'Play high-quality audio stream from YouTube URL.',
    category: 'Voice',
    aliases: ['p', 'stream'],
    options: [
      {
        name: 'url',
        type: 3, // String
        description: 'YouTube or sound link URL',
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
      return executePlay(message, voiceChannel, args[0]);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const voiceChannel = interaction.member?.voice?.channel;
      if (!voiceChannel) {
        return respond(interaction, { content: 'You must be in a voice channel to play music.' });
      }
      const url = interaction.options.getString('url');
      return executePlay(interaction, voiceChannel, url);
    }
  },
  {
    name: 'pause',
    description: 'Pause the current audio stream playback.',
    category: 'Voice',
    aliases: ['hold'],
    async execute(message, args, client) {
      return executePause(message);
    },
    async executeSlash(interaction, client) {
      return executePause(interaction);
    }
  },
  {
    name: 'stop',
    description: 'Stop playing, flush the queue, and disconnect voice channel.',
    category: 'Voice',
    aliases: ['leave', 'disconnect'],
    async execute(message, args, client) {
      return executeStop(message);
    },
    async executeSlash(interaction, client) {
      return executeStop(interaction);
    }
  }
];

// Helper: Play Stream
async function executePlay(ctx, voiceChannel, url) {
  const guildId = ctx.guild.id;
  
  try {
    let session = voiceSessions.get(guildId);
    
    // Join channel if session doesn't exist
    if (!session) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
      });

      const player = createAudioPlayer();
      connection.subscribe(player);

      session = { connection, player, childProcess: null };
      voiceSessions.set(guildId, session);

      // Error event monitoring
      player.on('error', err => {
        console.error('[Audio Player Error]:', err.message);
      });
    }

    await respond(ctx, { embeds: [buildEmbed('Voice Subsystem', `Streaming: \`${url}\`\nInvoking yt-dlp pipeline...`, [], 0x1e90ff)] });

    // Spawn yt-dlp to output raw audio data
    // yt-dlp -o - -f bestaudio <url>
    const ytDlpProcess = spawn('yt-dlp', [
      '-o', '-', 
      '-f', 'bestaudio',
      '--no-playlist',
      url
    ]);

    session.childProcess = ytDlpProcess;

    const resource = createAudioResource(ytDlpProcess.stdout, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true
    });
    
    resource.volume.setVolume(0.5); // 50% default volume

    session.player.play(resource);

  } catch (err) {
    console.error('[Voice Exec Error]:', err.message);
    return respond(ctx, { content: `Failed to join channel or play stream: ${err.message}` });
  }
}

// Helper: Pause Playback
async function executePause(ctx) {
  const guildId = ctx.guild.id;
  const session = voiceSessions.get(guildId);

  if (!session) {
    return respond(ctx, { content: 'No active voice sessions running in this guild.' });
  }

  if (session.player.state.status === AudioPlayerStatus.Paused) {
    session.player.unpause();
    return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', 'Stream playback unpaused.', [], 0x32cd32)] });
  } else {
    session.player.pause();
    return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', 'Stream playback paused.', [], 0xffd700)] });
  }
}

// Helper: Stop Playback and Disconnect
async function executeStop(ctx) {
  const guildId = ctx.guild.id;
  const session = voiceSessions.get(guildId);

  if (!session) {
    // Check if there is an orphan connection
    const connection = getVoiceConnection(guildId);
    if (connection) {
      connection.destroy();
      return respond(ctx, { content: 'Disconnected orphan voice channel connection.' });
    }
    return respond(ctx, { content: 'No voice session active.' });
  }

  try {
    session.player.stop();
    if (session.childProcess) {
      session.childProcess.kill();
    }
    session.connection.destroy();
    voiceSessions.delete(guildId);

    return respond(ctx, { embeds: [buildEmbed('Voice Subsystem', 'Voice playback terminated. Cleaned cache.', [], 0xff4500)] });
  } catch (err) {
    return respond(ctx, { content: `Failed to close voice session cleanly: ${err.message}` });
  }
}
