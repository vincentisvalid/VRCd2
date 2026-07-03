/**
 * .autorole — automatic role assignment for fresh members.
 *
 *   .autorole              → interactive component wizard (role select menu)
 *   .autorole add <role>   → append one binding
 *   .autorole remove <role>→ drop one binding
 *   .autorole list         → show every tracked binding
 *
 * Applied by the guildMemberAdd event on every join.
 */
import { ActionRowBuilder, RoleSelectMenuBuilder, ComponentType } from 'discord.js';
import { db } from '../../database/index.js';
import { brandEmbed, errorEmbed, successEmbed } from '../../core/embeds.js';

function usableRoleBlocker(ctx, role) {
  if (role.managed || role.id === ctx.guild.id) return 'Managed/integration roles and @everyone cannot be auto-assigned.';
  if (role.position >= ctx.guild.members.me.roles.highest.position) return `My highest role must sit above ${role} to grant it.`;
  return null;
}

export default {
  name: 'autorole',
  category: 'Roles',
  description: 'Manages roles automatically granted to new members.',
  usage: '.autorole [add <role> | remove <role> | list]',
  aliases: [],
  guildOnly: true,
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles'],
  cooldownMs: 3000,
  defaultSubcommand: 'wizard',
  subcommands: [
    { name: 'wizard', description: 'Visual setup: pick autoroles from a menu', options: [] },
    { name: 'add', description: 'Add one autorole', options: [{ name: 'role', type: 'role', description: 'Role to auto-assign', required: true }] },
    { name: 'remove', description: 'Remove one autorole', options: [{ name: 'role', type: 'role', description: 'Role to stop auto-assigning', required: true }] },
    { name: 'list', description: 'List all configured autoroles', options: [] },
  ],
  async execute(ctx) {
    const guilds = db.collection('guilds');
    const current = guilds.get(ctx.guild.id)?.autoRoles ?? [];

    switch (ctx.subcommand) {
      case 'add': {
        const role = ctx.getOption('role');
        const blocker = usableRoleBlocker(ctx, role);
        if (blocker) return ctx.replyError('Unusable role', blocker);
        if (current.includes(role.id)) return ctx.replyError('Already tracked', `${role} is already an autorole.`);

        guilds.update(ctx.guild.id, (doc) => ({ ...doc, autoRoles: [...(doc.autoRoles ?? []), role.id] }));
        return ctx.replySuccess('Autorole added', `${role} will be granted to every new member.`);
      }

      case 'remove': {
        const role = ctx.getOption('role');
        if (!current.includes(role.id)) return ctx.replyError('Not tracked', `${role} is not an autorole.`);
        guilds.update(ctx.guild.id, (doc) => ({ ...doc, autoRoles: (doc.autoRoles ?? []).filter((id) => id !== role.id) }));
        return ctx.replySuccess('Autorole removed', `${role} is no longer auto-assigned.`);
      }

      case 'list': {
        if (!current.length) return ctx.replyError('No autoroles', 'Add one with `.autorole add <role>` or run the `.autorole` wizard.');
        const lines = current.map((roleId, index) => {
          const role = ctx.guild.roles.cache.get(roleId);
          return `**${index + 1}.** ${role ? role.toString() : `~~deleted role~~ \`${roleId}\``}`;
        });
        return ctx.reply({ embeds: [brandEmbed().setTitle('🤖 Autorole bindings').setDescription(lines.join('\n'))] });
      }

      default: {
        // ── Component wizard ────────────────────────────────────────────
        const menu = new RoleSelectMenuBuilder()
          .setCustomId(`autorole:${ctx.user.id}`)
          .setPlaceholder('Pick the roles new members should receive…')
          .setMinValues(0)
          .setMaxValues(10);
        if (current.length) menu.setDefaultRoles(current.slice(0, 10));

        const wizardMessage = await ctx.reply({
          embeds: [
            brandEmbed()
              .setTitle('🤖 Autorole wizard')
              .setDescription('Select up to 10 roles to auto-assign on join. Selecting nothing clears the configuration.'),
          ],
          components: [new ActionRowBuilder().addComponents(menu)],
        });

        let selection;
        try {
          selection = await wizardMessage.awaitMessageComponent({
            componentType: ComponentType.RoleSelect,
            filter: (component) => component.user.id === ctx.user.id,
            time: 120_000,
          });
        } catch {
          return wizardMessage.edit({ embeds: [errorEmbed('Wizard timed out', 'No selection within 2 minutes.')], components: [] });
        }

        // Filter out anything the bot cannot actually grant.
        const accepted = [];
        const rejected = [];
        for (const roleId of selection.values) {
          const role = ctx.guild.roles.cache.get(roleId);
          if (role && !usableRoleBlocker(ctx, role)) accepted.push(roleId);
          else rejected.push(roleId);
        }

        guilds.update(ctx.guild.id, (doc) => ({ ...doc, autoRoles: accepted }));
        const summary = [
          accepted.length ? `Now auto-assigning: ${accepted.map((id) => `<@&${id}>`).join(' ')}` : 'Autorole configuration cleared.',
          rejected.length ? `Skipped (unmanageable): ${rejected.map((id) => `<@&${id}>`).join(' ')}` : null,
        ].filter(Boolean).join('\n');
        return selection.update({ embeds: [successEmbed('Autoroles saved', summary)], components: [] });
      }
    }
  },
};
