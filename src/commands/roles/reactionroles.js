/**
 * .reactionroles — persistent reaction→role listener maps.
 *
 *   .reactionroles create <messagelink> <emoji> <role>
 *   .reactionroles list
 *   .reactionroles remove <messagelink> <emoji>
 *
 * Bindings are stored per message ID and serviced by the
 * messageReactionAdd/Remove events (partial-safe, survives restarts).
 */
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';
import { parseMessageLink } from '../../core/resolvers.js';

const CUSTOM_EMOJI = /^<(a?):(\w+):(\d+)>$/;

/** Normalises an emoji argument → { key, display, reactable }. */
function parseEmojiArgument(raw) {
  const custom = CUSTOM_EMOJI.exec(raw);
  if (custom) return { key: custom[3], display: raw, reactable: custom[3] };
  return { key: raw, display: raw, reactable: raw }; // unicode glyph
}

async function fetchLinkedMessage(ctx, link) {
  const parsed = parseMessageLink(link);
  if (!parsed) throw new Error('That is not a valid Discord message link.');
  if (parsed.guildId !== ctx.guild.id) throw new Error('The linked message is in a different server.');
  const channel = await ctx.guild.channels.fetch(parsed.channelId).catch(() => null);
  if (!channel?.isTextBased()) throw new Error('The linked channel no longer exists (or is not a text channel).');
  const message = await channel.messages.fetch(parsed.messageId).catch(() => null);
  if (!message) throw new Error('The linked message could not be fetched.');
  return message;
}

export default {
  name: 'reactionroles',
  category: 'Roles',
  description: 'Binds reactions on a message to role toggles.',
  usage: '.reactionroles create <messagelink> <emoji> <role> | list | remove <messagelink> <emoji>',
  aliases: ['rr'],
  guildOnly: true,
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles', 'AddReactions'],
  cooldownMs: 3000,
  subcommands: [
    {
      name: 'create',
      description: 'Bind an emoji on a message to a role',
      options: [
        { name: 'messagelink', type: 'string', description: 'Link to the target message', required: true },
        { name: 'emoji', type: 'string', description: 'Reaction emoji (unicode or custom)', required: true },
        { name: 'role', type: 'role', description: 'Role to toggle', required: true },
      ],
    },
    { name: 'list', description: 'List all reaction-role bindings in this server', options: [] },
    {
      name: 'remove',
      description: 'Remove a binding from a message',
      options: [
        { name: 'messagelink', type: 'string', description: 'Link to the bound message', required: true },
        { name: 'emoji', type: 'string', description: 'The bound emoji to unbind', required: true },
      ],
    },
  ],
  async execute(ctx) {
    const collection = db.collection('reactionroles');

    switch (ctx.subcommand) {
      case 'create': {
        const role = ctx.getOption('role');
        if (role.managed || role.id === ctx.guild.id) {
          return ctx.replyError('Unusable role', 'Managed/integration roles and @everyone cannot be bound.');
        }
        if (role.position >= ctx.guild.members.me.roles.highest.position) {
          return ctx.replyError('Role too high', `My highest role must sit above ${role} to grant it.`);
        }

        let message;
        try {
          message = await fetchLinkedMessage(ctx, ctx.getOption('messagelink'));
        } catch (error) {
          return ctx.replyError('Bad message link', error.message);
        }

        const emoji = parseEmojiArgument(ctx.getOption('emoji'));
        try {
          await message.react(emoji.reactable); // also validates the emoji exists
        } catch {
          return ctx.replyError('Unreactable emoji', `I cannot react with ${emoji.display} — for custom emoji I must share a server with it.`);
        }

        collection.update(
          message.id,
          (doc) => {
            doc.guildId = ctx.guild.id;
            doc.channelId = message.channel.id;
            doc.bindings = [
              ...(doc.bindings ?? []).filter((binding) => binding.emojiKey !== emoji.key),
              { emojiKey: emoji.key, emojiDisplay: emoji.display, roleId: role.id },
            ];
            return doc;
          },
          { guildId: ctx.guild.id, channelId: message.channel.id, bindings: [] }
        );
        return ctx.replySuccess('Binding created', `${emoji.display} on [that message](${message.url}) now toggles ${role}.`);
      }

      case 'remove': {
        let message;
        try {
          message = await fetchLinkedMessage(ctx, ctx.getOption('messagelink'));
        } catch (error) {
          return ctx.replyError('Bad message link', error.message);
        }
        const emoji = parseEmojiArgument(ctx.getOption('emoji'));
        const record = collection.get(message.id);
        const binding = record?.bindings?.find((entry) => entry.emojiKey === emoji.key);
        if (!binding) return ctx.replyError('No such binding', `${emoji.display} is not bound on that message.`);

        const remaining = record.bindings.filter((entry) => entry.emojiKey !== emoji.key);
        if (remaining.length) collection.set(message.id, { ...record, bindings: remaining });
        else collection.delete(message.id);
        return ctx.replySuccess('Binding removed', `${emoji.display} no longer toggles <@&${binding.roleId}> on that message.`);
      }

      default: {
        const records = collection.find((record) => record.guildId === ctx.guild.id);
        if (!records.length) return ctx.replyError('No bindings', 'Create one with `.reactionroles create <messagelink> <emoji> <role>`.');

        const lines = records.flatMap(([messageId, record]) =>
          record.bindings.map(
            (binding) =>
              `${binding.emojiDisplay} → <@&${binding.roleId}> · [message](https://discord.com/channels/${record.guildId}/${record.channelId}/${messageId})`
          )
        );
        const embed = brandEmbed().setTitle('🎭 Reaction-role bindings').setDescription(lines.slice(0, 30).join('\n'));
        return ctx.reply({ embeds: [embed] });
      }
    }
  },
};
