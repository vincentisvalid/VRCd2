/**
 * .promptguard — AI-infrastructure defense: prompt-injection / jailbreak
 * heuristic scanner.
 *
 * Blue-team purpose: the bot exposes an LLM subsystem (`.llm`, `.askxipra`,
 * and the Ollama fallbacks). Untrusted user text flowing into those prompts
 * is an injection surface. This command scores arbitrary text against a
 * catalogue of known injection / jailbreak / exfiltration patterns so
 * moderators can vet inputs (or automations can pre-screen them) before they
 * reach a model. It is a DETECTOR only — it never executes the input.
 */
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

/**
 * Weighted signature catalogue. Each entry contributes to a risk score when
 * matched. Weights are tuned so a single strong indicator (e.g. an explicit
 * instruction override) is "suspicious" and two+ push into "high risk".
 */
const SIGNATURES = [
  { weight: 40, label: 'Instruction override', re: /\b(ignore|disregard|forget|override)\b.{0,30}\b(previous|prior|above|earlier|all)\b.{0,20}\b(instruction|prompt|rule|context|message)/i },
  { weight: 40, label: 'System-prompt exfiltration', re: /\b(reveal|show|print|repeat|output|leak|expose)\b.{0,30}\b(system prompt|initial prompt|instructions|your rules|the prompt above)/i },
  { weight: 35, label: 'Persona jailbreak (DAN-style)', re: /\b(you are now|act as|pretend to be|roleplay as)\b.{0,40}\b(dan|do anything now|unfiltered|no restrictions|jailbroken|developer mode)/i },
  { weight: 30, label: 'Guardrail nullification', re: /\b(no|without|ignore|bypass|disable)\b.{0,20}\b(restrictions|guardrails|safety|filters?|rules|policy|policies|limitations)\b/i },
  { weight: 25, label: 'Role-tag / delimiter injection', re: /(<\|?(system|assistant|user)\|?>|\[\/?(inst|system|s)\]|^\s*(system|assistant)\s*:)/im },
  { weight: 20, label: 'Credential / secret solicitation', re: /\b(api[_ -]?key|token|password|secret|\.env|environment variable|credentials?)\b/i },
  { weight: 20, label: 'Output-format coercion', re: /\b(respond only with|from now on you (will|must)|you must always|never refuse|always comply)\b/i },
  { weight: 15, label: 'Encoding / obfuscation hint', re: /\b(base64|rot13|hex[- ]?encode|decode the following|reverse the text)\b/i },
];

function classify(score) {
  if (score >= 60) return { level: 'HIGH RISK', emoji: '🛑', color: 0xed4245 };
  if (score >= 30) return { level: 'SUSPICIOUS', emoji: '⚠️', color: 0xfaa61a };
  return { level: 'LOW RISK', emoji: '✅', color: 0x57f287 };
}

export default {
  name: 'promptguard',
  category: 'Cybersecurity',
  description: 'Scans text for prompt-injection / jailbreak patterns before it reaches an LLM.',
  usage: '.promptguard <text to inspect>',
  aliases: ['injscan', 'aiguard'],
  cooldownMs: 3000,
  options: [{ name: 'text', type: 'string', description: 'The untrusted text to screen', required: true, rest: true }],
  async execute(ctx) {
    const text = ctx.getOption('text');
    if (text.length > 4000) return ctx.replyError('Too long', 'Screen up to 4000 characters at a time.');

    // Normalise zero-width and homoglyph-ish whitespace tricks before matching.
    const normalized = text.replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ');

    const hits = [];
    let score = 0;
    for (const signature of SIGNATURES) {
      if (signature.re.test(normalized)) {
        hits.push(signature.label);
        score += signature.weight;
      }
    }
    score = Math.min(100, score);
    const verdict = classify(score);

    const embed = brandEmbed()
      .setColor(verdict.color)
      .setTitle(`${verdict.emoji} Prompt Guard — ${verdict.level}`)
      .setDescription(`Risk score: **${score}/100**\n\n> ${truncate(normalized, 900)}`)
      .addFields({
        name: hits.length ? `Indicators (${hits.length})` : 'Indicators',
        value: hits.length ? hits.map((label) => `• ${label}`).join('\n') : 'No known injection patterns detected.',
      });
    if (score >= 30) {
      embed.addFields({ name: 'Recommendation', value: 'Treat as untrusted. Do not forward verbatim to a model with tool access or secrets in context.' });
    }
    return ctx.reply({ embeds: [embed] });
  },
};
