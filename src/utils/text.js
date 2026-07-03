/**
 * Text-processing helpers shared across the command surface.
 */

/**
 * Quote-aware tokenizer. Splits on whitespace but keeps `"quoted spans"`
 * together, and records each token's start offset in the original string so
 * greedy "rest" options can recover the verbatim remainder (preserving the
 * user's original spacing and pipes).
 *
 * @param {string} input
 * @returns {{ value: string, start: number }[]}
 */
export function tokenize(input) {
  const tokens = [];
  const pattern = /"([^"]*)"|(\S+)/g;
  let match;
  while ((match = pattern.exec(input)) !== null) {
    tokens.push({ value: match[1] ?? match[2], start: match.index });
  }
  return tokens;
}

/** Splits a long string into chunks no longer than `size`, breaking on newlines when possible. */
export function chunkString(text, size = 2000) {
  const chunks = [];
  let remaining = String(text);
  while (remaining.length > size) {
    let cut = remaining.lastIndexOf('\n', size);
    if (cut <= 0) cut = size;
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  if (remaining.length) chunks.push(remaining);
  return chunks;
}

/** Hard-truncates a string, appending an ellipsis when content was dropped. */
export function truncate(text, max) {
  const value = String(text ?? '');
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`;
}

/** Wraps content in a fenced code block, guarding against fence-breakouts. */
export function codeBlock(content, language = '') {
  const safe = String(content).replaceAll('```', "'''");
  return `\`\`\`${language}\n${safe}\n\`\`\``;
}

/** Escapes Discord markdown control characters in arbitrary user text. */
export function escapeMarkdown(text) {
  return String(text).replace(/([\\*_~`|>])/g, '\\$1');
}
