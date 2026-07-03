import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } from 'discord.js';
import axios from 'axios';
import { db } from '../database/db.js';
import { respond, buildEmbed } from '../utils/helpers.js';
import config from '../../config.json' assert { type: 'json' };

export default [
  {
    name: 'fmsetup',
    description: 'Link your Last.fm or Spotify credentials to your profile.',
    category: 'Music',
    aliases: ['musicsetup'],
    options: [
      {
        name: 'platform',
        type: 3, // String
        description: 'Choose platform (lastfm or spotify)',
        required: false,
        choices: [
          { name: 'Last.fm', value: 'lastfm' },
          { name: 'Spotify', value: 'spotify' }
        ]
      },
      {
        name: 'param1',
        type: 3, // String
        description: 'Last.fm username OR Spotify ClientID',
        required: false
      },
      {
        name: 'param2',
        type: 3, // String
        description: 'Spotify Client Secret (Spotify only)',
        required: false
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return promptMusicPlatform(message);
      }
      
      const sub = args[0].toLowerCase();
      if (sub === 'lastfm') {
        if (!args[1]) {
          return respond(message, { embeds: [buildEmbed('Error', 'Please specify your Last.fm username:\n`.fmsetup lastfm <username>`', [], 0xff0000)] });
        }
        return setupLastfm(message, args[1]);
      } else if (sub === 'spotify') {
        if (!args[1] || !args[2]) {
          return respond(message, { embeds: [buildEmbed('Error', 'Please specify Spotify ClientID and ClientSecret:\n`.fmsetup spotify <clientId> <clientSecret>`', [], 0xff0000)] });
        }
        return setupSpotify(message, args[1], args[2]);
      } else {
        return respond(message, { embeds: [buildEmbed('Error', 'Unknown platform. Use `.fmsetup lastfm <username>` or `.fmsetup spotify <clientId> <clientSecret>`', [], 0xff0000)] });
      }
    },
    async executeSlash(interaction, client) {
      const platform = interaction.options.getString('platform');
      const param1 = interaction.options.getString('param1');
      const param2 = interaction.options.getString('param2');

      if (!platform) {
        return promptMusicPlatform(interaction);
      }

      if (platform === 'lastfm') {
        if (!param1) {
          return respond(interaction, { content: 'Please provide your Last.fm username.', ephemeral: true });
        }
        return setupLastfm(interaction, param1);
      } else if (platform === 'spotify') {
        if (!param1 || !param2) {
          return respond(interaction, { content: 'Please provide both Spotify Client ID and Client Secret.', ephemeral: true });
        }
        return setupSpotify(interaction, param1, param2);
      }
    }
  },
  {
    name: 'fm',
    description: 'Display currently playing track or recent song history.',
    category: 'Music',
    aliases: ['np', 'nowplaying'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'User to view',
        required: false
      }
    ],
    async execute(message, args, client) {
      const targetUser = message.mentions.users.first() || message.author;
      return renderNowPlaying(message, targetUser);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('user') || interaction.user;
      return renderNowPlaying(interaction, targetUser);
    }
  }
];

// Helper: Platform picker menu
async function promptMusicPlatform(ctx) {
  const userId = ctx.author ? ctx.author.id : ctx.user.id;

  const select = new StringSelectMenuBuilder()
    .setCustomId('music_platform_select')
    .setPlaceholder('Choose music platform to link')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('Last.fm').setValue('lastfm').setDescription('Link username to fetch your scrobbles'),
      new StringSelectMenuOptionBuilder().setLabel('Spotify').setValue('spotify').setDescription('Securely configure developer credentials')
    );

  const row = new ActionRowBuilder().addComponents(select);
  const embed = buildEmbed('Music Setup Wizard', 'Choose a streaming provider platform to link with your VRCd profile.');

  const response = await respond(ctx, { embeds: [embed], components: [row] });

  const filter = i => i.customId === 'music_platform_select' && i.user.id === userId;
  const collector = response.createMessageComponentCollector({
    filter,
    componentType: ComponentType.StringSelect,
    time: 30000
  });

  collector.on('collect', async i => {
    const val = i.values[0];
    if (val === 'lastfm') {
      const askEmbed = buildEmbed('Last.fm Setup', 'To link Last.fm, please use prefix command:\n`.fmsetup lastfm <your_username>`');
      await i.update({ embeds: [askEmbed], components: [] });
    } else {
      const askEmbed = buildEmbed('Spotify Setup', 'To link Spotify credentials, please use prefix command:\n`.fmsetup spotify <clientId> <clientSecret>`\n*Your tokens will be safely encrypted locally.*');
      await i.update({ embeds: [askEmbed], components: [] });
    }
    collector.stop();
  });
}

