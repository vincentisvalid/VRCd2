/**
 * .qr — generates a scannable QR code PNG and streams it back to chat.
 */
import { AttachmentBuilder } from 'discord.js';
import QRCode from 'qrcode';
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

export default {
  name: 'qr',
  category: 'Utilities',
  description: 'Generates a QR code image from text or a URL.',
  usage: '.qr <text>',
  aliases: ['qrcode'],
  cooldownMs: 4000,
  options: [{ name: 'text', type: 'string', description: 'Text or URL to encode', required: true, rest: true }],
  async execute(ctx) {
    const text = ctx.getOption('text');
    if (text.length > 1000) return ctx.replyError('Too long', 'QR payloads cap at 1000 characters here.');

    let buffer;
    try {
      buffer = await QRCode.toBuffer(text, {
        type: 'png',
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000ff', light: '#ffffffff' },
      });
    } catch (error) {
      return ctx.replyError('Generation failed', `The QR engine rejected the payload: ${error.message}`);
    }

    const attachment = new AttachmentBuilder(buffer, { name: 'qr.png' });
    const embed = brandEmbed()
      .setTitle('📱 QR code')
      .setDescription(`Encodes: ${truncate(text, 500)}`)
      .setImage('attachment://qr.png');
    return ctx.reply({ embeds: [embed], files: [attachment] });
  },
};
