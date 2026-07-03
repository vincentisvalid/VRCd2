/**
 * Shared moderation plumbing: hierarchy validation and structured audit
 * logging into the database (immutable, append-only per guild).
 */
import { db } from '../../database/index.js';

/**
 * Validates that a moderation action is executable against a target member.
 * Returns a human-readable rejection reason, or null when clear to proceed.
 */
export function findActionBlocker(ctx, targetMember, { needBotAbility } = {}) {
  if (!targetMember) return 'That user is not a member of this server.';
  if (targetMember.id === ctx.user.id) return 'You cannot target yourself.';
  if (targetMember.id === ctx.client.user.id) return 'I refuse to moderate myself.';
  if (targetMember.id === ctx.guild.ownerId) return 'The server owner cannot be targeted.';

  const invokerTop = ctx.member.roles.highest;
  if (ctx.user.id !== ctx.guild.ownerId && targetMember.roles.highest.position >= invokerTop.position) {
    return 'That member sits at or above your highest role.';
  }
  if (needBotAbility === 'kick' && !targetMember.kickable) return 'My role is not high enough to kick that member.';
  if (needBotAbility === 'ban' && !targetMember.bannable) return 'My role is not high enough to ban that member.';
  if (needBotAbility === 'moderate' && !targetMember.moderatable) return 'My role is not high enough to time out that member.';
  if (needBotAbility === 'manage' && !targetMember.manageable) return 'My role is not high enough to manage that member.';
  return null;
}

/** Appends an immutable structural audit record for the guild. */
export function logModAction(guildId, entry) {
  db.collection('modlogs').update(
    guildId,
    (doc) => {
      doc.entries = [...(doc.entries ?? []), { ...entry, at: Date.now() }];
      return doc;
    },
    { entries: [] }
  );
}
