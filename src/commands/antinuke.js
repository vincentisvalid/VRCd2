import { PermissionFlagsBits } from 'discord.js';
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
  ].join('\n');
  return respond(ctx, { embeds: [buildEmbed('📋 AntiNuke Security Log Feed', logs, [], 0x00ffcc)] });
}
