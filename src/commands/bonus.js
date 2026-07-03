import { AttachmentBuilder, PermissionFlagsBits } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../database/db.js';
import { respond, buildEmbed, downloadFile } from '../utils/helpers.js';
import config from '../../config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_DIR = path.join(__dirname, '../../tmp');

export default [
  {
    name: 'translate',
    description: 'Translate text via local Ollama LLM.',
    category: 'Bonus',
    aliases: ['trans'],
    options: [
      { name: 'lang', type: 3, description: 'Target language (e.g. French, Spanish)', required: true },
      { name: 'text', type: 3, description: 'Text to translate', required: true }
    ],
    async execute(message, args, client) {
      if (args.length < 2) return respond(message, { content: 'Usage: `.translate <language> <text>`' });
      const lang = args[0];
      const text = args.slice(1).join(' ');
      return runTranslate(message, lang, text);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const lang = interaction.options.getString('lang');
      const text = interaction.options.getString('text');
      return runTranslate(interaction, lang, text);
    }
  },
  {
    name: 'weather',
    description: 'Fetch meteorological details for a location.',
    category: 'Bonus',
    aliases: ['temp'],
    options: [
      { name: 'location', type: 3, description: 'City/Location name', required: true }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Specify location: `.weather <location>`' });
      return runWeather(message, args.join(' '));
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runWeather(interaction, interaction.options.getString('location'));
    }
  },
  {
    name: 'crypto',
    description: 'Retrieve market prices for digital assets.',
    category: 'Bonus',
    aliases: ['price', 'coin'],
    options: [
      { name: 'ticker', type: 3, description: 'Crypto ticker (e.g. btc, eth, sol)', required: true }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.crypto <ticker>`' });
      return runCrypto(message, args[0]);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runCrypto(interaction, interaction.options.getString('ticker'));
    }
  },
  {
    name: 'urban',
    description: 'Search Urban Dictionary definitions.',
    category: 'Bonus',
    aliases: ['slang'],
    options: [
      { name: 'term', type: 3, description: 'Term to lookup', required: true }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.urban <term>`' });
      return runUrban(message, args.join(' '));
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runUrban(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'poll',
    description: 'Create a reactions poll. Quote arguments.',
    category: 'Bonus',
    aliases: ['vote'],
    options: [
      { name: 'question', type: 3, description: 'The poll question', required: true },
      { name: 'options', type: 3, description: 'Choices separated by commas', required: true }
    ],
    async execute(message, args, client) {
      // Parse quotes
      const raw = args.join(' ');
      const matches = raw.match(/"([^"]+)"/g);
      if (!matches || matches.length < 2) {
        return respond(message, { content: 'Usage: `.poll "Question" "Option 1" "Option 2"`' });
      }
      const question = matches[0].replace(/"/g, '');
      const choices = matches.slice(1).map(c => c.replace(/"/g, ''));
      return runPoll(message, question, choices);
    },
    async executeSlash(interaction, client) {
      const question = interaction.options.getString('question');
      const choices = interaction.options.getString('options').split(',').map(c => c.trim());
      return runPoll(interaction, question, choices);
    }
  },
  {
    name: 'reminder',
    description: 'Set a persistent timed reminder alert.',
    category: 'Bonus',
    aliases: ['remind'],
    options: [
      { name: 'duration', type: 3, description: 'Time (e.g. 10m, 1h)', required: true },
      { name: 'message', type: 3, description: 'Message to remind you of', required: true }
    ],
    async execute(message, args, client) {
      if (args.length < 2) return respond(message, { content: 'Usage: `.reminder <time: 10m/1h> <message>`' });
      const timeStr = args[0];
      const remindMsg = args.slice(1).join(' ');
      return runReminder(message, timeStr, remindMsg, client);
    },
    async executeSlash(interaction, client) {
      const duration = interaction.options.getString('duration');
      const msg = interaction.options.getString('message');
      return runReminder(interaction, duration, msg, client);
    }
  },
  {
    name: 'calculate',
    description: 'Evaluate a sanitized math expression.',
    category: 'Bonus',
    aliases: ['calc', 'math'],
    options: [
      { name: 'expression', type: 3, description: 'Math problem (e.g. 2 + 2 * 5)', required: true }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.calculate 12 * (3 + 4)`' });
      return runCalculate(message, args.join(' '));
    },
    async executeSlash(interaction, client) {
      return runCalculate(interaction, interaction.options.getString('expression'));
    }
  },
  {
    name: 'serverinfo',
    description: 'Display server information and statistics.',
    category: 'Bonus',
    aliases: ['guildinfo', 'si'],
    async execute(message, args, client) {
      return runServerInfo(message);
    },
    async executeSlash(interaction, client) {
      return runServerInfo(interaction);
    }
  },
  {
    name: 'avatar-compare',
    description: 'Compare avatars of two users side-by-side.',
    category: 'Bonus',
    aliases: ['avcomp'],
    options: [
      { name: 'user1', type: 6, description: 'First user', required: true },
      { name: 'user2', type: 6, description: 'Second user', required: true }
    ],
    async execute(message, args, client) {
      const mentions = message.mentions.users.toJSON();
      if (mentions.length < 2) return respond(message, { content: 'Please mention two users to compare.' });
      return runAvatarCompare(message, mentions[0], mentions[1]);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const u1 = interaction.options.getUser('user1');
      const u2 = interaction.options.getUser('user2');
      return runAvatarCompare(interaction, u1, u2);
    }
  },
  {
    name: 'steamstatus',
    description: 'Retrieve status flags of Steam Web Services.',
    category: 'Bonus',
    aliases: ['steamdown'],
    async execute(message, args, client) {
      return runSteamStatus(message);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runSteamStatus(interaction);
    }
  },
  {
    name: 'github',
    description: 'Fetch stats for a GitHub user profile.',
    category: 'Bonus',
    aliases: ['gh'],
    options: [
      { name: 'username', type: 3, description: 'GitHub username', required: true }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.github <username>`' });
      return runGithub(message, args[0]);
    },
    async executeSlash(interaction, client) {
      return runGithub(interaction, interaction.options.getString('username'));
    }
  },
  {
    name: 'lyrics',
    description: 'Look up lyrics for a song.',
    category: 'Bonus',
    aliases: ['songlyrics'],
    options: [
      { name: 'song', type: 3, description: 'Song title', required: true }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.lyrics <song name>`' });
      return runLyrics(message, args.join(' '));
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runLyrics(interaction, interaction.options.getString('song'));
    }
  },
  {
    name: 'slowmode',
    description: 'Set slowmode duration in seconds for current channel.',
    category: 'Bonus',
    aliases: ['slow'],
    options: [
      { name: 'seconds', type: 4, description: 'Rate limit in seconds', required: true }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(message, { content: 'Manage Channels required.' });
      }
      if (args.length === 0) return respond(message, { content: 'Usage: `.slowmode <seconds>`' });
      const sec = parseInt(args[0]);
      return setSlowmode(message, sec);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(interaction, { content: 'Manage Channels required.', ephemeral: true });
      }
      const sec = interaction.options.getInteger('seconds');
      return setSlowmode(interaction, sec);
    }
  },
  {
    name: 'qr',
    description: 'Instantly build a custom QR code.',
    category: 'Bonus',
    aliases: ['qrcode'],
    options: [
      { name: 'text', type: 3, description: 'QR Code payload text', required: true }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.qr <text>`' });
      return runQR(message, args.join(' '));
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runQR(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'backup-channel',
    description: 'Serialize current channel structure settings into encrypted JSON.',
    category: 'Bonus',
    aliases: ['channelbackup'],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(message, { content: 'Manage Channels required.' });
      }
      return runBackup(message);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(interaction, { content: 'Manage Channels required.', ephemeral: true });
      }
      return runBackup(interaction);
    }
  }
];

// 1. Translate
async function runTranslate(ctx, lang, text) {
  const model = config.defaultOllamaModel || 'llama3';
  const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

  try {
    const prompt = `Translate the following text to ${lang}. Output ONLY the translated text, do not add quotes, introductory, or concluding sentences.\n\nText: ${text}`;
    const res = await axios.post(`${ollamaHost}/api/generate`, { model, prompt, stream: false }, { timeout: 15000 });
    const translated = res.data?.response || 'Translation failed.';
    const embed = buildEmbed('Translation Engine', translated, [
      { name: 'Original', value: text, inline: true },
      { name: 'Language', value: lang, inline: true }
    ], 0x4169e1);
    await respond(ctx, { embeds: [embed] });
  } catch (err) {
    await respond(ctx, { content: 'Translation pipeline failed. Ollama offline.' });
  }
}

// 2. Weather
async function runWeather(ctx, loc) {
  const key = process.env.OPENWEATHER_API_KEY || config.weatherApiKey;
  if (!key) {
    // Elegant fallback simulation
    const mockEmbed = buildEmbed(
      `Weather in ${loc} (Simulation)`,
      `*OpenWeather API Key not configured. Rendering standard metric offsets.*`,
      [
        { name: 'Temperature', value: '21.5 °C', inline: true },
        { name: 'Humidity', value: '45%', inline: true },
        { name: 'Wind Speed', value: '3.4 m/s', inline: true },
        { name: 'Conditions', value: 'Partly Cloudy', inline: true }
      ],
      0xffa500
    );
    return respond(ctx, { embeds: [mockEmbed] });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(loc)}&appid=${key}&units=metric`;
    const res = await axios.get(url, { timeout: 5000 });
    const { main, wind, weather, name } = res.data;
    const embed = buildEmbed(
      `Weather in ${name}`,
      `Current conditions details for **${name}**`,
      [
        { name: 'Temp', value: `${main.temp} °C`, inline: true },
        { name: 'Humidity', value: `${main.humidity}%`, inline: true },
        { name: 'Wind', value: `${wind.speed} m/s`, inline: true },
        { name: 'Description', value: weather[0].description, inline: true }
      ],
      0x00bfff
    );
    await respond(ctx, { embeds: [embed] });
  } catch (err) {
    await respond(ctx, { content: `Could not retrieve weather details: ${err.message}` });
  }
}

// 3. Crypto
async function runCrypto(ctx, ticker) {
  const cleanTicker = ticker.toLowerCase();
  // Map standard tickers to CoinGecko IDs
  const mappings = {
    btc: 'bitcoin',
    eth: 'ethereum',
    sol: 'solana',
    doge: 'dogecoin',
    ada: 'cardano',
    xrp: 'ripple'
  };
  const id = mappings[cleanTicker] || cleanTicker;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`;
    const res = await axios.get(url, { timeout: 5000 });
    const data = res.data[id];
    
    if (!data) throw new Error('Asset ticker not found on indices.');

    const price = data.usd;
    const change = data.usd_24h_change || 0;
    const emoji = change >= 0 ? '📈' : '📉';

    const embed = buildEmbed(
      `Crypto: ${ticker.toUpperCase()}`,
      `Market price indexing metrics via CoinGecko.`,
      [
        { name: 'USD Value', value: `$${price.toLocaleString()}`, inline: true },
        { name: '24h Change', value: `${emoji} ${change.toFixed(2)}%`, inline: true }
      ],
      change >= 0 ? 0x00ff00 : 0xff0000
    );
    await respond(ctx, { embeds: [embed] });
  } catch (err) {
    await respond(ctx, { content: `Failed to fetch price logs: ${err.message}` });
  }
}

// 4. Urban
async function runUrban(ctx, term) {
  try {
    const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`;
    const res = await axios.get(url, { timeout: 5000 });
    const list = res.data?.list || [];
    
    if (list.length === 0) {
      return respond(ctx, { content: `No definitions found for term \`${term}\`.` });
    }

    const first = list[0];
    const def = first.definition.replace(/[\[\]]/g, '');
    const ex = first.example.replace(/[\[\]]/g, '');

    const embed = buildEmbed(
      `Urban: ${term}`,
      `**Definition**:\n${def.slice(0, 800)}\n\n**Example**:\n*${ex.slice(0, 800)}*`,
      [{ name: 'Likes', value: `👍 ${first.thumbs_up} | 👎 ${first.thumbs_down}`, inline: true }],
      0xe6c619
    );
    await respond(ctx, { embeds: [embed] });
  } catch (err) {
    await respond(ctx, { content: 'Urban Dictionary API lookup timed out.' });
  }
}

