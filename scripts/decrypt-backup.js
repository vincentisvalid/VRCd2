/**
 * Decrypts a `.vrcd.enc` channel backup produced by `.backup-channel`.
 *
 * Usage:
 *   BACKUP_SECRET=yourpassphrase node scripts/decrypt-backup.js <file> [out.json]
 *
 * Blob layout: salt(16) ‖ iv(12) ‖ authTag(16) ‖ ciphertext (AES-256-GCM,
 * scrypt-derived key) — mirrors src/commands/utilities/backup-channel.js.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { scryptSync, createDecipheriv } from 'node:crypto';

const [, , inputFile, outputFile] = process.argv;
const secret = process.env.BACKUP_SECRET;

if (!inputFile || !secret) {
  console.error('Usage: BACKUP_SECRET=... node scripts/decrypt-backup.js <backup.vrcd.enc> [out.json]');
  process.exit(2);
}

try {
  const blob = readFileSync(inputFile);
  const salt = blob.subarray(0, 16);
  const iv = blob.subarray(16, 28);
  const authTag = blob.subarray(28, 44);
  const ciphertext = blob.subarray(44);

  const key = scryptSync(secret, salt, 32);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const json = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');

  if (outputFile) {
    writeFileSync(outputFile, json);
    console.log(`Decrypted → ${outputFile}`);
  } else {
    console.log(json);
  }
} catch (error) {
  console.error(`Decryption failed: ${error.message} (wrong BACKUP_SECRET or corrupted file?)`);
  process.exit(1);
}
