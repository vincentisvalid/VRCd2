/**
 * Duration parsing and formatting utilities.
 *
 * Translates human text timing variables (`10m`, `2h`, `1d`, `1h30m`, …)
 * into millisecond delays, and renders milliseconds back into compact
 * human-readable strings.
 */

const UNIT_MS = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/**
 * Parses a compound duration string into milliseconds.
 * Returns `null` for anything that is not a clean duration expression.
 *
 * Accepted grammar: one or more `<number><s|m|h|d|w>` groups, e.g. `90s`,
 * `10m`, `2h`, `1d`, `1w`, `1h30m`.
 */
export function parseDuration(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().toLowerCase();
  if (!/^(\d+(?:\.\d+)?[smhdw])+$/.test(trimmed)) return null;
  let total = 0;
  const pattern = /(\d+(?:\.\d+)?)([smhdw])/g;
  let match;
  while ((match = pattern.exec(trimmed)) !== null) {
    total += Number.parseFloat(match[1]) * UNIT_MS[match[2]];
  }
  return Number.isFinite(total) && total > 0 ? Math.round(total) : null;
}

/** Formats milliseconds as e.g. `2d 4h 12m 6s`. */
export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0s';
  const parts = [];
  let remaining = Math.floor(ms / 1000);
  const table = [
    ['d', 86_400],
    ['h', 3_600],
    ['m', 60],
    ['s', 1],
  ];
  for (const [suffix, seconds] of table) {
    const amount = Math.floor(remaining / seconds);
    remaining -= amount * seconds;
    if (amount > 0) parts.push(`${amount}${suffix}`);
  }
  return parts.length ? parts.join(' ') : '0s';
}

/**
 * Parses `HH:MM:SS(.ms)`, `MM:SS` or plain seconds into fractional seconds.
 * Used by the `.cut` media command for precise segment extraction.
 */
export function parseTimestamp(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return Number.parseFloat(trimmed);
  const match = /^(?:(\d{1,3}):)?([0-5]?\d):([0-5]?\d(?:\.\d+)?)$/.exec(trimmed);
  if (!match) return null;
  const hours = match[1] ? Number.parseInt(match[1], 10) : 0;
  const minutes = Number.parseInt(match[2], 10);
  const seconds = Number.parseFloat(match[3]);
  return hours * 3600 + minutes * 60 + seconds;
}

/** Formats fractional seconds as an FFmpeg-friendly `HH:MM:SS.mmm` stamp. */
export function toFfmpegTimestamp(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = (totalSeconds % 60).toFixed(3).padStart(6, '0');
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${seconds}`;
}
