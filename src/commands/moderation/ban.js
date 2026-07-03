/**
 * .ban — fully blacklists an account from the guild's connection pools.
 * Works on non-members too (hackban by ID / mention).
 */
import { brandEmbed } from '../../core/embeds.js';
import { findActionBlocker, logModAction } from './_modShared.js';

export default {
  name: 'ban',
  category: 'Moderation',
  description: 'Bans a user from the server (works even if they already left).',
  usage: '.ban <@user> [reason]',
  aliases: [],
  guildOnly: true,
  userPermissions: ['BanMembers'],
  botPermissions: ['BanMembers'],
  cooldownMs: 4000,
  options: [
    { name: 'user', type: 'user', description: 'User to ban', required: true },
    { name: 'reason', type: 'string', description: 'Why they are being banned', required: false, rest: true },
  ],
  async execute(ctx) {
    const target = ctx.getOption('user');
    const reason = ctx.getOption('reason', 'No reason provided');
    const member = await ctx.fetchMemberOf(target);

    // Hierarchy checks only apply when the target is still a member.
    if (member) {
      const blocker = findActionBlocker(ctx, member, { needBotAbility: 'ban' });
      if (blocker) return ctx.replyError('Cannot ban', blocker);
    }

    await target
      .send(`You were banned from **${ctx.guild.name}** — reason: ${reason}`)
      .catch(() => {/* DMs closed — proceed regardless */});

    try {
      await ctx.guild.members.ban(target.id, { reason: `${ctx.user.tag}: ${reason}`, deleteMessageSeconds: 0 });
    } catch (error) {
      return ctx.replyError('Ban failed', `Discord refused the ban: ${error.message}`);
    }

    logModAction(ctx.guild.id, { action: 'ban', targetId: target.id, moderatorId: ctx.user.id, reason });
    const embed = brandEmbed()
      .setTitle('🔨 User banned')
      .addFields(
        { name: 'User', value: `${target.tag ?? target.username} (\`${target.id}\`)`, inline: true },
        { name: 'Moderator', value: `<@${ctx.user.id}>`, inline: true },
        { name: 'Reason', value: reason }
      );
    return ctx.reply({ embeds: [embed] });
  },
};
