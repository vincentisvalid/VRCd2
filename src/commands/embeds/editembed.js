/**
 * .editembed — full string payload adjustment of the previously deployed
 * workshop embed, re-fetched live from the channel via the tracked ID.
 */
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

export default {
  name: 'editembed',
  category: 'Embeds',
  description: 'Rewrites the most recent .sendembed message (`title | subtitle | …`).',
  usage: '.editembed <title | subtitle | …>',
  aliases: [],
  guildOnly: true,
  userPermissions: ['ManageMessages'],
  cooldownMs: 3000,
  options: [
    { name: 'text', type: 'string', description: 'New bar-separated content: title | subtitle | …', required: true, rest: true },
  ],
  async execute(ctx) {
    const record = db.collection('embeds').get(ctx.channel.id);
    if (!record) {
      return ctx.replyError('Nothing tracked', 'No workshop embed is tracked for this channel — deploy one with `.sendembed` first.');
    }

    let target = null;
    try {
      target = await ctx.channel.messages.fetch(record.messageId);
    } catch {
      db.collection('embeds').delete(ctx.channel.id);
      return ctx.replyError('Embed missing', 'The tracked embed was deleted — tracking record cleared.');
    }

    const segments = ctx
      .getOption('text')
      .split('|')
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (!segments.length) {
      return ctx.replyError('Nothing to apply', 'Provide new content: `.editembed New title | new subtitle`.');
    }

    const [title, ...body] = segments;
    const embed = brandEmbed().setTitle(truncate(title, 256));
    if (body.length) embed.setDescription(truncate(body.join('\n'), 4096));

    try {
      await target.edit({ embeds: [embed] });
    } catch (error) {
      return ctx.replyError('Edit failed', `Discord refused the edit: ${error.message}`);
    }
    return ctx.replySuccess('Embed updated', `Payload adjusted on \`${record.messageId}\`.`);
  },
};
