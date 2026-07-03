/**
 * .fm — now-playing / last-scrobble card.
 *
 * Queries the target's linked Last.fm session for the currently spinning
 * track and lifetime scrobble count, rendered as an album-art rich embed.
 */
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';
import { getRecentTrack, getUserInfo } from '../../services/lastfm.js';
import { escapeMarkdown } from '../../utils/text.js';

export default {
  name: 'fm',
  category: 'Music',
  description: 'Shows what a user is currently playing (Last.fm), with scrobbles and artist info.',
  usage: '.fm [@user]',
  aliases: ['nowplaying', 'np'],
  cooldownMs: 4000,
  options: [{ name: 'user', type: 'user', description: 'Whose music to show (defaults to you)', required: false }],
  async execute(ctx) {
    const target = ctx.getOption('user') ?? ctx.user;
    const music = db.collection('users').get(target.id)?.music;

    if (!music?.lastfm) {
      return ctx.replyError(
        'No linked account',
        target.id === ctx.user.id
          ? 'Link one first: `.fmsetup lastfm <username>`'
          : `${target.username} has not linked a Last.fm account.`
      );
    }

    await ctx.defer();

    let track;
    let info;
    try {
      [track, info] = await Promise.all([getRecentTrack(music.lastfm), getUserInfo(music.lastfm)]);
    } catch (error) {
      return ctx.replyError('Last.fm lookup failed', error.message);
    }
    if (!track) return ctx.replyError('Nothing to show', `**${music.lastfm}** has no scrobbles yet.`);

    const embed = brandEmbed()
      .setAuthor({
        name: `${track.nowPlaying ? 'Now spinning' : 'Last scrobbled'} — ${music.lastfm}`,
        iconURL: target.displayAvatarURL({ size: 64 }),
        url: info?.url ?? undefined,
      })
      .setTitle(`${track.loved ? '❤️ ' : ''}${escapeMarkdown(track.name)}`)
      .setURL(track.url ?? null)
      .setDescription(
        [`**Artist:** ${escapeMarkdown(track.artist)}`, track.album ? `**Album:** ${escapeMarkdown(track.album)}` : null]
          .filter(Boolean)
          .join('\n')
      );

    if (track.image) embed.setThumbnail(track.image);
    if (info) {
      embed.addFields({ name: 'Scrobbles', value: info.scrobbles.toLocaleString(), inline: true });
      if (info.country) embed.addFields({ name: 'Country', value: info.country, inline: true });
    }
    if (music.appleMusic) embed.addFields({ name: 'Apple Music', value: music.appleMusic, inline: true });

    return ctx.reply({ embeds: [embed] });
  },
};
