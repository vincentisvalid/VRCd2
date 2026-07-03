import { db } from '../database/db.js';
import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'sendembed',
    description: 'Send a beautifully styled custom embed to the channel.',
    category: 'Embeds',
    aliases: ['embed'],
    options: [
      {
        name: 'input',
        type: 3, // String
        description: 'Formatted as Title | Description | Optional Hex Color',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return message.reply({ embeds: [buildEmbed('Usage', '`.sendembed Title | Description | HexColor (Optional)`\nExample: `.sendembed Hello World | This is an embed description | #ff00ff`')] });
      }
      const rawInput = args.join(' ');
      return runSendEmbed(message, rawInput);
    },
    async executeSlash(interaction, client) {
      const rawInput = interaction.options.getString('input');
      return runSendEmbed(interaction, rawInput);
    }
  },
  {
    name: 'delembed',
    description: 'Delete the last custom embed sent by the bot in this channel.',
    category: 'Embeds',
    aliases: ['deleteembed'],
    async execute(message, args, client) {
      return runDeleteEmbed(message);
    },
    async executeSlash(interaction, client) {
      return runDeleteEmbed(interaction);
    }
  },
  {
    name: 'editembed',
    description: 'Edit the last custom embed sent by the bot in this channel.',
    category: 'Embeds',
    aliases: ['modifyembed'],
    options: [
      {
        name: 'input',
        type: 3, // String
        description: 'New content formatted as Title | Description | HexColor (Optional)',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return message.reply({ content: 'Provide the new text. Usage: `.editembed Title | Description | HexColor`' });
      }
      const rawInput = args.join(' ');
      return runEditEmbed(message, rawInput);
    },
    async executeSlash(interaction, client) {
      const rawInput = interaction.options.getString('input');
      return runEditEmbed(interaction, rawInput);
    }
  }
];

// Helper: Parse bar-separated layout inputs
function parseEmbedString(input, attachmentUrl = null) {
  const parts = input.split('|').map(p => p.trim());
  const title = parts[0] || 'Notification';
  const description = parts[1] || '';
  
  let color = 0x8a2be2; // default purple
  if (parts[2]) {
    const rawColor = parts[2].replace('#', '');
    const parsedColor = parseInt(rawColor, 16);
    if (!isNaN(parsedColor)) {
      color = parsedColor;
    }
  }

  const embed = buildEmbed(title, description, [], color);
  if (attachmentUrl) {
    embed.setImage(attachmentUrl);
  }

  return embed;
}

// Helper: Send Custom Embed
async function runSendEmbed(ctx, rawInput) {
  const channelId = ctx.channelId || ctx.channel?.id;
  const message = ctx.message || ctx;
  const attachment = message.attachments?.first()?.url || null;

  try {
    const embed = parseEmbedString(rawInput, attachment);
    
    let sentMsg;
    if (ctx.isInteraction || (ctx.deferred !== undefined && ctx.replied !== undefined)) {
      sentMsg = await ctx.reply({ embeds: [embed], fetchReply: true });
    } else {
      sentMsg = await ctx.channel.send({ embeds: [embed] });
    }

    db.embeds.set(channelId, sentMsg.id);
  } catch (err) {
    console.error('[Embed Workshop Error]:', err.message);
    const errEmbed = buildEmbed('Error', `Failed to construct/send custom embed:\n\`${err.message}\``, [], 0xff0000);
    await respond(ctx, { embeds: [errEmbed] });
  }
}

// Helper: Delete Last Custom Embed
async function runDeleteEmbed(ctx) {
  const channelId = ctx.channelId || ctx.channel?.id;
  const lastEmbedId = db.embeds.get(channelId);

  if (!lastEmbedId) {
    return respond(ctx, { content: 'No tracked custom embed found in this channel database logs.' });
  }

  try {
    const channel = ctx.channel || await ctx.client.channels.fetch(channelId);
    const targetMsg = await channel.messages.fetch(lastEmbedId);
    
    await targetMsg.delete();
    db.embeds.delete(channelId);

    const confirmation = buildEmbed('Embed Purged', 'Successfully deleted the tracked custom embed from this channel.', [], 0x00ff00);
    return respond(ctx, { embeds: [confirmation] });
  } catch (err) {
    console.error('[Embed Deletion Error]:', err.message);
    return respond(ctx, { content: 'Could not find or delete the target embed message. It may have already been deleted.' });
  }
}

// Helper: Edit Last Custom Embed
async function runEditEmbed(ctx, rawInput) {
  const channelId = ctx.channelId || ctx.channel?.id;
  const lastEmbedId = db.embeds.get(channelId);
  const message = ctx.message || ctx;
  const attachment = message.attachments?.first()?.url || null;

  if (!lastEmbedId) {
    return respond(ctx, { content: 'No tracked custom embed found in this channel.' });
  }

  try {
    const channel = ctx.channel || await ctx.client.channels.fetch(channelId);
    const targetMsg = await channel.messages.fetch(lastEmbedId);
    const newEmbed = parseEmbedString(rawInput, attachment);

    await targetMsg.edit({ embeds: [newEmbed] });

    const confirmation = buildEmbed('Embed Modified', 'The custom embed has been adjusted successfully.', [], 0x00ff00);
    return respond(ctx, { embeds: [confirmation] });
  } catch (err) {
    console.error('[Embed Modification Error]:', err.message);
    return respond(ctx, { content: `Failed to edit the custom embed: ${err.message}` });
  }
}
