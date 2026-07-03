/**
 * .serverinfo — granular guild metrics: tiers, member distribution,
 * channel structure, and feature sets.
 */
import { ChannelType } from 'discord.js';
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

const VERIFICATION_LABELS = ['None', 'Low', 'Medium', 'High', 'Very High'];

export default {
  name: 'serverinfo',
  category: 'Utilities',
  description: 'Shows detailed structural metrics about this server.',
  usage: '.serverinfo',
  aliases: ['guildinfo', 'si'],
  guildOnly: true,
  cooldownMs: 5000,
  options: [],
  async execute(ctx) {
    const guild = ctx.guild;
    await ctx.defer();
    const owner = await guild.fetchOwner().catch(() => null);

    const channels = guild.channels.cache;
    const textCount = channels.filter((c) => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement).size;
    const voiceCount = channels.filter((c) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice).size;
    const categoryCount = channels.filter((c) => c.type === ChannelType.GuildCategory).size;

    const features = guild.features.length
      ? truncate(guild.features.map((feature) => `\`${feature.toLowerCase()}\``).join(' '), 1024)
      : '*none*';

    const embed = brandEmbed()
      .setTitle(`🏰 ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 512 }))
      .addFields(
        { name: 'Owner', value: owner ? `<@${owner.id}>` : 'Unknown', inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: 'ID', value: `\`${guild.id}\``, inline: true },
        { name: 'Members', value: guild.memberCount.toLocaleString(), inline: true },
        { name: 'Boosts', value: `Tier ${guild.premiumTier} · ${guild.premiumSubscriptionCount ?? 0} boosts`, inline: true },
        { name: 'Verification', value: VERIFICATION_LABELS[guild.verificationLevel] ?? String(guild.verificationLevel), inline: true },
        { name: 'Channels', value: `${textCount} text · ${voiceCount} voice · ${categoryCount} categories`, inline: true },
        { name: 'Roles', value: String(guild.roles.cache.size), inline: true },
        { name: 'Emoji / Stickers', value: `${guild.emojis.cache.size} / ${guild.stickers.cache.size}`, inline: true },
        { name: 'Feature set', value: features }
      );
    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));
    return ctx.reply({ embeds: [embed] });
  },
};
