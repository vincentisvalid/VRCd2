/**
 * .booster msg — editable boost-announcement template.
 *
 * Placeholders: {user} mention · {username} · {guild} · {count}.
 * The channel the command is run in becomes the announcement channel.
 * Fired by the guildMemberUpdate booster tracker the instant boost
 * metrics change.
 */
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';

export default {
  name: 'booster',
  category: 'Roles',
  description: 'Configures the boost announcement message template.',
  usage: '.booster msg <text with {user} {guild} {count}>',
  aliases: [],
  guildOnly: true,
  userPermissions: ['ManageGuild'],
  cooldownMs: 3000,
  defaultSubcommand: 'show',
  subcommands: [
    {
      name: 'msg',
      description: 'Set the announcement template (sent in this channel)',
      options: [{ name: 'text', type: 'string', description: 'Template with {user} {username} {guild} {count}', required: true, rest: true }],
    },
    { name: 'show', description: 'Show the current booster configuration', options: [] },
  ],
  async execute(ctx) {
    if (ctx.subcommand === 'msg') {
      const text = ctx.getOption('text');
      if (text.length > 1500) return ctx.replyError('Too long', 'Templates are capped at 1500 characters.');

      db.collection('guilds').update(ctx.guild.id, (doc) => ({
        ...doc,
        boosterMessage: { text, channelId: ctx.channel.id, updatedBy: ctx.user.id, updatedAt: Date.now() },
      }));
      return ctx.replySuccess(
        'Booster template saved',
        `Announcements will fire in <#${ctx.channel.id}>.\n\n**Preview:**\n${text
          .replaceAll('{user}', `<@${ctx.user.id}>`)
          .replaceAll('{username}', ctx.user.username)
          .replaceAll('{guild}', ctx.guild.name)
          .replaceAll('{count}', String(ctx.guild.premiumSubscriptionCount ?? 0))}`
      );
    }

    const guildDoc = db.collection('guilds').get(ctx.guild.id) ?? {};
    const embed = brandEmbed()
      .setTitle('💜 Booster configuration')
      .addFields(
        { name: 'Booster role', value: guildDoc.boosterRoleId ? `<@&${guildDoc.boosterRoleId}>` : '*not set — use `.boosterrole`*', inline: true },
        { name: 'Announcement channel', value: guildDoc.boosterMessage?.channelId ? `<#${guildDoc.boosterMessage.channelId}>` : '*not set*', inline: true },
        { name: 'Template', value: guildDoc.boosterMessage?.text ?? '*not set — use `.booster msg <text>`*' }
      );
    return ctx.reply({ embeds: [embed] });
  },
};
