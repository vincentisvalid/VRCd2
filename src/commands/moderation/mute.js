/**
 * .mute — translates text timing variables (10m, 2h, 1d, 1h30m) into a
 * millisecond delay and places a strict timeout lock on the member.
 */
import { brandEmbed } from '../../core/embeds.js';
import { config } from '../../core/config.js';
import { parseDuration, formatDuration } from '../../utils/time.js';
import { findActionBlocker, logModAction } from './_modShared.js';

export default {
  name: 'mute',
  category: 'Moderation',
  description: 'Times a member out for a duration (e.g. 10m, 2h, 1d — max 28d).',
  usage: '.mute <@user> <duration> [reason]',
  aliases: ['timeout'],
  guildOnly: true,
  userPermissions: ['ModerateMembers'],
  botPermissions: ['ModerateMembers'],
  cooldownMs: 4000,
  options: [
    { name: 'user', type: 'user', description: 'Member to mute', required: true },
    { name: 'duration', type: 'string', description: 'Length like 10m / 2h / 1d / 1h30m', required: true },
    { name: 'reason', type: 'string', description: 'Why they are being muted', required: false, rest: true },
  ],
  async execute(ctx) {
    const target = ctx.getOption('user');
    const durationText = ctx.getOption('duration');
    const reason = ctx.getOption('reason', 'No reason provided');

    const durationMs = parseDuration(durationText);
    if (durationMs === null) {
      return ctx.replyError('Invalid duration', `\`${durationText}\` is not a duration — use forms like \`10m\`, \`2h\`, \`1d\`, \`1h30m\`.`);
    }
    if (durationMs > config.moderation.maxTimeoutMs) {
      return ctx.replyError('Too long', `Discord caps timeouts at ${formatDuration(config.moderation.maxTimeoutMs)}.`);
    }

    const member = await ctx.fetchMemberOf(target);
    const blocker = findActionBlocker(ctx, member, { needBotAbility: 'moderate' });
    if (blocker) return ctx.replyError('Cannot mute', blocker);

    try {
      await member.timeout(durationMs, `${ctx.user.tag}: ${reason}`);
    } catch (error) {
      return ctx.replyError('Mute failed', `Discord refused the timeout: ${error.message}`);
    }

    logModAction(ctx.guild.id, { action: 'mute', targetId: target.id, moderatorId: ctx.user.id, reason, durationMs });
    const embed = brandEmbed()
      .setTitle('🔇 Member muted')
      .addFields(
        { name: 'User', value: `<@${target.id}>`, inline: true },
        { name: 'Duration', value: formatDuration(durationMs), inline: true },
        { name: 'Expires', value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>`, inline: true },
        { name: 'Reason', value: reason }
      );
    return ctx.reply({ embeds: [embed] });
  },
};
