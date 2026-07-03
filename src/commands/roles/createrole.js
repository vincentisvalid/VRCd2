/**
 * .createrole — instant role generation with an exact colour specification.
 */
import { brandEmbed } from '../../core/embeds.js';

const HEX_COLOR = /^#?([0-9a-f]{6})$/i;

export default {
  name: 'createrole',
  category: 'Roles',
  description: 'Creates a role with the given name and hex colour.',
  usage: '.createrole <name> <hex>  (quote multi-word names: .createrole "VR Legends" ff00aa)',
  aliases: [],
  guildOnly: true,
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles'],
  cooldownMs: 4000,
  options: [
    { name: 'name', type: 'string', description: 'Role name (quote multi-word names in prefix mode)', required: true },
    { name: 'hex', type: 'string', description: 'Colour like ff00aa or #ff00aa', required: true },
  ],
  async execute(ctx) {
    const name = ctx.getOption('name').trim();
    const hexRaw = ctx.getOption('hex').trim();

    if (name.length < 1 || name.length > 100) return ctx.replyError('Invalid name', 'Role names must be 1–100 characters.');
    const match = HEX_COLOR.exec(hexRaw);
    if (!match) return ctx.replyError('Invalid colour', `\`${hexRaw}\` is not a hex colour — use a form like \`ff00aa\`.`);
    const color = Number.parseInt(match[1], 16);

    let role;
    try {
      role = await ctx.guild.roles.create({
        name,
        color,
        permissions: [], // least privilege by default — grant explicitly afterwards
        reason: `Created by ${ctx.user.tag} via .createrole`,
      });
    } catch (error) {
      return ctx.replyError('Creation failed', `Discord refused the role: ${error.message}`);
    }

    const embed = brandEmbed()
      .setTitle('🎨 Role created')
      .setColor(color)
      .setDescription(`${role} is live.`)
      .addFields(
        { name: 'Name', value: name, inline: true },
        { name: 'Colour', value: `#${match[1].toLowerCase()}`, inline: true },
        { name: 'ID', value: `\`${role.id}\``, inline: true }
      );
    return ctx.reply({ embeds: [embed] });
  },
};
