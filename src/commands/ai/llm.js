/**
 * .llm — direct local loop to a running Ollama instance.
 */
import { generate } from '../../services/ollama.js';
import { brandEmbed } from '../../core/embeds.js';
import { chunkString, codeBlock, truncate } from '../../utils/text.js';

export default {
  name: 'llm',
  category: 'AI',
  description: 'Queries a local Ollama model and returns the response inline.',
  usage: '.llm <modelname> <query>',
  aliases: ['ollama'],
  cooldownMs: 5000,
  options: [
    { name: 'model', type: 'string', description: 'Ollama model tag (e.g. llama3, mistral)', required: true },
    { name: 'query', type: 'string', description: 'Prompt to send to the model', required: true, rest: true },
  ],
  async execute(ctx) {
    const model = ctx.getOption('model');
    const query = ctx.getOption('query');
    if (!/^[\w.:\-\/]+$/.test(model)) {
      return ctx.replyError('Invalid model name', 'Model tags may only contain letters, digits, `._:-/`.');
    }

    await ctx.defer();
    const answer = await generate({ model, prompt: query });
    if (!answer) return ctx.replyError('Empty response', `\`${model}\` returned no text.`);

    // First 4096 chars ride in the embed; any overflow follows as chunks.
    const [head, ...overflow] = chunkString(answer, 4000);
    const embed = brandEmbed()
      .setTitle(`🧠 ${model}`)
      .setDescription(head)
      .addFields({ name: 'Prompt', value: truncate(query, 1024) });
    await ctx.reply({ embeds: [embed] });
    for (const chunk of overflow.slice(0, 3)) await ctx.followUp({ content: codeBlock(chunk.slice(0, 1900), 'md') });
  },
};
