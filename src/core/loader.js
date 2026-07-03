/**
 * Command collection loader.
 *
 * Recursively walks `src/commands/**`, dynamically imports every module,
 * validates the exported command shape, and builds the runtime lookup
 * caches (canonical names + alias map) used by both transports.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Collection } from 'discord.js';
import { createLogger } from './logger.js';

const log = createLogger('loader');

function* walkJsFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walkJsFiles(fullPath);
    // `_`-prefixed files are shared helpers co-located with their category, not commands.
    else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.startsWith('_')) yield fullPath;
  }
}

function validateCommand(command, file) {
  const problems = [];
  if (!command?.name || typeof command.name !== 'string') problems.push('missing string `name`');
  if (!command?.category) problems.push('missing `category`');
  if (typeof command?.execute !== 'function') problems.push('missing `execute` function');
  if (problems.length) throw new Error(`Invalid command module ${file}: ${problems.join(', ')}`);
}

/**
 * @param {string} commandsDirectory absolute path to src/commands
 * @returns {{ commands: Collection, aliases: Map }}
 */
export async function loadCommands(commandsDirectory) {
  const commands = new Collection();
  const aliases = new Map();

  for (const file of walkJsFiles(commandsDirectory)) {
    try {
      const module = await import(pathToFileURL(file).href);
      const command = module.default;
      validateCommand(command, file);

      if (commands.has(command.name)) {
        throw new Error(`Duplicate command name "${command.name}" (${file})`);
      }
      commands.set(command.name, command);

      for (const alias of command.aliases ?? []) {
        if (aliases.has(alias) || commands.has(alias)) {
          throw new Error(`Duplicate alias "${alias}" on command "${command.name}"`);
        }
        aliases.set(alias, command.name);
      }
    } catch (error) {
      // One broken command module must not prevent the rest from loading.
      log.error(`Skipping command file ${file}:`, error.message);
    }
  }

  log.info(`Loaded ${commands.size} commands (${aliases.size} aliases).`);
  return { commands, aliases };
}

/** Looks a command up by canonical name or alias. */
export function findCommand(client, name) {
  const lowered = String(name ?? '').toLowerCase();
  return client.commands.get(lowered) ?? client.commands.get(client.commandAliases.get(lowered)) ?? null;
}
