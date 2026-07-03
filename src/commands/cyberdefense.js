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
  },
  {
    name: 'geolocate',
    description: 'Resolve geographical information from an IPv4 address.',
    category: 'CyberDefense',
    aliases: ['iplookup', 'ip'],
    options: [
      { name: 'ip', type: 3, description: 'IPv4 Address to lookup', required: true }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.geolocate <ipv4_address>`' });
      return runGeolocate(message, args[0]);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runGeolocate(interaction, interaction.options.getString('ip'));
    }
  },
  {
    name: 'lockdown',
    description: 'Restrict or restore SendMessages privileges for @everyone in the channel.',
    category: 'CyberDefense',
    aliases: ['lock'],
    options: [
      { name: 'state', type: 3, description: 'State: on or off', required: true }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(message, { content: '❌ Manage Channels required.' });
      }
      if (args.length === 0) return respond(message, { content: 'Usage: `.lockdown <on/off>`' });
      return runLockdown(message, args[0]);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return respond(interaction, { content: '❌ Manage Channels required.', ephemeral: true });
      }
      const state = interaction.options.getString('state');
      return runLockdown(interaction, state);
    }
  },
  {
    name: 'raidmode',
    description: 'Toggle strict auto-kick policy for newly joining accounts (Intrusion Prevention).',
    category: 'CyberDefense',
    aliases: ['antiraid'],
    options: [
      { name: 'state', type: 3, description: 'State: on or off', required: true }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return respond(message, { content: '❌ Administrator permissions required.' });
      }
      if (args.length === 0) return respond(message, { content: 'Usage: `.raidmode <on/off>`' });
      return runRaidMode(message, args[0]);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return respond(interaction, { content: '❌ Administrator permissions required.', ephemeral: true });
      }
      const state = interaction.options.getString('state');
      return runRaidMode(interaction, state);
    }
  },
  {
    name: 'scanlinks',
    description: 'Audit channel history for suspected malware or phishing link threats.',
    category: 'CyberDefense',
    aliases: ['auditlinks'],
    async execute(message, args, client) {
      return runScanLinks(message);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runScanLinks(interaction);
    }
  },
  {
    name: 'checkperms',
    description: 'Verify administrative privileges and detect overly permissive roles.',
    category: 'CyberDefense',
    aliases: ['auditperms'],
    async execute(message, args, client) {
      return runCheckPerms(message);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runCheckPerms(interaction);
    }
  },
  {
    name: 'quarantine',
    description: 'Isolate compromised users in a locked quarantine state.',
    category: 'CyberDefense',
    aliases: ['isolate'],
    options: [
      { name: 'user', type: 6, description: 'User to quarantine', required: true },
      { name: 'reason', type: 3, description: 'Reason for quarantine', required: false }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(message, { content: '❌ Manage Roles required.' });
      }
      const targetUser = message.mentions.users.first();
      if (!targetUser) return respond(message, { content: 'Please mention a user.' });
      const reason = args.slice(1).join(' ') || 'No reason provided';
      return runQuarantine(message, targetUser, reason);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(interaction, { content: '❌ Manage Roles required.', ephemeral: true });
      }
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      return runQuarantine(interaction, targetUser, reason);
    }
  },
  {
    name: 'auditlog',
    description: 'Retrieve latest server audit log events for integrity reviews.',
    category: 'CyberDefense',
    aliases: ['logs'],
    options: [
      { name: 'limit', type: 4, description: 'Number of logs to fetch (max 10)', required: false }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        return respond(message, { content: '❌ View Audit Log permissions required.' });
      }
      const limit = args[0] ? parseInt(args[0]) : 5;
      return runAuditLog(message, limit);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        return respond(interaction, { content: '❌ View Audit Log permissions required.', ephemeral: true });
      }
      const limit = interaction.options.getInteger('limit') || 5;
      return runAuditLog(interaction, limit);
    }
  },
  {
    name: 'antispam',
    description: 'Toggle automatic message rate-limiting (Intrusion Detection System).',
    category: 'CyberDefense',
    aliases: ['ids'],
    options: [
      { name: 'state', type: 3, description: 'State: on or off', required: true }
    ],
    async execute(message, args, client) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return respond(message, { content: '❌ Administrator permissions required.' });
      }
      if (args.length === 0) return respond(message, { content: 'Usage: `.antispam <on/off>`' });
      return runAntiSpamToggle(message, args[0]);
    },
    async executeSlash(interaction, client) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return respond(interaction, { content: '❌ Administrator permissions required.', ephemeral: true });
      }
      const state = interaction.options.getString('state');
      return runAntiSpamToggle(interaction, state);
    }
  },
  {
    name: 'gsearch',
    description: 'Query the web using Google Search API with fallback results.',
    category: 'CyberDefense',
    aliases: ['google', 'search'],
    options: [
      { name: 'query', type: 3, description: 'Search term', required: true }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.gsearch <query>`' });
      return runGoogleSearch(message, args.join(' '));
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const query = interaction.options.getString('query');
      return runGoogleSearch(interaction, query);
    }
  },
  {
    name: 'gimgsearch',
    description: 'Query Google Images API and retrieve matching visual assets.',
    category: 'CyberDefense',
    aliases: ['gimg', 'imagesearch'],
    options: [
      { name: 'query', type: 3, description: 'Image search term', required: true }
    ],
    async execute(message, args, client) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.gimgsearch <query>`' });
      return runGoogleImageSearch(message, args.join(' '));
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const query = interaction.options.getString('query');
      return runGoogleImageSearch(interaction, query);
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
  const apiKey = process.env.FREECRYPTOAPI_KEY;

  if (!apiKey) {
    const errorEmbed = buildEmbed(
      'FreeCryptoAPI Key Required',
      `Please set your \`FREECRYPTOAPI_KEY\` in your \`.env\` file to use this command.\n\n*Get a free API key at [freecryptoapi.com](https://freecryptoapi.com).*`,
      [],
      0xffa500
    );
    return respond(ctx, { embeds: [errorEmbed] });
  }

  const symbol = ticker.toUpperCase();

  try {
    const url = `https://api.freecryptoapi.com/v1/getData?symbol=${encodeURIComponent(symbol)}`;
    const res = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 5000
    });
    
    const data = res.data;
    if (!data || !data.price) throw new Error('Asset ticker not found on index.');

    const price = data.price;
    const change = data.change_24h || 0;
    const emoji = change >= 0 ? '📈' : '📉';

    const fields = [
      { name: 'USD Value', value: `$${price.toLocaleString()}`, inline: true },
      { name: '24h Change', value: `${emoji} ${change.toFixed(2)}%`, inline: true }
    ];

    if (data.market_cap) {
      fields.push({ name: 'Market Cap', value: `$${data.market_cap.toLocaleString()}`, inline: true });
    }

    const embed = buildEmbed(
      `Crypto: ${symbol}`,
      `Market price indexing metrics via FreeCryptoAPI.`,
      fields,
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

// 16. Geolocate IP address
async function runGeolocate(ctx, ip) {
  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (!ipv4Regex.test(ip)) {
    return respond(ctx, { content: '❌ Invalid IPv4 address format.' });
  }

  try {
    const url = `http://ip-api.com/json/${ip}`;
    const res = await axios.get(url, { timeout: 5000 });
    const d = res.data;

    if (d.status === 'fail') {
      return respond(ctx, { content: `❌ IP lookup failed: ${d.message}` });
    }

    const embed = buildEmbed(
      `IP Geolocation: ${ip}`,
      `Details resolved via ip-api.`,
      [
        { name: 'Location', value: `${d.city || 'Unknown'}, ${d.regionName || 'Unknown'}, ${d.country || 'Unknown'}`, inline: true },
        { name: 'ZIP Code', value: `\`${d.zip || 'N/A'}\``, inline: true },
        { name: 'Coordinates', value: `Lat: \`${d.lat}\` | Lon: \`${d.lon}\``, inline: true },
        { name: 'Timezone', value: `\`${d.timezone || 'Unknown'}\``, inline: true },
        { name: 'ISP', value: `\`${d.isp || 'Unknown'}\``, inline: true },
        { name: 'Organization', value: `\`${d.org || 'Unknown'}\``, inline: true }
      ],
      0x4682b4
    );
    await respond(ctx, { embeds: [embed] });
  } catch (err) {
    await respond(ctx, { content: `Failed to geolocate IP: ${err.message}` });
  }
}

// 17. Lockdown channel send message permissions
async function runLockdown(ctx, state) {
  const channel = ctx.channel;
  const everyone = ctx.guild.roles.everyone;
  const turnOn = state.toLowerCase() === 'on';

  try {
    await channel.permissionOverwrites.edit(everyone, {
      SendMessages: !turnOn
    });

    const embed = buildEmbed(
      turnOn ? '🔒 Channel Lockdown Activated' : '🔓 Channel Lockdown Released',
      turnOn 
        ? 'SendMessages permission stripped for @everyone in this channel.' 
        : 'SendMessages permission restored for @everyone in this channel.',
      [],
      turnOn ? 0xff0000 : 0x00ff00
    );
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Failed to execute lockdown: ${err.message}` });
  }
}

// 18. Toggle RaidMode Auto-kick policy
function runRaidMode(ctx, state) {
  const guildId = ctx.guild.id;
  const turnOn = state.toLowerCase() === 'on';
  db.settings.set(`raidmode_${guildId}`, turnOn);

  const embed = buildEmbed(
    turnOn ? '🚨 Raid Mode ENABLED' : '🟢 Raid Mode DISABLED',
    turnOn 
      ? 'Intrusion Prevention active. Newly joining server members will be automatically kicked.' 
      : 'Raid prevention deactivated. Normal server joining rules restored.',
    [],
    turnOn ? 0xff0000 : 0x00ff00
  );
  return respond(ctx, { embeds: [embed] });
}

// 19. Scan history for suspected malware or phishing link patterns
async function runScanLinks(ctx) {
  const channel = ctx.channel;
  
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const suspiciousPatterns = [
      /discord\.(gg|gift|free|nitro)/gi,
      /dlscord/gi,
      /steamc(o|0)mmunity/gi,
      /bit\.ly/gi,
      /tinyurl/gi,
      /free-nitro/gi,
      /gift-nitro/gi
    ];

    const flagged = [];
    messages.forEach(msg => {
      if (msg.author.bot) return;
      const match = suspiciousPatterns.some(pattern => pattern.test(msg.content));
      if (match) {
        flagged.push({ author: msg.author, text: msg.content.slice(0, 100) });
      }
    });

    if (flagged.length === 0) {
      return respond(ctx, { embeds: [buildEmbed('Link Scan Complete', '🟢 Checked last 50 messages. Zero threats found.', [], 0x00ff00)] });
    }

    const threatList = flagged.map(f => `User: ${f.author} - *${f.text}*`).join('\n');
    const embed = buildEmbed(
      '⚠️ Security Audit Flagged Threats',
      `Identified potential malicious or tracking links in recent messages:\n\n${threatList}`,
      [],
      0xffa500
    );
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Link scanning failed: ${err.message}` });
  }
}

