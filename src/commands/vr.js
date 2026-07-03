import { 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  ComponentType 
} from 'discord.js';
import axios from 'axios';
import { db } from '../database/db.js';
import { respond, buildEmbed } from '../utils/helpers.js';
import config from '../../config.json' with { type: 'json' };

export default [
  {
    name: 'vrsetup',
    description: 'Set up your VR headset profile and steam64id.',
    category: 'VR',
    aliases: ['vrset'],
    options: [
      {
        name: 'steamid',
        type: 3, // String
        description: 'Your Steam64ID (17-digit number)',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length < 1) {
        return respond(message, { embeds: [buildEmbed('VR Setup', 'Usage: `.vrsetup <steam64id>`\nTo find your SteamID, use a site like steamid.io.', [], 0xffcc00)] });
      }
      const steamid = args[0];
      if (!/^\d{17}$/.test(steamid)) {
        return respond(message, { embeds: [buildEmbed('Error', 'Invalid Steam64ID. It must be a 17-digit number.', [], 0xff0000)] });
      }
      return promptHeadsetSelection(message, steamid);
    },
    async executeSlash(interaction, client) {
      const steamid = interaction.options.getString('steamid');
      if (!/^\d{17}$/.test(steamid)) {
        return respond(interaction, { embeds: [buildEmbed('Error', 'Invalid Steam64ID. It must be a 17-digit number.', [], 0xff0000)], ephemeral: true });
      }
      return promptHeadsetSelection(interaction, steamid);
    }
  },
  {
    name: 'vrstats',
    description: 'View VR profile statistics for a user.',
    category: 'VR',
    aliases: ['vrprofile'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'The user to view',
        required: false
      }
    ],
    async execute(message, args, client) {
      const targetUser = message.mentions.users.first() || message.author;
      return renderVRStats(message, targetUser);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('user') || interaction.user;
      return renderVRStats(interaction, targetUser);
    }
  }
];

// Helper: Show dropdown to select headset
async function promptHeadsetSelection(ctx, steamid) {
  const userId = ctx.author ? ctx.author.id : ctx.user.id;
  
  const select = new StringSelectMenuBuilder()
    .setCustomId('vr_headset_select')
    .setPlaceholder('Choose your primary VR Headset')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('Meta Quest 3').setValue('Meta Quest 3').setDescription('Standalone & PCVR via Link/Virtual Desktop'),
      new StringSelectMenuOptionBuilder().setLabel('Valve Index').setValue('Valve Index').setDescription('PCVR with Lighthouse tracking & knuckle controllers'),
      new StringSelectMenuOptionBuilder().setLabel('Pico 4').setValue('Pico 4').setDescription('Balanced standalone and PCVR streaming headset'),
      new StringSelectMenuOptionBuilder().setLabel('HTC Vive').setValue('HTC Vive').setDescription('Classic SteamVR Lighthouse headset'),
      new StringSelectMenuOptionBuilder().setLabel('Apple Vision Pro').setValue('Apple Vision Pro').setDescription('Ultra-premium spatial computing headset')
    );

  const row = new ActionRowBuilder().addComponents(select);
  const embed = buildEmbed('VR Profile Setup', 'Please select your primary VR Headset from the drop-down menu below to link it with SteamID.');

  const response = await respond(ctx, { embeds: [embed], components: [row] });
  
  // Create components collector
  const filter = i => i.customId === 'vr_headset_select' && i.user.id === userId;
  
  // Get channel / interaction reference safely
  const collector = response.createMessageComponentCollector({
    filter,
    componentType: ComponentType.StringSelect,
    time: 30000
  });

  collector.on('collect', async i => {
    const selectedHeadset = i.values[0];
    
    // Fetch or create profile
    const profile = db.profiles.get(userId, {});
    profile.steam64id = steamid;
    profile.headset = selectedHeadset;
    db.profiles.set(userId, profile);

    const successEmbed = buildEmbed(
      'VR Setup Completed',
      `Successfully linked profile!\n\n**SteamID**: \`${steamid}\`\n**Headset**: \`${selectedHeadset}\``,
      [],
      0x00ff00
    );

    await i.update({ embeds: [successEmbed], components: [] });
    collector.stop();
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'time' && collected.size === 0) {
      const timeoutEmbed = buildEmbed('VR Setup Expired', 'The setup wizard timed out. Please run the command again.', [], 0xff0000);
      if (ctx.editReply) {
        await ctx.editReply({ embeds: [timeoutEmbed], components: [] });
      } else {
        await response.edit({ embeds: [timeoutEmbed], components: [] });
      }
    }
  });
}

