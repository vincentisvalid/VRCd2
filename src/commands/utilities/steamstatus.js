/**
 * .steamstatus — global availability of critical Steam infrastructure
 * nodes: Web API front door (unauthenticated probe with latency), plus the
 * store/community edges via lightweight HTTPS probes.
 */
import axios from 'axios';
import { brandEmbed } from '../../core/embeds.js';
import { getServerInfo } from '../../services/steam.js';

async function probe(url) {
  const start = Date.now();
  try {
    const response = await axios.get(url, { timeout: 8_000, maxRedirects: 3, validateStatus: () => true });
    const latency = Date.now() - start;
    return response.status < 500
      ? { up: true, label: `🟢 Online · ${latency}ms` }
      : { up: false, label: `🔴 HTTP ${response.status}` };
  } catch (error) {
    return { up: false, label: `🔴 Unreachable (${error.code ?? error.message})` };
  }
}

export default {
  name: 'steamstatus',
  category: 'Utilities',
  description: 'Checks the availability of Steam’s core infrastructure nodes.',
  usage: '.steamstatus',
  aliases: [],
  cooldownMs: 10000,
  options: [],
  async execute(ctx) {
    await ctx.defer();

    const [webApi, store, community] = await Promise.all([
      getServerInfo()
        .then((result) => ({ up: true, label: `🟢 Online · ${result.latencyMs}ms (server time ${result.info?.servertimestring ?? 'n/a'})` }))
        .catch((error) => ({ up: false, label: `🔴 ${error.message}` })),
      probe('https://store.steampowered.com/'),
      probe('https://steamcommunity.com/'),
    ]);

    const allUp = [webApi, store, community].every((node) => node.up);
    const embed = brandEmbed()
      .setTitle(`${allUp ? '🟢' : '🟠'} Steam platform status`)
      .addFields(
        { name: 'Web API', value: webApi.label },
        { name: 'Store', value: store.label },
        { name: 'Community', value: community.label }
      )
      .setDescription(allUp ? 'All monitored nodes are responding normally.' : 'One or more nodes are degraded — Steam may be having a moment.');
    return ctx.reply({ embeds: [embed] });
  },
};
