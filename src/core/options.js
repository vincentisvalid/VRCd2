/**
 * Option schema engine.
 *
 * Commands declare a typed `options` array once; this module materialises
 * those declarations from BOTH transports:
 *   - prefix messages: positional token parsing with entity resolution
 *   - slash interactions: native typed option getters
 *
 * Supported option types: string, integer, number, boolean, user, role,
 * channel, attachment. A trailing string option may set `rest: true` to
 * greedily consume the verbatim remainder of the message.
 */
import { resolveUser, resolveRole, resolveChannel } from './resolvers.js';

/** Raised when user input cannot satisfy a command's declared schema. */
export class UsageError extends Error {}

const BOOLEAN_TRUE = new Set(['true', 'yes', 'on', '1', 'enable', 'enabled']);
const BOOLEAN_FALSE = new Set(['false', 'no', 'off', '0', 'disable', 'disabled']);

/**
 * Parses positional prefix-mode tokens against a declared option schema.
 *
 * @param {object} params
 * @param {object[]} params.schema      declared option descriptors
 * @param {{value:string,start:number}[]} params.tokens tokenized argument list
 * @param {string} params.rawArgs       verbatim argument string
 * @param {import('discord.js').Message} params.message invoking message
 * @returns {Promise<Map<string, any>>}
 */
export async function parsePrefixOptions({ schema = [], tokens, rawArgs, message }) {
  const opts = new Map();
  let index = 0;
  const attachmentQueue = [...message.attachments.values()];
  let repliedFetched = false;

  /** Lazily pull attachments from a replied-to message (media commands support reply targeting). */
  const refillAttachments = async () => {
    if (attachmentQueue.length || repliedFetched || !message.reference?.messageId) return;
    repliedFetched = true;
    try {
      const referenced = await message.channel.messages.fetch(message.reference.messageId);
      attachmentQueue.push(...referenced.attachments.values());
    } catch {
      /* referenced message unavailable — the option simply stays unfilled */
    }
  };

  for (const option of schema) {
    const token = tokens[index];

    if (option.type === 'attachment') {
      await refillAttachments();
      const attachment = attachmentQueue.shift() ?? null;
      if (!attachment && option.required) {
        throw new UsageError(`Attach a file for **${option.name}** (upload it with the command or reply to a message containing one).`);
      }
      opts.set(option.name, attachment);
      continue; // attachments never consume text tokens
    }

    if (!token) {
      if (option.required) throw new UsageError(`Missing required argument **${option.name}** — ${option.description}`);
      opts.set(option.name, null);
      continue;
    }

    switch (option.type) {
      case 'string': {
        if (option.rest) {
          opts.set(option.name, rawArgs.slice(token.start).trim());
          index = tokens.length;
        } else {
          if (option.choices && !option.choices.some((c) => c.value === token.value.toLowerCase())) {
            throw new UsageError(`**${option.name}** must be one of: ${option.choices.map((c) => `\`${c.value}\``).join(', ')}`);
          }
          opts.set(option.name, token.value);
          index += 1;
        }
        break;
      }
      case 'integer':
      case 'number': {
        const parsed = option.type === 'integer' ? Number.parseInt(token.value, 10) : Number.parseFloat(token.value);
        if (Number.isNaN(parsed)) {
          if (option.required) throw new UsageError(`**${option.name}** must be a ${option.type} — got \`${token.value}\`.`);
          opts.set(option.name, null);
          break; // token not consumed; later options may claim it
        }
        opts.set(option.name, parsed);
        index += 1;
        break;
      }
      case 'boolean': {
        const lowered = token.value.toLowerCase();
        if (BOOLEAN_TRUE.has(lowered)) opts.set(option.name, true);
        else if (BOOLEAN_FALSE.has(lowered)) opts.set(option.name, false);
        else {
          if (option.required) throw new UsageError(`**${option.name}** must be yes/no — got \`${token.value}\`.`);
          opts.set(option.name, null);
          break;
        }
        index += 1;
        break;
      }
      case 'user': {
        const user = await resolveUser(message.client, message.guild, token.value);
        if (!user) {
          if (option.required) throw new UsageError(`Could not resolve **${option.name}** from \`${token.value}\` — mention a user or pass an ID/username.`);
          opts.set(option.name, null);
          break;
        }
        opts.set(option.name, user);
        index += 1;
        break;
      }
      case 'role': {
        const role = resolveRole(message.guild, token.value);
        if (!role) {
          if (option.required) throw new UsageError(`Could not resolve role **${option.name}** from \`${token.value}\`.`);
          opts.set(option.name, null);
          break;
        }
        opts.set(option.name, role);
        index += 1;
        break;
      }
      case 'channel': {
        const channel = resolveChannel(message.guild, token.value);
        if (!channel) {
          if (option.required) throw new UsageError(`Could not resolve channel **${option.name}** from \`${token.value}\`.`);
          opts.set(option.name, null);
          break;
        }
        opts.set(option.name, channel);
        index += 1;
        break;
      }
      default:
        throw new Error(`Unknown option type "${option.type}" on option "${option.name}"`);
    }
  }

  return opts;
}

/** Materialises the same schema from a chat-input interaction's typed getters. */
export function collectSlashOptions({ schema = [], interaction }) {
  const opts = new Map();
  for (const option of schema) {
    let value = null;
    switch (option.type) {
      case 'string':
        value = interaction.options.getString(option.name);
        break;
      case 'integer':
        value = interaction.options.getInteger(option.name);
        break;
      case 'number':
        value = interaction.options.getNumber(option.name);
        break;
      case 'boolean':
        value = interaction.options.getBoolean(option.name);
        break;
      case 'user':
        value = interaction.options.getUser(option.name);
        break;
      case 'role':
        value = interaction.options.getRole(option.name);
        break;
      case 'channel':
        value = interaction.options.getChannel(option.name);
        break;
      case 'attachment':
        value = interaction.options.getAttachment(option.name);
        break;
      default:
        throw new Error(`Unknown option type "${option.type}" on option "${option.name}"`);
    }
    opts.set(option.name, value ?? null);
  }
  return opts;
}
