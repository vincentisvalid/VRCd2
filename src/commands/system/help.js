/**
 * .help — dynamic category-sorted command index.
 *
 * Scans the live command collection at call time, so newly added modules
 * appear automatically. `.help <command>` renders a detail card with usage,
 * arguments, and the alias map.
 */
import { brandEmbed } from '../../core/embeds.js';
import { findCommand } from '../../core/loader.js';
import { getEffectivePrefix } from '../../core/prefixes.js';
import { truncate } from '../../utils/text.js';

const CATEGORY_ORDER = [
  'System',
  'AI',
  'VR',
  'Music',
  'Media Effects',
  'Embeds',
  'Moderation',
  'UserInfo',
  'Admin Utils',
  'Voice',
  'Settings',
  'Roles',
  'Quotes',
  'Cybersecurity',
  'Utilities',
];

function describeOptions(schema = []) {
  return schema.map((option) => (option.required ? `<${option.name}>` : `[${option.name}]`)).join(' ');
}

export default {
  name: 'help',
  category: 'System',
  description: 'Lists every command by category, or shows details for one command.',
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

    // ── Index view ───────────────────────────────────────────────────────
    const byCategory = new Map();
    for (const command of ctx.client.commands.values()) {
      if (!byCategory.has(command.category)) byCategory.set(command.category, []);
      byCategory.get(command.category).push(command);
    }

    const orderedCategories = [...byCategory.keys()].sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const embed = brandEmbed()
      .setTitle('🕶️ VRCd Bot — Command Index')
      .setDescription(`Prefix: \`${prefix}\` (slash commands mirror everything)\nUse \`${prefix}help <command>\` for arguments & aliases.`);

    for (const category of orderedCategories) {
      const commands = byCategory
        .get(category)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((command) => `\`${command.name}\``)
        .join(' ');
      embed.addFields({ name: category, value: truncate(commands, 1024) });
    }

    return ctx.reply({ embeds: [embed] });
  },
};
