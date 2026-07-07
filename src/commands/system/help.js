/**
 * .help — interactive command browser.
 *
 * The index view is a living menu: a category select box plus an overview
 * button, scanning the live command collection at call time so new modules
 * appear automatically. `.help <command>` still renders a static detail
 * card with usage, arguments, and the alias map.
 */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { brandEmbed } from '../../core/embeds.js';
import { disableRows } from '../../core/components.js';
import { findCommand } from '../../core/loader.js';
import { getEffectivePrefix } from '../../core/prefixes.js';
import { flavor } from '../../utils/humanize.js';
import { truncate } from '../../utils/text.js';

const CATEGORY_META = new Map([
  ['System', { emoji: '🧭', blurb: 'Getting around the bot' }],
  ['AI', { emoji: '🤖', blurb: 'Ollama chat & fal.ai generation' }],
  ['VR', { emoji: '🥽', blurb: 'Headset profiles & Steam VR stats' }],
  ['Music', { emoji: '🎧', blurb: 'Last.fm / Spotify listening cards' }],
  ['Media Effects', { emoji: '🎬', blurb: 'FFmpeg glitch, VHS, chroma-key & more' }],
  ['Embeds', { emoji: '📝', blurb: 'Custom embed workshop' }],
  ['Moderation', { emoji: '🛡️', blurb: 'Jail, kick, ban, mute, warn' }],
  ['UserInfo', { emoji: '👤', blurb: 'Profiles, avatars, timezones' }],
  ['Admin Utils', { emoji: '🃏', blurb: 'Role-gated special utilities' }],
  ['Voice', { emoji: '🔊', blurb: 'Voice channel audio playback' }],
  ['Settings', { emoji: '⚙️', blurb: 'Prefixes & configuration' }],
  ['Roles', { emoji: '🎭', blurb: 'Reaction roles, autoroles, boosters' }],
  ['Quotes', { emoji: '💬', blurb: 'Community quote book' }],
  ['Cybersecurity', { emoji: '🔐', blurb: 'Defensive audits & lookups' }],
  ['Utilities', { emoji: '🧰', blurb: 'Weather, crypto, polls, reminders…' }],
]);

const categoryOrder = [...CATEGORY_META.keys()];

function describeOptions(schema = []) {
  return schema.map((option) => (option.required ? `<${option.name}>` : `[${option.name}]`)).join(' ');
}

function groupByCategory(client) {
  const byCategory = new Map();
  for (const command of client.commands.values()) {
    if (!byCategory.has(command.category)) byCategory.set(command.category, []);
    byCategory.get(command.category).push(command);
  }
  return new Map(
    [...byCategory.entries()].sort(([a], [b]) => {
      const ia = categoryOrder.indexOf(a);
      const ib = categoryOrder.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
  );
}

function overviewEmbed(byCategory, prefix) {
  const embed = brandEmbed()
    .setTitle('🕶️ VRCd Bot — Command Browser')
    .setDescription(
      `${flavor('helpIntro')}\n\nPrefix: \`${prefix}\` · every command also works as a slash command.\n` +
        `Need one command's details? \`${prefix}help <command>\``
    );
  for (const [category, commands] of byCategory) {
    const meta = CATEGORY_META.get(category) ?? { emoji: '📦', blurb: '' };
    embed.addFields({
      name: `${meta.emoji} ${category} · ${commands.length}`,
      value: meta.blurb || '​',
      inline: true,
    });
  }
  return embed;
}

function categoryEmbed(category, commands, prefix) {
  const meta = CATEGORY_META.get(category) ?? { emoji: '📦', blurb: '' };
  const lines = commands
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((command) => `**\`${prefix}${command.name}\`** — ${truncate(command.description ?? '', 90)}`);
  return brandEmbed()
    .setTitle(`${meta.emoji} ${category}`)
    .setDescription(truncate(lines.join('\n'), 4096))
    .addFields({ name: 'Details', value: `\`${prefix}help <command>\` shows arguments, aliases & subcommands.` });
}

function buildRows(byCategory, activeCategory) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('helpnav:category')
    .setPlaceholder('Browse a category…')
    .addOptions(
      [...byCategory.keys()].slice(0, 25).map((category) => {
        const meta = CATEGORY_META.get(category) ?? { emoji: '📦', blurb: '' };
        const option = new StringSelectMenuOptionBuilder()
          .setValue(category)
          .setLabel(category)
          .setEmoji(meta.emoji)
          .setDefault(category === activeCategory);
        if (meta.blurb) option.setDescription(truncate(meta.blurb, 100));
        return option;
      })
    );
  const homeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('helpnav:home').setLabel('Overview').setEmoji('🏠').setStyle(ButtonStyle.Secondary).setDisabled(!activeCategory)
  );
  return [new ActionRowBuilder().addComponents(menu), homeRow];
}

