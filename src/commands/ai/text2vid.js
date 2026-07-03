/**
 * .text2vid — on-the-fly authenticated fal.ai video generation with the
 * strict key-security workflow (SHA-512 fingerprint + message purge).
 */
import { runFalModel, extractVideoUrl } from '../../services/falai.js';
import { beginSecuredFalRequest } from './_falSecurity.js';
import { config } from '../../core/config.js';
import { brandEmbed, errorEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

export default {
  name: 'text2vid',
  category: 'AI',
  description: 'Generates a short video from a prompt via fal.ai (key is hashed & the message purged).',
  usage: '.text2vid <apikey> <prompt>',
  aliases: ['t2v'],
  cooldownMs: 15000,
  options: [
    { name: 'apikey', type: 'string', description: 'Your fal.ai API key (never stored)', required: true },
    { name: 'prompt', type: 'string', description: 'What the video should show', required: true, rest: true },
  ],
  async execute(ctx) {
    const apiKey = ctx.getOption('apikey');
    const prompt = ctx.getOption('prompt');

    const { processingMessage } = await beginSecuredFalRequest(ctx, { apiKey, taskTitle: 'Rendering video' });

    try {
      const data = await runFalModel({
        apiKey,
        model: config.fal.text2vidModel,
        input: { prompt },
      });
      const videoUrl = extractVideoUrl(data);
      if (!videoUrl) throw new Error('fal.ai responded without a video URL.');

      const embed = brandEmbed()
        .setTitle('🎬 Video ready')
        .setDescription(`${truncate(prompt, 1900)}\n\n[Download / watch](${videoUrl})`);
      await processingMessage.edit({ content: videoUrl, embeds: [embed] });
    } catch (error) {
      await processingMessage.edit({ embeds: [errorEmbed('Video generation failed', error.message)] });
    }
  },
};
