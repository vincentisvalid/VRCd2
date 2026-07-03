/**
 * Ollama service — local LLM loop.
 *
 * Talks to a locally running Ollama instance (default
 * http://127.0.0.1:11434) via its /api/generate endpoint. Responses are
 * requested non-streamed and post-chunked for Discord's message limits;
 * the transport still handles Ollama's NDJSON stream format defensively in
 * case a proxy forces streaming.
 */
import axios from 'axios';
import { config } from '../core/config.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('ollama');

/**
 * Runs a single generation against Ollama.
 *
 * @param {object} params
 * @param {string} params.model   Ollama model tag (e.g. `llama3`, `mistral`)
 * @param {string} params.prompt  user prompt
 * @param {string} [params.system] optional behaviour-locking system prompt
 * @returns {Promise<string>} the generated text
 */
export async function generate({ model, prompt, system }) {
  const body = { model, prompt, stream: false };
  if (system) body.system = system;

  const response = await axios.post(`${config.env.ollamaBaseUrl}/api/generate`, body, {
    timeout: config.ai.requestTimeoutMs,
    // Accept any parseable payload; we normalise below.
    validateStatus: (status) => status < 500,
  });

  if (response.status === 404) {
    throw new Error(`Model \`${model}\` is not available on the Ollama host. Pull it first: \`ollama pull ${model}\``);
  }
  if (response.status >= 400) {
    throw new Error(`Ollama rejected the request (HTTP ${response.status}): ${response.data?.error ?? 'unknown error'}`);
  }

  // Normal non-streamed shape: { response: "..." }
  if (typeof response.data?.response === 'string') return response.data.response.trim();

  // Defensive: some deployments return NDJSON chunks even with stream:false.
  if (typeof response.data === 'string') {
    const combined = response.data
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line).response ?? '';
        } catch {
          return '';
        }
      })
      .join('');
    if (combined) return combined.trim();
  }

  throw new Error('Ollama returned an unrecognised payload shape.');
}

/** Quick health probe used by fallback chains (e.g. `.randomquote`). */
export async function isOnline() {
  try {
    const response = await axios.get(`${config.env.ollamaBaseUrl}/api/tags`, { timeout: 4_000 });
    return response.status === 200;
  } catch (error) {
    log.debug('Ollama offline:', error.message);
    return false;
  }
}
