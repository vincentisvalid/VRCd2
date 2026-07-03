/**
 * .randomquote — layered quote sourcing with seamless failover:
 *   1. Remote public API (ZenQuotes).
 *   2. Local Ollama generation loop (when the remote is offline).
 *   3. The server's own .createquote book as the final fallback.
 */
import axios from 'axios';
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';
import { generate, isOnline } from '../../services/ollama.js';
import { config } from '../../core/config.js';
import { createLogger } from '../../core/logger.js';

const log = createLogger('randomquote');

async function fromRemoteApi() {
  const response = await axios.get('https://zenquotes.io/api/random', { timeout: 8_000 });
  const entry = response.data?.[0];
  if (!entry?.q || !entry?.a) throw new Error('Malformed ZenQuotes payload.');
  return { text: entry.q, author: entry.a, source: 'ZenQuotes' };
}

async function fromOllama() {
  if (!(await isOnline())) throw new Error('Ollama offline');
  const raw = await generate({
    model: config.ai.defaultModel,
    prompt: 'Produce one short, original, inspiring quote (max 40 words). Respond with EXACTLY this format and nothing else: "<quote>" — <fictional author name>',
  });
  const match = /"([^"]{10,400})"\s*—\s*(.{2,80})/.exec(raw);
  if (!match) return { text: raw.slice(0, 300), author: 'Local model', source: 'Ollama' };
  return { text: match[1].trim(), author: match[2].trim(), source: 'Ollama' };
}

function fromLocalBook(guildId) {
  const pool = db.collection('quotes').find((quote) => quote.guildId === guildId);
  if (!pool.length) return null;
  const [, quote] = pool[Math.floor(Math.random() * pool.length)];
  return { text: quote.text, author: quote.author, source: 'Server quote book' };
}

export default {
  name: 'randomquote',
  category: 'Quotes',
  description: 'Fetches a random quote (remote API → Ollama → local book failover).',
  usage: '.randomquote',
  aliases: ['quote'],
  cooldownMs: 4000,
  options: [],
  async execute(ctx) {
    await ctx.defer();

    let quote = null;
    try {
      quote = await fromRemoteApi();
    } catch (remoteError) {
      log.warn('Remote quote API failed:', remoteError.message);
      try {
        quote = await fromOllama();
      } catch (ollamaError) {
        log.warn('Ollama fallback failed:', ollamaError.message);
        quote = ctx.guild ? fromLocalBook(ctx.guild.id) : null;
      }
    }

    if (!quote) {
      return ctx.replyError(
        'No quotes available',
        'The remote API and the local Ollama loop are both offline, and this server has no saved quotes yet (`.createquote`).'
      );
    }

    const embed = brandEmbed()
      .setTitle('💬 Random quote')
      .setDescription(`“${quote.text}”\n\n— **${quote.author}**`)
      .addFields({ name: 'Source', value: quote.source, inline: true });
    return ctx.reply({ embeds: [embed] });
  },
};