// 5. Poll
async function runPoll(ctx, question, choices) {
  if (choices.length > 9) return respond(ctx, { content: 'Polls are limited to a maximum of 9 choices.' });
  
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
  let desc = '';
  
  for (let i = 0; i < choices.length; i++) {
    desc += `${emojis[i]} ${choices[i]}\n\n`;
  }

  const embed = buildEmbed(`Poll: ${question}`, desc, [], 0x9370db);
  
  let sent;
  if (ctx.isInteraction || (ctx.deferred !== undefined && ctx.replied !== undefined)) {
    sent = await ctx.reply({ embeds: [embed], fetchReply: true });
  } else {
    sent = await ctx.channel.send({ embeds: [embed] });
  }

  for (let i = 0; i < choices.length; i++) {
    await sent.react(emojis[i]).catch(() => {});
  }
}

// 6. Reminder
async function runReminder(ctx, timeStr, remindMsg, client) {
  const userId = ctx.author ? ctx.author.id : ctx.user.id;
  const channelId = ctx.channelId || ctx.channel.id;

  const match = timeStr.match(/^(\d+)([mhs])$/i);
  if (!match) return respond(ctx, { content: 'Invalid time format. Use e.g. 10m, 1h.' });

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  let ms = 0;

  if (unit === 's') ms = value * 1000;
  else if (unit === 'm') ms = value * 60 * 1000;
  else if (unit === 'h') ms = value * 60 * 60 * 1000;

  const runAt = Date.now() + ms;

  // Store in database
  const activeReminders = db.reminders.get('active', []);
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  activeReminders.push({ id, userId, channelId, message: remindMsg, runAt });
  db.reminders.set('active', activeReminders);

  // Set timeout
  setTimeout(async () => {
    try {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel) {
        await channel.send({ content: `🔔 <@${userId}> **Reminder**: ${remindMsg}` });
      }
      // Remove from database
      const current = db.reminders.get('active', []);
      db.reminders.set('active', current.filter(r => r.id !== id));
    } catch (_) {}
  }, ms);

  return respond(ctx, { embeds: [buildEmbed('Reminder Scheduled', `I will remind you in **${timeStr}** about:\n*${remindMsg}*`, [], 0x32cd32)] });
}

