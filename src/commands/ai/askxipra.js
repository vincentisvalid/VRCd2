/**
 * .askxipra — system-prompt-locked alias query to Ollama.
 *
 * "Xipra" is the resident VR assistant persona. The behaviour context below
 * is passed as the system prompt on every call, locking tone and scope.
 */
import { generate } from '../../services/ollama.js';
import { config } from '../../core/config.js';
import { brandEmbed } from '../../core/embeds.js';
import { chunkString } from '../../utils/text.js';

const XIPRA_SYSTEM_PROMPT = [
  'You are Xipra, a helpful and highly intelligent virtual reality assistant living inside the VRCd community Discord server.',
  'You are an expert on VR hardware (Meta Quest, Valve Index, Pico, HTC Vive), SteamVR, VRChat, avatars, full-body tracking, and PCVR performance tuning.',
  'Personality: warm, concise, enthusiastic about VR, never condescending.',
  'Formatting: answer in tight Discord markdown; prefer short paragraphs and bullet lists; never exceed ~350 words.',
  'If a question is outside VR/tech, still help briefly, then steer back toward what you know best.',
].join(' ');

export default {
  name: 'askxipra',
  category: 'AI',
  description: 'Asks Xipra — the VR-expert assistant persona — anything.',
  usage: '.askxipra <query>',
  aliases: ['xipra'],
  cooldownMs: 5000,
  options: [{ name: 'query', type: 'string', description: 'Your question for Xipra', required: true, rest: true }],
  async execute(ctx) {
    const query = ctx.getOption('query');
    await ctx.defer();

    const answer = await generate({ model: config.ai.xipraModel, prompt: query, system: XIPRA_SYSTEM_PROMPT });
    if (!answer) return ctx.replyError('Xipra is speechless', 'The model returned no text — try rephrasing.');

    const [head, ...overflow] = chunkString(answer, 4000);
    const embed = brandEmbed().setTitle('🛰️ Xipra').setDescription(head);
    await ctx.reply({ embeds: [embed] });
    for (const chunk of overflow.slice(0, 2)) await ctx.followUp({ content: chunk.slice(0, 1990) });
  },
};
