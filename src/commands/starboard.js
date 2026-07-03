import { PermissionFlagsBits } from 'discord.js';
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
