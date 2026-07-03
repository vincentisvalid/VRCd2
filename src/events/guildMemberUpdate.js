/**
 * Booster tracking: detects Nitro-boost state transitions to distribute the
 * configured booster role and fire the announcement template.
 */
import { Events } from 'discord.js';
import { db } from '../database/index.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('booster');

/** Fills the announcement template placeholders. */
function renderTemplate(template, member) {
  return template
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{guild}', member.guild.name)
    .replaceAll('{count}', String(member.guild.premiumSubscriptionCount ?? 0));
}

export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    try {
      const startedBoosting = !oldMember.premiumSince && Boolean(newMember.premiumSince);
      const stoppedBoosting = Boolean(oldMember.premiumSince) && !newMember.premiumSince;
      if (!startedBoosting && !stoppedBoosting) return;

      const guildDoc = db.collection('guilds').get(newMember.guild.id) ?? {};

      // ── Booster role distribution ─────────────────────────────────────
      if (guildDoc.boosterRoleId) {
        const role = newMember.guild.roles.cache.get(guildDoc.boosterRoleId);
        if (role) {
          if (startedBoosting) await newMember.roles.add(role, 'Server boost started').catch((e) => log.warn(e.message));
          if (stoppedBoosting) await newMember.roles.remove(role, 'Server boost ended').catch((e) => log.warn(e.message));
        }
      }

      // ── Announcement template ─────────────────────────────────────────
      if (startedBoosting && guildDoc.boosterMessage?.text) {
        const channelId = guildDoc.boosterMessage.channelId ?? newMember.guild.systemChannelId;
        if (channelId) {
          const channel = await newMember.guild.channels.fetch(channelId).catch(() => null);
          if (channel?.isTextBased()) {
            await channel.send({ content: renderTemplate(guildDoc.boosterMessage.text, newMember) }).catch((e) => log.warn(e.message));
          }
        }
      }
    } catch (error) {
      log.error('guildMemberUpdate handler failed:', error.message);
    }
  },
};
