import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType, 
  PermissionFlagsBits 
} from 'discord.js';
import { db } from '../database/db.js';
import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'reactionroles',
    description: 'Bind reaction roles to a message.',
    category: 'Roles',
    aliases: ['rr'],
    options: [
      {
        name: 'messagelink',
        type: 3, // String
        description: 'Direct link to the message',
        required: true
      },
      {
        name: 'emoji',
        type: 3, // String
        description: 'Emoji for the reaction',
        required: true
      },
      {
        name: 'roleid',
        type: 3, // String
        description: 'ID of the role to assign',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(message, { content: 'Insufficient permissions (Manage Roles required).' });
      }
      if (args.length < 3) {
        return respond(message, { content: 'Usage: `.reactionroles create <messagelink> <reactionemoji> <roleid>`' });
      }
      return createReactionRole(message, args[0], args[1], args[2]);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(interaction, { content: 'Insufficient permissions (Manage Roles required).', ephemeral: true });
      }
      const link = interaction.options.getString('messagelink');
      const emoji = interaction.options.getString('emoji');
      const roleid = interaction.options.getString('roleid');
      return createReactionRole(interaction, link, emoji, roleid);
    }
  },
  {
    name: 'boosterrole',
    description: 'Configure server booster role reward distribution.',
    category: 'Roles',
    aliases: ['boostrole'],
    options: [
      {
        name: 'roleid',
        type: 3, // String
        description: 'Role ID to allocate to boosters',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(message, { content: 'Manage Roles required.' });
      }
      if (args.length === 0) return respond(message, { content: 'Usage: `.boosterrole <roleid>`' });
      db.settings.set(`booster_role_${message.guild.id}`, args[0]);
      return respond(message, { embeds: [buildEmbed('Booster Config', `Mapped server booster role rewards to <@&${args[0]}>.`, [], 0x00ffcc)] });
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(interaction, { content: 'Manage Roles required.', ephemeral: true });
      }
      const roleid = interaction.options.getString('roleid');
      db.settings.set(`booster_role_${interaction.guild.id}`, roleid);
      return respond(interaction, { embeds: [buildEmbed('Booster Config', `Mapped server booster role rewards to <@&${roleid}>.`, [], 0x00ffcc)] });
    }
  },
  {
    name: 'booster',
    description: 'Configure Server Booster message notification alerts.',
    category: 'Roles',
    aliases: ['boostmsg'],
    options: [
      {
        name: 'message_text',
        type: 3, // String
        description: 'Custom message template containing {user} and {server}',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return respond(message, { content: 'Manage Server required.' });
      }
      if (args.length === 0) return respond(message, { content: 'Usage: `.booster msg <text>`' });
      // Skip the "msg" arg if typed like .booster msg text
      let text = args.join(' ');
      if (args[0].toLowerCase() === 'msg') {
        text = args.slice(1).join(' ');
      }
      db.settings.set(`booster_msg_${message.guild.id}`, text);
      return respond(message, { embeds: [buildEmbed('Booster Config', `Saved booster message template:\n*${text}*`, [], 0x00ffcc)] });
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return respond(interaction, { content: 'Manage Server required.', ephemeral: true });
      }
      const text = interaction.options.getString('message_text');
      db.settings.set(`booster_msg_${interaction.guild.id}`, text);
      return respond(interaction, { embeds: [buildEmbed('Booster Config', `Saved booster message template:\n*${text}*`, [], 0x00ffcc)] });
    }
  },
  {
    name: 'autorole',
    description: 'Configure and list auto-assigned new member roles.',
    category: 'Roles',
    aliases: ['ar'],
    options: [
      {
        name: 'action',
        type: 3, // String
        description: 'Choose action (add, list, wizard)',
        required: false,
        choices: [
          { name: 'Add AutoRole', value: 'add' },
          { name: 'List AutoRoles', value: 'list' },
          { name: 'Launch Setup Wizard', value: 'wizard' }
        ]
      },
      {
        name: 'roleid',
        type: 3, // String
        description: 'Role ID to add (for "add" action)',
        required: false
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(message, { content: 'Manage Roles required.' });
      }
      
      const sub = args[0] ? args[0].toLowerCase() : 'wizard';
      if (sub === 'add') {
        if (!args[1]) return respond(message, { content: 'Specify role ID: `.autorole add <roleid>`' });
        return addAutoRole(message, args[1]);
      } else if (sub === 'list') {
        return listAutoRoles(message);
      } else {
        return launchAutoRoleWizard(message);
      }
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(interaction, { content: 'Manage Roles required.', ephemeral: true });
      }
      const action = interaction.options.getString('action') || 'wizard';
      const roleid = interaction.options.getString('roleid');

      if (action === 'add') {
        if (!roleid) return respond(interaction, { content: 'Provide role ID to add.', ephemeral: true });
        return addAutoRole(interaction, roleid);
      } else if (action === 'list') {
        return listAutoRoles(interaction);
      } else {
        return launchAutoRoleWizard(interaction);
      }
    }
  },
  {
    name: 'createrole',
    description: 'Instantly generate server roles with color parameters.',
    category: 'Roles',
    aliases: ['makerole'],
    options: [
      {
        name: 'name',
        type: 3, // String
        description: 'Role name',
        required: true
      },
      {
        name: 'color',
        type: 3, // String
        description: 'Hex color string (e.g. #ff00ff)',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(message, { content: 'Manage Roles required.' });
      }
      if (args.length < 2) return respond(message, { content: 'Usage: `.createrole <name> <hex_color>`' });
      const hex = args.pop();
      const name = args.join(' ');
      return createGuildRole(message, name, hex);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(interaction, { content: 'Manage Roles required.', ephemeral: true });
      }
      const name = interaction.options.getString('name');
      const color = interaction.options.getString('color');
      return createGuildRole(interaction, name, color);
    }
  }
];

