/**
 * .translate — instant cross-vocabulary rewriting.
 * Primary: the public Google translate `gtx` endpoint (no key, auto-detect).
 * Fallback: a local Ollama LLM loop when the endpoint is unreachable.
 */
import axios from 'axios';
import { brandEmbed } from '../../core/embeds.js';
import { generate, isOnline } from '../../services/ollama.js';
import { config } from '../../core/config.js';
import { truncate } from '../../utils/text.js';
import { createLogger } from '../../core/logger.js';

const log = createLogger('translate');
const LANG_CODE = /^[a-z]{2,3}(-[a-z]{2,4})?$/i;

async function viaGoogle(target, text) {
  const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
    params: { client: 'gtx', sl: 'auto', tl: target, dt: 't', q: text },
    timeout: 10_000,
  });
  const segments = response.data?.[0];
  if (!Array.isArray(segments)) throw new Error('Malformed translation payload.');
  const translated = segments.map((segment) => segment?.[0] ?? '').join('');
  const detected = response.data?.[2] ?? 'auto';
  if (!translated) throw new Error('Empty translation.');
  return { translated, detected, engine: 'Google (gtx)' };
}

async function viaOllama(target, text) {
  if (!(await isOnline())) throw new Error('Ollama offline');
  const translated = await generate({
    model: config.ai.defaultModel,
    system: 'You are a precise translation engine. Output ONLY the translated text — no commentary, no quotes.',
    prompt: `Translate the following text into the language with ISO code "${target}":\n\n${text}`,
  });
  return { translated, detected: 'auto', engine: `Ollama (${config.ai.defaultModel})` };
}

export default {
  name: 'translate',
  category: 'Utilities',
  description: 'Translates text into a target language (auto-detects the source).',
  usage: '.translate <target_lang> <text>  — e.g. .translate ja hello there',
  aliases: ['tr'],
  cooldownMs: 4000,
  options: [
    { name: 'target', type: 'string', description: 'Target language code (en, ja, de, pt-br…)', required: true },
    { name: 'text', type: 'string', description: 'Text to translate', required: true, rest: true },
  ],
  async execute(ctx) {
    const target = ctx.getOption('target').toLowerCase();
    const text = ctx.getOption('text');
    if (!LANG_CODE.test(target)) {
      return ctx.replyError('Invalid language code', `\`${target}\` is not an ISO language code — try \`en\`, \`ja\`, \`de\`, \`es\`, \`pt-br\`…`);
    }
    if (text.length > 1800) return ctx.replyError('Too long', 'Translations are capped at 1800 characters per call.');

    await ctx.defer();
    let result;
    try {
      result = await viaGoogle(target, text);
    } catch (googleError) {
      log.warn('Google endpoint failed:', googleError.message);
      try {
        result = await viaOllama(target, text);
      } catch (ollamaError) {
        return ctx.replyError('Translation unavailable', `Both engines failed — Google: ${googleError.message} · Ollama: ${ollamaError.message}`);
      }
    }

    const embed = brandEmbed()
      .setTitle(`🌐 Translation → ${target}`)
      .setDescription(truncate(result.translated, 4000))
      .addFields(
        { name: 'Detected source', value: String(result.detected), inline: true },
        { name: 'Engine', value: result.engine, inline: true }
      );
    return ctx.reply({ embeds: [embed] });
  },
};
