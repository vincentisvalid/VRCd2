/**
 * .lyrics — full lyric records via the lyrics.ovh public API, delivered as
 * multi-page embed scroll blocks with button navigation.
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import axios from 'axios';
import { brandEmbed } from '../../core/embeds.js';
import { chunkString, truncate } from '../../utils/text.js';

const PAGE_SIZE = 3500;

export default {
  name: 'lyrics',
  category: 'Utilities',
  description: 'Fetches song lyrics ("Artist - Title" works best).',
  usage: '.lyrics <artist - title>  — e.g. .lyrics Daft Punk - Around the World',
  aliases: [],
  cooldownMs: 6000,
  options: [{ name: 'song', type: 'string', description: 'Artist - Title (dash-separated)', required: true, rest: true }],
  async execute(ctx) {
    const query = ctx.getOption('song');
    const dashIndex = query.indexOf('-');
    if (dashIndex === -1) {
      return ctx.replyError('Need artist and title', 'Use the dash form: `.lyrics Daft Punk - Around the World`');
    }
    const artist = query.slice(0, dashIndex).trim();
    const title = query.slice(dashIndex + 1).trim();
    if (!artist || !title) return ctx.replyError('Need artist and title', 'Both sides of the dash must be filled in.');

    await ctx.defer();
    let lyrics;
    try {
      const response = await axios.get(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { timeout: 20_000, validateStatus: (status) => status < 500 }
      );
      if (response.status === 404 || !response.data?.lyrics) {
        return ctx.replyError('Not found', `No lyric record for **${title}** by **${artist}**.`);
      }
      lyrics = response.data.lyrics.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
    } catch (error) {
      return ctx.replyError('Lookup failed', `lyrics.ovh errored: ${error.message}`);
    }

    const pages = chunkString(lyrics, PAGE_SIZE);
    const renderPage = (index) =>
      brandEmbed()
        .setTitle(`🎤 ${truncate(`${artist} — ${title}`, 250)}`)
        .setDescription(pages[index])
        .addFields({ name: 'Page', value: `${index + 1} / ${pages.length}`, inline: true });

    if (pages.length === 1) return ctx.reply({ embeds: [renderPage(0)] });

    // ── Button-driven scroll block ───────────────────────────────────────
    let page = 0;
    const controls = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('lyrics:prev').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId('lyrics:next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page === pages.length - 1)
      );

    const scrollMessage = await ctx.reply({ embeds: [renderPage(0)], components: [controls()] });
    const collector = scrollMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300_000,
    });

    collector.on('collect', async (press) => {
      if (press.user.id !== ctx.user.id) {
        await press.reply({ content: 'Only the requester can scroll this record.', ephemeral: true }).catch(() => {});
        return;
      }
      page += press.customId === 'lyrics:next' ? 1 : -1;
      page = Math.max(0, Math.min(pages.length - 1, page));
      await press.update({ embeds: [renderPage(page)], components: [controls()] }).catch(() => {});
    });
    collector.on('end', () => {
      scrollMessage.edit({ components: [] }).catch(() => {});
    });
  },
};
