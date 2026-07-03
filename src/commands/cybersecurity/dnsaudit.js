/**
 * .dnsaudit — internet-infrastructure defense: DNS + email-authentication
 * posture audit for a domain.
 *
 * Blue-team purpose: surfaces the records that matter for a domain's
 * security posture — A/AAAA/MX/NS and, crucially, the email-authentication
 * triad (SPF, DMARC, and a DKIM selector probe). Missing SPF/DMARC is the
 * single most common cause of spoofable domains. Read-only: standard
 * resolver queries only, no scanning or probing of hosts.
 */
import { Resolver } from 'node:dns/promises';
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

const DOMAIN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;
const COMMON_DKIM_SELECTORS = ['default', 'google', 'selector1', 'selector2', 'k1', 'dkim', 'mail'];

/** Runs a resolver call, returning `fallback` on any NXDOMAIN / no-record condition. */
async function safeResolve(fn, fallback = []) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function flattenTxt(records) {
  return records.map((chunks) => chunks.join(''));
}

export default {
  name: 'dnsaudit',
  category: 'Cybersecurity',
  description: 'Audits a domain’s DNS posture — records, SPF, DMARC, and DKIM selector presence.',
  usage: '.dnsaudit <domain>',
  aliases: ['dnscheck'],
  cooldownMs: 5000,
  options: [{ name: 'domain', type: 'string', description: 'Domain to audit (e.g. example.com)', required: true }],
  async execute(ctx) {
    const domain = ctx.getOption('domain').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!DOMAIN.test(domain)) {
      return ctx.replyError('Invalid domain', `\`${domain}\` is not a valid domain name (e.g. \`example.com\`).`);
    }

    await ctx.defer();
    const resolver = new Resolver();
    resolver.setServers(['1.1.1.1', '8.8.8.8']); // consistent, trustworthy resolvers regardless of host config

    const [a, aaaa, mx, ns, txt, dmarcTxt] = await Promise.all([
      safeResolve(() => resolver.resolve4(domain)),
      safeResolve(() => resolver.resolve6(domain)),
      safeResolve(() => resolver.resolveMx(domain)),
      safeResolve(() => resolver.resolveNs(domain)),
      safeResolve(() => resolver.resolveTxt(domain)),
      safeResolve(() => resolver.resolveTxt(`_dmarc.${domain}`)),
    ]);

    if (!a.length && !aaaa.length && !ns.length) {
      return ctx.replyError('No records found', `\`${domain}\` does not appear to resolve — check the spelling.`);
    }

    const txtFlat = flattenTxt(txt);
    const spf = txtFlat.find((record) => record.toLowerCase().startsWith('v=spf1'));
    const dmarc = flattenTxt(dmarcTxt).find((record) => record.toLowerCase().startsWith('v=dmarc1'));

    // Cheap DKIM presence probe across common selectors — not exhaustive,
    // but catches the overwhelming majority of real-world configurations.
    const dkimResults = await Promise.all(
      COMMON_DKIM_SELECTORS.map(async (selector) => {
        const records = await safeResolve(() => resolver.resolveTxt(`${selector}._domainkey.${domain}`));
        return records.length ? selector : null;
      })
    );
    const dkimSelectors = dkimResults.filter(Boolean);

    const spfIssues = [];
    if (spf) {
      if (!/[-~]all\b/.test(spf)) spfIssues.push('no enforcing `all` mechanism (missing `-all`/`~all`) — SPF is effectively advisory');
      if ((spf.match(/\binclude:/g) ?? []).length + (spf.match(/\bredirect=/g) ?? []).length > 10) {
        spfIssues.push('many lookup mechanisms — check the 10-lookup DNS limit is not exceeded');
      }
    }
    const dmarcPolicy = /p=(\w+)/i.exec(dmarc ?? '')?.[1]?.toLowerCase();

    const posture = spf && dmarc && dmarcPolicy && dmarcPolicy !== 'none' ? '🟢 Solid' : spf || dmarc ? '🟡 Partial' : '🔴 Weak';

    const embed = brandEmbed()
      .setTitle(`🛡️ DNS Audit — ${domain}`)
      .setDescription(`Email-spoofing posture: **${posture}**`)
      .addFields(
        { name: 'A', value: a.length ? a.join('\n') : '*none*', inline: true },
        { name: 'AAAA', value: aaaa.length ? aaaa.join('\n') : '*none*', inline: true },
        { name: 'Nameservers', value: ns.length ? truncate(ns.join('\n'), 300) : '*none*', inline: true },
        { name: 'MX', value: mx.length ? mx.sort((x, y) => x.priority - y.priority).map((r) => `${r.priority} ${r.exchange}`).join('\n') : '*none — cannot receive mail*' },
        { name: 'SPF', value: spf ? truncate(spf, 400) + (spfIssues.length ? `\n⚠️ ${spfIssues.join('; ')}` : '') : '❌ *not configured — domain is spoofable via mail-from*' },
        { name: 'DMARC', value: dmarc ? `${truncate(dmarc, 300)}${dmarcPolicy === 'none' ? '\n⚠️ policy is `none` (monitor-only, no enforcement)' : ''}` : '❌ *not configured — spoofed mail will not be rejected/quarantined*' },
        { name: 'DKIM selectors found', value: dkimSelectors.length ? dkimSelectors.join(', ') : '*none of the common selectors responded (may use a custom selector)*' }
      );
    return ctx.reply({ embeds: [embed] });
  },
};
