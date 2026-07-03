/**
 * .boosterrole — configures the automatic role distributed to Server
 * Boosters (assigned/removed by the guildMemberUpdate booster tracker).
 */
import { db } from '../../database/index.js';

export default {
  name: 'boosterrole',
  category: 'Roles',
  description: 'Sets the role automatically granted to Server Boosters.',
  usage: '.boosterrole <roleid>',
  aliases: [],
  guildOnly: true,
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles'],
  cooldownMs: 3000,
  options: [{ name: 'role', type: 'role', description: 'Role to grant to boosters', required: true }],
  async execute(ctx) {
    const role = ctx.getOption('role');
    if (role.managed || role.id === ctx.guild.id) {
      return ctx.replyError('Unusable role', 'Managed/integration roles and @everyone cannot be distributed.');
    }
    if (role.position >= ctx.guild.members.me.roles.highest.position) {
      return ctx.replyError('Role too high', `My highest role must sit above ${role} to grant it.`);
    }

    db.collection('guilds').update(ctx.guild.id, (doc) => ({ ...doc, boosterRoleId: role.id }));

    // Retroactively grant to existing boosters so nobody is left behind.
    let granted = 0;
    for (const member of ctx.guild.members.cache.values()) {
      if (member.premiumSince && !member.roles.cache.has(role.id)) {
        await member.roles.add(role, 'Booster role configured').then(() => (granted += 1)).catch(() => {});
      }
    }

    return ctx.replySuccess('Booster role set', `${role} now auto-distributes to boosters (granted to ${granted} existing booster(s)).`);
  },
};