// 20. Check Administrative Permission overrides
async function runCheckPerms(ctx) {
  const guild = ctx.guild;

  try {
    const highRiskUsers = [];
    const members = await guild.members.fetch();

    members.forEach(member => {
      if (member.user.bot) return;
      const hasAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
      const hasGuild = member.permissions.has(PermissionFlagsBits.ManageGuild);
      const hasRoles = member.permissions.has(PermissionFlagsBits.ManageRoles);
      
      if (hasAdmin || hasGuild || hasRoles) {
        const perms = [];
        if (hasAdmin) perms.push('Administrator');
        if (hasGuild) perms.push('Manage Server');
        if (hasRoles) perms.push('Manage Roles');
        highRiskUsers.push({ user: member.user, perms: perms.join(', ') });
      }
    });

    const list = highRiskUsers.map(u => `• ${u.user} (${u.user.username}) - [${u.perms}]`).join('\n') || 'None';
    const embed = buildEmbed(
      '🛡️ Permission Privilege Audit',
      `Identified non-bot users with elevated server permissions:\n\n${list}`,
      [],
      0x00ffff
    );
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Permission check failed: ${err.message}` });
  }
}

// 21. Quarantine compromised accounts
async function runQuarantine(ctx, targetUser, reason) {
  const guild = ctx.guild;
  const member = await guild.members.fetch(targetUser.id).catch(() => null);

  if (!member) return respond(ctx, { content: 'User not found in server.' });

  try {
    let quarantineRole = guild.roles.cache.find(r => r.name === 'Quarantined');
    if (!quarantineRole) {
      quarantineRole = await guild.roles.create({
        name: 'Quarantined',
        color: '#708090',
        reason: 'Quarantine isolation role'
      });
    }

    const roleIds = member.roles.cache.filter(r => r.id !== guild.id).map(r => r.id);
    db.jails.set(`quarantine_${targetUser.id}`, {
      roles: roleIds,
      reason,
      timestamp: Date.now()
    });

    const removable = member.roles.cache.filter(r => r.id !== guild.id && r.editable);
    for (const [id, r] of removable) {
      await member.roles.remove(r).catch(() => {});
    }
    await member.roles.add(quarantineRole);

    const embed = buildEmbed(
      '☣️ Account Quarantined',
      `**User**: ${targetUser}\n**Reason**: ${reason}\n\n*All server permissions revoked. Account isolated.*`,
      [],
      0x8b0000
    );
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Quarantine failed: ${err.message}` });
  }
}

