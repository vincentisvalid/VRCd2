/**
 * .prefix — structural settings management for the runtime evaluation prefix.
 *
 *   .prefix <new>       → GLOBAL runtime prefix (bot owners only)
 *   .prefix self <new>  → personal per-user override
 *   .prefix set <new>   → per-guild override (ManageGuild)
 *
 * Resolution order at parse time: user override → guild → global → default.
 */
import { config } from '../../core/config.js';
import {
  setGlobalPrefix,
  setGuildPrefix,
  setUserPrefix,
  getEffectivePrefix,
  validatePrefix,
} from '../../core/prefixes.js';

export default {
  name: 'prefix',
  category: 'Settings',
  description: 'Manages the command prefix (global / personal / per-server).',
  usage: '.prefix <new> | .prefix self <new> | .prefix set <new>',
  aliases: [],
  cooldownMs: 3000,
  defaultSubcommand: 'global',
  subcommands: [
    {
      name: 'global',
      description: 'Update the global runtime prefix (bot owners only)',
      options: [{ name: 'new_prefix', type: 'string', description: 'The new global prefix', required: true }],
    },
    {
      name: 'self',
      description: 'Set a personal prefix override just for you',
      options: [{ name: 'new_prefix', type: 'string', description: 'Your personal prefix', required: true }],
    },
    {
      name: 'set',
      description: 'Set this server’s prefix (ManageGuild required)',
      options: [{ name: 'new_prefix', type: 'string', description: 'The server prefix', required: true }],
    },
  ],
  async execute(ctx) {
    const newPrefix = ctx.getOption('new_prefix');
    const invalid = validatePrefix(newPrefix);
    if (invalid) return ctx.replyError('Invalid prefix', invalid);

    switch (ctx.subcommand) {
      case 'self': {
        setUserPrefix(ctx.user.id, newPrefix);
        return ctx.replySuccess('Personal prefix saved', `Your commands now parse with \`${newPrefix}\` everywhere (overrides server settings).`);
      }
      case 'set': {
        if (!ctx.guild) return ctx.replyError('Server only', 'Guild prefixes can only be set inside a server.');
        if (!ctx.member.permissions.has('ManageGuild')) {
          return ctx.replyError('Missing permissions', 'You need `ManageGuild` to change this server’s prefix.');
        }
        setGuildPrefix(ctx.guild.id, newPrefix);
        return ctx.replySuccess('Server prefix saved', `**${ctx.guild.name}** now parses commands with \`${newPrefix}\`.`);
      }
      default: {
        // Global mutation touches every guild — owner-locked.
        if (!config.bot.ownerIds.includes(ctx.user.id)) {
          return ctx.replyError(
            'Owner only',
            `The global prefix affects every server, so only bot owners may change it.\nDid you mean \`${getEffectivePrefix(ctx.user.id, ctx.guild?.id)}prefix self ${newPrefix}\`?`
          );
        }
        setGlobalPrefix(newPrefix);
        return ctx.replySuccess('Global prefix saved', `All engine evaluations now default to \`${newPrefix}\`.`);
      }
    }
  },
};
