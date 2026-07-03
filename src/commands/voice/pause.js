/**
 * .pause — halts (or resumes) the audio stream without resetting progress.
 */
import { getGuildPlayer } from '../../services/player.js';

export default {
  name: 'pause',
  category: 'Voice',
  description: 'Pauses the current track (run again to resume).',
  usage: '.pause',
  aliases: ['resume'],
  guildOnly: true,
  cooldownMs: 2000,
  options: [],
  async execute(ctx) {
    const player = getGuildPlayer(ctx.guild.id);
    if (!player?.current) return ctx.replyError('Nothing playing', 'There is no active track to pause.');

    const nowPaused = player.togglePause();
    return ctx.replySuccess(
      nowPaused ? 'Paused' : 'Resumed',
      nowPaused ? 'Track frozen in place — `.pause` again to resume.' : 'Back to the music. 🎶'
    );
  },
};
