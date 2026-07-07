/**
 * Persistent component router.
 *
 * Interactive wizards that live and die inside one command invocation use
 * local collectors (awaitMessageComponent). But some UI must keep working
 * across process restarts — poll vote buttons, music player controls —
 * long after any collector is gone. Those components carry a namespaced
 * customId (`poll:vote:2`, `player:toggle`) and are dispatched here from
 * the interactionCreate event.
 *
 * Handlers self-register at module load time (the command loader imports
 * every command module, so registration is automatic).
 */
import { MessageFlags } from 'discord.js';
import { errorEmbed } from './embeds.js';
import { createLogger } from './logger.js';

const log = createLogger('components');

/** prefix → async (interaction, parts: string[]) */
const handlers = new Map();

export function registerComponentHandler(prefix, handler) {
  if (handlers.has(prefix)) log.warn(`Component prefix "${prefix}" registered twice — overwriting.`);
  handlers.set(prefix, handler);
}

/**
 * Routes a component interaction to its registered handler.
 * Returns true when a handler owned the interaction. Unregistered prefixes
 * are ignored (they belong to short-lived collectors).
 */
export async function routeComponent(interaction) {
  const [prefix, ...parts] = interaction.customId.split(':');
  const handler = handlers.get(prefix);
  if (!handler) return false;

  try {
    await handler(interaction, parts);
  } catch (error) {
    log.error(`Component handler "${prefix}" failed:`, error?.stack ?? error);
    const payload = {
      embeds: [errorEmbed('Something went wrong', 'That control failed unexpectedly — the incident has been logged.')],
      flags: MessageFlags.Ephemeral,
    };
    try {
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
      else await interaction.reply(payload);
    } catch {
      /* interaction expired — nothing further to deliver */
    }
  }
  return true;
}
