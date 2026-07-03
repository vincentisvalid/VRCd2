/**
 * Classic text-prefix transport.
 *
 * Resolves the layered prefix (user → guild → global → default), parses the
 * command line against the declared option schema, and hands a unified
 * CommandContext to the dispatcher — the exact same execution path slash
 * interactions use.
 */
import { Events } from 'discord.js';
import { tokenize } from '../utils/text.js';
import { getEffectivePrefix } from '../core/prefixes.js';
import { findCommand } from '../core/loader.js';
import { parsePrefixOptions, UsageError } from '../core/options.js';
import { CommandContext } from '../core/context.js';
import { runCommand } from '../core/dispatcher.js';
import { errorEmbed } from '../core/embeds.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('messageCreate');

export default {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      if (message.author.bot || message.webhookId || !message.content) return;

      const prefix = getEffectivePrefix(message.author.id, message.guild?.id);
      const mentionPrefix = new RegExp(`^<@!?${message.client.user.id}>\\s*`);

      let body = null;
      if (message.content.startsWith(prefix)) body = message.content.slice(prefix.length);
      else if (mentionPrefix.test(message.content)) body = message.content.replace(mentionPrefix, '');
      if (body === null || !body.trim()) return;

      const commandName = body.trim().split(/\s+/)[0];
      const command = findCommand(message.client, commandName);
      if (!command) return;

      // Everything after the command name, whitespace-preserved.
      const argString = body.trim().slice(commandName.length).trimStart();
      let tokens = tokenize(argString);
      let rawArgs = argString;

      // ── Subcommand routing ────────────────────────────────────────────
      let subcommand = null;
      if (command.subcommands?.length) {
        const candidate = tokens[0]?.value?.toLowerCase();
        subcommand = command.subcommands.find((sub) => sub.name === candidate || (sub.aliases ?? []).includes(candidate)) ?? null;
        if (subcommand) {
          const remaining = tokens.slice(1);
          rawArgs = remaining.length ? argString.slice(remaining[0].start) : '';
          tokens = tokenize(rawArgs); // re-tokenize so offsets align with rawArgs
        } else if (command.defaultSubcommand) {
          subcommand = command.subcommands.find((sub) => sub.name === command.defaultSubcommand) ?? null;
        }
        if (!subcommand) {
          const list = command.subcommands.map((sub) => `\`${sub.name}\``).join(', ');
          await message.reply({ embeds: [errorEmbed('Invalid usage', `Pick a subcommand: ${list}\n\nUsage: \`${command.usage ?? command.name}\``)] });
          return;
        }
      }

      const schema = subcommand ? subcommand.options ?? [] : command.options ?? [];
      let opts;
      try {
        opts = await parsePrefixOptions({ schema, tokens, rawArgs, message });
      } catch (error) {
        if (error instanceof UsageError) {
          await message.reply({ embeds: [errorEmbed('Invalid usage', `${error.message}\n\nUsage: \`${command.usage ?? command.name}\``)] });
          return;
        }
        throw error;
      }

      const ctx = new CommandContext({
        client: message.client,
        command,
        subcommand: subcommand?.name ?? null,
        message,
        args: tokens.map((token) => token.value),
        rawArgs,
        opts,
      });
      await runCommand(ctx);
    } catch (error) {
      log.error('Unhandled failure in messageCreate:', error?.stack ?? error);
    }
  },
};
