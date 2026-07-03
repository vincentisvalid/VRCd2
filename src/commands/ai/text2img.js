/**
 * .text2img — on-the-fly authenticated fal.ai image generation with the
 * strict key-security workflow (SHA-512 fingerprint + message purge).
 */
import { runFalModel, extractImageUrl } from '../../services/falai.js';
import { beginSecuredFalRequest } from './_falSecurity.js';
import { config } from '../../core/config.js';
import { brandEmbed, errorEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

export default {
  name: 'text2img',
  category: 'AI',
  description: 'Generates an image from a prompt via fal.ai (key is hashed & the message purged).',
  usage: '.text2img <apikey> <prompt>',
  aliases: ['t2i'],
  cooldownMs: 10000,
  options: [
    { name: 'apikey', type: 'string', description: 'Your fal.ai API key (never stored)', required: true },
    { name: 'prompt', type: 'string', description: 'What to render', required: true, rest: true },
  ],
  async execute(ctx) {
    const apiKey = ctx.getOption('apikey');
    const prompt = ctx.getOption('prompt');

    const { processingMessage } = await beginSecuredFalRequest(ctx, { apiKey, taskTitle: 'Generating image' });

    try {
      const data = await runFalModel({
        apiKey,
        model: config.fal.text2imgModel,
        input: { prompt, num_images: 1, enable_safety_checker: true },
      });
      const imageUrl = extractImageUrl(data);
      if (!imageUrl) throw new Error('fal.ai responded without an image URL.');

      const embed = brandEmbed()
        .setTitle('🖼️ Image ready')
        .setDescription(truncate(prompt, 2048))
        .setImage(imageUrl);
      await processingMessage.edit({ embeds: [embed] });
    } catch (error) {
      await processingMessage.edit({ embeds: [errorEmbed('Image generation failed', error.message)] });
    }
  },
};
