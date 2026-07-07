/**
 * .jail — strips an offender's roles and locks them into a strict #prison
 * channel override. The full previous role set is persisted so `.unjail`
 * restores state exactly; every transition is logged to the database.
 *
 * First run auto-provisions the infrastructure: a "Jailed" role that is
 * denied visibility in every existing channel, plus a #prison channel only
 * that role (and staff) can see.
 */
import { ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';
import { db } from '../../database/index.js';
import { config } from '../../core/config.js';
import { brandEmbed, errorEmbed } from '../../core/embeds.js';
import { confirmDialog } from '../../core/components.js';
import { findActionBlocker, logModAction } from './_modShared.js';
import { createLogger } from '../../core/logger.js';

const log = createLogger('jail');

/** Ensures the jail role + prison channel exist; returns { role, channel }. */
async function provisionJail(guild) {
  const guildDoc = db.collection('guilds').get(guild.id) ?? {};

  let role = guildDoc.jailRoleId ? guild.roles.cache.get(guildDoc.jailRoleId) : null;
  if (!role) {
    role = await guild.roles.create({
      name: config.moderation.jailRoleName,
      color: 0x36393f,
      permissions: [],
      reason: 'VRCd jail infrastructure',
    });
    // Deny visibility across every existing channel except the prison.
    for (const channel of guild.channels.cache.values()) {
      if (!('permissionOverwrites' in channel)) continue;
      await channel.permissionOverwrites
        .create(role, { ViewChannel: false, SendMessages: false, Connect: false }, { reason: 'Jail lockdown' })
        .catch((error) => log.warn(`Overwrite failed in #${channel.name}:`, error.message));
    }
  }

  let channel = guildDoc.prisonChannelId ? guild.channels.cache.get(guildDoc.prisonChannelId) : null;
  if (!channel) {
    channel = await guild.channels.create({
      name: config.moderation.prisonChannelName,
      type: ChannelType.GuildText,
      reason: 'VRCd jail infrastructure',
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    });
  }

  db.collection('guilds').update(guild.id, (doc) => ({ ...doc, jailRoleId: role.id, prisonChannelId: channel.id }));
  return { role, channel };
}

export default {
  name: 'jail',
  category: 'Moderation',
  description: 'Strips a member of their roles and confines them to #prison.',
  usage: '.jail <@user> [reason]',
  aliases: [],
  guildOnly: true,
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles', 'ManageChannels'],
  cooldownMs: 4000,
  options: [
    { name: 'user', type: 'user', description: 'Member to jail', required: true },
    { name: 'reason', type: 'string', description: 'Why they are being jailed', required: false, rest: true },
  ],
  async execute(ctx) {
    const target = ctx.getOption('user');
    const reason = ctx.getOption('reason', 'No reason provided');
    const member = await ctx.fetchMemberOf(target);

    const blocker = findActionBlocker(ctx, member, { needBotAbility: 'manage' });
    if (blocker) return ctx.replyError('Cannot jail', blocker);

    const jailKey = `${ctx.guild.id}:${target.id}`;
    if (db.collection('jail').has(jailKey)) {
      return ctx.replyError('Already jailed', `${target.username} is already in prison — use \`.unjail\` first.`);
    }

    // Native confirmation — jailing strips every role the member holds.
    const confirmation = await confirmDialog(ctx, {
      embed: brandEmbed()
        .setTitle('🔒 Confirm jail')
        .setDescription(`You're about to strip **${target.tag ?? target.username}** of all roles and confine them to prison.`)
        .addFields({ name: 'Reason', value: reason }),
      confirmLabel: `Jail ${(target.username ?? 'user').slice(0, 20)}`,
      confirmStyle: ButtonStyle.Danger,
      confirmEmoji: '🔒',
    });
    if (!confirmation.confirmed) return;

    const { role, channel } = await provisionJail(ctx.guild);

    // Snapshot every removable role, then hard-swap to the jail role only.
    const previousRoleIds = member.roles.cache
      .filter((existing) => existing.id !== ctx.guild.id && !existing.managed)
      .map((existing) => existing.id);

    try {
      await member.roles.set([role.id], `Jailed by ${ctx.user.tag}: ${reason}`);
    } catch (error) {
      return confirmation.finalize({ embeds: [errorEmbed('Role swap failed', `Discord refused the role update: ${error.message}`)] });
    }

    db.collection('jail').set(jailKey, {
      guildId: ctx.guild.id,
      userId: target.id,
      previousRoleIds,
      reason,
      moderatorId: ctx.user.id,
      jailedAt: Date.now(),
    });
    logModAction(ctx.guild.id, { action: 'jail', targetId: target.id, moderatorId: ctx.user.id, reason });

    const embed = brandEmbed()
      .setTitle('🔒 Member jailed')
      .setDescription(`**${target.tag ?? target.username}** has been confined to ${channel}.`)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Roles stripped', value: String(previousRoleIds.length), inline: true },
        { name: 'Moderator', value: `<@${ctx.user.id}>`, inline: true }
      );
    return confirmation.finalize({ embeds: [embed] });
  },
};
