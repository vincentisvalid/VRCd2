/**
 * fal.ai service — on-the-fly authenticated generative media requests.
 *
 * The AI media commands (.text2img / .text2vid / .editimage) accept the
 * caller's fal.ai key inline. Security policy implemented here + in the
 * commands:
 *   1. The plaintext key is used exactly once for the request and is never
 *      written to the database, logs, or chat.
 *   2. A SHA-512 digest of the key is computed immediately so the user can
 *      be shown a spoilered fingerprint (`||hash||`) proving what was used
 *      without ever re-exposing the secret.
 *   3. The triggering message (prefix mode) is purged from channel history
 *      before any network round-trip begins.
 */
import { createHash } from 'node:crypto';
import axios from 'axios';
import { config } from '../core/config.js';

/**
 * SHA-512 digest (hex) of the provided API key. Hashing is one-way: the
 * fingerprint cannot be reversed into the original credential.
 */
export function hashApiKey(apiKey) {
  return createHash('sha512').update(String(apiKey), 'utf8').digest('hex');
}

/**
 * Executes a synchronous fal.run model invocation.
 *
 * @param {object} params
 * @param {string} params.apiKey plaintext fal.ai key (never persisted)
 * @param {string} params.model  model route, e.g. `fal-ai/flux/dev`
 * @param {object} params.input  model input payload
 * @returns {Promise<object>} the model's JSON output
 */
export async function runFalModel({ apiKey, model, input }) {
  try {
    const response = await axios.post(`https://fal.run/${model}`, input, {
      timeout: config.fal.requestTimeoutMs,
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) throw new Error('fal.ai rejected the API key (unauthorised).');
      if (status === 422) throw new Error(`fal.ai rejected the input payload: ${JSON.stringify(error.response.data?.detail ?? {}).slice(0, 300)}`);
      if (status === 429) throw new Error('fal.ai rate limit hit — wait a moment and retry.');
      throw new Error(`fal.ai returned HTTP ${status}.`);
    }
    if (error.code === 'ECONNABORTED') throw new Error('fal.ai request timed out.');
    throw new Error(`Could not reach fal.ai: ${error.message}`);
  }
}

/** Pulls the first image URL out of the many shapes fal models return. */
export function extractImageUrl(data) {
  return (
    data?.images?.[0]?.url ??
    data?.image?.url ??
    (typeof data?.images?.[0] === 'string' ? data.images[0] : null) ??
    data?.output?.images?.[0]?.url ??
    null
  );
}

/** Pulls the first video URL out of a fal video-model response. */
export function extractVideoUrl(data) {
  return data?.video?.url ?? data?.videos?.[0]?.url ?? (typeof data?.video === 'string' ? data.video : null) ?? null;
}
