/**
 * .pfp — high-fidelity global + server-specific avatar renders.
 */
import { brandEmbed } from '../../core/embeds.js';

export default {
  name: 'pfp',
  category: 'UserInfo',
  description: 'Shows a user’s global (and server-specific) avatar at maximum resolution.',
  usage: '.pfp [@user]',
  aliases: ['avatar', 'av'],
  cooldownMs: 3000,
  options: [{ name: 'user', type: 'user', description: 'Whose avatar (defaults to you)', required: false }],
  async execute(ctx) {
    const target = ctx.getOption('user') ?? ctx.user;
    const globalUrl = target.displayAvatarURL({ size: 4096, extension: 'png', forceStatic: false });

    const embed = brandEmbed()
      .setTitle(`🖼️ ${target.username}'s avatar`)
      .setImage(globalUrl)
      .setDescription(`[PNG](${target.displayAvatarURL({ size: 4096, extension: 'png' })}) · [JPG](${target.displayAvatarURL({ size: 4096, extension: 'jpg' })}) · [WEBP](${target.displayAvatarURL({ size: 4096, extension: 'webp' })})`);

    // Surface the per-server override when one exists and differs.
    const member = await ctx.fetchMemberOf(target);
    const guildAvatar = member?.avatarURL?.({ size: 4096, forceStatic: false });
    if (guildAvatar) {
      embed.setThumbnail(guildAvatar).addFields({ name: 'Server avatar', value: `[Open](${guildAvatar})`, inline: true });
    }

    return ctx.reply({ embeds: [embed] });
  },
};
