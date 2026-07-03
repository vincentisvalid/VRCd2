/**
 * .backup-channel — serialises the channel's text configuration, its full
 * permission tree, and settings into an ENCRYPTED JSON backup file.
 *
 * Crypto: AES-256-GCM with a key derived from BACKUP_SECRET via scrypt and
 * a random salt; the salt + IV + auth tag are prepended to the ciphertext.
 * Restore procedure lives in the README (§ Channel backups).
 */
import { randomBytes, scryptSync, createCipheriv } from 'node:crypto';
import { AttachmentBuilder } from 'discord.js';
import { config } from '../../core/config.js';
import { brandEmbed } from '../../core/embeds.js';

function serializeChannel(channel) {
  return {
    schema: 'vrcd-channel-backup/1',
    exportedAt: new Date().toISOString(),
    guild: { id: channel.guild.id, name: channel.guild.name },
    channel: {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      topic: channel.topic ?? null,
      nsfw: channel.nsfw ?? false,
      rateLimitPerUser: channel.rateLimitPerUser ?? 0,
      parentId: channel.parentId ?? null,
      position: channel.rawPosition,
    },
    permissionOverwrites: channel.permissionOverwrites.cache.map((overwrite) => ({
      id: overwrite.id,
      type: overwrite.type, // 0 = role, 1 = member
      allow: overwrite.allow.bitfield.toString(),
      deny: overwrite.deny.bitfield.toString(),
    })),
  };
}

/** salt(16) ‖ iv(12) ‖ authTag(16) ‖ ciphertext — one self-describing blob. */
function encryptPayload(json, secret) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(secret, salt, 32);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(json, 'utf8')), cipher.final()]);
  return Buffer.concat([salt, iv, cipher.getAuthTag(), ciphertext]);
}

export default {
  name: 'backup-channel',
  category: 'Utilities',
  description: 'Exports this channel’s settings + permission tree as an encrypted backup file.',
  usage: '.backup-channel',
  aliases: ['backupchannel'],
  guildOnly: true,
  userPermissions: ['ManageChannels'],
  cooldownMs: 10000,
  options: [],
  async execute(ctx) {
    if (!config.env.backupSecret) {
      return ctx.replyError('Not configured', 'The bot host must set `BACKUP_SECRET` in .env before encrypted backups can be produced.');
    }
    if (!('permissionOverwrites' in ctx.channel)) {
      return ctx.replyError('Unsupported channel', 'This channel type cannot be serialised.');
    }

    await ctx.defer();
    let blob;
    let overwriteCount;
    try {
      const snapshot = serializeChannel(ctx.channel);
      overwriteCount = snapshot.permissionOverwrites.length;
      blob = encryptPayload(JSON.stringify(snapshot, null, 2), config.env.backupSecret);
    } catch (error) {
      return ctx.replyError('Backup failed', `Serialisation/encryption errored: ${error.message}`);
    }

    const filename = `backup-${ctx.channel.name}-${Date.now()}.vrcd.enc`;
    const attachment = new AttachmentBuilder(blob, { name: filename });
    const embed = brandEmbed()
      .setTitle('🗄️ Channel backup ready')
      .setDescription(
        [
          `Serialised **#${ctx.channel.name}** — topic, pacing, NSFW flag, position, and **${overwriteCount}** permission overwrites.`,
          'Encrypted with AES-256-GCM (scrypt-derived key). Decryption requires the host’s `BACKUP_SECRET` — see the README § Channel backups.',
        ].join('\n')
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  },
};