export default {
  name: 'help',
  category: 'System',
  description: 'Interactive command browser, or details for one command.',
  usage: '.help [command]',
  aliases: ['commands', 'h'],
  options: [{ name: 'command', type: 'string', description: 'Command name to inspect', required: false }],
  async execute(ctx) {
    const prefix = getEffectivePrefix(ctx.user.id, ctx.guild?.id);
    const query = ctx.getOption('command');

    // ── Detail view ──────────────────────────────────────────────────────
    if (query) {
      const command = findCommand(ctx.client, query);
      if (!command) return ctx.replyError('Unknown command', `Nothing named \`${query}\` — try \`${prefix}help\`.`);

      const embed = brandEmbed()
        .setTitle(`📖 ${prefix}${command.name}`)
        .setDescription(command.description ?? 'No description.')
        .addFields({ name: 'Category', value: command.category, inline: true });
      if (command.aliases?.length) {
        embed.addFields({ name: 'Aliases', value: command.aliases.map((alias) => `\`${alias}\``).join(', '), inline: true });
      }
      embed.addFields({ name: 'Usage', value: `\`${command.usage ?? `${prefix}${command.name}`}\`` });
      if (command.subcommands?.length) {
        embed.addFields({
          name: 'Subcommands',
          value: command.subcommands
            .map((sub) => `\`${sub.name} ${describeOptions(sub.options)}\` — ${truncate(sub.description ?? '', 80)}`)
            .join('\n'),
        });
      } else if (command.options?.length) {
        embed.addFields({
          name: 'Arguments',
          value: command.options
            .map((option) => `\`${option.required ? `<${option.name}>` : `[${option.name}]`}\` — ${truncate(option.description ?? '', 80)}`)
            .join('\n'),
        });
      }
      return ctx.reply({ embeds: [embed] });
    }

    // ── Interactive browser ──────────────────────────────────────────────
    const byCategory = groupByCategory(ctx.client);
    let activeCategory = null;

    const browser = await ctx.reply({
      embeds: [overviewEmbed(byCategory, prefix)],
      components: buildRows(byCategory, activeCategory),
    });

    const collector = browser.createMessageComponentCollector({
      filter: (component) => component.customId.startsWith('helpnav:'),
      time: 180_000,
    });

    collector.on('collect', async (component) => {
      if (component.user.id !== ctx.user.id) {
        await component.reply({ content: flavor('notYours'), flags: MessageFlags.Ephemeral }).catch(() => {});
        return;
      }
      collector.resetTimer();
      if (component.customId === 'helpnav:home' && component.isButton()) {
        activeCategory = null;
        await component.update({ embeds: [overviewEmbed(byCategory, prefix)], components: buildRows(byCategory, null) }).catch(() => {});
        return;
      }
      if (component.isStringSelectMenu()) {
        activeCategory = component.values[0];
        const commands = byCategory.get(activeCategory) ?? [];
        await component
          .update({ embeds: [categoryEmbed(activeCategory, commands, prefix)], components: buildRows(byCategory, activeCategory) })
          .catch(() => {});
      }
    });

    collector.on('end', async () => {
      await browser.edit({ components: disableRows(buildRows(byCategory, activeCategory)) }).catch(() => {});
    });
  },
};
