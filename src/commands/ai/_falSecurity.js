/**
 * Shared security workflow for the fal.ai key-bearing commands
 * (.text2img / .text2vid / .editimage).
 *
 * Contract enforced for every command that accepts an inline API key:
 *   1. In prefix mode the triggering message is purged from text history
 *      IMMEDIATELY — before any hashing or network work begins — so the
 *      plaintext key's exposure window is as small as Discord allows.
 *   2. The key is digested with SHA-512 and the spoilered fingerprint
 *      (`||hash||`) is posted so the caller can verify which credential
 *      was used without the secret ever being echoed.
 *   3. The plaintext key lives only in this call frame; it is never stored,
 *      logged, or attached to any embed.
 */
import { hashApiKey } from '../../services/falai.js';
import { brandEmbed, processingEmbed } from '../../core/embeds.js';

/**
 * Runs steps 1–2 and posts the processing embed.
 * Returns `{ fingerprint, processingMessage }` — the caller edits
 * `processingMessage` with the final result (or failure embed).
 */
export async function beginSecuredFalRequest(ctx, { apiKey, taskTitle }) {
  // Step 1 — purge the plaintext-bearing message from channel history.
  if (!ctx.isSlash) {
    await ctx.message.delete().catch(() => {
      /* Missing ManageMessages or already gone — hashing still proceeds. */
    });
  }

  // Step 2 — one-way SHA-512 fingerprint.
  const fingerprint = hashApiKey(apiKey);

  const securityEmbed = brandEmbed()
    .setTitle('🔐 Key secured')
    .setDescription(
      [
        'Your message was purged and the API key was hashed with **SHA-512**.',
        `Fingerprint: ||\`${fingerprint.slice(0, 64)}…\`||`,
      ].join('\n')
    );

  await ctx.reply({ embeds: [securityEmbed] });
  const processingMessage = await ctx.followUp({
    embeds: [processingEmbed(taskTitle, 'Talking to fal.ai — this can take a minute…')],
  });
  return { fingerprint, processingMessage };
}
