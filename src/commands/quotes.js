import axios from 'axios';
import { db } from '../database/db.js';
import { respond, buildEmbed } from '../utils/helpers.js';
import config from '../../config.json' with { type: 'json' };

export default [
  {
    name: 'createquote',
    description: 'Commit a custom quote into the local database.',
    category: 'Quotes',
    aliases: ['addquote', 'savequote'],
    options: [
      {
        name: 'quote_content',
        type: 3, // String
        description: 'Formatted as Author | Quote Text',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return respond(message, { content: 'Usage: `.createquote Author | Quote text here`' });
      }
      const rawInput = args.join(' ');
      return runCreateQuote(message, rawInput);
    },
    async executeSlash(interaction, client) {
      const rawInput = interaction.options.getString('quote_content');
      return runCreateQuote(interaction, rawInput);
    }
  },
  {
    name: 'randomquote',
    description: 'Fetch a random quote (online API or local Ollama engine fallback).',
    category: 'Quotes',
    aliases: ['quote'],
    async execute(message, args, client) {
      return runRandomQuote(message);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runRandomQuote(interaction);
    }
  }
];

// Helper: Commit quote to DB
function runCreateQuote(ctx, rawInput) {
  const parts = rawInput.split('|').map(p => p.trim());
  
  if (parts.length < 2) {
    return respond(ctx, { content: 'Format must be: `Author | Quote Text`. Use a vertical bar separator.' });
  }

  const author = parts[0];
  const text = parts[1];

  const guildId = ctx.guild.id;
  const quotesList = db.quotes.get(guildId, []);

  quotesList.push({
    author,
    text,
    timestamp: Date.now(),
    submittedBy: ctx.author ? ctx.author.id : ctx.user.id
  });

  db.quotes.set(guildId, quotesList);

  const embed = buildEmbed(
    'Quote Logged',
    `Successfully saved quote to guild memory database:\n\n*"${text}"*\n— **${author}**`,
    [],
    0x32cd32
  );
  return respond(ctx, { embeds: [embed] });
}

// Helper: Fetch random quote with LLM fallback
async function runRandomQuote(ctx) {
  try {
    // Try online API first (zenquotes.io)
    const res = await axios.get('https://zenquotes.io/api/random', { timeout: 4000 });
    const data = res.data?.[0];
    
    if (data && data.q && data.a) {
      const embed = buildEmbed(
        'Random Quote',
        `*"${data.q}"*\n— **${data.a}**`,
        [{ name: 'Source', value: 'ZenQuotes API', inline: true }],
        0x6a5acd
      );
      return respond(ctx, { embeds: [embed] });
    }
    throw new Error('Invalid API response format.');
  } catch (err) {
    console.warn('[Quotes API Failed, falling back to Ollama loop]:', err.message);

    // Fallback: local Ollama query loop
    const model = config.defaultOllamaModel || 'llama3';
    const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

    try {
      const prompt = `Generate a single short philosophical, funny, or inspirational quote. Output ONLY the quote and the author, formatted exactly as: "Quote text" - Author name. Do not include any greeting or explanation.`;
      
      const res = await axios.post(`${ollamaHost}/api/generate`, {
        model,
        prompt,
        stream: false
      }, { timeout: 10000 });

      const text = res.data?.response || '';
      
      // Parse generated "Quote" - Author
      const embed = buildEmbed(
        'Random Quote (Ollama Engine)',
        text || '"The code is the architecture." - Local Engine',
        [{ name: 'Status', value: 'ZenQuotes Offline (Fallback active)', inline: true }],
        0xff8c00
      );
      return respond(ctx, { embeds: [embed] });
    } catch (ollamaErr) {
      console.error('[Quotes Ollama Fallback Failed]:', ollamaErr.message);
      
      // Secondary fallback: pull from local database if any exists
      const guildId = ctx.guild.id;
      const quotesList = db.quotes.get(guildId, []);
      
      if (quotesList.length > 0) {
        const rand = quotesList[Math.floor(Math.random() * quotesList.length)];
        const embed = buildEmbed(
          'Random Quote (Local Cache)',
          `*"${rand.text}"*\n— **${rand.author}**`,
          [{ name: 'Status', value: 'All APIs Offline (Local database fetch)', inline: true }],
          0x00ffcc
        );
        return respond(ctx, { embeds: [embed] });
      }

      return respond(ctx, { content: 'Could not fetch quotes. Local and remote interfaces are currently offline.' });
    }
  }
}
