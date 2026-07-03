/**
 * .urban — slang insights from the Urban Dictionary public API.
 */
import axios from 'axios';
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

/** UD wraps cross-links in [brackets] — convert them to searchable links. */
function linkify(text) {
  return String(text).replace(/\[([^\]]+)\]/g, (_, term) => `[${term}](https://www.urbandictionary.com/define.php?term=${encodeURIComponent(term)})`);
}

export default {
  name: 'urban',
  category: 'Utilities',
  description: 'Looks a term up on Urban Dictionary.',
  usage: '.urban <term>',
  aliases: ['ud'],
  cooldownMs: 4000,
  options: [{ name: 'term', type: 'string', description: 'Slang term to define', required: true, rest: true }],
  async execute(ctx) {
    const term = ctx.getOption('term');
    await ctx.defer();

    let entry;
    try {
      const response = await axios.get('https://api.urbandictionary.com/v0/define', {
        params: { term },
        timeout: 10_000,
      });
      const list = response.data?.list ?? [];
      // Highest-voted definition first.
      entry = [...list].sort((a, b) => (b.thumbs_up ?? 0) - (a.thumbs_up ?? 0))[0];
    } catch (error) {
      return ctx.replyError('Lookup failed', `Urban Dictionary errored: ${error.message}`);
    }
    if (!entry) return ctx.replyError('No definition', `Urban Dictionary has nothing for \`${term}\`.`);

    const embed = brandEmbed()
      .setTitle(`📕 ${truncate(entry.word ?? term, 250)}`)
      .setURL(entry.permalink ?? null)
      .setDescription(truncate(linkify(entry.definition ?? ''), 2048));
    if (entry.example) embed.addFields({ name: 'Usage context', value: truncate(linkify(entry.example), 1024) });
    embed.addFields({ name: 'Votes', value: `👍 ${entry.thumbs_up ?? 0} · 👎 ${entry.thumbs_down ?? 0}`, inline: true });
    return ctx.reply({ embeds: [embed] });
  },
};