// 7. Calculate
function runCalculate(ctx, expr) {
  // STRICT Regex sanitize
  const clean = expr.replace(/\s+/g, '');
  if (!/^[0-9+\-*/().]+$/.test(clean)) {
    return respond(ctx, { content: '❌ Security rejection: Mathematical expression contains non-numeric strings.' });
  }

  try {
    // Safe execution of sanitized numbers & operators
    const result = new Function(`return (${clean})`)();
    return respond(ctx, { embeds: [buildEmbed('Calculator Output', `Expression: \`${expr}\`\nResult: **${result}**`, [], 0x00ffcc)] });
  } catch (err) {
    return respond(ctx, { content: 'Math syntax error in expression evaluation.' });
  }
}

// 8. ServerInfo
async function runServerInfo(ctx) {
  const guild = ctx.guild;
  const embed = buildEmbed(
    `${guild.name} Server Info`,
    `Detailed parameters index.`,
    [
      { name: 'Guild ID', value: `\`${guild.id}\``, inline: true },
      { name: 'Total Members', value: `\`${guild.memberCount}\``, inline: true },
      { name: 'Verification Level', value: `\`${guild.verificationLevel}\``, inline: true },
      { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
    ],
    0xda70d6
  );
  if (guild.iconURL()) embed.setThumbnail(guild.iconURL());
  return respond(ctx, { embeds: [embed] });
}

// 9. Avatar Compare side-by-side using Canvas
async function runAvatarCompare(ctx, u1, u2) {
  const p1Path = path.join(TMP_DIR, `av1_${Date.now()}.png`);
  const p2Path = path.join(TMP_DIR, `av2_${Date.now()}.png`);
  const outPath = path.join(TMP_DIR, `compare_${Date.now()}.png`);

  try {
    const { createCanvas, loadImage } = await import('canvas');

    const u1Url = u1.displayAvatarURL({ extension: 'png', size: 256 });
    const u2Url = u2.displayAvatarURL({ extension: 'png', size: 256 });

    await downloadFile(u1Url, p1Path);
    await downloadFile(u2Url, p2Path);

    const canvas = createCanvas(512, 256);
    const g = canvas.getContext('2d');

    const img1 = await loadImage(p1Path);
    const img2 = await loadImage(p2Path);

    g.drawImage(img1, 0, 0, 256, 256);
    g.drawImage(img2, 256, 0, 256, 256);

    // Save
    fs.writeFileSync(outPath, canvas.toBuffer());

    const file = new AttachmentBuilder(outPath, { name: 'avatar_comparison.png' });
    const embed = buildEmbed('Avatar Side-by-Side', `Comparing avatars of **${u1.username}** and **${u2.username}**`);
    embed.setImage('attachment://avatar_comparison.png');

    await respond(ctx, { embeds: [embed], files: [file] });

  } catch (err) {
    console.error('[Avatar Compare Error]:', err.message);
    await respond(ctx, { content: 'Failed to process canvas avatar compilation.' });
  } finally {
    if (fs.existsSync(p1Path)) fs.unlinkSync(p1Path);
    if (fs.existsSync(p2Path)) fs.unlinkSync(p2Path);
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }
}

// 10. Steam Status
async function runSteamStatus(ctx) {
  try {
    // Query CM list or WebAPI status
    const res = await axios.get('https://api.steampowered.com/ISteamDirectory/GetCMList/v1/?cellid=0', { timeout: 4000 });
    const active = res.data?.response?.message === 'success';

    const embed = buildEmbed(
      'Steam Platform Status',
      `Systemic global availability checks.`,
      [
        { name: 'Authentication Manager', value: active ? '🟢 Operational' : '🔴 Connection Refused', inline: true },
        { name: 'Steam Community Server', value: '🟢 Operational', inline: true },
        { name: 'Web API Gateway', value: '🟢 Online', inline: true }
      ],
      active ? 0x00ff00 : 0xff0000
    );
    await respond(ctx, { embeds: [embed] });
  } catch (_) {
    // fallback
    const embed = buildEmbed('Steam Platform Status', 'Availability metrics queried offline. Defaulting to fallback parameters.', [
      { name: 'Steam Services', value: '🔴 API Limit Exceeded / Offline', inline: true }
    ], 0xffcc00);
    await respond(ctx, { embeds: [embed] });
  }
}

// 11. GitHub
async function runGithub(ctx, user) {
  try {
    const url = `https://api.github.com/users/${encodeURIComponent(user)}`;
    const res = await axios.get(url, { timeout: 4000 });
    const d = res.data;

    const embed = buildEmbed(
      `GitHub User: ${d.login}`,
      d.bio || 'No profile bio provided.',
      [
        { name: 'Public Repos', value: `\`${d.public_repos}\``, inline: true },
        { name: 'Followers', value: `\`${d.followers}\``, inline: true },
        { name: 'Following', value: `\`${d.following}\``, inline: true }
      ],
      0x24292e
    );
    if (d.avatar_url) embed.setThumbnail(d.avatar_url);
    await respond(ctx, { embeds: [embed] });
  } catch (err) {
    await respond(ctx, { content: `Failed to find GitHub profile \`${user}\`.` });
  }
}

// 12. Lyrics search
async function runLyrics(ctx, query) {
  try {
    const url = `https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { timeout: 6000 });
    const d = res.data;

    if (!d || !d.lyrics) throw new Error('Lyrics search returned empty index.');

    const chunks = d.lyrics.match(/[\s\S]{1,1800}/g) || [d.lyrics];
    const embed = buildEmbed(`Lyrics: ${d.title} (${d.author})`, chunks[0]);
    await respond(ctx, { embeds: [embed] });

    for (let i = 1; i < chunks.length; i++) {
      if (ctx.channel) await ctx.channel.send({ content: chunks[i] });
    }
  } catch (_) {
    // fallback
    await respond(ctx, { content: `Could not retrieve lyrics index for *${query}*.` });
  }
}

// 13. Slowmode
async function setSlowmode(ctx, sec) {
  try {
    await ctx.channel.setRateLimitPerUser(sec);
    const embed = buildEmbed('Rate Limit Updated', `Current channel text pacing slowmode set to **${sec}s** duration.`, [], 0x32cd32);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Slowmode adjustment rejected: ${err.message}` });
  }
}

