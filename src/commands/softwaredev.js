import axios from 'axios';
import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'gitlookup',
    description: 'Lookup public information on a GitHub profile.',
    category: 'Software Dev',
    options: [{ name: 'username', type: 3, description: 'GitHub Username', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.gitlookup <username>`' });
      return runGitLookup(message, args[0]);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runGitLookup(interaction, interaction.options.getString('username'));
    }
  },
  {
    name: 'jsonformat',
    description: 'Pretty print and validate raw JSON text strings.',
    category: 'Software Dev',
    options: [{ name: 'json', type: 3, description: 'Raw JSON string', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.jsonformat <raw-json>`' });
      return runJsonFormat(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return runJsonFormat(interaction, interaction.options.getString('json'));
    }
  },
  {
    name: 'regexcheck',
    description: 'Test regular expressions (regex) patterns against input strings.',
    category: 'Software Dev',
    options: [
      { name: 'pattern', type: 3, description: 'Regex pattern', required: true },
      { name: 'text', type: 3, description: 'Text to match against', required: true }
    ],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Usage: `.regexcheck <pattern> <text>`' });
      return runRegexCheck(message, args[0], args.slice(1).join(' '));
    },
    async executeSlash(interaction) {
      return runRegexCheck(interaction, interaction.options.getString('pattern'), interaction.options.getString('text'));
    }
  },
  {
    name: 'requestcheck',
    description: 'Make a fast HTTP HEAD request to audit target latency and headers.',
    category: 'Software Dev',
    options: [{ name: 'url', type: 3, description: 'Target URL', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.requestcheck <url>`' });
      return runRequestCheck(message, args[0]);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runRequestCheck(interaction, interaction.options.getString('url'));
    }
  }
];

async function runGitLookup(ctx, username) {
  try {
    const res = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { 'User-Agent': 'VRCd2-Bot' },
      timeout: 5000
    });
    const data = res.data;

    const fields = [
      { name: 'Public Repos', value: `${data.public_repos}`, inline: true },
      { name: 'Followers', value: `${data.followers}`, inline: true },
      { name: 'Bio', value: data.bio || 'No bio configured.' }
    ];

    const embed = buildEmbed(`GitHub: ${data.login}`, `Profile Summary`, fields, 0x24292e);
    if (data.avatar_url) embed.setThumbnail(data.avatar_url);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `GitHub lookup failed: ${err.message}` });
  }
}

function runJsonFormat(ctx, rawJson) {
  try {
    const obj = JSON.parse(rawJson);
    const formatted = JSON.stringify(obj, null, 2);
    return respond(ctx, { content: `✅ **JSON Valid!**\n\`\`\`json\n${formatted.slice(0, 1900)}\n\`\`\`` });
  } catch (err) {
    return respond(ctx, { content: `❌ **JSON Invalid:** \`${err.message}\`` });
  }
}

function runRegexCheck(ctx, pattern, text) {
  try {
    const regex = new RegExp(pattern);
    const matches = regex.test(text);
    return respond(ctx, { content: matches ? `✅ **Match found!** Pattern \`${pattern}\` matched target text.` : `❌ **No match found** for pattern \`${pattern}\`.` });
  } catch (err) {
    return respond(ctx, { content: `❌ **Invalid regex pattern:** \`${err.message}\`` });
  }
}

async function runRequestCheck(ctx, url) {
  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
  const startTime = Date.now();
  try {
    const res = await axios.head(formattedUrl, { timeout: 5000 });
    const latency = Date.now() - startTime;
    const fields = [
      { name: 'Status Code', value: `${res.status} ${res.statusText}`, inline: true },
      { name: 'Latency', value: `${latency}ms`, inline: true },
      { name: 'Server Header', value: res.headers['server'] || 'Unknown' }
    ];
    return respond(ctx, { embeds: [buildEmbed(`HTTP Diagnostic Check: ${url}`, `Successful request execution.`, fields, 0x32cd32)] });
  } catch (err) {
    return respond(ctx, { content: `❌ **Request failed:** \`${err.message}\`` });
  }
}
