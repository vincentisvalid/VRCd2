/**
 * Autorole engine: applies every configured automatic role to fresh members.
 */
import { Events } from 'discord.js';
import { db } from '../database/index.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('autorole');

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      const guildDoc = db.collection('guilds').get(member.guild.id);
      const autoRoles = guildDoc?.autoRoles ?? [];
      if (!autoRoles.length) return;

      for (const roleId of autoRoles) {
        const role = member.guild.roles.cache.get(roleId);
        if (!role) continue; // role was deleted — leave the binding for .autorole list visibility
        await member.roles.add(role, 'Autorole on join').catch((error) => {
          log.warn(`Could not grant autorole ${roleId} in ${member.guild.id}:`, error.message);
        });
      }
    } catch (error) {
      log.error('guildMemberAdd handler failed:', error.message);
    }
  },
};