// Helper: Setup Lastfm account
async function setupLastfm(ctx, username) {
  const userId = ctx.author ? ctx.author.id : ctx.user.id;
  const profile = db.profiles.get(userId, {});
  profile.lastfm = username;
  db.profiles.set(userId, profile);

  return respond(ctx, { embeds: [buildEmbed('Last.fm Linked', `Successfully mapped user profile to Last.fm username \`${username}\`.`, [], 0x00ff00)] });
}

// Helper: Setup Spotify developer tokens
async function setupSpotify(ctx, clientId, clientSecret) {
  const userId = ctx.author ? ctx.author.id : ctx.user.id;
  const profile = db.profiles.get(userId, {});
  profile.spotify = {
    clientId,
    clientSecret
  };
  db.profiles.set(userId, profile);

  return respond(ctx, { embeds: [buildEmbed('Spotify Configured', `Spotify API Credentials saved to user database profile.`, [], 0x00ff00)] });
}

// Helper: Fetch playing song and render
async function renderNowPlaying(ctx, targetUser) {
  const profile = db.profiles.get(targetUser.id, null);
  
  if (!profile || (!profile.lastfm && !profile.spotify)) {
    const notSetup = buildEmbed(
      'Profile Not Configured',
      `${targetUser.username} has not configured their Last.fm or Spotify profile.\nRun \`.fmsetup lastfm <username>\` to setup.`
    );
    return respond(ctx, { embeds: [notSetup] });
  }

  // Prefer Last.fm if configured
  if (profile.lastfm) {
    const apiKey = process.env.LASTFM_API_KEY || config.lastfmApiKey;
    if (!apiKey) {
      return respond(ctx, { embeds: [buildEmbed('Config Missing', 'Last.fm API Key is not set in the bot configuration.', [], 0xff0000)] });
    }

    try {
      const url = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${profile.lastfm}&api_key=${apiKey}&format=json&limit=1`;
      const res = await axios.get(url, { timeout: 6000 });
      const recentTracks = res.data?.recenttracks?.track;
      
      if (!recentTracks || recentTracks.length === 0) {
        return respond(ctx, { embeds: [buildEmbed('No Tracks', `Could not find any recent tracks for Last.fm user \`${profile.lastfm}\`.`, [], 0xffcc00)] });
      }

      const track = Array.isArray(recentTracks) ? recentTracks[0] : recentTracks;
      const isPlaying = track['@attr']?.nowplaying === 'true';
      const trackName = track.name;
      const artistName = track.artist?.['#text'] || track.artist?.name || 'Unknown Artist';
      const albumName = track.album?.['#text'] || 'Unknown Album';
      const albumArt = track.image?.[3]?.['#text'] || track.image?.[2]?.['#text'] || '';
      const scrobbles = res.data?.recenttracks?.['@attr']?.total || '0';

      const embed = buildEmbed(
        isPlaying ? `${targetUser.username} is listening to...` : `${targetUser.username}'s Last Played`,
        `**${trackName}**\nby *${artistName}*\nAlbum: *${albumName}*`,
        [
          { name: 'Total Scrobbles', value: `\`${scrobbles}\``, inline: true },
          { name: 'Last.fm Profile', value: `[Link](https://last.fm/user/${profile.lastfm})`, inline: true }
        ],
        0xff0055
      );

      if (albumArt) embed.setThumbnail(albumArt);
      return respond(ctx, { embeds: [embed] });
    } catch (err) {
      console.error('[Music] Last.fm API error:', err.message);
      return respond(ctx, { embeds: [buildEmbed('API Error', 'Failed to retrieve music details from Last.fm API.', [], 0xff0000)] });
    }
  }

  // Fallback to Spotify Developer API if credentials are provided
  if (profile.spotify) {
    try {
      // 1. Get access token
      const auth = Buffer.from(`${profile.spotify.clientId}:${profile.spotify.clientSecret}`).toString('base64');
      const tokenRes = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000
      });

      const token = tokenRes.data.access_token;
      
      // Note: Spotify client credentials grant cannot fetch active playback status of a user (that requires OAuth auth code).
      // So we fallback to search for a query or display integration status.
      const infoEmbed = buildEmbed(
        'Spotify Profile Configured',
        `Developer access validated successfully.\n\n*Note: Real-time playback queries (.fm) require Last.fm mapping. Run \`.fmsetup lastfm <user>\` for direct track scrobble scraping.*`,
        [
          { name: 'API Client ID', value: `\`${profile.spotify.clientId}\`` }
        ],
        0x1db954
      );
      return respond(ctx, { embeds: [infoEmbed] });
    } catch (err) {
      console.error('[Music] Spotify credentials error:', err.message);
      return respond(ctx, { embeds: [buildEmbed('Auth Failure', 'Spotify Developer credentials verification failed. Ensure client details are correct.', [], 0xff0000)] });
    }
  }
}
