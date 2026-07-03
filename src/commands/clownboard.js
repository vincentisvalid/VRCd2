import { PermissionFlagsBits } from 'discord.js';
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
