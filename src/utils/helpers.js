import crypto from 'crypto';
import fs from 'fs';
import axios from 'axios';
import { EmbedBuilder } from 'discord.js';

/**
 * Computes the SHA-512 hash of a string.
 */
export function sha512(text) {
  return crypto.createHash('sha512').update(text).digest('hex');
}

/**
 * Universal reply handler for both Message and CommandInteraction contexts.
 */
export async function respond(ctx, options) {
  const isInteraction = ctx.isInteraction || (ctx.deferred !== undefined && ctx.replied !== undefined);
  
  if (isInteraction) {
    if (ctx.deferred || ctx.replied) {
      return await ctx.editReply(options);
    } else {
      return await ctx.reply(options);
    }
  } else {
    return await ctx.reply(options);
  }
}

/**
 * Safe message deletion.
 */
export async function deleteTrigger(ctx) {
  const isInteraction = ctx.isInteraction || (ctx.deferred !== undefined && ctx.replied !== undefined);
  if (!isInteraction && ctx.delete) {
    try {
      await ctx.delete();
    } catch (err) {
      console.warn('[Helpers] Failed to delete user trigger message:', err.message);
    }
  }
}

/**
 * Downloads a file from a URL to a local destination path.
 */
export async function downloadFile(url, destPath) {
  const writer = fs.createWriteStream(destPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

/**
 * Standard dynamic embed template conforming to elite UI styling.
 */
export function buildEmbed(title, description, fields = [], color = 0x8a2be2) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: `VRCd Bot • ${new Date().toUTCString()}` });

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}
