import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Collection, 
  REST, 
  Routes 
} from 'discord.js';
import dotenv from 'dotenv';
import config from '../config.json' with { type: 'json' };
import { db } from './database/db.js';

// Load environment variables
dotenv.config();

// Verify client credentials
if (!process.env.DISCORD_TOKEN) {
  console.error('[Engine Warning] DISCORD_TOKEN is missing in the environment variables.');
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember
  ]
});

// Cache collections setup
client.commands = new Collection();
client.aliases = new Collection();

// Dynamically load all command files in src/commands/
const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const fileUrl = pathToFileURL(path.join(commandsDir, file)).href;
    const module = await import(fileUrl);
    const cmdList = module.default;
    
    if (Array.isArray(cmdList)) {
      for (const cmd of cmdList) {
        client.commands.set(cmd.name, cmd);
        if (cmd.aliases && cmd.aliases.length > 0) {
          for (const alias of cmd.aliases) {
            client.aliases.set(alias, cmd);
          }
        }
      }
    }
  } catch (err) {
    console.error(`[Loader Error] Failed to import command file ${file}:`, err);
  }
}

// ----------------------------------------------------------------
// ready Event
// ----------------------------------------------------------------
client.once('ready', async () => {
  console.log(`[Engine Online] Logged in as ${client.user.tag}`);
  
  // Update Rich Presence state
  client.user.setActivity({
    name: `VR Games | Prefix: ${config.defaultPrefix}`,
    type: 0 // Playing
  });

  // Deploy Slash Commands to API
  try {
    console.log('[Slash Commands] Registering application endpoints...');
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const body = client.commands.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options || []
    }));

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || client.user.id),
      { body }
    );
    console.log('[Slash Commands] Successfully loaded global application schemas.');
  } catch (err) {
    console.error('[Slash Commands Error] Deployment failed:', err.message);
  }

  // Load and restore scheduled reminders from database
  try {
    const activeReminders = db.reminders.get('active', []);
    const now = Date.now();
    console.log(`[Reminders] Loading ${activeReminders.length} scheduled timers...`);

    for (const reminder of activeReminders) {
      const remaining = reminder.runAt - now;
      if (remaining <= 0) {
        // Send immediately if passed while bot was offline
        triggerReminder(reminder);
      } else {
        // Schedule timeout
        setTimeout(() => triggerReminder(reminder), remaining);
      }
    }
  } catch (err) {
    console.error('[Reminders Restoration Failed]:', err.message);
  }
});

// Helper for reminder triggering
async function triggerReminder(reminder) {
  try {
    const channel = await client.channels.fetch(reminder.channelId).catch(() => null);
    if (channel) {
      await channel.send({ content: `🔔 <@${reminder.userId}> **Reminder**: ${reminder.message}` });
    }
  } catch (_) {}
  // Clean db
  const current = db.reminders.get('active', []);
  db.reminders.set('active', current.filter(r => r.id !== reminder.id));
}

const spamTrackers = new Map();

// ----------------------------------------------------------------
// messageCreate Event (Prefix parsing)
// ----------------------------------------------------------------
client.on('messageCreate', async message => {
  if (message.author.bot || message.system) return;

  // Intrusion Detection System: AntiSpam Watcher
  if (message.guild) {
    const antiSpamActive = db.settings.get(`antispam_${message.guild.id}`);
    if (antiSpamActive === true) {
      const userId = message.author.id;
      const now = Date.now();
      
      if (!spamTrackers.has(userId)) {
        spamTrackers.set(userId, []);
      }
      
      const timestamps = spamTrackers.get(userId);
      timestamps.push(now);
      
      const recentTimestamps = timestamps.filter(t => now - t < 4000);
      spamTrackers.set(userId, recentTimestamps);
      
      if (recentTimestamps.length > 5) {
        console.log(`[IDS Alert] Flagged spammer ${message.author.tag} in guild ${message.guild.name}`);
        await message.delete().catch(() => {});
        
        const member = await message.guild.members.fetch(userId).catch(() => null);
        if (member && member.moderatable) {
          await member.timeout(10 * 60 * 1000, 'Muted by Intrusion Detection System (AntiSpam)').catch(() => {});
          await message.channel.send({
            content: `🛡️ **IDS Intrusion Alert**: <@${userId}> has been automatically muted for 10 minutes for rate-limit spam violations.`
          }).catch(() => {});
        }
        return;
      }
    }
  }

  // Resolve prefix override hierarchy
  const userPrefix = db.settings.get(`prefix_user_${message.author.id}`);
  const guildPrefix = message.guild ? db.settings.get(`prefix_guild_${message.guild.id}`) : null;
  const globalPrefix = db.settings.get('global_prefix');
  const activePrefix = userPrefix || guildPrefix || globalPrefix || config.defaultPrefix;

  if (!message.content.startsWith(activePrefix)) return;

  const args = message.content.slice(activePrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName) || client.aliases.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(`[Command Error] Failed executing prefix command ${commandName}:`, err);
    message.reply({ content: 'An unexpected exception occurred while executing this command. Logs generated.' }).catch(() => {});
  }
});

