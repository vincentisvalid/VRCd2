/**
 * .editimage — mutates an attached image via fal.ai's image-edit route
 * (config: fal.editImageModel, default FLUX.2 klein 4B edit), with the same
 * key-security workflow as the other fal commands.
 */
import { runFalModel, extractImageUrl } from '../../services/falai.js';
import { beginSecuredFalRequest } from './_falSecurity.js';
import { config } from '../../core/config.js';
import { brandEmbed, errorEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

export default {
  name: 'editimage',
  category: 'AI',
  description: 'Edits an attached image with an AI prompt via fal.ai (key hashed, message purged).',
  usage: '.editimage <apikey> <prompt> (attach an image)',
  aliases: ['imgedit'],
  cooldownMs: 10000,
  options: [
    { name: 'apikey', type: 'string', description: 'Your fal.ai API key (never stored)', required: true },
    { name: 'prompt', type: 'string', description: 'How to mutate the image', required: true, rest: true },
    { name: 'image', type: 'attachment', description: 'The image to edit', required: true },
  ],
  async execute(ctx) {
    const apiKey = ctx.getOption('apikey');
    const prompt = ctx.getOption('prompt');
    const attachment = ctx.getOption('image');

    if (!attachment?.url) {
      return ctx.replyError('No image attached', 'Attach the image you want edited alongside the command.');
    }
    if (attachment.contentType && !attachment.contentType.startsWith('image/')) {
      return ctx.replyError('Not an image', `\`${attachment.contentType}\` is not an editable image type.`);
    }

    // NOTE: the attachment URL must be captured BEFORE the purge in prefix
    // mode — Discord CDN links stay valid briefly after message deletion,
    // and fal.ai fetches the source immediately.
    const sourceUrl = attachment.url;

    const { processingMessage } = await beginSecuredFalRequest(ctx, { apiKey, taskTitle: 'Editing image' });

    try {
      const data = await runFalModel({
        apiKey,
        model: config.fal.editImageModel,
        input: { prompt, image_urls: [sourceUrl] },
      });
      const imageUrl = extractImageUrl(data);
      if (!imageUrl) throw new Error('fal.ai responded without an edited image URL.');

      const embed = brandEmbed()
        .setTitle('🪄 Edit complete')
        .setDescription(truncate(prompt, 2048))
        .setImage(imageUrl);
      await processingMessage.edit({ embeds: [embed] });
    } catch (error) {
      await processingMessage.edit({ embeds: [errorEmbed('Image edit failed', error.message)] });
    }
  },
};
