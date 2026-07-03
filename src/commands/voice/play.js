/**
 * .play — spawns (or reuses) the guild's voice connection and pipes a
 * yt-dlp bestaudio stream into high-quality Opus playback.
 */
import { brandEmbed } from '../../core/embeds.js';
import { getGuildPlayer, probeTrackTitle } from '../../services/player.js';
import { assertFfmpegAvailable } from '../../services/media.js';
import { truncate } from '../../utils/text.js';

export default {
  name: 'play',
  category: 'Voice',
  description: 'Plays audio from a URL (YouTube and most yt-dlp-supported sites) in your voice channel.',
  usage: '.play <URL>',
  aliases: ['p'],
  guildOnly: true,
  botPermissions: ['Connect', 'Speak'],
  cooldownMs: 4000,
  options: [{ name: 'url', type: 'string', description: 'Track URL to stream', required: true }],
  async execute(ctx) {
    const url = ctx.getOption('url').trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      return ctx.replyError('Invalid URL', 'Pass a direct `http(s)` link — e.g. a YouTube watch URL.');
    }

    const voiceChannel = ctx.member?.voice?.channel;
    if (!voiceChannel) return ctx.replyError('Join a voice channel first', 'I follow you — hop into a voice channel, then `.play`.');

    // Playback transcoding rides on the host ffmpeg binary.
    await assertFfmpegAvailable();
    await ctx.defer();

    const player = getGuildPlayer(ctx.guild.id, { create: true });
    try {
      await player.connect(voiceChannel);
    } catch (error) {
      return ctx.replyError('Connection failed', error.message);
    }

    const title = await probeTrackTitle(url);
    let position;
    try {
      position = await player.enqueue({ url, title, requestedBy: ctx.user.id });
    } catch (error) {
      return ctx.replyError('Playback failed', error.message);
    }

    const embed = brandEmbed()
      .setTitle(position === 0 ? '▶️ Now playing' : `📥 Queued (#${position})`)
      .setDescription(`[${truncate(title, 200)}](${url})`)
      .addFields({ name: 'Requested by', value: `<@${ctx.user.id}>`, inline: true });
    return ctx.reply({ embeds: [embed] });
  },
};
