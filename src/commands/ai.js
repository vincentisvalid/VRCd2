import axios from 'axios';
import { sha512, respond, deleteTrigger, buildEmbed } from '../utils/helpers.js';
import config from '../../config.json' assert { type: 'json' };

export default [
  {
    name: 'llm',
    description: 'Query a local Ollama model instance.',
    category: 'AI',
    aliases: ['ollama', 'ask'],
    options: [
      {
        name: 'model',
        type: 3, // String
        description: 'The Ollama model to query (e.g., llama3, mistral)',
        required: true
      },
      {
        name: 'query',
        type: 3, // String
        description: 'Your prompt or question for the AI',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length < 2) {
        return respond(message, { embeds: [buildEmbed('Error', 'Usage: `.llm <modelname> <query>`', [], 0xff0000)] });
      }
      const model = args[0];
      const query = args.slice(1).join(' ');
      return runLLM(message, model, query);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const model = interaction.options.getString('model');
      const query = interaction.options.getString('query');
      return runLLM(interaction, model, query);
    }
  },
  {
    name: 'askxipra',
    description: 'Ask Xipra, the helpful virtual reality assistant.',
    category: 'AI',
    aliases: ['xipra'],
    options: [
      {
        name: 'query',
        type: 3, // String
        description: 'Your question about Virtual Reality',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return respond(message, { embeds: [buildEmbed('Error', 'Usage: `.askxipra <query>`', [], 0xff0000)] });
      }
      const query = args.join(' ');
      return runXipra(message, query);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const query = interaction.options.getString('query');
      return runXipra(interaction, query);
    }
  },
  {
    name: 'text2vid',
    description: 'Generate a video from text using Fal.ai.',
    category: 'AI',
    aliases: ['t2v'],
    options: [
      {
        name: 'apikey',
        type: 3, // String
        description: 'Your Fal.ai API Key',
        required: true
      },
      {
        name: 'prompt',
        type: 3, // String
        description: 'The video generation prompt',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length < 2) {
        return respond(message, { embeds: [buildEmbed('Error', 'Usage: `.text2vid <apikey> <prompt>`', [], 0xff0000)] });
      }
      const apikey = args[0];
      const prompt = args.slice(1).join(' ');
      await deleteTrigger(message);
      return runFalVideo(message, apikey, prompt);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply({ ephemeral: true });
      const apikey = interaction.options.getString('apikey');
      const prompt = interaction.options.getString('prompt');
      return runFalVideo(interaction, apikey, prompt);
    }
  },
  {
    name: 'text2img',
    description: 'Generate an image from text using Fal.ai.',
    category: 'AI',
    aliases: ['t2i'],
    options: [
      {
        name: 'apikey',
        type: 3, // String
        description: 'Your Fal.ai API Key',
        required: true
      },
      {
        name: 'prompt',
        type: 3, // String
        description: 'The image generation prompt',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length < 2) {
        return respond(message, { embeds: [buildEmbed('Error', 'Usage: `.text2img <apikey> <prompt>`', [], 0xff0000)] });
      }
      const apikey = args[0];
      const prompt = args.slice(1).join(' ');
      await deleteTrigger(message);
      return runFalImage(message, apikey, prompt);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply({ ephemeral: true });
      const apikey = interaction.options.getString('apikey');
      const prompt = interaction.options.getString('prompt');
      return runFalImage(interaction, apikey, prompt);
    }
  },
  {
    name: 'editimage',
    description: 'Modify an attached image using Fal.ai gpt-images-v2-edit.',
    category: 'AI',
    aliases: ['editimg'],
    options: [
      {
        name: 'apikey',
        type: 3, // String
        description: 'Your Fal.ai API Key',
        required: true
      },
      {
        name: 'prompt',
        type: 3, // String
        description: 'Editing instructions',
        required: true
      },
      {
        name: 'image_url',
        type: 3, // String
        description: 'Optional image URL (or attach an image)',
        required: false
      }
    ],
    async execute(message, args, client) {
      if (args.length < 2) {
        return respond(message, { embeds: [buildEmbed('Error', 'Usage: `.editimage <apikey> <prompt>` (Must attach an image)', [], 0xff0000)] });
      }
      const apikey = args[0];
      const prompt = args.slice(1).join(' ');
      
      const attachment = message.attachments.first();
      if (!attachment) {
        return respond(message, { embeds: [buildEmbed('Error', 'Please attach an image file to edit.', [], 0xff0000)] });
      }
      
      await deleteTrigger(message);
      return runFalImageEdit(message, apikey, prompt, attachment.url);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply({ ephemeral: true });
      const apikey = interaction.options.getString('apikey');
      const prompt = interaction.options.getString('prompt');
      const imageUrl = interaction.options.getString('image_url');
      
      if (!imageUrl) {
        return respond(interaction, { content: 'Please provide an image_url or use the text prefix version with an attachment.' });
      }
      return runFalImageEdit(interaction, apikey, prompt, imageUrl);
    }
  }
];

