/**
 * .vrstats — aggregates the local VR profile with live Steam Web API data:
 * VR playtime across the curated title set, persona status, and hardware badge.
 */
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';
import { getPlayerSummary, getOwnedGames, aggregateVrPlaytime, PERSONA_STATES } from '../../services/steam.js';
import { HEADSET_PROFILES } from './vrsetup.js';

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  return hours >= 1 ? `${hours.toLocaleString()}h ${minutes % 60}m` : `${minutes}m`;
}

export default {
  name: 'vrstats',
  category: 'VR',
  description: 'Shows VR playtime, live Steam status, and hardware badge for a linked profile.',
  usage: '.vrstats [@user]',
  aliases: ['vrprofile'],
  cooldownMs: 5000,
  options: [{ name: 'user', type: 'user', description: 'Whose VR stats to show (defaults to you)', required: false }],
  async execute(ctx) {
    const target = ctx.getOption('user') ?? ctx.user;
    const profile = db.collection('users').get(target.id);

    if (!profile?.vr?.steam64) {
      return ctx.replyError(
        'No VR profile',
        target.id === ctx.user.id
          ? 'You have not linked a profile yet — run `.vrsetup` first.'
          : `${target.username} has not linked a VR profile yet.`
      );
    }

    await ctx.defer();
    const { steam64, headsetId, headsetLabel } = profile.vr;
    const badge = HEADSET_PROFILES.find((entry) => entry.id === headsetId)?.emoji ?? '🥽';

    let summary = null;
    let games = [];
    try {
      [summary, games] = await Promise.all([getPlayerSummary(steam64), getOwnedGames(steam64)]);
    } catch (error) {
      return ctx.replyError('Steam lookup failed', error.message);
    }

    const { vrGames, totalMinutes } = aggregateVrPlaytime(games);
    const status = summary
      ? summary.gameextrainfo
        ? `🎮 In-game: **${summary.gameextrainfo}**`
        : PERSONA_STATES[summary.personastate] ?? 'Unknown'
      : 'Profile private or unavailable';

    const embed = brandEmbed()
      .setTitle(`${badge} VR Stats — ${summary?.personaname ?? target.username}`)
      .setThumbnail(summary?.avatarfull ?? target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'Hardware badge', value: `${badge} ${headsetLabel}`, inline: true },
        { name: 'Steam status', value: status, inline: true },
        { name: 'Total VR playtime', value: formatMinutes(totalMinutes), inline: true }
      );

    if (vrGames.length) {
      embed.addFields({
        name: 'Top VR titles',
        value: vrGames
          .slice(0, 6)
          .map((game, index) => `**${index + 1}.** ${game.name} — ${formatMinutes(game.minutes)}`)
          .join('\n'),
      });
    } else {
      embed.addFields({
        name: 'Top VR titles',
        value: 'No tracked VR titles found (the Steam game list may be private).',
      });
    }
    embed.addFields({ name: 'SteamID64', value: `\`${steam64}\``, inline: true });

    return ctx.reply({ embeds: [embed] });
  },
};
