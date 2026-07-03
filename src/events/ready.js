/**
 * Fired once when the gateway session is fully established.
 * Registers the slash manifest, restores persisted reminders, and sets presence.
 */
import { Events, ActivityType } from 'discord.js';
import { config } from '../core/config.js';
import { registerSlashCommands } from '../core/registrar.js';
import { restoreReminders } from '../services/reminders.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('ready');

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    log.info(`Logged in as ${client.user.tag} (${client.user.id}) — ${client.guilds.cache.size} guild(s).`);

    try {
      client.user.setPresence({
        status: config.bot.presence.status,
        activities: [{ name: config.bot.presence.activity, type: ActivityType.Playing }],
      });
    } catch (error) {
      log.warn('Failed to set presence:', error.message);
    }

    await registerSlashCommands(client.commands);
    restoreReminders(client);
  },
};
