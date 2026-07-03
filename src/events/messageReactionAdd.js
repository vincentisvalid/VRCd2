/**
 * Reaction-role listener: grants the bound role when a tracked reaction is added.
 */
import { Events } from 'discord.js';
import { handleReactionToggle } from '../services/reactionRoles.js';

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    await handleReactionToggle(reaction, user, 'add');
  },
};
