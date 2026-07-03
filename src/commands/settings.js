import { db } from '../database/db.js';
import { respond, buildEmbed } from '../utils/helpers.js';
import { PermissionFlagsBits } from 'discord.js';

export default [
  {
    name: 'prefix',
    description: 'Manage command prefixes (global, guild, or user-specific override).',
    category: 'Settings',
    aliases: ['setprefix'],
    options: [
      {
        name: 'scope',
        type: 3, // String
        description: 'Choose scope (global, self, or set)',
        required: true,
        choices: [
          { name: 'Global Prefix', value: 'global' },
          { name: 'Personal (Self) Override', value: 'self' },
          { name: 'Server (Guild) Default', value: 'set' }
        ]
      },
      {
        name: 'prefix_char',
        type: 3, // String
        description: 'New prefix character(s)',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return respond(message, { content: 'Usage:\n`.prefix <new_prefix>` (Global Admin)\n`.prefix self <new_prefix>` (Personal override)\n`.prefix set <new_prefix>` (Guild override)' });
      }

      // Check subcommands
      const sub = args[0].toLowerCase();
      
      if (sub === 'self') {
        if (!args[1]) return respond(message, { content: 'Please provide prefix.' });
        return setSelfPrefix(message, args[1]);
      } else if (sub === 'set') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return respond(message, { content: 'You need Manage Server permission to set the server prefix.' });
        }
        if (!args[1]) return respond(message, { content: 'Please provide prefix.' });
        return setGuildPrefix(message, args[1]);
      } else {
        // Assume default global prefix update if no self/set (check permission first)
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return respond(message, { content: 'You need Administrator permission to modify the global prefix.' });
        }
        const newPrefix = args.join(' ');
        return setGlobalPrefix(message, newPrefix);
      }
    },
    async executeSlash(interaction, client) {
      const scope = interaction.options.getString('scope');
      const prefixChar = interaction.options.getString('prefix_char');

      if (scope === 'self') {
        return setSelfPrefix(interaction, prefixChar);
      } else if (scope === 'set') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return respond(interaction, { content: 'You need Manage Server permission to set the server prefix.', ephemeral: true });
        }
        return setGuildPrefix(interaction, prefixChar);
      } else if (scope === 'global') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return respond(interaction, { content: 'You need Administrator permission to modify the global prefix.', ephemeral: true });
        }
        return setGlobalPrefix(interaction, prefixChar);
      }
    }
  }
];

function setGlobalPrefix(ctx, prefix) {
  db.settings.set('global_prefix', prefix);
  const embed = buildEmbed('Global Prefix Updated', `Static runtime evaluation prefix is now globally set to: \`${prefix}\``, [], 0x00ffcc);
  return respond(ctx, { embeds: [embed] });
}

function setSelfPrefix(ctx, prefix) {
  const userId = ctx.author ? ctx.author.id : ctx.user.id;
  db.settings.set(`prefix_user_${userId}`, prefix);
  const embed = buildEmbed('Personal Prefix Saved', `Your personal command prefix override has been mapped to: \`${prefix}\``, [], 0x00ffcc);
  return respond(ctx, { embeds: [embed] });
}

function setGuildPrefix(ctx, prefix) {
  const guildId = ctx.guild.id;
  db.settings.set(`prefix_guild_${guildId}`, prefix);
  const embed = buildEmbed('Server Prefix Configured', `The default prefix specifically bound across this Guild is now: \`${prefix}\``, [], 0x00ffcc);
  return respond(ctx, { embeds: [embed] });
}
