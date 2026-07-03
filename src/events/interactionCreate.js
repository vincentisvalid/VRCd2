/**
 * Slash-command transport. Materialises the declared option schema through
 * the interaction's typed getters and funnels into the shared dispatcher.
 */
import { Events, MessageFlags } from 'discord.js';
import { collectSlashOptions } from '../core/options.js';
import { CommandContext } from '../core/context.js';
import { runCommand } from '../core/dispatcher.js';
import { errorEmbed } from '../core/embeds.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('interactionCreate');

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      await interaction
        .reply({ embeds: [errorEmbed('Unknown command', 'This command is no longer registered.')], flags: MessageFlags.Ephemeral })
        .catch(() => {});
      return;
    }

    try {
      let subcommand = null;
      let schema = command.options ?? [];
      if (command.subcommands?.length) {
        const subName = interaction.options.getSubcommand(false);
        subcommand = command.subcommands.find((sub) => sub.name === subName) ?? null;
        schema = subcommand?.options ?? [];
      }

      const opts = collectSlashOptions({ schema, interaction });
      const args = [...opts.values()].filter((value) => value !== null).map((value) => String(value?.id ?? value));

      const ctx = new CommandContext({
        client: interaction.client,
        command,
        subcommand: subcommand?.name ?? null,
        interaction,
        args,
        rawArgs: args.join(' '),
        opts,
      });
      await runCommand(ctx);
    } catch (error) {
      log.error(`Slash dispatch for "${interaction.commandName}" failed:`, error?.stack ?? error);
      const payload = { embeds: [errorEmbed('Something went wrong', 'The command failed unexpectedly — the incident has been logged.')] };
      try {
        if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
        else await interaction.reply(payload);
      } catch {
        /* interaction expired — nothing further to deliver */
      }
    }
  },
};
