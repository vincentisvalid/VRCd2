/**
 * .kick — removes a member via the API gateway wrapper, backed by the
 * structural audit log.
 */
import { brandEmbed } from '../../core/embeds.js';
import { findActionBlocker, logModAction } from './_modShared.js';

export default {
  name: 'kick',
  category: 'Moderation',
  description: 'Kicks a member from the server.',
  usage: '.kick <@user> [reason]',
  aliases: [],
  guildOnly: true,
  userPermissions: ['KickMembers'],
  botPermissions: ['KickMembers'],
  cooldownMs: 4000,
  options: [
    { name: 'user', type: 'user', description: 'Member to kick', required: true },
    { name: 'reason', type: 'string', description: 'Why they are being kicked', required: false, rest: true },
  ],
  async execute(ctx) {
    const target = ctx.getOption('user');
    const reason = ctx.getOption('reason', 'No reason provided');
    const member = await ctx.fetchMemberOf(target);

    const blocker = findActionBlocker(ctx, member, { needBotAbility: 'kick' });
    if (blocker) return ctx.replyError('Cannot kick', blocker);

    // Courtesy DM before the kick (afterwards we share no mutual server).
    await target
      .send(`You were kicked from **${ctx.guild.name}** — reason: ${reason}`)
      .catch(() => {/* DMs closed — proceed regardless */});

    try {
      await member.kick(`${ctx.user.tag}: ${reason}`);
    } catch (error) {
      return ctx.replyError('Kick failed', `Discord refused the kick: ${error.message}`);
    }

    logModAction(ctx.guild.id, { action: 'kick', targetId: target.id, moderatorId: ctx.user.id, reason });
    const embed = brandEmbed()
      .setTitle('👢 Member kicked')
      .addFields(
        { name: 'User', value: `${target.tag ?? target.username} (\`${target.id}\`)`, inline: true },
        { name: 'Moderator', value: `<@${ctx.user.id}>`, inline: true },
        { name: 'Reason', value: reason }
      );
    return ctx.reply({ embeds: [embed] });
  },
};
