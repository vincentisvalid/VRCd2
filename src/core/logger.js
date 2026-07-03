/**
 * Minimal structured console logger.
 *
 * Every line is timestamped in UTC and tagged with a severity + scope so
 * that production hosts can grep and route output cleanly. Tracebacks from
 * gracefully-handled failures are dumped here (never to end users).
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const activeLevel = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

function write(level, scope, parts) {
  if (LEVELS[level] < activeLevel) return;
  const stamp = new Date().toISOString();
  const line = `[${stamp}] [${level.toUpperCase()}] [${scope}]`;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  sink(line, ...parts);
}

export function createLogger(scope) {
  return {
    debug: (...parts) => write('debug', scope, parts),
    info: (...parts) => write('info', scope, parts),
    warn: (...parts) => write('warn', scope, parts),
    error: (...parts) => write('error', scope, parts),
  };
}

export const logger = createLogger('core');
export default logger;
