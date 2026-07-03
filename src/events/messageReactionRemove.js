/**
 * Reaction-role listener: strips the bound role when a tracked reaction is removed.
 */
import { Events } from 'discord.js';
import { handleReactionToggle } from '../services/reactionRoles.js';

export default {
  name: Events.MessageReactionRemove,
  async execute(reaction, user) {
    await handleReactionToggle(reaction, user, 'remove');
  },
};
