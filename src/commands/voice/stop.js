/**
 * .stop — fully unbinds playback: stops the stream, flushes the tracking
 * queue, and disconnects the voice instance.
 */
import { getGuildPlayer } from '../../services/player.js';

export default {
  name: 'stop',
  category: 'Voice',
  description: 'Stops playback, clears the queue, and leaves the voice channel.',
  usage: '.stop',
  aliases: ['disconnect', 'leave'],
  guildOnly: true,
  cooldownMs: 2000,
  options: [],
  async execute(ctx) {
    const player = getGuildPlayer(ctx.guild.id);
    if (!player) return ctx.replyError('Not connected', 'I am not in a voice channel here.');

    const flushed = player.queue.length;
    player.destroy();
    return ctx.replySuccess('Stopped', `Playback ended, ${flushed} queued track(s) flushed, voice connection released.`);
  },
};
