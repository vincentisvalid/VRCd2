/**
 * Reaction-role binding engine shared by the add/remove reaction events.
 *
 * Bindings persist in the `reactionroles` collection keyed by message ID:
 *   { guildId, channelId, bindings: [{ emojiKey, emojiDisplay, roleId }] }
 * Custom emoji are keyed by their snowflake ID; unicode emoji by the glyph.
 */
import { db } from '../database/index.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('reactionroles');

/** Canonical storage key for any reaction emoji. */
export function emojiKeyOf(emoji) {
  return emoji.id ?? emoji.name;
}

/**
 * Handles one reaction toggle event.
 * @param {'add'|'remove'} direction
 */
export async function handleReactionToggle(reaction, user, direction) {
  try {
    if (user.bot) return;
    if (reaction.partial) reaction = await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const record = db.collection('reactionroles').get(reaction.message.id);
    if (!record) return;

    const key = emojiKeyOf(reaction.emoji);
    const binding = record.bindings.find((entry) => entry.emojiKey === key);
    if (!binding) return;

    const guild = reaction.message.guild;
    if (!guild) return;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    if (direction === 'add') await member.roles.add(binding.roleId, 'Reaction role toggle');
    else await member.roles.remove(binding.roleId, 'Reaction role toggle');
  } catch (error) {
    log.error(`Reaction-role ${direction} failed:`, error.message);
  }
}
