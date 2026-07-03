/**
 * .stickbug — Admin Utils exclusive.
 *
 * Instant mention ping tied to the iconic stickbug asset.
 *
 * ACCESS: hard-locked by the dispatcher's immutable Admin Utils gate —
 * execution is rejected unless the caller holds one of the exact role IDs
 * frozen in config.json (adminUtils.allowedRoleIds).
 */
const STICKBUG_URL = 'https://www.youtube.com/watch?v=9BalEldzE8o';

export default {
  name: 'stickbug',
  category: 'Admin Utils',
  description: 'Gets someone stickbugged. Admin Utils roles only.',
  usage: '.stickbug <@user>',
  aliases: [],
  guildOnly: true,
  adminUtilsOnly: true,
  cooldownMs: 5000,
  options: [{ name: 'user', type: 'user', description: 'Who gets stickbugged', required: true }],
  async execute(ctx) {
    const target = ctx.getOption('user');
    await ctx.reply({ content: `<@${target.id}> get stick bugged lol ${STICKBUG_URL}` });
  },
};
