/**
 * Factory for the simple profile-field setter commands (.setbio, .games,
 * .musicgenre, .career). Each stores one editable text block on the user's
 * database profile with uniform validation and confirmation UX.
 */
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

export function makeProfileFieldCommand({ name, aliases = [], field, label, emoji, description, maxLength = 300 }) {
  return {
    name,
    category: 'UserInfo',
    description,
    usage: `.${name} <text>`,
    aliases,
    cooldownMs: 3000,
    options: [
      { name: 'text', type: 'string', description: `${label} text (or "clear" to remove)`, required: true, rest: true },
    ],
    async execute(ctx) {
      const text = ctx.getOption('text').trim();

      if (text.toLowerCase() === 'clear') {
        db.collection('users').update(ctx.user.id, (profile) => {
          delete profile[field];
          return profile;
        });
        return ctx.replySuccess(`${label} cleared`, 'The field was removed from your profile.');
      }

      if (text.length > maxLength) {
        return ctx.replyError('Too long', `${label} entries are capped at ${maxLength} characters (you sent ${text.length}).`);
      }

      db.collection('users').update(ctx.user.id, (profile) => ({ ...profile, [field]: text }));

      const embed = brandEmbed()
        .setTitle(`${emoji} ${label} updated`)
        .setDescription(truncate(text, 2048))
        .setThumbnail(ctx.user.displayAvatarURL({ size: 128 }));
      return ctx.reply({ embeds: [embed] });
    },
  };
}