// Helper: Render statistics
async function renderVRStats(ctx, targetUser) {
  const profile = db.profiles.get(targetUser.id, null);
  if (!profile || !profile.steam64id) {
    const noProfileEmbed = buildEmbed(
      'Profile Not Found',
      `${targetUser.username} has not set up a VR profile yet. Ask them to run \`.vrsetup <steam64id>\`!`,
      [],
      0xffcc00
    );
    return respond(ctx, { embeds: [noProfileEmbed] });
  }

  const apiKey = process.env.STEAM_API_KEY || config.steamWebApiKey;
  let steamSummary = null;
  let vrPlaytime = 'Private/Not Found';
  let statusStr = 'Offline';

  try {
    if (apiKey) {
      // 1. Get Player Summaries
      const summaryUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${profile.steam64id}`;
      const summaryRes = await axios.get(summaryUrl, { timeout: 5000 });
      const player = summaryRes.data?.response?.players?.[0];
      
      if (player) {
        steamSummary = player;
        statusStr = player.personastate === 1 ? 'Online' : player.personastate === 3 ? 'Away' : 'Offline';
        if (player.gameextrainfo) {
          statusStr = `Playing: **${player.gameextrainfo}**`;
        }
      }

      // 2. Get VR Playtime (using standard games query and searching for VR titles, or fallback)
      const gamesUrl = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${profile.steam64id}&format=json&include_appinfo=true`;
      const gamesRes = await axios.get(gamesUrl, { timeout: 5000 });
      const games = gamesRes.data?.response?.games || [];

      // Detect known VR games in Steam profile
      const vrKeywords = ['vr', 'virtual reality', 'alyx', 'beat saber', 'boneworks', 'bonelab', 'vrc', 'vrchat', 'blade & sorcery', 'pavlov'];
      let vrMinutes = 0;
      
      for (const game of games) {
        const gameName = (game.name || '').toLowerCase();
        if (vrKeywords.some(keyword => gameName.includes(keyword))) {
          vrMinutes += game.playtime_forever || 0;
        }
      }

      if (vrMinutes > 0) {
        vrPlaytime = `${(vrMinutes / 60).toFixed(1)} hours`;
      } else {
        vrPlaytime = 'No VR games found or library is private';
      }
    } else {
      vrPlaytime = 'Steam Integration Config Required (No API Key)';
    }
  } catch (err) {
    console.error('[VRStats] Steam API Error:', err.message);
    vrPlaytime = 'API Error (Fallback Active)';
  }

  // Create hardware badge and fields
  const badgeEmoji = getHeadsetEmoji(profile.headset);
  
  const statsEmbed = buildEmbed(
    `${targetUser.username}'s Virtual Reality Profile`,
    `Current VR stats aggregated from Steam Integration and local databases.`,
    [
      { name: 'Primary VR Headset', value: `${badgeEmoji} ${profile.headset}`, inline: true },
      { name: 'Steam64ID', value: `\`${profile.steam64id}\``, inline: true },
      { name: 'Estimated VR Playtime', value: vrPlaytime, inline: true },
      { name: 'Steam Status', value: statusStr, inline: true }
    ],
    0x9932cc
  );

  if (steamSummary && steamSummary.avatarfull) {
    statsEmbed.setThumbnail(steamSummary.avatarfull);
  } else {
    statsEmbed.setThumbnail(targetUser.displayAvatarURL());
  }

  return respond(ctx, { embeds: [statsEmbed] });
}

function getHeadsetEmoji(headset) {
  switch (headset) {
    case 'Meta Quest 3': return '🥽';
    case 'Valve Index': return '🕹️';
    case 'Pico 4': return '🕶️';
    case 'HTC Vive': return '📡';
    case 'Apple Vision Pro': return '🍎';
    default: return '👓';
  }
}