// ----------------------------------------------------------------
// interactionCreate Event (Slash Commands execution)
// ----------------------------------------------------------------
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.executeSlash(interaction, client);
  } catch (err) {
    console.error(`[Interaction Error] Slash Command ${interaction.commandName} failed:`, err);
    const options = { content: 'Failed to process interaction request.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(options).catch(() => {});
    } else {
      await interaction.reply(options).catch(() => {});
    }
  }
});

// ----------------------------------------------------------------
// Reaction Roles Listeners
// ----------------------------------------------------------------
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (err) {
      return console.error('[Reaction Role] Failed fetching partial reaction:', err.message);
    }
  }

  const messageId = reaction.message.id;
  const rules = db.reactionRoles.get(messageId);
  if (!rules) return;

  const matchingRule = rules.find(r => r.emoji === reaction.emoji.name || r.emoji === reaction.emoji.id);
  if (!matchingRule) return;

  const guild = reaction.message.guild;
  if (!guild) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (member) {
    await member.roles.add(matchingRule.roleId).catch(err => {
      console.warn(`[Reaction Role] Role add failed for ${user.tag}:`, err.message);
    });
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (err) {
      return console.error('[Reaction Role] Failed fetching partial reaction removal:', err.message);
    }
  }

  const messageId = reaction.message.id;
  const rules = db.reactionRoles.get(messageId);
  if (!rules) return;

  const matchingRule = rules.find(r => r.emoji === reaction.emoji.name || r.emoji === reaction.emoji.id);
  if (!matchingRule) return;

  const guild = reaction.message.guild;
  if (!guild) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (member) {
    await member.roles.remove(matchingRule.roleId).catch(err => {
      console.warn(`[Reaction Role] Role removal failed for ${user.tag}:`, err.message);
    });
  }
});

// ----------------------------------------------------------------
// Server Boosting Tracker Listeners
// ----------------------------------------------------------------
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const guild = newMember.guild;

  // Detect when member starts boosting
  if (!oldMember.premiumSince && newMember.premiumSince) {
    console.log(`[Booster Alert] Member ${newMember.user.tag} started boosting server.`);
    
    // Assign Booster Role if configured
    const boosterRoleId = db.settings.get(`booster_role_${guild.id}`);
    if (boosterRoleId) {
      await newMember.roles.add(boosterRoleId).catch(err => {
        console.warn(`[Booster Alert] Failed assigning booster role:`, err.message);
      });
    }

    // Send Customized Boosting Message
    const template = db.settings.get(`booster_msg_${guild.id}`);
    if (template) {
      const channel = guild.systemChannel || guild.channels.cache.find(c => c.name === 'general' || c.name === 'chat');
      if (channel) {
        const parsedMsg = template
          .replace(/{user}/g, `<@${newMember.id}>`)
          .replace(/{server}/g, guild.name);
        await channel.send({ content: parsedMsg }).catch(() => {});
      }
    }
  }
});

// ----------------------------------------------------------------
// AutoRole Listeners
// ----------------------------------------------------------------
client.on('guildMemberAdd', async member => {
  const guild = member.guild;

  // Intrusion Prevention: Raid Mode kick
  const raidModeActive = db.settings.get(`raidmode_${guild.id}`);
  if (raidModeActive === true) {
    console.log(`[RaidMode] Automatically kicking joining user ${member.user.tag}...`);
    await member.send({ content: `⚠️ **Security Alert**: The server **${guild.name}** is currently locked down. You have been auto-kicked as an anti-intrusion prevention measure. Please try joining again later.` }).catch(() => {});
    await member.kick('Auto-kick triggered by active Guild RaidMode intrusion prevention.').catch(err => {
      console.error(`[RaidMode Error] Failed to kick user:`, err.message);
    });
    return;
  }

  const mappedRoles = db.autoroles.get(guild.id, []);

  if (mappedRoles.length > 0) {
    console.log(`[AutoRole] Allocating joining roles to member ${member.user.tag}...`);
    for (const roleId of mappedRoles) {
      await member.roles.add(roleId).catch(err => {
        console.warn(`[AutoRole Error] Failed assigning auto role ID ${roleId}:`, err.message);
      });
    }
  }
});

// ----------------------------------------------------------------
// Global Unhandled Exceptions and Rejections Management
// ----------------------------------------------------------------
process.on('unhandledRejection', error => {
  console.error('[Unhandled Promise Rejection] Fatal Exception Logged:', error);
});

process.on('uncaughtException', error => {
  console.error('[Uncaught Exception] Crash prevented by top-level process hook:', error);
});

// Boot Client API Gateway
client.login(process.env.DISCORD_TOKEN);
