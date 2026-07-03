import { db } from '../database/db.js';
import { respond, buildEmbed } from '../utils/helpers.js';
import { PermissionFlagsBits } from 'discord.js';

export default [
  {
    name: 'jail',
    description: 'Strip user roles, apply prison isolation, and log state.',
    category: 'Moderation',
    aliases: ['prison'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'The user to jail',
        required: true
      },
      {
        name: 'reason',
        type: 3, // String
        description: 'Reason for jailing',
        required: false
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(message, { content: 'You do not have Manage Roles permission.' });
      }
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        return respond(message, { content: 'Please mention a user to jail.' });
      }
      const reason = args.slice(1).join(' ') || 'No reason provided';
      return runJail(message, targetUser, reason);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(interaction, { content: 'You do not have Manage Roles permission.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      return runJail(interaction, targetUser, reason);
    }
  },
  {
    name: 'kick',
    description: 'Kick an offending user from the guild.',
    category: 'Moderation',
    aliases: ['boot'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'The user to kick',
        required: true
      },
      {
        name: 'reason',
        type: 3, // String
        description: 'Reason for kicking',
        required: false
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return respond(message, { content: 'You do not have Kick Members permission.' });
      }
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        return respond(message, { content: 'Please mention a user to kick.' });
      }
      const reason = args.slice(1).join(' ') || 'No reason provided';
      return runKick(message, targetUser, reason);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return respond(interaction, { content: 'You do not have Kick Members permission.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      return runKick(interaction, targetUser, reason);
    }
  },
  {
    name: 'ban',
    description: 'Ban a user permanently from the guild.',
    category: 'Moderation',
    aliases: ['blacklist'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'The user to ban',
        required: true
      },
      {
        name: 'reason',
        type: 3, // String
        description: 'Reason for banning',
        required: false
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return respond(message, { content: 'You do not have Ban Members permission.' });
      }
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        return respond(message, { content: 'Please mention a user to ban.' });
      }
      const reason = args.slice(1).join(' ') || 'No reason provided';
      return runBan(message, targetUser, reason);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return respond(interaction, { content: 'You do not have Ban Members permission.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      return runBan(interaction, targetUser, reason);
    }
  },
  {
    name: 'mute',
    description: 'Place a communication timeout over a member.',
    category: 'Moderation',
    aliases: ['timeout'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'The user to mute',
        required: true
      },
      {
        name: 'duration',
        type: 3, // String
        description: 'Timeout duration (e.g. 10m, 2h, 1d)',
        required: true
      },
      {
        name: 'reason',
        type: 3, // String
        description: 'Reason for muting',
        required: false
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return respond(message, { content: 'You do not have Moderate Members permission.' });
      }
      const targetUser = message.mentions.users.first();
      if (!targetUser || args.length < 2) {
        return respond(message, { content: 'Usage: `.mute <@user> <duration> [reason]` (e.g., `.mute @user 10m reason`)' });
      }
      const durationStr = args[1];
      const reason = args.slice(2).join(' ') || 'No reason provided';
      return runMute(message, targetUser, durationStr, reason);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return respond(interaction, { content: 'You do not have Moderate Members permission.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('user');
      const durationStr = interaction.options.getString('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      return runMute(interaction, targetUser, durationStr, reason);
    }
  },
  {
    name: 'warn',
    description: 'Log an infraction warning count against a user.',
    category: 'Moderation',
    aliases: ['infraction'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'The user to warn',
        required: true
      },
      {
        name: 'reason',
        type: 3, // String
        description: 'Reason for warning',
        required: false
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return respond(message, { content: 'You do not have Kick/Manage permissions to warn users.' });
      }
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        return respond(message, { content: 'Please mention a user to warn.' });
      }
      const reason = args.slice(1).join(' ') || 'No reason provided';
      return runWarn(message, targetUser, reason);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return respond(interaction, { content: 'You do not have Kick/Manage permissions to warn users.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      return runWarn(interaction, targetUser, reason);
    }
  },
  {
    name: 'purge',
    description: 'Bulk delete a number of recent messages from this channel.',
    category: 'Moderation',
    aliases: ['clear', 'prune'],
    options: [
      {
        name: 'num',
        type: 4, // Integer
        description: 'Number of messages to delete (1-100)',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return respond(message, { content: 'You do not have Manage Messages permission.' });
      }
      const num = parseInt(args[0], 10);
      if (!Number.isInteger(num) || num < 1 || num > 100) {
        return respond(message, { content: 'Usage: `.purge <num>` where num is between 1 and 100.' });
      }
      return runPurge(message, num);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return respond(interaction, { content: 'You do not have Manage Messages permission.', ephemeral: true });
      }
      const num = interaction.options.getInteger('num');
      if (num < 1 || num > 100) {
        return respond(interaction, { content: 'Number of messages must be between 1 and 100.', ephemeral: true });
      }
      await interaction.deferReply({ ephemeral: true });
      return runPurge(interaction, num);
    }
  }
];

// Helper: Jail
async function runJail(ctx, targetUser, reason) {
  const guild = ctx.guild;
  const member = await guild.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    return respond(ctx, { content: 'User is not currently in this server.' });
  }

  try {
    // 1. Find or create the Jailed/Prison role
    let jailRole = guild.roles.cache.find(r => r.name === 'Jailed' || r.name === 'Prisoner');
    if (!jailRole) {
      jailRole = await guild.roles.create({
        name: 'Jailed',
        color: '#ff0000',
        reason: 'Required role for VRCd Jail system'
      });

      // Configure overrides for jail channel
      let prisonChannel = guild.channels.cache.find(c => c.name === 'prison' || c.name === 'jail');
      if (prisonChannel) {
        await prisonChannel.permissionOverwrites.create(jailRole, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        });
      }
    }

    // 2. Save current roles to database
    const roleIds = member.roles.cache.filter(r => r.id !== guild.id).map(r => r.id);
    db.jails.set(targetUser.id, {
      guildId: guild.id,
      roles: roleIds,
      reason,
      timestamp: Date.now()
    });

    // 3. Remove roles and add Jail role
    const removableRoles = member.roles.cache.filter(r => r.id !== guild.id && r.editable);
    for (const [id, r] of removableRoles) {
      await member.roles.remove(r).catch(() => {});
    }
    await member.roles.add(jailRole);

    const embed = buildEmbed(
      'User Jailed',
      `**User**: ${targetUser}\n**Reason**: ${reason}\n\n*Original roles saved. Run a custom unjail script/command to restore.*`,
      [],
      0xdc143c
    );
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    console.error('[Jail Error]:', err.message);
    return respond(ctx, { content: `Failed to jail user: ${err.message}` });
  }
}

