import { PermissionFlagsBits } from 'discord.js';
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
