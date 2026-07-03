import { db } from '../database/db.js';
import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'tz',
    description: 'Map your IANA timezone string to set display time offsets.',
    category: 'UserInfo',
    aliases: ['timezone'],
    options: [
      {
        name: 'zone',
        type: 3, // String
        description: 'IANA Timezone string (e.g. America/New_York)',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return respond(message, { content: 'Usage: `.tz <IANA_Timezone>` (e.g., `.tz America/Los_Angeles`)' });
      }
      return setTimezone(message, args[0]);
    },
    async executeSlash(interaction, client) {
      const zone = interaction.options.getString('zone');
      return setTimezone(interaction, zone);
    }
  },
  {
    name: 'pfp',
    description: 'Fetch global and server-specific avatar URLs of a user.',
    category: 'UserInfo',
    aliases: ['avatar', 'av'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'Target user to view',
        required: false
      }
    ],
    async execute(message, args, client) {
      const targetUser = message.mentions.users.first() || message.author;
      return renderPfp(message, targetUser);
    },
    async executeSlash(interaction, client) {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      return renderPfp(interaction, targetUser);
    }
  },
  {
    name: 'banner',
    description: 'Fetch high-resolution background profile banner header of a user.',
    category: 'UserInfo',
    aliases: ['profilebanner'],
    options: [
      {
        name: 'user',
        type: 6, // User
        description: 'Target user to view',
        required: false
      }
    ],
    async execute(message, args, client) {
      const targetUser = message.mentions.users.first() || message.author;
      return renderBanner(message, targetUser, client);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('user') || interaction.user;
      return renderBanner(interaction, targetUser, client);
    }
  },
  {
    name: 'setbio',
    description: 'Create an editable custom biography block nested in your profile.',
    category: 'UserInfo',
    aliases: ['bio'],
    options: [
      {
        name: 'text',
        type: 3, // String
        description: 'Your brief biography text',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Provide text: `.setbio <text>`' });
      return updateProfileField(message, 'bio', args.join(' '));
    },
    async executeSlash(interaction, client) {
      const text = interaction.options.getString('text');
      return updateProfileField(interaction, 'bio', text);
    }
  },
  {
    name: 'games',
    description: 'Update the list of preferred or frequently played gaming titles.',
    category: 'UserInfo',
    aliases: ['setgames', 'mygames'],
    options: [
      {
        name: 'text',
        type: 3, // String
        description: 'Comma separated list of games',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.games VR Chat, Beat Saber, Elden Ring`' });
      return updateProfileField(message, 'games', args.join(' '));
    },
    async executeSlash(interaction, client) {
      const text = interaction.options.getString('text');
      return updateProfileField(interaction, 'games', text);
    }
  },
  {
    name: 'musicgenre',
    description: 'Populate your preferred music genres for user discovery.',
    category: 'UserInfo',
    aliases: ['setgenre', 'genres'],
    options: [
      {
        name: 'text',
        type: 3, // String
        description: 'Comma separated genres',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.musicgenre Synthwave, Phonk, Metal`' });
      return updateProfileField(message, 'musicgenre', args.join(' '));
    },
    async executeSlash(interaction, client) {
      const text = interaction.options.getString('text');
      return updateProfileField(interaction, 'musicgenre', text);
    }
  },
  {
    name: 'career',
    description: 'Bind professional job designation inside database profiles.',
    category: 'UserInfo',
    aliases: ['setcareer', 'job'],
    options: [
      {
        name: 'text',
        type: 3, // String
        description: 'Your job title or professional path',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.career Systems Architect / XR Developer`' });
      return updateProfileField(message, 'career', args.join(' '));
    },
    async executeSlash(interaction, client) {
      const text = interaction.options.getString('text');
      return updateProfileField(interaction, 'career', text);
    }
  }
];

// Helper: TZ setting
async function setTimezone(ctx, tzStr) {
  const userId = ctx.author ? ctx.author.id : ctx.user.id;
  
  try {
    // Validate IANA timezone
    new Intl.DateTimeFormat('en-US', { timeZone: tzStr });
    
    const profile = db.profiles.get(userId, {});
    profile.timezone = tzStr;
    db.profiles.set(userId, profile);

    const embed = buildEmbed('Timezone Saved', `Successfully mapped Timezone to \`${tzStr}\`.`, [], 0x32cd32);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Invalid IANA timezone string. Try e.g. \`America/Los_Angeles\` or \`Europe/London\`.` });
  }
}

// Helper: Render Pfp URLs
async function renderPfp(ctx, targetUser) {
  const guild = ctx.guild;
  const member = guild ? await guild.members.fetch(targetUser.id).catch(() => null) : null;

  const globalAvatar = targetUser.displayAvatarURL({ size: 1024, extension: 'png' });
  const serverAvatar = member ? member.avatarURL({ size: 1024, extension: 'png' }) : null;

  const embed = buildEmbed(`${targetUser.username}'s Avatars`, `High fidelity resolution profile pictures.`);
  embed.setImage(globalAvatar);
  embed.addFields({ name: 'Global Avatar', value: `[Link](${globalAvatar})` });

  if (serverAvatar) {
    embed.addFields({ name: 'Server Specific Avatar', value: `[Link](${serverAvatar})` });
    // In rich embed we can put one image in the main body and the server one in a different way or link it
  }

  return respond(ctx, { embeds: [embed] });
}

// Helper: Render Banner URL
async function renderBanner(ctx, targetUser, client) {
  try {
    const fetchedUser = await client.users.fetch(targetUser.id, { force: true });
    const bannerUrl = fetchedUser.bannerURL({ size: 1024, extension: 'png' });

    if (!bannerUrl) {
      return respond(ctx, { content: `${targetUser.username} does not have a profile banner set up.` });
    }

    const embed = buildEmbed(`${targetUser.username}'s Profile Banner`, `[Download Link](${bannerUrl})`);
    embed.setImage(bannerUrl);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Failed to fetch banner: ${err.message}` });
  }
}

// Helper: generic profile fields update
async function updateProfileField(ctx, fieldName, text) {
  const userId = ctx.author ? ctx.author.id : ctx.user.id;
  const profile = db.profiles.get(userId, {});
  profile[fieldName] = text;
  db.profiles.set(userId, profile);

  const embed = buildEmbed('Profile Updated', `Successfully set your **${fieldName}** field to:\n*${text}*`, [], 0x00ffcc);
  return respond(ctx, { embeds: [embed] });
}
