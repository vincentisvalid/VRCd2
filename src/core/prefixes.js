/**
 * Prefix resolution — the layered runtime evaluation chain.
 *
 * Priority (highest wins): personal user override → guild override →
 * global runtime setting → static config.json default.
 */
import { db } from '../database/index.js';
import { config } from './config.js';

export function getEffectivePrefix(userId, guildId) {
  const userPrefix = db.collection('users').get(userId)?.prefix;
  if (userPrefix) return userPrefix;
  if (guildId) {
    const guildPrefix = db.collection('guilds').get(guildId)?.prefix;
    if (guildPrefix) return guildPrefix;
  }
  const globalPrefix = db.collection('settings').get('global')?.prefix;
  return globalPrefix || config.bot.defaultPrefix;
}

export function setGlobalPrefix(prefix) {
  db.collection('settings').update('global', (doc) => ({ ...doc, prefix }), {});
}

export function setGuildPrefix(guildId, prefix) {
  db.collection('guilds').update(guildId, (doc) => ({ ...doc, prefix }), {});
}

export function setUserPrefix(userId, prefix) {
  db.collection('users').update(userId, (doc) => ({ ...doc, prefix }), {});
}

/** Shared validation for every prefix mutation path. */
export function validatePrefix(prefix) {
  if (typeof prefix !== 'string' || !prefix.length) return 'Prefix cannot be empty.';
  if (prefix.length > 5) return 'Prefix must be 5 characters or fewer.';
  if (/\s/.test(prefix)) return 'Prefix cannot contain whitespace.';
  if (prefix.startsWith('/')) return 'Prefix cannot start with `/` (reserved for slash commands).';
  return null;
}
