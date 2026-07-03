/**
 * .troll — Admin Utils exclusive.
 *
 * Delivers the legendary Rick Astley asset to the target via direct
 * message (falling back to a channel ping when DMs are closed).
 *
 * ACCESS: hard-locked by the dispatcher's immutable Admin Utils gate —
 * execution is rejected unless the caller holds one of the exact role IDs
 * frozen in config.json (adminUtils.allowedRoleIds).
 */
const RICKROLL_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

export default {
  name: 'troll',
  category: 'Admin Utils',
  description: 'Sends the target a very important video. Admin Utils roles only.',
  usage: '.troll <@user>',
  aliases: [],
  guildOnly: true,
  adminUtilsOnly: true,
  cooldownMs: 5000,
  options: [{ name: 'user', type: 'user', description: 'The lucky recipient', required: true }],
  async execute(ctx) {
    const target = ctx.getOption('user');
    if (target.bot) return ctx.replyError('Pointless', 'Bots are immune to being rickrolled.');

    try {
      await target.send(`<@${target.id}> you've been summoned by **${ctx.guild.name}** — important briefing: ${RICKROLL_URL}`);
      return ctx.replySuccess('Delivered', `📨 ${target.username} has received their briefing. Never gonna give you up.`);
    } catch {
      // DMs closed — broadcast the tag in-channel instead.
      await ctx.channel.send(`<@${target.id}> important briefing: ${RICKROLL_URL}`);
      return ctx.replySuccess('Delivered (public fallback)', `${target.username} has DMs closed, so the briefing went out in-channel.`);
    }
  },
};
