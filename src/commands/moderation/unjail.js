/**
 * .unjail — releases a jailed member, restoring their exact pre-jail role
 * set from the persisted state snapshot.
 */
import { db } from '../../database/index.js';
import { logModAction } from './_modShared.js';

export default {
  name: 'unjail',
  category: 'Moderation',
  description: 'Releases a jailed member and restores their previous roles.',
  usage: '.unjail <@user>',
  aliases: ['release'],
  guildOnly: true,
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles'],
  cooldownMs: 4000,
  options: [{ name: 'user', type: 'user', description: 'Member to release', required: true }],
  async execute(ctx) {
    const target = ctx.getOption('user');
    const jailKey = `${ctx.guild.id}:${target.id}`;
    const record = db.collection('jail').get(jailKey);
    if (!record) return ctx.replyError('Not jailed', `${target.username} has no jail record in this server.`);

    const member = await ctx.fetchMemberOf(target);
    if (!member) {
      // They left while jailed — clear the record so a rejoin starts clean.
      db.collection('jail').delete(jailKey);
      return ctx.replySuccess('Record cleared', `${target.username} already left the server; jail state wiped.`);
    }

    // Restore only roles that still exist (some may have been deleted since).
    const restorable = record.previousRoleIds.filter((roleId) => ctx.guild.roles.cache.has(roleId));
    try {
      await member.roles.set(restorable, `Unjailed by ${ctx.user.tag}`);
    } catch (error) {
      return ctx.replyError('Restore failed', `Discord refused the role update: ${error.message}`);
    }

    db.collection('jail').delete(jailKey);
    logModAction(ctx.guild.id, { action: 'unjail', targetId: target.id, moderatorId: ctx.user.id, reason: null });
    return ctx.replySuccess('Member released', `<@${target.id}> is free — ${restorable.length} role(s) restored.`);
  },
};
