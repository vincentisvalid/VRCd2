/**
 * .geolocate — IP address geolocation lookup.
 *
 * Resolves an IPv4 address to its approximate geographic + network metadata
 * (country/region/city, coordinates, ISP, organisation, and ASN) via the
 * free ip-api.com endpoint — no API key required.
 *
 * Scope: this is a coarse, ISP-level lookup intended for network diagnostics
 * and abuse triage. It deliberately rejects private/reserved ranges (which
 * carry no public geolocation) rather than leaking internal addressing.
 */
import axios from 'axios';
import { brandEmbed } from '../../core/embeds.js';

/** Strict dotted-quad IPv4 matcher (each octet 0–255). */
const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

/**
 * Detects private / reserved / non-routable IPv4 ranges. These have no
 * meaningful public geolocation, so we short-circuit them with a clear
 * message instead of a pointless remote lookup.
 */
function classifyReserved(ip) {
  const [a, b] = ip.split('.').map(Number);
  if (a === 10) return 'private (10.0.0.0/8)';
  if (a === 172 && b >= 16 && b <= 31) return 'private (172.16.0.0/12)';
  if (a === 192 && b === 168) return 'private (192.168.0.0/16)';
  if (a === 127) return 'loopback (127.0.0.0/8)';
  if (a === 169 && b === 254) return 'link-local (169.254.0.0/16)';
  if (a === 100 && b >= 64 && b <= 127) return 'carrier-grade NAT (100.64.0.0/10)';
  if (a === 0 || a >= 224) return 'reserved / multicast';
  return null;
}

export default {
  name: 'geolocate',
  category: 'Cybersecurity',
  description: 'Geolocates a public IPv4 address (country, network, ISP, ASN).',
  usage: '.geolocate <ipv4addr>',
  aliases: ['geoip', 'iplookup'],
  cooldownMs: 5000,
  options: [{ name: 'ip', type: 'string', description: 'The IPv4 address to look up', required: true }],
  async execute(ctx) {
    const ip = ctx.getOption('ip').trim();

    // ── Input validation ─────────────────────────────────────────────────
    if (!IPV4.test(ip)) {
      return ctx.replyError('Invalid IPv4 address', `\`${ip}\` is not a valid dotted-quad IPv4 address (e.g. \`8.8.8.8\`).`);
    }
    const reserved = classifyReserved(ip);
    if (reserved) {
      return ctx.replyError('Non-public address', `\`${ip}\` is a **${reserved}** address — it has no public geolocation.`);
    }

    await ctx.defer();

    // ── Remote lookup ────────────────────────────────────────────────────
    let data;
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}`, {
        params: {
          // Bitmask selecting the fields we render (see ip-api docs).
          fields: 'status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query,proxy,hosting,mobile',
        },
        timeout: 10_000,
        validateStatus: (statusCode) => statusCode < 500,
      });
      data = response.data;
    } catch (error) {
      return ctx.replyError('Lookup failed', `Could not reach the geolocation service: ${error.message}`);
    }

    if (data?.status !== 'success') {
      return ctx.replyError('Lookup failed', `The geolocation service reported: ${data?.message ?? 'unknown error'}.`);
    }

    // ── Render ───────────────────────────────────────────────────────────
    const location = [data.city, data.regionName, data.country].filter(Boolean).join(', ') || 'Unknown';
    const flags = [
      data.proxy ? '🕵️ Proxy/VPN' : null,
      data.hosting ? '🏢 Hosting/Datacenter' : null,
      data.mobile ? '📱 Mobile network' : null,
    ].filter(Boolean);

    const embed = brandEmbed()
      .setTitle(`🌐 Geolocation — ${data.query}`)
      .addFields(
        { name: 'Location', value: `${data.countryCode ? `:flag_${data.countryCode.toLowerCase()}: ` : ''}${location}`, inline: false },
        { name: 'Coordinates', value: data.lat !== undefined ? `\`${data.lat}, ${data.lon}\`` : 'n/a', inline: true },
        { name: 'Timezone', value: data.timezone ?? 'n/a', inline: true },
        { name: 'Postal', value: data.zip || 'n/a', inline: true },
        { name: 'ISP', value: data.isp || 'n/a', inline: true },
        { name: 'Organisation', value: data.org || 'n/a', inline: true },
        { name: 'ASN', value: data.as || 'n/a', inline: true }
      );

    if (flags.length) embed.addFields({ name: 'Network flags', value: flags.join(' · ') });
    if (data.lat !== undefined && data.lon !== undefined) {
      embed.setDescription(`[View on OpenStreetMap](https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lon}#map=10/${data.lat}/${data.lon})`);
    }

    return ctx.reply({ embeds: [embed] });
  },
};
