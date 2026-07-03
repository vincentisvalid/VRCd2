/**
 * .sendembed — custom embed builder.
 *
 * Splits the payload on vertical bars: `title | subtitle | line | …`.
 * The first segment becomes the title; remaining segments join as the
 * multi-line description. File attachments ride along. The deployed
 * message ID is retained in the database for .editembed / .delembed.
 */
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

export default {
  name: 'sendembed',
  category: 'Embeds',
  description: 'Sends a custom embed (`title | subtitle | more lines…`), tracking it for later edits.',
  usage: '.sendembed <title | subtitle | …>',
  aliases: ['embed'],
  guildOnly: true,
  userPermissions: ['ManageMessages'],
  cooldownMs: 3000,
  options: [
    { name: 'text', type: 'string', description: 'Bar-separated content: title | subtitle | …', required: true, rest: true },
    { name: 'file', type: 'attachment', description: 'Optional attachment to include', required: false },
  ],
  async execute(ctx) {
    const raw = ctx.getOption('text');
    const segments = raw
      .split('|')
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (!segments.length) {
      return ctx.replyError('Nothing to send', 'Provide at least a title: `.sendembed My title | my subtitle`.');
    }

    const [title, ...body] = segments;
    const embed = brandEmbed().setTitle(truncate(title, 256));
    if (body.length) embed.setDescription(truncate(body.join('\n'), 4096));

    // Attachments: slash option or raw message uploads pass straight through.
    const files = ctx.attachments.map((attachment) => attachment.url ?? attachment);

    const deployed = await ctx.channel.send({ embeds: [embed], files });

    // Retain the deployed message for the edit/delete workshop commands.
    db.collection('embeds').set(ctx.channel.id, {
      messageId: deployed.id,
      channelId: ctx.channel.id,
      guildId: ctx.guild.id,
      authorId: ctx.user.id,
      createdAt: Date.now(),
    });

    if (ctx.isSlash) {
      await ctx.reply({ content: `✅ Embed deployed (\`${deployed.id}\`).`, ephemeral: true });
    } else {
      await ctx.message.delete().catch(() => {
        /* keep the original if we lack ManageMessages */
      });
    }
  },
};
