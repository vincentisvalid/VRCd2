/**
 * Reminder scheduler — crash-safe notification preservation.
 *
 * Reminders persist in the `reminders` collection and are re-armed on every
 * boot, so a process restart never loses a pending notification. Delays
 * longer than the 32-bit setTimeout ceiling are chunked into re-arming hops.
 */
import { randomUUID } from 'node:crypto';
import { db } from '../database/index.js';
import { brandEmbed } from '../core/embeds.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('reminders');
const MAX_TIMEOUT_MS = 2_147_483_647;

/** reminderId → active timer */
const timers = new Map();

async function fire(client, reminder) {
  timers.delete(reminder.id);
  db.collection('reminders').delete(reminder.id);

  const embed = brandEmbed()
    .setTitle('⏰ Reminder')
    .setDescription(reminder.message)
    .addFields({ name: 'Set', value: `<t:${Math.floor(reminder.createdAt / 1000)}:R>` });

  try {
    const channel = await client.channels.fetch(reminder.channelId);
    await channel.send({ content: `<@${reminder.userId}>`, embeds: [embed] });
    return;
  } catch {
    /* channel gone or unwritable — fall back to DM */
  }
  try {
    const user = await client.users.fetch(reminder.userId);
    await user.send({ embeds: [embed] });
  } catch (error) {
    log.warn(`Could not deliver reminder ${reminder.id}:`, error.message);
  }
}

function arm(client, reminder) {
  const delay = reminder.fireAt - Date.now();
  if (delay <= 0) {
    fire(client, reminder).catch((error) => log.error('Reminder fire failed:', error.message));
    return;
  }
  const hop = Math.min(delay, MAX_TIMEOUT_MS);
  const timer = setTimeout(() => {
    if (reminder.fireAt - Date.now() > 250) arm(client, reminder); // long-delay chunk hop
    else fire(client, reminder).catch((error) => log.error('Reminder fire failed:', error.message));
  }, hop);
  timer.unref?.();
  timers.set(reminder.id, timer);
}

/** Creates, persists, and arms a new reminder. Returns the stored document. */
export function createReminder(client, { userId, channelId, guildId, message, fireAt }) {
  const reminder = {
    id: randomUUID(),
    userId,
    channelId,
    guildId: guildId ?? null,
    message,
    fireAt,
    createdAt: Date.now(),
  };
  db.collection('reminders').set(reminder.id, reminder);
  arm(client, reminder);
  return reminder;
}

/** Re-arms every persisted reminder — called once from the ready event. */
export function restoreReminders(client) {
  let restored = 0;
  for (const [, reminder] of db.collection('reminders').all()) {
    arm(client, reminder);
    restored += 1;
  }
  if (restored) log.info(`Restored ${restored} persisted reminder(s).`);
}
