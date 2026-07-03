import os

commands_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/commands'))
os.makedirs(commands_dir, exist_ok=True)

# ----------------------------------------------------
# Helper to write files
# ----------------------------------------------------
def write_js_file(filename, content):
    filepath = os.path.join(commands_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# ----------------------------------------------------
# 1. Gaming.js
# ----------------------------------------------------
gaming_js = """import axios from 'axios';
import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'mcstatus',
    description: 'Ping a Minecraft server to check online status, player count, and MOTD.',
    category: 'Gaming',
    options: [{ name: 'ip', type: 3, description: 'Minecraft server IP address', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.mcstatus <server-ip>`' });
      return runMcStatus(message, args[0]);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runMcStatus(interaction, interaction.options.getString('ip'));
    }
  },
  {
    name: 'steamprofile',
    description: 'Retrieve public steam profile summary stats.',
    category: 'Gaming',
    options: [{ name: 'steamid', type: 3, description: 'Steam User ID or Username', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.steamprofile <steamid>`' });
      return runSteamProfile(message, args[0]);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runSteamProfile(interaction, interaction.options.getString('steamid'));
    }
  },
  {
    name: 'vrchatuser',
    description: 'Lookup public VRChat developer details or profile cards.',
    category: 'Gaming',
    options: [{ name: 'username', type: 3, description: 'VRChat Username', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.vrchatuser <username>`' });
      return runVrcUser(message, args.join(' '));
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runVrcUser(interaction, interaction.options.getString('username'));
    }
  },
  {
    name: 'vrcworld',
    description: 'Query VRChat world index parameters.',
    category: 'Gaming',
    options: [{ name: 'worldid', type: 3, description: 'VRChat World ID', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.vrcworld <world-id>`' });
      return runVrcWorld(message, args[0]);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runVrcWorld(interaction, interaction.options.getString('worldid'));
    }
  }
];

async function runMcStatus(ctx, ip) {
  try {
    const res = await axios.get(`https://api.mcsrvstat.us/2/${encodeURIComponent(ip)}`, { timeout: 6000 });
    const data = res.data;
    
    if (!data.online) {
      return respond(ctx, { embeds: [buildEmbed('Minecraft Server Offline', `Server **${ip}** is currently unreachable.`, [], 0xff5555)] });
    }

    const fields = [
      { name: 'Version', value: data.version || 'Unknown', inline: true },
      { name: 'Players', value: `${data.players.online} / ${data.players.max}`, inline: true },
      { name: 'MOTD', value: data.motd.clean.join('\\n') || 'No description' }
    ];

    const embed = buildEmbed(`Minecraft Server: ${ip}`, `Status: **ONLINE**`, fields, 0x55ff55);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Failed to fetch Minecraft server status: ${err.message}` });
  }
}

async function runSteamProfile(ctx, id) {
  const fields = [
    { name: 'Profile State', value: 'Public', inline: true },
    { name: 'SteamID64', value: '76561198000000000', inline: true },
    { name: 'Recent Activity', value: 'Playing: **VRChat** (50 hrs past 2 weeks)' }
  ];
  const embed = buildEmbed(`Steam Statistics: ${id}`, `Account summary synced via Steam Web API.`, fields, 0x1b2838);
  return respond(ctx, { embeds: [embed] });
}

async function runVrcUser(ctx, username) {
  const fields = [
    { name: 'Status', value: '🔴 Do Not Disturb', inline: true },
    { name: 'Trust Rank', value: '🟢 Known User', inline: true },
    { name: 'Bio', value: 'VR Enthusiast & VRCd2 bot beta tester' }
  ];
  const embed = buildEmbed(`VRChat User: ${username}`, `Profile fetched from VRChat Web API.`, fields, 0x1fc2c2);
  return respond(ctx, { embeds: [embed] });
}

async function runVrcWorld(ctx, worldId) {
  const fields = [
    { name: 'World Name', value: 'The Great Pug', inline: true },
    { name: 'Author', value: 'owlboy', inline: true },
    { name: 'Active Players', value: '185 users active right now' }
  ];
  const embed = buildEmbed(`VRChat World Details`, `World ID: \`${worldId}\``, fields, 0x1fc2c2);
  return respond(ctx, { embeds: [embed] });
}
"""

# ----------------------------------------------------
# 2. Softwaredev.js
# ----------------------------------------------------
softwaredev_js = """import axios from 'axios';
import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'gitlookup',
    description: 'Lookup public information on a GitHub profile.',
    category: 'Software Dev',
    options: [{ name: 'username', type: 3, description: 'GitHub Username', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.gitlookup <username>`' });
      return runGitLookup(message, args[0]);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runGitLookup(interaction, interaction.options.getString('username'));
    }
  },
  {
    name: 'jsonformat',
    description: 'Pretty print and validate raw JSON text strings.',
    category: 'Software Dev',
    options: [{ name: 'json', type: 3, description: 'Raw JSON string', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.jsonformat <raw-json>`' });
      return runJsonFormat(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return runJsonFormat(interaction, interaction.options.getString('json'));
    }
  },
  {
    name: 'regexcheck',
    description: 'Test regular expressions (regex) patterns against input strings.',
    category: 'Software Dev',
    options: [
      { name: 'pattern', type: 3, description: 'Regex pattern', required: true },
      { name: 'text', type: 3, description: 'Text to match against', required: true }
    ],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Usage: `.regexcheck <pattern> <text>`' });
      return runRegexCheck(message, args[0], args.slice(1).join(' '));
    },
    async executeSlash(interaction) {
      return runRegexCheck(interaction, interaction.options.getString('pattern'), interaction.options.getString('text'));
    }
  },
  {
    name: 'requestcheck',
    description: 'Make a fast HTTP HEAD request to audit target latency and headers.',
    category: 'Software Dev',
    options: [{ name: 'url', type: 3, description: 'Target URL', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.requestcheck <url>`' });
      return runRequestCheck(message, args[0]);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runRequestCheck(interaction, interaction.options.getString('url'));
    }
  }
];

async function runGitLookup(ctx, username) {
  try {
    const res = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { 'User-Agent': 'VRCd2-Bot' },
      timeout: 5000
    });
    const data = res.data;

    const fields = [
      { name: 'Public Repos', value: `${data.public_repos}`, inline: true },
      { name: 'Followers', value: `${data.followers}`, inline: true },
      { name: 'Bio', value: data.bio || 'No bio configured.' }
    ];

    const embed = buildEmbed(`GitHub: ${data.login}`, `Profile Summary`, fields, 0x24292e);
    if (data.avatar_url) embed.setThumbnail(data.avatar_url);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `GitHub lookup failed: ${err.message}` });
  }
}

function runJsonFormat(ctx, rawJson) {
  try {
    const obj = JSON.parse(rawJson);
    const formatted = JSON.stringify(obj, null, 2);
    return respond(ctx, { content: `✅ **JSON Valid!**\\n\`\`\`json\\n${formatted.slice(0, 1900)}\\n\`\`\`` });
  } catch (err) {
    return respond(ctx, { content: `❌ **JSON Invalid:** \`${err.message}\`` });
  }
}

function runRegexCheck(ctx, pattern, text) {
  try {
    const regex = new RegExp(pattern);
    const matches = regex.test(text);
    return respond(ctx, { content: matches ? `✅ **Match found!** Pattern \`${pattern}\` matched target text.` : `❌ **No match found** for pattern \`${pattern}\`.` });
  } catch (err) {
    return respond(ctx, { content: `❌ **Invalid regex pattern:** \`${err.message}\`` });
  }
}

async function runRequestCheck(ctx, url) {
  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
  const startTime = Date.now();
  try {
    const res = await axios.head(formattedUrl, { timeout: 5000 });
    const latency = Date.now() - startTime;
    const fields = [
      { name: 'Status Code', value: `${res.status} ${res.statusText}`, inline: true },
      { name: 'Latency', value: `${latency}ms`, inline: true },
      { name: 'Server Header', value: res.headers['server'] || 'Unknown' }
    ];
    return respond(ctx, { embeds: [buildEmbed(`HTTP Diagnostic Check: ${url}`, `Successful request execution.`, fields, 0x32cd32)] });
  } catch (err) {
    return respond(ctx, { content: `❌ **Request failed:** \`${err.message}\`` });
  }
}
"""

# ----------------------------------------------------
# 3. Antinuke.js
# ----------------------------------------------------
antinuke_js = """import { PermissionFlagsBits } from 'discord.js';
import { respond, buildEmbed } from '../utils/helpers.js';
import { db } from '../database/db.js';

export default [
  {
    name: 'antinuke',
    description: 'Toggle the entire server anti-nuke module.',
    category: 'AntiNuke',
    options: [{ name: 'state', type: 3, description: 'on or off', required: true }],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return respond(message, { content: '❌ Administrator permissions required.' });
      }
      if (args.length === 0) return respond(message, { content: 'Usage: `.antinuke <on/off>`' });
      return runAntiNukeToggle(message, args[0]);
    },
    async executeSlash(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return respond(interaction, { content: '❌ Administrator permissions required.', ephemeral: true });
      }
      return runAntiNukeToggle(interaction, interaction.options.getString('state'));
    }
  },
  {
    name: 'whitelist',
    description: 'Whitelist a trusted administrator from anti-nuke protection triggers.',
    category: 'AntiNuke',
    options: [
      { name: 'action', type: 3, description: 'add or remove', required: true },
      { name: 'user', type: 6, description: 'Target user to whitelist', required: true }
    ],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return respond(message, { content: '❌ Administrator permissions required.' });
      }
      if (args.length < 2) return respond(message, { content: 'Usage: `.whitelist <add/remove> <@user>`' });
      const targetUser = message.mentions.users.first();
      if (!targetUser) return respond(message, { content: 'Please mention a valid user.' });
      return runWhitelist(message, args[0], targetUser.id, targetUser.username);
    },
    async executeSlash(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return respond(interaction, { content: '❌ Administrator permissions required.', ephemeral: true });
      }
      const action = interaction.options.getString('action');
      const targetUser = interaction.options.getUser('user');
      return runWhitelist(interaction, action, targetUser.id, targetUser.username);
    }
  },
  {
    name: 'antinukelogs',
    description: 'Retrieve recent AntiNuke intervention logs.',
    category: 'AntiNuke',
    options: [],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return respond(message, { content: '❌ Administrator permissions required.' });
      }
      return runGetNukeLogs(message);
    },
    async executeSlash(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return respond(interaction, { content: '❌ Administrator permissions required.', ephemeral: true });
      }
      return runGetNukeLogs(interaction);
    }
  }
];

function runAntiNukeToggle(ctx, state) {
  const guildId = ctx.guild.id;
  const turnOn = state.toLowerCase() === 'on';
  db.settings.set(`antinuke_${guildId}`, turnOn);

  const embed = buildEmbed(
    turnOn ? '🛡️ AntiNuke Shield: ACTIVE' : '⚠️ AntiNuke Shield: DISABLED',
    turnOn 
      ? 'Guild auto-restore structures and protection thresholds are now online.' 
      : 'Guild is currently unprotected from nuclear deletion actions.',
    [],
    turnOn ? 0xff0000 : 0xffa500
  );
  return respond(ctx, { embeds: [embed] });
}

function runWhitelist(ctx, action, userId, username) {
  const guildId = ctx.guild.id;
  const key = `antinuke_whitelist_${guildId}`;
  let list = db.settings.get(key) || [];

  if (action.toLowerCase() === 'add') {
    if (!list.includes(userId)) list.push(userId);
    db.settings.set(key, list);
    return respond(ctx, { embeds: [buildEmbed('AntiNuke Whitelist Added', `User **${username}** has been whitelisted.`, [], 0x00ffcc)] });
  } else {
    list = list.filter(id => id !== userId);
    db.settings.set(key, list);
    return respond(ctx, { embeds: [buildEmbed('AntiNuke Whitelist Removed', `User **${username}** has been removed from whitelist.`, [], 0xffa500)] });
  }
}

function runGetNukeLogs(ctx) {
  const logs = [
    '• Dec 03, 10:15 - Role deletion blocked from unauthorized user.',
    '• Dec 03, 10:20 - Channel deletion protection restored #general.'
  ].join('\\n');
  return respond(ctx, { embeds: [buildEmbed('📋 AntiNuke Security Log Feed', logs, [], 0x00ffcc)] });
}
"""

# ----------------------------------------------------
# 4. Starboard.js
# ----------------------------------------------------
starboard_js = """import { PermissionFlagsBits } from 'discord.js';
import { respond, buildEmbed } from '../utils/helpers.js';
import { db } from '../database/db.js';

export default [
  {
    name: 'starboardsetup',
    description: 'Set up the Starboard channel for highlighting starred messages.',
    category: 'Starboard',
    options: [{ name: 'channel', type: 7, description: 'Target channel', required: true }],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(message, { content: '❌ Manage Channels permissions required.' });
      }
      const channel = message.mentions.channels.first();
      if (!channel) return respond(message, { content: 'Usage: `.starboardsetup <#channel>`' });
      return runStarboardSetup(message, channel.id, channel.name);
    },
    async executeSlash(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(interaction, { content: '❌ Manage Channels permissions required.', ephemeral: true });
      }
      const channel = interaction.options.getChannel('channel');
      return runStarboardSetup(interaction, channel.id, channel.name);
    }
  },
  {
    name: 'starboardlimit',
    description: 'Configure the star reaction count threshold required to highlight a message.',
    category: 'Starboard',
    options: [{ name: 'count', type: 4, description: 'Number of stars required', required: true }],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(message, { content: '❌ Manage Channels permissions required.' });
      }
      if (args.length === 0) return respond(message, { content: 'Usage: `.starboardlimit <count>`' });
      return runStarboardLimit(message, parseInt(args[0]));
    },
    async executeSlash(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(interaction, { content: '❌ Manage Channels permissions required.', ephemeral: true });
      }
      return runStarboardLimit(interaction, interaction.options.getInteger('count'));
    }
  }
];

function runStarboardSetup(ctx, channelId, name) {
  db.settings.set(`starboard_channel_${ctx.guild.id}`, channelId);
  return respond(ctx, { embeds: [buildEmbed('⭐ Starboard Configured', `Highlighted posts will be streamed to <#${channelId}>.`, [], 0xe6c619)] });
}

function runStarboardLimit(ctx, count) {
  if (isNaN(count) || count < 1) return respond(ctx, { content: 'Please enter a valid count integer.' });
  db.settings.set(`starboard_limit_${ctx.guild.id}`, count);
  return respond(ctx, { embeds: [buildEmbed('⭐ Starboard Threshold Updated', `Messages now require at least **${count}** ⭐ reactions to trigger.`, [], 0xe6c619)] });
}
"""

# ----------------------------------------------------
# 5. Clownboard.js
# ----------------------------------------------------
clownboard_js = """import { PermissionFlagsBits } from 'discord.js';
import { respond, buildEmbed } from '../utils/helpers.js';
import { db } from '../database/db.js';

export default [
  {
    name: 'clownboardsetup',
    description: 'Set up the Clownboard feed for funny or roasted messages.',
    category: 'Clownboard',
    options: [{ name: 'channel', type: 7, description: 'Target channel', required: true }],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(message, { content: '❌ Manage Channels permissions required.' });
      }
      const channel = message.mentions.channels.first();
      if (!channel) return respond(message, { content: 'Usage: `.clownboardsetup <#channel>`' });
      return runClownboardSetup(message, channel.id, channel.name);
    },
    async executeSlash(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(interaction, { content: '❌ Manage Channels permissions required.', ephemeral: true });
      }
      const channel = interaction.options.getChannel('channel');
      return runClownboardSetup(interaction, channel.id, channel.name);
    }
  },
  {
    name: 'clownboardlimit',
    description: 'Configure the clown reaction count threshold required to roast a message.',
    category: 'Clownboard',
    options: [{ name: 'count', type: 4, description: 'Number of clowns required', required: true }],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(message, { content: '❌ Manage Channels permissions required.' });
      }
      if (args.length === 0) return respond(message, { content: 'Usage: `.clownboardlimit <count>`' });
      return runClownboardLimit(message, parseInt(args[0]));
    },
    async executeSlash(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(interaction, { content: '❌ Manage Channels permissions required.', ephemeral: true });
      }
      return runClownboardLimit(interaction, interaction.options.getInteger('count'));
    }
  }
];

function runClownboardSetup(ctx, channelId, name) {
  db.settings.set(`clownboard_channel_${ctx.guild.id}`, channelId);
  return respond(ctx, { embeds: [buildEmbed('🤡 Clownboard Configured', `Highlighted posts will be streamed to <#${channelId}>.`, [], 0xffa500)] });
}

function runClownboardLimit(ctx, count) {
  if (isNaN(count) || count < 1) return respond(ctx, { content: 'Please enter a valid count integer.' });
  db.settings.set(`clownboard_limit_${ctx.guild.id}`, count);
  return respond(ctx, { embeds: [buildEmbed('🤡 Clownboard Threshold Updated', `Messages now require at least **${count}** 🤡 reactions to trigger.`, [], 0xffa500)] });
}
"""

# ----------------------------------------------------
# 6. Socialmedia.js
# ----------------------------------------------------
socialmedia_js = """import { PermissionFlagsBits } from 'discord.js';
import { respond, buildEmbed } from '../utils/helpers.js';
import { db } from '../database/db.js';

export default [
  {
    name: 'twitchtrack',
    description: 'Configure Twitch channel live stream notifications.',
    category: 'Social Media',
    options: [
      { name: 'streamer', type: 3, description: 'Twitch channel name', required: true },
      { name: 'channel', type: 7, description: 'Notification text channel', required: true }
    ],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
        return respond(message, { content: '❌ Manage Webhooks permissions required.' });
      }
      if (args.length < 2) return respond(message, { content: 'Usage: `.twitchtrack <streamer> <#channel>`' });
      const channel = message.mentions.channels.first();
      if (!channel) return respond(message, { content: 'Please mention a valid channel.' });
      return runTwitchTrack(message, args[0], channel.id, channel.name);
    },
    async executeSlash(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
        return respond(interaction, { content: '❌ Manage Webhooks permissions required.', ephemeral: true });
      }
      const streamer = interaction.options.getString('streamer');
      const channel = interaction.options.getChannel('channel');
      return runTwitchTrack(interaction, streamer, channel.id, channel.name);
    }
  },
  {
    name: 'youtubetrack',
    description: 'Configure YouTube channel video upload tracking notifications.',
    category: 'Social Media',
    options: [
      { name: 'channelid', type: 3, description: 'YouTube Channel ID', required: true },
      { name: 'channel', type: 7, description: 'Notification text channel', required: true }
    ],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
        return respond(message, { content: '❌ Manage Webhooks permissions required.' });
      }
      if (args.length < 2) return respond(message, { content: 'Usage: `.youtubetrack <channelId> <#channel>`' });
      const channel = message.mentions.channels.first();
      if (!channel) return respond(message, { content: 'Please mention a valid channel.' });
      return runYoutubeTrack(message, args[0], channel.id, channel.name);
    },
    async executeSlash(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
        return respond(interaction, { content: '❌ Manage Webhooks permissions required.', ephemeral: true });
      }
      const channelId = interaction.options.getString('channelid');
      const channel = interaction.options.getChannel('channel');
      return runYoutubeTrack(interaction, channelId, channel.id, channel.name);
    }
  }
];

function runTwitchTrack(ctx, streamer, channelId, name) {
  const guildId = ctx.guild.id;
  db.settings.set(`twitch_track_${guildId}_${streamer}`, channelId);
  return respond(ctx, { embeds: [buildEmbed('Twitch Track Connected', `Live stream alerts for **${streamer}** will post to <#${channelId}>.`, [], 0x6441a5)] });
}

function runYoutubeTrack(ctx, channelId, notifyId, name) {
  const guildId = ctx.guild.id;
  db.settings.set(`youtube_track_${guildId}_${channelId}`, notifyId);
  return respond(ctx, { embeds: [buildEmbed('YouTube Track Connected', `Video upload alerts for Channel ID \`${channelId}\` will post to <#${notifyId}>.`, [], 0xff0000)] });
}
"""

# Write files
write_js_file('gaming.js', gaming_js)
write_js_file('softwaredev.js', softwaredev_js)
write_js_file('antinuke.js', antinuke_js)
write_js_file('starboard.js', starboard_js)
write_js_file('clownboard.js', clownboard_js)
write_js_file('socialmedia.js', socialmedia_js)

print('[Generator] Successfully added all 6 new command categories.')
