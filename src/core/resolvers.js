/**
 * Entity resolvers — turn loose user input (mentions, snowflake IDs, names)
 * into concrete discord.js structures. All resolvers fail soft (return null)
 * so callers decide whether a miss is fatal for their argument slot.
 */

const USER_MENTION = /^<@!?(\d{15,21})>$/;
const ROLE_MENTION = /^<@&(\d{15,21})>$/;
const CHANNEL_MENTION = /^<#(\d{15,21})>$/;
const SNOWFLAKE = /^\d{15,21}$/;

/** Resolve a token to a global User (mention → ID → guild username search). */
export async function resolveUser(client, guild, token) {
  if (!token) return null;
  const id = USER_MENTION.exec(token)?.[1] ?? (SNOWFLAKE.test(token) ? token : null);
  if (id) {
    return client.users.fetch(id).catch(() => null);
  }
  if (guild) {
    const member = await resolveMemberByName(guild, token);
    if (member) return member.user;
  }
  return null;
}

/** Resolve a token to a GuildMember within the invocation guild. */
export async function resolveMember(guild, token) {
  if (!guild || !token) return null;
  const id = USER_MENTION.exec(token)?.[1] ?? (SNOWFLAKE.test(token) ? token : null);
  if (id) return guild.members.fetch(id).catch(() => null);
  return resolveMemberByName(guild, token);
}

async function resolveMemberByName(guild, query) {
  try {
    const matches = await guild.members.fetch({ query, limit: 1 });
    return matches.first() ?? null;
  } catch {
    return null;
  }
}

/** Resolve a token to a Role (mention → ID → case-insensitive name). */
export function resolveRole(guild, token) {
  if (!guild || !token) return null;
  const id = ROLE_MENTION.exec(token)?.[1] ?? (SNOWFLAKE.test(token) ? token : null);
  if (id) return guild.roles.cache.get(id) ?? null;
  const lowered = token.toLowerCase();
  return guild.roles.cache.find((role) => role.name.toLowerCase() === lowered) ?? null;
}

/** Resolve a token to a guild Channel (mention → ID → name). */
export function resolveChannel(guild, token) {
  if (!guild || !token) return null;
  const id = CHANNEL_MENTION.exec(token)?.[1] ?? (SNOWFLAKE.test(token) ? token : null);
  if (id) return guild.channels.cache.get(id) ?? null;
  const lowered = token.toLowerCase().replace(/^#/, '');
  return guild.channels.cache.find((channel) => channel.name === lowered) ?? null;
}

/**
 * Parses a Discord message link into its ID triplet, e.g.
 * https://discord.com/channels/<guildId>/<channelId>/<messageId>
 */
export function parseMessageLink(link) {
  const match = /discord(?:app)?\.com\/channels\/(\d{15,21})\/(\d{15,21})\/(\d{15,21})/.exec(link ?? '');
  if (!match) return null;
  return { guildId: match[1], channelId: match[2], messageId: match[3] };
}
