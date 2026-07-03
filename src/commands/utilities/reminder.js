/**
 * .reminder — persistent, crash-safe reminders. Timers are database-backed
 * and re-armed on boot by the reminders service, so restarts never eat a
 * notification.
 */
import { createReminder } from '../../services/reminders.js';
import { parseDuration, formatDuration } from '../../utils/time.js';
import { truncate } from '../../utils/text.js';

const MAX_REMINDER_MS = 365 * 24 * 60 * 60 * 1000; // one year

export default {
  name: 'reminder',
  category: 'Utilities',
  description: 'Sets a reminder that survives bot restarts (e.g. .reminder 45m stretch).',
  usage: '.reminder <time: 10m/1h/2d> <message>',
  aliases: ['remind', 'remindme'],
  cooldownMs: 3000,
  options: [
    { name: 'time', type: 'string', description: 'Delay like 10m / 1h / 2d / 1h30m', required: true },
    { name: 'message', type: 'string', description: 'What to remind you about', required: true, rest: true },
  ],
  async execute(ctx) {
    const timeText = ctx.getOption('time');
    const message = ctx.getOption('message');

    const delayMs = parseDuration(timeText);
    if (delayMs === null) {
      return ctx.replyError('Invalid time', `\`${timeText}\` is not a duration — use forms like \`10m\`, \`1h\`, \`2d\`, \`1h30m\`.`);
    }
    if (delayMs < 10_000) return ctx.replyError('Too soon', 'Reminders need at least 10 seconds of lead time.');
    if (delayMs > MAX_REMINDER_MS) return ctx.replyError('Too far out', 'Reminders cap at one year.');
    if (message.length > 1000) return ctx.replyError('Too long', 'Reminder messages cap at 1000 characters.');

    const reminder = createReminder(ctx.client, {
      userId: ctx.user.id,
      channelId: ctx.channel.id,
      guildId: ctx.guild?.id,
      message,
      fireAt: Date.now() + delayMs,
    });

    return ctx.replySuccess(
      'Reminder armed',
      `I will ping you in **${formatDuration(delayMs)}** (<t:${Math.floor(reminder.fireAt / 1000)}:f>):\n> ${truncate(message, 500)}`
    );
  },
};