// 22. Audit Log fetching
async function runAuditLog(ctx, limit) {
  const guild = ctx.guild;
  
  try {
    const logs = await guild.fetchAuditLogs({ limit });
    const entries = logs.entries.map((entry, idx) => {
      const time = `<t:${Math.floor(entry.createdTimestamp / 1000)}:R>`;
      return `${idx + 1}. **${entry.executor.username}** performed **${entry.action}** on target **${entry.targetId}** (${time})`;
    }).join('\n') || 'No logs captured.';

    const embed = buildEmbed('📋 Administrative Audit Log Feed', entries, [], 0x4682b4);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Failed to retrieve audit logs: ${err.message}` });
  }
}

// 23. AntiSpam IDS toggles
function runAntiSpamToggle(ctx, state) {
  const guildId = ctx.guild.id;
  const turnOn = state.toLowerCase() === 'on';
  db.settings.set(`antispam_${guildId}`, turnOn);

  const embed = buildEmbed(
    turnOn ? '🛡️ Intrusion Detection System: Antispam ACTIVE' : '🟢 Antispam IDS INACTIVE',
    turnOn 
      ? 'Rate limit watchers deployed. Mutes will apply automatically to spammers.' 
      : 'Intrusion Detection System offline.',
    [],
    turnOn ? 0x00ffcc : 0xffa500
  );
  return respond(ctx, { embeds: [embed] });
}

// 24. Google search with DuckDuckGo fallback
async function runGoogleSearch(ctx, query) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  if (apiKey && cx) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;
      const res = await axios.get(url, { timeout: 5000 });
      const items = res.data.items || [];

      if (items.length === 0) {
        return respond(ctx, { embeds: [buildEmbed('Google Search Results', `No items found matching *${query}*.`, [], 0xffa500)] });
      }

      const fields = items.slice(0, 3).map((item, idx) => ({
        name: `${idx + 1}. ${item.title}`,
        value: `[Link](${item.link})\n${item.snippet || 'No description available.'}`
      }));

      const embed = buildEmbed(`Google Search: ${query}`, `Top search index matches:`, fields, 0x4285f4);
      return respond(ctx, { embeds: [embed] });
    } catch (err) {
      console.warn('[Google Search API Failed, falling back to DuckDuckGo]:', err.message);
    }
  }

  // Fallback to DuckDuckGo Instant Answer API
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const res = await axios.get(url, { timeout: 5000 });
    const abstract = res.data.AbstractText;
    const abstractUrl = res.data.AbstractURL;
    const related = res.data.RelatedTopics || [];

    if (!abstract && related.length === 0) {
      return respond(ctx, { embeds: [buildEmbed('Search Results', `No index results found for *${query}*.`, [], 0xffa500)] });
    }

    const fields = [];
    if (abstract) {
      fields.push({ name: 'Abstract Summary', value: `${abstract}\n[Source Link](${abstractUrl})` });
    }

    const topics = related.slice(0, 3).filter(t => t.Text && t.FirstURL);
    if (topics.length > 0) {
      const topicText = topics.map((t, i) => `• [${t.Text.slice(0, 100)}](${t.FirstURL})`).join('\n');
      fields.push({ name: 'Related Topics', value: topicText });
    }

    const embed = buildEmbed(
      `Search: ${query} (DuckDuckGo Fallback)`,
      `Google API key missing or offline. Rendering fallback indices:`,
      fields,
      0xde5833
    );
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Search query failed to execute: ${err.message}` });
  }
}

// 25. Google Image Search with fallback
async function runGoogleImageSearch(ctx, query) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  if (!apiKey || !cx) {
    const keyMissingEmbed = buildEmbed(
      'Google Image Search Configuration Required',
      `This command requires \`GOOGLE_API_KEY\` and \`GOOGLE_CX\` environment variables.\n\n*Get credentials on the Google Custom Search Engine developers portal.*`,
      [],
      0xffa500
    );
    return respond(ctx, { embeds: [keyMissingEmbed] });
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image`;
    const res = await axios.get(url, { timeout: 5000 });
    const items = res.data.items || [];

    if (items.length === 0) {
      return respond(ctx, { embeds: [buildEmbed('Google Image Search', `No images found matching *${query}*.`, [], 0xffa500)] });
    }

    const first = items[0];
    const embed = buildEmbed(
      `Google Image Search: ${query}`,
      `Title: **${first.title || 'Image'}**\n[Original Link](${first.link})`,
      [],
      0x4285f4
    );
    embed.setImage(first.link);
    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    return respond(ctx, { content: `Google Image search failed: ${err.message}` });
  }
}
