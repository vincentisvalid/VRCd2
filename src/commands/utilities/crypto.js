/**
 * .crypto — market pricing lookups via the CoinGecko public index.
 * Two-stage: /search resolves a loose ticker to a coin ID, /coins/markets
 * pulls the pricing summary.
 */
import axios from 'axios';
import { brandEmbed } from '../../core/embeds.js';

const COINGECKO = 'https://api.coingecko.com/api/v3';

export default {
  name: 'crypto',
  category: 'Utilities',
  description: 'Shows live market data for a cryptocurrency ticker.',
  usage: '.crypto <ticker>  — e.g. .crypto btc',
  aliases: ['coin'],
  cooldownMs: 5000,
  options: [{ name: 'ticker', type: 'string', description: 'Symbol or name, e.g. btc / ethereum', required: true }],
  async execute(ctx) {
    const ticker = ctx.getOption('ticker').toLowerCase();
    await ctx.defer();

    let coinId;
    let coinName;
    try {
      const search = await axios.get(`${COINGECKO}/search`, { params: { query: ticker }, timeout: 10_000 });
      const exact = search.data?.coins?.find((coin) => coin.symbol?.toLowerCase() === ticker);
      const best = exact ?? search.data?.coins?.[0];
      if (!best) return ctx.replyError('Unknown ticker', `CoinGecko has nothing matching \`${ticker}\`.`);
      coinId = best.id;
      coinName = best.name;
    } catch (error) {
      return ctx.replyError('Search failed', `CoinGecko search errored: ${error.message}`);
    }

    let market;
    try {
      const response = await axios.get(`${COINGECKO}/coins/markets`, {
        params: { vs_currency: 'usd', ids: coinId, price_change_percentage: '1h,24h,7d' },
        timeout: 10_000,
      });
      market = response.data?.[0];
      if (!market) throw new Error('empty market payload');
    } catch (error) {
      return ctx.replyError('Market lookup failed', `CoinGecko markets errored: ${error.message}`);
    }

    const pct = (value) => (value === null || value === undefined ? 'n/a' : `${value >= 0 ? '📈 +' : '📉 '}${value.toFixed(2)}%`);
    const embed = brandEmbed()
      .setTitle(`🪙 ${coinName} (${market.symbol?.toUpperCase()})`)
      .setThumbnail(market.image ?? null)
      .addFields(
        { name: 'Price', value: `$${market.current_price?.toLocaleString()}`, inline: true },
        { name: '24h', value: pct(market.price_change_percentage_24h), inline: true },
        { name: '7d', value: pct(market.price_change_percentage_7d_in_currency), inline: true },
        { name: 'Market cap', value: `$${market.market_cap?.toLocaleString()} (#${market.market_cap_rank})`, inline: true },
        { name: '24h range', value: `$${market.low_24h?.toLocaleString()} – $${market.high_24h?.toLocaleString()}`, inline: true },
        { name: 'ATH', value: `$${market.ath?.toLocaleString()}`, inline: true }
      );
    return ctx.reply({ embeds: [embed] });
  },
};
