/**
 * .createquote — commits a custom quote into the local database layer.
 * Syntax: `.createquote <author> | <text>` (bar-separated).
 */
import { randomUUID } from 'node:crypto';
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

export default {
  name: 'createquote',
  category: 'Quotes',
  description: 'Saves a quote to the server’s local quote book (`author | text`).',
  usage: '.createquote <author> | <text>',
  aliases: ['addquote'],
  guildOnly: true,
  cooldownMs: 3000,
  options: [
    { name: 'quote', type: 'string', description: 'Format: author | quote text', required: true, rest: true },
  ],
  async execute(ctx) {
    const raw = ctx.getOption('quote');
    const barIndex = raw.indexOf('|');
    if (barIndex === -1) {
      return ctx.replyError('Missing separator', 'Use the bar format: `.createquote Gaben | The best VR is the one you play.`');
    }

    const author = raw.slice(0, barIndex).trim();
    const text = raw.slice(barIndex + 1).trim();
    if (!author || !text) return ctx.replyError('Incomplete quote', 'Both the author and the quote text are required.');
    if (text.length > 1000) return ctx.replyError('Too long', 'Quotes are capped at 1000 characters.');

    const id = randomUUID();
    db.collection('quotes').set(id, {
      id,
      guildId: ctx.guild.id,
      author,
      text,
      addedBy: ctx.user.id,
      addedAt: Date.now(),
    });

    const total = db.collection('quotes').find((quote) => quote.guildId === ctx.guild.id).length;
    const embed = brandEmbed()
      .setTitle('📚 Quote saved')
      .setDescription(`“${truncate(text, 2000)}”\n— **${truncate(author, 100)}**`)
      .addFields({ name: 'Quote book', value: `${total} quote(s) stored for this server.` });
    return ctx.reply({ embeds: [embed] });
  },
};
