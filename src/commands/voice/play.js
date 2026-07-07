/**
 * .play — spawns (or reuses) the guild's voice connection and pipes a
 * yt-dlp bestaudio stream into high-quality Opus playback.
 *
 * The now-playing card carries a live control deck (pause/resume, skip,
 * stop) dispatched through the component router, so the buttons keep
 * working for the whole session — even across bot restarts.
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { brandEmbed } from '../../core/embeds.js';
import { registerComponentHandler } from '../../core/componentRouter.js';
import { getGuildPlayer, probeTrackTitle } from '../../services/player.js';
import { assertFfmpegAvailable } from '../../services/media.js';
import { flavor } from '../../utils/humanize.js';
import { truncate } from '../../utils/text.js';

function controlRow({ paused = false, disabled = false } = {}) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('player:toggle')
      .setEmoji(paused ? '▶️' : '⏸️')
      .setLabel(paused ? 'Resume' : 'Pause')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder().setCustomId('player:skip').setEmoji('⏭️').setLabel('Skip').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('player:stop').setEmoji('⏹️').setLabel('Stop').setStyle(ButtonStyle.Danger).setDisabled(disabled)
  );
}

function nowPlayingEmbed({ title, url, requestedBy, status }) {
  return brandEmbed()
    .setTitle('🎶 Now playing')
    .setDescription(`[${truncate(title, 200)}](${url})`)
    .addFields(
      { name: 'Requested by', value: `<@${requestedBy}>`, inline: true },
      { name: 'Status', value: status, inline: true }
    );
}

/** Control-deck router entry: validates voice co-presence, applies the action. */
async function handlePlayerComponent(interaction, parts) {
  const player = getGuildPlayer(interaction.guildId);
  if (!player || (!player.current && parts[0] !== 'stop')) {
    await interaction.reply({ content: 'Nothing is playing right now — queue something with `.play <url>`.', flags: MessageFlags.Ephemeral }).catch(() => {});
    return;
  }

  const memberChannelId = interaction.member?.voice?.channelId;
  const botChannelId = interaction.guild?.members?.me?.voice?.channelId;
  if (!memberChannelId || memberChannelId !== botChannelId) {
    await interaction.reply({ content: 'Hop into my voice channel first — then the controls are all yours.', flags: MessageFlags.Ephemeral }).catch(() => {});
    return;
  }

  const track = player.current;
  const base = track
    ? { title: track.title, url: track.url, requestedBy: track.requestedBy }
    : { title: 'Playback', url: 'https://discord.com', requestedBy: interaction.user.id };

  switch (parts[0]) {
    case 'toggle': {
      const paused = player.togglePause();
      await interaction
        .update({
          embeds: [nowPlayingEmbed({ ...base, status: paused ? `⏸️ Paused by <@${interaction.user.id}>` : `▶️ Resumed by <@${interaction.user.id}>` })],
          components: [controlRow({ paused })],
        })
        .catch(() => {});
      return;
    }
    case 'skip': {
      player.skip();
      await interaction
        .update({
          embeds: [nowPlayingEmbed({ ...base, status: `⏭️ Skipped by <@${interaction.user.id}> — next track starting…` })],
          components: [controlRow()],
        })
        .catch(() => {});
      return;
    }
    case 'stop': {
      player.destroy();
      await interaction
        .update({
          embeds: [nowPlayingEmbed({ ...base, status: `⏹️ Stopped by <@${interaction.user.id}> — queue cleared, disconnected.` })],
          components: [controlRow({ disabled: true })],
        })
        .catch(() => {});
    }
  }
}

registerComponentHandler('player', handlePlayerComponent);

export default {
  name: 'play',
  category: 'Voice',
  description: 'Plays audio from a URL in your voice channel, with live playback controls.',
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

    if (position > 0) {
      const embed = brandEmbed()
        .setTitle(`📥 Queued (#${position})`)
        .setDescription(`[${truncate(title, 200)}](${url})\n${flavor('done')}`)
        .addFields({ name: 'Requested by', value: `<@${ctx.user.id}>`, inline: true });
      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply({
      embeds: [nowPlayingEmbed({ title, url, requestedBy: ctx.user.id, status: '▶️ Streaming' })],
      components: [controlRow()],
    });
  },
};
