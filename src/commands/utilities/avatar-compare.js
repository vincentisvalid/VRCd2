/**
 * .avatar-compare — downloads two avatars and composes them side-by-side
 * on a Canvas layout with name captions.
 */
import { AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

const TILE = 512;
const GAP = 24;
const CAPTION_HEIGHT = 64;

export default {
  name: 'avatar-compare',
  category: 'Utilities',
  description: 'Renders two members’ avatars side-by-side as one image.',
  usage: '.avatar-compare <@user1> <@user2>',
  aliases: ['avcompare'],
  cooldownMs: 6000,
  options: [
    { name: 'first', type: 'user', description: 'First user', required: true },
    { name: 'second', type: 'user', description: 'Second user', required: true },
  ],
  async execute(ctx) {
    const first = ctx.getOption('first');
    const second = ctx.getOption('second');
    await ctx.defer();

    let images;
    try {
      images = await Promise.all(
        [first, second].map((user) => loadImage(user.displayAvatarURL({ size: TILE, extension: 'png', forceStatic: true })))
      );
    } catch (error) {
      return ctx.replyError('Download failed', `Could not fetch one of the avatars: ${error.message}`);
    }

    const canvas = createCanvas(TILE * 2 + GAP * 3, TILE + CAPTION_HEIGHT + GAP * 2);
    const g = canvas.getContext('2d');

    // Backdrop
    g.fillStyle = '#1e1f22';
    g.fillRect(0, 0, canvas.width, canvas.height);

    // Tiles + captions
    const names = [first.username, second.username];
    images.forEach((image, index) => {
      const x = GAP + index * (TILE + GAP);
      g.drawImage(image, x, GAP, TILE, TILE);
      g.fillStyle = '#ffffff';
      g.font = 'bold 32px sans-serif';
      g.textAlign = 'center';
      g.fillText(truncate(names[index], 24), x + TILE / 2, GAP + TILE + 44);
    });

    // Versus divider
    g.fillStyle = '#8a2be2';
    g.font = 'bold 40px sans-serif';
    g.fillText('VS', canvas.width / 2, GAP + TILE / 2 + 14);

    const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'avatar-compare.png' });
    const embed = brandEmbed()
      .setTitle(`🆚 ${first.username} vs ${second.username}`)
      .setImage('attachment://avatar-compare.png');
    return ctx.reply({ embeds: [embed], files: [attachment] });
  },
};
