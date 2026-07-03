import { respond, buildEmbed } from '../utils/helpers.js';
import config from '../../config.json' assert { type: 'json' };

const ALLOWED_ADMIN_ROLES = config.allowedAdminRoles || [
  "1520892811736514731",
  "1517418461779722300"
];

// Helper: Guard validation check for admin roles
function isAdminAuthorized(ctx) {
  const member = ctx.member;
  if (!member) return false;
  return ALLOWED_ADMIN_ROLES.some(roleId => member.roles.cache.has(roleId));
}

export default [
  {
    name: 'troll',
    description: 'Direct Message / Mention troll pinging the Rick Astley video.',
    category: 'Admin Utils',
    aliases: ['rickroll'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'User to troll',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (!isAdminAuthorized(message)) {
        return respond(message, { content: '❌ ACCESS DENIED: Insufficient administrative privileges.' });
      }
      const targetUser = message.mentions.users.first();
      if (!targetUser) return respond(message, { content: 'Please specify a target user.' });
      return executeTroll(message, targetUser);
    },
    async executeSlash(interaction, client) {
      if (!isAdminAuthorized(interaction)) {
        return respond(interaction, { content: '❌ ACCESS DENIED: Insufficient administrative privileges.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('user');
      return executeTroll(interaction, targetUser);
    }
  },
  {
    name: 'stickbug',
    description: 'Deploy the stickbug meme mention target.',
    category: 'Admin Utils',
    aliases: ['bug'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'User to stickbug',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (!isAdminAuthorized(message)) {
        return respond(message, { content: '❌ ACCESS DENIED: Insufficient administrative privileges.' });
      }
      const targetUser = message.mentions.users.first();
      if (!targetUser) return respond(message, { content: 'Please specify a target user.' });
      return executeStickbug(message, targetUser);
    },
    async executeSlash(interaction, client) {
      if (!isAdminAuthorized(interaction)) {
        return respond(interaction, { content: '❌ ACCESS DENIED: Insufficient administrative privileges.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('user');
      return executeStickbug(interaction, targetUser);
    }
  }
];

// Helper: Rickroll
async function executeTroll(ctx, targetUser) {
  try {
    // Send a DM if possible, else reply in channel
    await targetUser.send({
      content: `Hey ${targetUser}, you've been trolled!\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ`
    }).catch(() => {});

    const embed = buildEmbed('Troll Target Acquired', `Sent rickroll ping to ${targetUser}.`, [], 0xff00ff);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Failed to completely execute troll sequence: ${err.message}` });
  }
}

// Helper: Stickbug
async function executeStickbug(ctx, targetUser) {
  try {
    const embed = buildEmbed(
      'Get Stickbugged!',
      `Hey ${targetUser}, get stickbugged lol!\nhttps://www.youtube.com/watch?v=9BalEldzE8o`,
      [],
      0x00ff00
    );
    // Mentions the user in the channel
    return respond(ctx, { content: `${targetUser}`, embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Failed to stickbug user: ${err.message}` });
  }
}
