/**
 * .warn — logs an immutable infraction increment on the target's relational
 * profile record and reports the running infraction level.
 */
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';
import { findActionBlocker, logModAction } from './_modShared.js';

export default {
  name: 'warn',
  category: 'Moderation',
  description: 'Warns a member; infractions accumulate on their record.',
  usage: '.warn <@user> [reason]',
  aliases: [],
  guildOnly: true,
  userPermissions: ['ModerateMembers'],
  cooldownMs: 3000,
  options: [
    { name: 'user', type: 'user', description: 'Member to warn', required: true },
    { name: 'reason', type: 'string', description: 'What they did', required: false, rest: true },
  ],
  async execute(ctx) {
    const target = ctx.getOption('user');
    const reason = ctx.getOption('reason', 'No reason provided');
    const member = await ctx.fetchMemberOf(target);

    const blocker = findActionBlocker(ctx, member, {});
    if (blocker) return ctx.replyError('Cannot warn', blocker);

    const warnKey = `${ctx.guild.id}:${target.id}`;
    const record = db.collection('warns').update(
      warnKey,
      (doc) => {
        doc.entries = [
          ...(doc.entries ?? []),
          { reason, moderatorId: ctx.user.id, at: Date.now() }, // append-only: entries are never rewritten
        ];
        return doc;
      },
      { guildId: ctx.guild.id, userId: target.id, entries: [] }
    );
    logModAction(ctx.guild.id, { action: 'warn', targetId: target.id, moderatorId: ctx.user.id, reason });

    const count = record.entries.length;
    await target
      .send(`You received a warning in **${ctx.guild.name}** (warning #${count}) — reason: ${reason}`)
      .catch(() => {/* DMs closed */});

    const embed = brandEmbed()
      .setTitle('⚠️ Warning issued')
      .addFields(
        { name: 'User', value: `<@${target.id}>`, inline: true },
        { name: 'Infraction level', value: `#${count}`, inline: true },
        { name: 'Moderator', value: `<@${ctx.user.id}>`, inline: true },
        { name: 'Reason', value: reason }
      );

    if (record.entries.length > 1) {
      embed.addFields({
        name: 'History',
        value: record.entries
          .slice(-5)
          .map((entry, i) => `\`${count - Math.min(4, count - 1) + i}.\` <t:${Math.floor(entry.at / 1000)}:d> — ${entry.reason}`)
          .join('\n')
          .slice(0, 1024),
      });
    }
    return ctx.reply({ embeds: [embed] });
  },
};
