/**
 * .delembed — safely purges the last workshop embed deployed in this
 * channel, using the retained message-ID tracking record.
 */
import { db } from '../../database/index.js';

export default {
  name: 'delembed',
  category: 'Embeds',
  description: 'Deletes the most recent .sendembed message in this channel.',
  usage: '.delembed',
  aliases: [],
  guildOnly: true,
  userPermissions: ['ManageMessages'],
  botPermissions: ['ManageMessages'],
  cooldownMs: 3000,
  options: [],
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
      return ctx.replyError('Already gone', 'The tracked embed no longer exists — tracking record cleared.');
    }

    try {
      await target.delete();
    } catch (error) {
      return ctx.replyError('Delete failed', `Discord refused the deletion: ${error.message}`);
    }
    db.collection('embeds').delete(ctx.channel.id);
    return ctx.replySuccess('Embed purged', `Removed the tracked embed (\`${record.messageId}\`).`);
  },
};
