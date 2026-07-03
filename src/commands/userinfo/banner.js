/**
 * .banner — high-resolution profile banner via a forced REST user fetch
 * (banner data is only populated on full user GETs, never from cache).
 */
import { brandEmbed } from '../../core/embeds.js';

export default {
  name: 'banner',
  category: 'UserInfo',
  description: 'Shows a user’s profile banner at maximum resolution.',
  usage: '.banner [@user]',
  aliases: [],
  cooldownMs: 3000,
  options: [{ name: 'user', type: 'user', description: 'Whose banner (defaults to you)', required: false }],
  async execute(ctx) {
    const target = ctx.getOption('user') ?? ctx.user;

    await ctx.defer();
    let fetched;
    try {
      fetched = await ctx.client.users.fetch(target.id, { force: true }); // REST fetch populates banner
    } catch (error) {
      return ctx.replyError('Fetch failed', `Could not pull the profile: ${error.message}`);
    }

    const bannerUrl = fetched.bannerURL({ size: 4096, forceStatic: false });
    if (!bannerUrl) {
      const accent = fetched.hexAccentColor;
      return ctx.replyError(
        'No banner',
        `${fetched.username} has no banner image set.${accent ? ` Their accent colour is \`${accent}\`.` : ''}`
      );
    }

    const embed = brandEmbed().setTitle(`🎏 ${fetched.username}'s banner`).setImage(bannerUrl);
    return ctx.reply({ embeds: [embed] });
  },
};