// Helper: Kick
async function runKick(ctx, targetUser, reason) {
  const guild = ctx.guild;
  const member = await guild.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    return respond(ctx, { content: 'User not found in server.' });
  }
  if (!member.kickable) {
    return respond(ctx, { content: 'Unable to kick this user (Check permissions hierarchy).' });
  }

  try {
    await member.kick(reason);
    const embed = buildEmbed('User Kicked', `**User**: ${targetUser.username} (${targetUser.id})\n**Reason**: ${reason}`, [], 0xffa500);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Kick failed: ${err.message}` });
  }
}

// Helper: Ban
async function runBan(ctx, targetUser, reason) {
  const guild = ctx.guild;
  
  try {
    await guild.members.ban(targetUser.id, { reason });
    const embed = buildEmbed('User Banned', `**User**: ${targetUser.username} (${targetUser.id})\n**Reason**: ${reason}`, [], 0xff0000);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Ban failed: ${err.message}` });
  }
}

// Helper: Mute (Timeout)
async function runMute(ctx, targetUser, durationStr, reason) {
  const guild = ctx.guild;
  const member = await guild.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    return respond(ctx, { content: 'User not found in server.' });
  }

  // Parse duration (e.g. 10m, 2h, 1d)
  const match = durationStr.match(/^(\d+)([mhd])$/i);
  if (!match) {
    return respond(ctx, { content: 'Invalid duration format. Use e.g. 10m, 2h, 1d.' });
  }

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  let ms = 0;

  if (unit === 'm') ms = value * 60 * 1000;
  else if (unit === 'h') ms = value * 60 * 60 * 1000;
  else if (unit === 'd') ms = value * 24 * 60 * 60 * 1000;

  if (ms <= 0 || ms > 28 * 24 * 60 * 60 * 1000) {
    return respond(ctx, { content: 'Duration must be between 1 minute and 28 days.' });
  }

  try {
    await member.timeout(ms, reason);
    const embed = buildEmbed(
      'User Timed Out (Muted)',
      `**User**: ${targetUser}\n**Duration**: ${durationStr}\n**Reason**: ${reason}`,
      [],
      0x4682b4
    );
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Timeout failed: ${err.message}` });
  }
}

// Helper: Warn
async function runWarn(ctx, targetUser, reason) {
  const userId = targetUser.id;
  const warnings = db.profiles.get(userId, {});
  
  if (!warnings.warnCount) warnings.warnCount = 0;
  if (!warnings.warnHistory) warnings.warnHistory = [];

  warnings.warnCount += 1;
  warnings.warnHistory.push({
    reason,
    timestamp: Date.now(),
    moderator: ctx.author ? ctx.author.id : ctx.user.id
  });

  db.profiles.set(userId, warnings);

  const embed = buildEmbed(
    'Warning Registered',
    `**User**: ${targetUser}\n**Total Infractions**: \`${warnings.warnCount}\`\n**Reason**: ${reason}`,
    [],
    0xff8c00
  );
  return respond(ctx, { embeds: [embed] });
}

// Helper: Purge (bulk delete) recent channel messages
async function runPurge(ctx, num) {
  const channel = ctx.channel;
  const isInteraction = ctx.isInteraction || (ctx.deferred !== undefined && ctx.replied !== undefined);

  const botMember = ctx.guild.members.me;
  if (botMember && !channel.permissionsFor(botMember).has(PermissionFlagsBits.ManageMessages)) {
    return respond(ctx, { content: 'I do not have Manage Messages permission in this channel.' });
  }

  try {
    // Prefix invocations also remove the triggering command message itself; Discord
    // caps bulkDelete at 100 messages per call regardless of path.
    const amountToDelete = Math.min(isInteraction ? num : num + 1, 100);
    // Passing `true` filters out messages older than 14 days instead of throwing,
    // since Discord's bulk-delete API rejects any batch containing one.
    const deleted = await channel.bulkDelete(amountToDelete, true);
    const deletedCount = isInteraction ? deleted.size : Math.max(0, deleted.size - 1);

    const embed = buildEmbed(
      'Messages Purged',
      `Deleted **${deletedCount}** message${deletedCount === 1 ? '' : 's'} from ${channel}.` +
        (deletedCount < num ? '\n*Some messages were skipped (older than 14 days cannot be bulk-deleted).*' : ''),
      [],
      0x32cd32
    );

    if (isInteraction) {
      return respond(ctx, { embeds: [embed] });
    }
    // The invoking message was already removed by bulkDelete, so reply() has nothing
    // to attach to — send a fresh confirmation instead and auto-clean it shortly after.
    const sent = await channel.send({ embeds: [embed] });
    setTimeout(() => sent.delete().catch(() => {}), 5000);
  } catch (err) {
    return respond(ctx, { content: `Purge failed: ${err.message}` });
  }
}
