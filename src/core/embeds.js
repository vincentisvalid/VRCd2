/**
 * Rich-embed factory.
 *
 * Every embed the bot ships carries the dynamic environment footer mandated
 * by the design spec: `VRCd Bot • [Current UTC Time]`. Centralising embed
 * construction here keeps the aesthetic identical across all 12 command
 * categories.
 */
import { EmbedBuilder } from 'discord.js';
import { config } from './config.js';

/** Formats the current moment as a compact UTC stamp, e.g. `2026-07-03 14:05 UTC`. */
export function utcNow() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ` +
    `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} UTC`
  );
}

/** Base branded embed — footer is computed at call time so it always reflects "now". */
export function brandEmbed() {
  return new EmbedBuilder()
    .setColor(config.bot.embedColor)
    .setFooter({ text: `${config.bot.brandName} • ${utcNow()}` });
}

/** Uniform success embed. */
export function successEmbed(title, description) {
  const embed = brandEmbed().setColor(config.bot.successColor).setTitle(`✅ ${title}`);
  if (description) embed.setDescription(description);
  return embed;
}

/**
 * Uniform graceful-failure embed. `reason` should be a human-readable cause
 * (e.g. "The Ollama endpoint refused the connection") — technical tracebacks
 * belong in the logger, never in chat.
 */
export function errorEmbed(title, reason) {
  const embed = brandEmbed().setColor(config.bot.errorColor).setTitle(`⚠️ ${title}`);
  if (reason) embed.setDescription(reason);
  return embed;
}

/** Transient "working on it" embed used by long-running pipelines (media, AI). */
export function processingEmbed(title, description) {
  const embed = brandEmbed().setTitle(`⏳ ${title}`);
  if (description) embed.setDescription(description);
  return embed;
}