// Helper: Local Ollama Generative Model Loop
async function runLLM(ctx, model, query) {
  const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  const startEmbed = buildEmbed('Ollama Generation', `Sending query to model \`${model}\`...`);
  const replyMessage = await respond(ctx, { embeds: [startEmbed] });

  try {
    const res = await axios.post(`${ollamaHost}/api/generate`, {
      model,
      prompt: query,
      stream: false
    }, { timeout: 45000 });

    const responseText = res.data.response || 'No response returned from model.';
    
    // Chunk output for Discord limits
    const chunks = responseText.match(/[\s\S]{1,1950}/g) || [responseText];
    
    const embed = buildEmbed(`Ollama: ${model}`, chunks[0], [
      { name: 'Prompt', value: query.length > 256 ? query.slice(0, 253) + '...' : query }
    ]);
    
    await respond(ctx, { embeds: [embed] });
    
    // Post trailing chunks as text if they exceed 1 chunk
    for (let i = 1; i < chunks.length; i++) {
      if (ctx.channel) {
        await ctx.channel.send({ content: chunks[i] });
      }
    }
  } catch (err) {
    const errorEmbed = buildEmbed('Ollama Error', `Failed to execute request:\n\`\`\`\n${err.message}\n\`\`\``, [], 0xff0000);
    await respond(ctx, { embeds: [errorEmbed] });
  }
}

// Helper: Xipra Virtual Reality assistant prompt system
async function runXipra(ctx, query) {
  const model = config.defaultOllamaModel || 'llama3';
  const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  
  const systemPrompt = `You are "Xipra", a helpful, highly intelligent virtual reality assistant.
Your expertise is in VR headsets (Quest, Valve Index, HTC Vive, Pico, Apple Vision Pro), VR gaming, SteamVR, spatial computing, and VR hardware diagnostics.
Keep your answers engaging, informative, and technical but easy to understand.`;

  const startEmbed = buildEmbed('Consulting Xipra', 'Asking your virtual reality assistant...');
  await respond(ctx, { embeds: [startEmbed] });

  try {
    const res = await axios.post(`${ollamaHost}/api/generate`, {
      model,
      system: systemPrompt,
      prompt: query,
      stream: false
    }, { timeout: 45000 });

    const responseText = res.data.response || 'Xipra had no reply.';
    const embed = buildEmbed('Xipra VR Assistant', responseText, [
      { name: 'Query', value: query }
    ], 0x00ffcc);
    
    await respond(ctx, { embeds: [embed] });
  } catch (err) {
    const errorEmbed = buildEmbed('Xipra Offline', `Failed to invoke local prompt system:\n\`\`\`\n${err.message}\n\`\`\``, [], 0xff0000);
    await respond(ctx, { embeds: [errorEmbed] });
  }
}

