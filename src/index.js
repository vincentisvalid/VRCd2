/**
 * VRCd Bot — main process loop.
 *
 * Boot order:
 *   1. Validate the minimum environment (token + client ID).
 *   2. Construct the gateway client with the modern intent/partial set.
 *   3. Initialise the database pool (collections lazily hydrate from disk).
 *   4. Load the command collection caches and wire every event listener.
 *   5. Install global rejection/exception guards, then log in.
 */
import { readdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config, assertBootRequirements, PROJECT_ROOT } from './core/config.js';
import { db } from './database/index.js';
import { loadCommands } from './core/loader.js';
import { createLogger } from './core/logger.js';

const log = createLogger('index');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 1. Environment validation ────────────────────────────────────────────
const bootProblems = assertBootRequirements();
if (bootProblems.length) {
  for (const problem of bootProblems) log.error(problem);
  log.error('Copy .env.example to .env and fill in the required secrets.');
  process.exit(1);
}

// ── 2. Gateway client ────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers, // autorole / booster / jail restoration
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
});

// ── 3. Database + working directories ────────────────────────────────────
client.db = db;
await mkdir(path.join(PROJECT_ROOT, config.media.tmpDir), { recursive: true });

// ── 4. Command caches + event wiring ─────────────────────────────────────
const { commands, aliases } = await loadCommands(path.join(__dirname, 'commands'));
client.commands = commands;
client.commandAliases = aliases;

const eventsDirectory = path.join(__dirname, 'events');
for (const file of readdirSync(eventsDirectory).filter((name) => name.endsWith('.js'))) {
  try {
    const module = await import(pathToFileURL(path.join(eventsDirectory, file)).href);
    const event = module.default;
    if (!event?.name || typeof event.execute !== 'function') {
      throw new Error('event module must export { name, execute }');
    }
    if (event.once) client.once(event.name, (...args) => event.execute(...args));
    else client.on(event.name, (...args) => event.execute(...args));
  } catch (error) {
    log.error(`Skipping event file ${file}:`, error.message);
  }
}

// ── 5. Global crash guards ───────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  // A stray rejection must never take the gateway down — log and continue.
  log.error('Unhandled promise rejection:', reason?.stack ?? reason);
});
process.on('uncaughtException', (error) => {
  // Log, flush the database, and exit non-zero so a supervisor restarts us
  // from a clean state rather than limping on with corrupted internals.
  log.error('Uncaught exception — shutting down:', error?.stack ?? error);
  try {
    db.flushAll();
  } finally {
    process.exit(1);
  }
});
client.on('error', (error) => log.error('Client error:', error?.message ?? error));
client.on('shardError', (error) => log.error('Shard error:', error?.message ?? error));

// ── Login ────────────────────────────────────────────────────────────────
try {
  await client.login(config.env.discordToken);
} catch (error) {
  log.error('Discord login failed:', error?.message ?? error);
  process.exit(1);
}
