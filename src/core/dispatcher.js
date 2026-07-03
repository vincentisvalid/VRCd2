/**
 * Command dispatcher — the single execution gateway both transports funnel
 * through. Enforces (in order): guild scoping, the immutable Admin Utils
 * role gate, owner locks, caller permissions, bot permissions, and per-user
 * cooldowns; then executes the command inside a defensive envelope that
 * converts any thrown error into a graceful error embed + internal traceback.
 */
import { PermissionsBitField } from 'discord.js';
import { config } from './config.js';
import { errorEmbed } from './embeds.js';
import { UsageError } from './options.js';
import { createLogger } from './logger.js';

const log = createLogger('dispatcher');

/** cooldown bookkeeping: `${commandName}:${userId}` → expiry epoch ms */
const cooldowns = new Map();
const DEFAULT_COOLDOWN_MS = 2_000;

/**
 * The immutable Admin Utils condition. The allowlist is sourced from the
 * deep-frozen config, so no runtime code path can widen it. Execution is
 * rejected unless the calling member holds at least one of the exact
 * configured role IDs.
 */
function passesAdminUtilsGate(member) {
  if (!member?.roles?.cache) return false;
  return config.adminUtils.allowedRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

function findMissingPermissions(holderPermissions, required = []) {
  if (!required.length) return [];
  if (!holderPermissions) return required;
  const bitfield = new PermissionsBitField(holderPermissions.bitfield ?? holderPermissions);
  return required.filter((permission) => !bitfield.has(PermissionsBitField.Flags[permission]));
}

/**
 * Runs a fully-built CommandContext through all gates and into `execute`.
 * Never throws — every failure path resolves into user-facing feedback.
 */
export async function runCommand(ctx) {
  const { command } = ctx;
  try {
    // ── Gate 1: guild scoping ────────────────────────────────────────────
    if (command.guildOnly && !ctx.guild) {
      return await ctx.replyError('Server only', 'This command can only be used inside a server.');
    }

    // ── Gate 2: immutable Admin Utils role filter ────────────────────────
    if (command.adminUtilsOnly && !passesAdminUtilsGate(ctx.member)) {
      return await ctx.replyError(
        'Access denied',
        'This command is locked to the configured Admin Utils roles.'
      );
    }

    // ── Gate 3: bot-owner lock ───────────────────────────────────────────
    if (command.ownerOnly && !config.bot.ownerIds.includes(ctx.user.id)) {
      return await ctx.replyError('Access denied', 'Only the bot owner can run this command.');
    }

    // ── Gate 4: caller permissions ───────────────────────────────────────
    if (ctx.guild) {
      const missingUser = findMissingPermissions(ctx.member?.permissions, command.userPermissions ?? []);
      if (missingUser.length) {
        return await ctx.replyError('Missing permissions', `You need: ${missingUser.map((p) => `\`${p}\``).join(', ')}`);
      }

      // ── Gate 5: bot permissions ────────────────────────────────────────
      const me = ctx.guild.members.me;
      const missingBot = findMissingPermissions(me?.permissions, command.botPermissions ?? []);
      if (missingBot.length) {
        return await ctx.replyError('I lack permissions', `Grant me: ${missingBot.map((p) => `\`${p}\``).join(', ')}`);
      }
    }

    // ── Gate 6: per-user cooldown ────────────────────────────────────────
    const cooldownKey = `${command.name}:${ctx.user.id}`;
    const expiry = cooldowns.get(cooldownKey) ?? 0;
    const now = Date.now();
    if (now < expiry) {
      const waitSeconds = ((expiry - now) / 1000).toFixed(1);
      return await ctx.replyError('Slow down', `Try \`${command.name}\` again in ${waitSeconds}s.`);
    }
    cooldowns.set(cooldownKey, now + (command.cooldownMs ?? DEFAULT_COOLDOWN_MS));
    if (cooldowns.size > 5_000) pruneCooldowns();

    // ── Execution envelope ───────────────────────────────────────────────
    await command.execute(ctx);
  } catch (error) {
    if (error instanceof UsageError) {
      await safeErrorReply(ctx, 'Invalid usage', `${error.message}\n\nUsage: \`${command.usage ?? command.name}\``);
      return;
    }
    // Dump the technical traceback internally; ship only a clean cause to chat.
    log.error(`Command "${command.name}" failed:`, error?.stack ?? error);
    await safeErrorReply(
      ctx,
      'Something went wrong',
      `\`${command.name}\` failed: ${error?.message ?? 'unknown internal error'}`
    );
  }
}

async function safeErrorReply(ctx, title, reason) {
  try {
    await ctx.reply({ embeds: [errorEmbed(title, reason)] });
  } catch (secondary) {
    log.error('Failed to deliver error embed:', secondary?.message ?? secondary);
  }
}

function pruneCooldowns() {
  const now = Date.now();
  for (const [key, expiry] of cooldowns) {
    if (expiry <= now) cooldowns.delete(key);
  }
}

export default runCommand;
