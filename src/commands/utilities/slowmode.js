/**
 * .slowmode — adjusts the channel's text pacing limitation (0s–6h).
 */
import { parseDuration, formatDuration } from '../../utils/time.js';

const MAX_SLOWMODE_SECONDS = 21_600; // Discord's 6h ceiling

export default {
  name: 'slowmode',
  category: 'Utilities',
  description: 'Sets this channel’s slowmode (e.g. 5s, 2m, 1h — `off` to disable).',
  usage: '.slowmode <duration|off>',
  aliases: ['sm'],
  guildOnly: true,
  userPermissions: ['ManageChannels'],
  botPermissions: ['ManageChannels'],
  cooldownMs: 3000,
  options: [{ name: 'duration', type: 'string', description: 'Like 5s / 2m / 1h, or "off"', required: true }],
  async execute(ctx) {
    const input = ctx.getOption('duration').toLowerCase();

    let seconds;
    if (input === 'off' || input === '0') {
      seconds = 0;
    } else {
      const ms = parseDuration(input);
      if (ms === null) return ctx.replyError('Invalid duration', `\`${input}\` is not a duration — use forms like \`5s\`, \`2m\`, \`1h\`, or \`off\`.`);
      seconds = Math.round(ms / 1000);
      if (seconds > MAX_SLOWMODE_SECONDS) {
        return ctx.replyError('Too long', `Discord caps slowmode at ${formatDuration(MAX_SLOWMODE_SECONDS * 1000)}.`);
      }
    }

    try {
      await ctx.channel.setRateLimitPerUser(seconds, `Slowmode set by ${ctx.user.tag}`);
    } catch (error) {
      return ctx.replyError('Update failed', `Discord refused the change: ${error.message}`);
    }
    return ctx.replySuccess(
      'Slowmode updated',
      seconds === 0 ? 'Slowmode disabled — full speed ahead.' : `Members can now post once every **${formatDuration(seconds * 1000)}**.`
    );
  },
};
