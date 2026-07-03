/**
 * .tz — stores a validated IANA timezone string on the user record and
 * renders the correctly calibrated local time.
 */
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';

/** Validates an IANA zone by attempting to construct a formatter with it. */
function isValidTimezone(zone) {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

function localTimeIn(zone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());
}

export default {
  name: 'tz',
  category: 'UserInfo',
  description: 'Sets your IANA timezone (e.g. America/Los_Angeles) or shows a saved one.',
  usage: '.tz [timezone | @user]',
  aliases: ['timezone'],
  cooldownMs: 3000,
  options: [
    { name: 'timezone', type: 'string', description: 'IANA zone like America/Los_Angeles (omit to view)', required: false },
    { name: 'user', type: 'user', description: 'View another member’s timezone', required: false },
  ],
  async execute(ctx) {
    const zoneInput = ctx.getOption('timezone');
    const targetUser = ctx.getOption('user');

    // ── View mode ────────────────────────────────────────────────────────
    if (!zoneInput || targetUser) {
      const subject = targetUser ?? ctx.user;
      const saved = db.collection('users').get(subject.id)?.timezone;
      if (!saved) {
        return ctx.replyError(
          'No timezone saved',
          subject.id === ctx.user.id ? 'Set one with `.tz America/Los_Angeles`.' : `${subject.username} has not set a timezone.`
        );
      }
      const embed = brandEmbed()
        .setTitle(`🕐 ${subject.username}'s local time`)
        .setDescription(`**${localTimeIn(saved)}**\nZone: \`${saved}\``);
      return ctx.reply({ embeds: [embed] });
    }

    // ── Set mode ─────────────────────────────────────────────────────────
    // A "timezone" that resolved as a mention lands in view mode above, so
    // anything reaching here is a raw zone string to validate.
    if (!isValidTimezone(zoneInput)) {
      return ctx.replyError(
        'Unknown timezone',
        `\`${zoneInput}\` is not a valid IANA zone. Use the \`Region/City\` form, e.g. \`Europe/Berlin\`, \`America/New_York\`.`
      );
    }

    db.collection('users').update(ctx.user.id, (profile) => ({ ...profile, timezone: zoneInput }));
    const embed = brandEmbed()
      .setTitle('🕐 Timezone saved')
      .setDescription(`Zone: \`${zoneInput}\`\nYour local time right now: **${localTimeIn(zoneInput)}**`);
    return ctx.reply({ embeds: [embed] });
  },
};
