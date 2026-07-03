/**
 * .github — repo/user metrics from the GitHub REST API. Repos show stars,
 * forks, open issues, and recent branch activity; users show profile stats.
 * An optional GITHUB_TOKEN in .env raises the rate limits.
 */
import axios from 'axios';
import { brandEmbed } from '../../core/embeds.js';
import { config } from '../../core/config.js';
import { truncate } from '../../utils/text.js';

const API = 'https://api.github.com';

function headers() {
  const base = { Accept: 'application/vnd.github+json', 'User-Agent': 'vrcd-bot' };
  if (config.env.githubToken) base.Authorization = `Bearer ${config.env.githubToken}`;
  return base;
}

export default {
  name: 'github',
  category: 'Utilities',
  description: 'Shows GitHub stats for a repo (owner/name) or a user.',
  usage: '.github <owner/repo | username>',
  aliases: ['gh'],
  cooldownMs: 5000,
  options: [{ name: 'target', type: 'string', description: 'owner/repo or username', required: true }],
  async execute(ctx) {
    const target = ctx.getOption('target').trim().replace(/^https?:\/\/github\.com\//i, '');
    if (!/^[\w.\-]+(\/[\w.\-]+)?$/.test(target)) {
      return ctx.replyError('Invalid target', 'Pass `owner/repo` or a plain `username`.');
    }
    await ctx.defer();

    try {
      if (target.includes('/')) {
        // ── Repository view ─────────────────────────────────────────────
        const [repoRes, branchesRes, pullsRes] = await Promise.all([
          axios.get(`${API}/repos/${target}`, { headers: headers(), timeout: 10_000 }),
          axios.get(`${API}/repos/${target}/branches`, { headers: headers(), timeout: 10_000, params: { per_page: 5 } }),
          axios.get(`${API}/repos/${target}/pulls`, { headers: headers(), timeout: 10_000, params: { state: 'open', per_page: 1 } }),
        ]);
        const repo = repoRes.data;
        const branches = branchesRes.data.map((branch) => `\`${branch.name}\``).join(' ') || '*none*';
        // Total open PRs ride in the Link header when paginated; fall back to array length.
        const openPrs = /page=(\d+)>; rel="last"/.exec(pullsRes.headers.link ?? '')?.[1] ?? pullsRes.data.length;

        const embed = brandEmbed()
          .setTitle(`📦 ${repo.full_name}`)
          .setURL(repo.html_url)
          .setDescription(truncate(repo.description ?? '*no description*', 1024))
          .addFields(
            { name: 'Stars', value: `⭐ ${repo.stargazers_count.toLocaleString()}`, inline: true },
            { name: 'Forks', value: `🍴 ${repo.forks_count.toLocaleString()}`, inline: true },
            { name: 'Open issues', value: `🐛 ${repo.open_issues_count.toLocaleString()}`, inline: true },
            { name: 'Open PRs', value: `🔀 ${openPrs}`, inline: true },
            { name: 'Language', value: repo.language ?? 'n/a', inline: true },
            { name: 'Last push', value: `<t:${Math.floor(new Date(repo.pushed_at).getTime() / 1000)}:R>`, inline: true },
            { name: 'Branches (first 5)', value: branches }
          );
        return ctx.reply({ embeds: [embed] });
      }

      // ── User view ─────────────────────────────────────────────────────
      const { data: user } = await axios.get(`${API}/users/${target}`, { headers: headers(), timeout: 10_000 });
      const embed = brandEmbed()
        .setTitle(`👤 ${user.name ?? user.login}`)
        .setURL(user.html_url)
        .setThumbnail(user.avatar_url)
        .setDescription(truncate(user.bio ?? '*no bio*', 1024))
        .addFields(
          { name: 'Public repos', value: String(user.public_repos), inline: true },
          { name: 'Followers', value: String(user.followers), inline: true },
          { name: 'Following', value: String(user.following), inline: true },
          { name: 'Joined', value: `<t:${Math.floor(new Date(user.created_at).getTime() / 1000)}:D>`, inline: true }
        );
      return ctx.reply({ embeds: [embed] });
    } catch (error) {
      if (error.response?.status === 404) return ctx.replyError('Not found', `GitHub has no \`${target}\`.`);
      if (error.response?.status === 403) return ctx.replyError('Rate limited', 'GitHub rate limit hit — set GITHUB_TOKEN in .env to raise it.');
      return ctx.replyError('GitHub lookup failed', error.message);
    }
  },
};