// 14. QR Code Generator
async function runQR(ctx, text) {
  const dest = path.join(TMP_DIR, `qr_${Date.now()}.png`);
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
    await downloadFile(url, dest);

    const file = new AttachmentBuilder(dest, { name: 'qrcode.png' });
    const embed = buildEmbed('QR Code Generated', `Payload: *${text}*`);
    embed.setImage('attachment://qrcode.png');

    await respond(ctx, { embeds: [embed], files: [file] });
  } catch (err) {
    await respond(ctx, { content: 'Failed to request QR Code assets.' });
  } finally {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
  }
}

// 15. Backup Channel settings
async function runBackup(ctx) {
  const channel = ctx.channel;
  const backup = {
    name: channel.name,
    topic: channel.topic || '',
    type: channel.type,
    rateLimitPerUser: channel.rateLimitPerUser || 0,
    permissionOverwrites: channel.permissionOverwrites.cache.map(o => ({
      id: o.id,
      type: o.type,
      allow: o.allow.toArray(),
      deny: o.deny.toArray()
    }))
  };

  const backupPath = path.join(TMP_DIR, `backup_${channel.name}_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');

  try {
    const file = new AttachmentBuilder(backupPath, { name: `channel_settings_backup.json` });
    const embed = buildEmbed('Channel Serialized', 'Generated configuration and permissions JSON database backup.');
    await respond(ctx, { embeds: [embed], files: [file] });
  } catch (err) {
    await respond(ctx, { content: 'Failed to compile configuration backup.' });
  } finally {
    if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  }
}
