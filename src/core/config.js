/**
 * Central configuration loader.
 *
 * Merges the static `config.json` schema with environment secrets loaded
 * via dotenv. The exported object is deep-frozen so that no runtime code
 * path can mutate security-critical values (most importantly the
 * Admin Utils role-ID allowlist, which the spec requires to be immutable).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/** Recursively freeze an object graph so nothing can be reassigned at runtime. */
function deepFreeze(object) {
  for (const value of Object.values(object)) {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

let fileConfig;
try {
  fileConfig = JSON.parse(readFileSync(path.join(PROJECT_ROOT, 'config.json'), 'utf8'));
} catch (error) {
  // A malformed config.json is unrecoverable — fail fast with a clear message.
  console.error('[config] Failed to parse config.json:', error.message);
  process.exit(1);
}

export const config = deepFreeze({
  ...fileConfig,
  env: {
    discordToken: process.env.DISCORD_TOKEN ?? '',
    discordClientId: process.env.DISCORD_CLIENT_ID ?? '',
    steamApiKey: process.env.STEAM_API_KEY ?? '',
    lastfmApiKey: process.env.LASTFM_API_KEY ?? '',
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY ?? '',
    removeBgApiKey: process.env.REMOVEBG_API_KEY ?? '',
    githubToken: process.env.GITHUB_TOKEN ?? '',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || fileConfig.ai.ollamaBaseUrl,
    backupSecret: process.env.BACKUP_SECRET ?? '',
  },
});

/** Validate the minimum viable environment before the client attempts login. */
export function assertBootRequirements() {
  const problems = [];
  if (!config.env.discordToken) problems.push('DISCORD_TOKEN is missing from the environment.');
  if (!config.env.discordClientId) problems.push('DISCORD_CLIENT_ID is missing from the environment.');
  return problems;
}

export default config;
