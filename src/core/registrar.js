/**
 * Slash-command registrar.
 *
 * Generically converts each command's declarative option schema into
 * discord.js SlashCommandBuilder JSON and pushes the full manifest to the
 * Discord API. When `bot.devGuildId` is configured the manifest is scoped
 * to that guild (instant propagation for development); otherwise it is
 * registered globally.
 */
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config } from './config.js';
import { truncate } from '../utils/text.js';
import { createLogger } from './logger.js';

const log = createLogger('registrar');

const OPTION_METHODS = {
  string: 'addStringOption',
  integer: 'addIntegerOption',
  number: 'addNumberOption',
  boolean: 'addBooleanOption',
  user: 'addUserOption',
  role: 'addRoleOption',
  channel: 'addChannelOption',
  attachment: 'addAttachmentOption',
};

function applyOptions(builder, options = []) {
  // Discord requires required options to precede optional ones.
  const ordered = [...options].sort((a, b) => Number(Boolean(b.required)) - Number(Boolean(a.required)));
  for (const option of ordered) {
    const method = OPTION_METHODS[option.type];
    if (!method) throw new Error(`Cannot map option type "${option.type}" to a slash builder`);
    builder[method]((optionBuilder) => {
      optionBuilder
        .setName(option.name)
        .setDescription(truncate(option.description ?? option.name, 100))
        .setRequired(Boolean(option.required));
      if (option.choices && option.type === 'string') {
        optionBuilder.addChoices(...option.choices.map((c) => ({ name: c.name ?? c.value, value: c.value })));
      }
      return optionBuilder;
    });
  }
  return builder;
}

function buildCommandJson(command) {
  const builder = new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(truncate(command.description ?? command.name, 100));
  if (command.guildOnly) builder.setDMPermission(false);

  if (command.subcommands?.length) {
    for (const sub of command.subcommands) {
      builder.addSubcommand((subBuilder) => {
        subBuilder.setName(sub.name).setDescription(truncate(sub.description ?? sub.name, 100));
        applyOptions(subBuilder, sub.options ?? []);
        return subBuilder;
      });
    }
  } else {
    applyOptions(builder, command.options ?? []);
  }
  return builder.toJSON();
}

export async function registerSlashCommands(commands) {
  const manifest = [];
  for (const command of commands.values()) {
    if (command.slash === false) continue; // opt-out escape hatch
    try {
      manifest.push(buildCommandJson(command));
    } catch (error) {
      log.error(`Failed to build slash JSON for "${command.name}":`, error.message);
    }
  }

  const rest = new REST({ version: '10' }).setToken(config.env.discordToken);
  const route = config.bot.devGuildId
    ? Routes.applicationGuildCommands(config.env.discordClientId, config.bot.devGuildId)
    : Routes.applicationCommands(config.env.discordClientId);

  try {
    await rest.put(route, { body: manifest });
    log.info(`Registered ${manifest.length} slash commands ${config.bot.devGuildId ? `to dev guild ${config.bot.devGuildId}` : 'globally'}.`);
  } catch (error) {
    // Slash registration failure must not stop prefix operation.
    log.error('Slash command registration failed:', error?.message ?? error);
  }
}

export default registerSlashCommands;