// Helper: Create Reaction Role mappings
async function createReactionRole(ctx, msgLink, emoji, roleId) {
  // Extract message ID from link
  // e.g. https://discord.com/channels/123/456/789
  const match = msgLink.match(/channels\/\d+\/(\d+)\/(\d+)/);
  if (!match) {
    return respond(ctx, { content: 'Invalid message link format.' });
  }

  const channelId = match[1];
  const messageId = match[2];

  try {
    const channel = ctx.guild.channels.cache.get(channelId) || await ctx.client.channels.fetch(channelId);
    const targetMsg = await channel.messages.fetch(messageId);

    // Save mapping
    const existing = db.reactionRoles.get(messageId, []);
    existing.push({ emoji, roleId });
    db.reactionRoles.set(messageId, existing);

    // React to the message
    await targetMsg.react(emoji);

    const embed = buildEmbed('Reaction Role Created', `Successfully registered listener!\n\n**Message**: [Jump to Message](${msgLink})\n**Emoji**: ${emoji}\n**Role**: <@&${roleId}>`, [], 0x32cd32);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    console.error('[ReactionRoles Error]:', err.message);
    return respond(ctx, { content: `Failed to configure reaction roles: ${err.message}` });
  }
}

// Helper: Add AutoRole
function addAutoRole(ctx, roleId) {
  const guildId = ctx.guild.id;
  const current = db.autoroles.get(guildId, []);
  if (!current.includes(roleId)) {
    current.push(roleId);
    db.autoroles.set(guildId, current);
  }
  return respond(ctx, { embeds: [buildEmbed('AutoRole System', `Appended <@&${roleId}> into automatic join assignments list.`, [], 0x00ffcc)] });
}

// Helper: List AutoRoles
function listAutoRoles(ctx) {
  const guildId = ctx.guild.id;
  const current = db.autoroles.get(guildId, []);
  
  if (current.length === 0) {
    return respond(ctx, { embeds: [buildEmbed('AutoRole System', 'No automatic roles mapped currently.', [], 0xffa500)] });
  }

  const list = current.map((id, index) => `${index + 1}. <@&${id}> (\`${id}\`)`).join('\n');
  return respond(ctx, { embeds: [buildEmbed('Tracked AutoRoles', list, [], 0x00ffcc)] });
}

// Helper: Setup Wizard components
async function launchAutoRoleWizard(ctx) {
  const guildId = ctx.guild.id;
  const userId = ctx.author ? ctx.author.id : ctx.user.id;

  const btnList = new ButtonBuilder().setCustomId('ar_list').setLabel('List Roles').setStyle(ButtonStyle.Secondary);
  const btnClear = new ButtonBuilder().setCustomId('ar_clear').setLabel('Reset System').setStyle(ButtonStyle.Danger);
  
  const row = new ActionRowBuilder().addComponents(btnList, btnClear);
  
  const embed = buildEmbed('AutoRole Component Wizard', 'Select an operation button to administer server auto-role systems.');
  const response = await respond(ctx, { embeds: [embed], components: [row] });

  const filter = i => ['ar_list', 'ar_clear'].includes(i.customId) && i.user.id === userId;
  const collector = response.createMessageComponentCollector({
    filter,
    componentType: ComponentType.Button,
    time: 20000
  });

  collector.on('collect', async i => {
    if (i.customId === 'ar_list') {
      const current = db.autoroles.get(guildId, []);
      const text = current.length > 0 ? current.map(id => `<@&${id}>`).join(', ') : 'No roles';
      await i.update({ embeds: [buildEmbed('AutoRole Setup', `Tracked roles: ${text}`)], components: [] });
    } else {
      db.autoroles.set(guildId, []);
      await i.update({ embeds: [buildEmbed('AutoRole Setup', 'Successfully wiped all automatic assignment roles.', [], 0xff0000)], components: [] });
    }
    collector.stop();
  });
}

// Helper: Create Role
async function createGuildRole(ctx, name, colorHex) {
  try {
    const cleanHex = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
    const newRole = await ctx.guild.roles.create({
      name,
      color: cleanHex,
      reason: 'Created via VRCd createrole command'
    });

    const embed = buildEmbed('Role Created Successfully', `Name: **${name}**\nColor: **${cleanHex}**\nRole: ${newRole}`, [], 0x00ff00);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Failed to create role: ${err.message}` });
  }
}