// Helper: Fal.ai text-to-video API
async function runFalVideo(ctx, apikey, prompt) {
  const hashedKey = sha512(apikey);
  const statusEmbed = buildEmbed(
    'Fal.ai Video Gen (LTX-2.3 Fast)',
    `Key Hashed: ||${hashedKey.slice(0, 12)}...${hashedKey.slice(-12)}||\nStarting generation pipeline...`
  );
  
  await respond(ctx, { embeds: [statusEmbed] });

  try {
    const response = await axios.post(
      'https://queue.fal.run/fal-ai/ltx-2.3/text-to-video/fast', 
      { prompt },
      {
        headers: {
          'Authorization': `Key ${apikey}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000
      }
    );

    // Fal queue workflow - Poll for result
    const request_id = response.data.request_id;
    let videoUrl = null;
    let attempts = 0;
    
    while (!videoUrl && attempts < 25) {
      await new Promise(r => setTimeout(r, 4000));
      const statusRes = await axios.get(`https://queue.fal.run/fal-ai/ltx-2.3/text-to-video/fast/requests/${request_id}`, {
        headers: { 'Authorization': `Key ${apikey}` }
      });
      
      if (statusRes.data.status === 'COMPLETED') {
        videoUrl = statusRes.data.results?.video?.url || statusRes.data.results?.outputs?.[0]?.file?.url;
        break;
      } else if (statusRes.data.status === 'FAILED') {
        throw new Error(`Fal.ai pipeline failed: ${JSON.stringify(statusRes.data.logs)}`);
      }
      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Fal.ai request timed out.');
    }

    const successEmbed = buildEmbed(
      'Fal.ai Video Generated Successfully (LTX-2.3)',
      `Prompt: *${prompt}*\n[Download Video Link](${videoUrl})`,
      [],
      0x00ff00
    );
    await respond(ctx, { embeds: [successEmbed], content: videoUrl });
  } catch (err) {
    const errorEmbed = buildEmbed('Fal.ai Video Error', `Generation failed:\n\`\`\`\n${err.message}\n\`\`\``, [], 0xff0000);
    await respond(ctx, { embeds: [errorEmbed] });
  }
}

// Helper: Fal.ai text-to-image API
async function runFalImage(ctx, apikey, prompt) {
  const hashedKey = sha512(apikey);
  const statusEmbed = buildEmbed(
    'Fal.ai Image Gen (FLUX.1 schnell)',
    `Key Hashed: ||${hashedKey.slice(0, 12)}...${hashedKey.slice(-12)}||\nStarting generation pipeline...`
  );
  await respond(ctx, { embeds: [statusEmbed] });

  try {
    const res = await axios.post(
      'https://queue.fal.run/fal-ai/flux-1/schnell', 
      { prompt, sync_mode: true },
      {
        headers: {
          'Authorization': `Key ${apikey}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000
      }
    );

    const imageUrl = res.data.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Failed to capture generated image link from response.');
    }

    const successEmbed = buildEmbed(
      'Fal.ai Image Generated Successfully (FLUX.1)',
      `Prompt: *${prompt}*`,
      [],
      0x00ff00
    );
    successEmbed.setImage(imageUrl);
    await respond(ctx, { embeds: [successEmbed] });
  } catch (err) {
    const errorEmbed = buildEmbed('Fal.ai Image Error', `Generation failed:\n\`\`\`\n${err.message}\n\`\`\``, [], 0xff0000);
    await respond(ctx, { embeds: [errorEmbed] });
  }
}

// Helper: Fal.ai flux/schnell/redux API for Image Editing
async function runFalImageEdit(ctx, apikey, prompt, imageUrl) {
  const hashedKey = sha512(apikey);
  const statusEmbed = buildEmbed(
    'Fal.ai Image Edit (FLUX.1 Redux)',
    `Key Hashed: ||${hashedKey.slice(0, 12)}...${hashedKey.slice(-12)}||\nSending modification request...`
  );
  await respond(ctx, { embeds: [statusEmbed] });

  try {
    const res = await axios.post(
      'https://queue.fal.run/fal-ai/flux/schnell/redux', 
      { 
        image_url: imageUrl,
        prompt: prompt,
        sync_mode: true
      },
      {
        headers: {
          'Authorization': `Key ${apikey}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000
      }
    );

    const outputUrl = res.data.images?.[0]?.url;
    if (!outputUrl) {
      throw new Error('No output image returned from the image mutation API.');
    }

    const successEmbed = buildEmbed(
      'Fal.ai Image Modified (FLUX.1 Redux)',
      `Instruction: *${prompt}*`,
      [],
      0x00ff00
    );
    successEmbed.setImage(outputUrl);
    await respond(ctx, { embeds: [successEmbed] });
  } catch (err) {
    const errorEmbed = buildEmbed('Fal.ai Image Edit Error', `Modification failed:\n\`\`\`\n${err.message}\n\`\`\``, [], 0xff0000);
    await respond(ctx, { embeds: [errorEmbed] });
  }
}
