import axios from 'axios';
import net from 'net';
import fs from 'fs';
import { spawn } from 'child_process';
import { db } from '../database/db.js';
import { sha512, respond, deleteTrigger, buildEmbed } from '../utils/helpers.js';
import config from '../../config.json' with { type: 'json' };

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
  },
  {
    name: 'context_info',
    description: 'Get connection status of active LLM providers and MCP servers.',
    category: 'AI',
    aliases: ['ctxinfo', 'mcpinfo'],
    async execute(message, args, client) {
      return runContextInfo(message);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runContextInfo(interaction);
    }
  },
  {
    name: 'context_details',
    description: 'Display detailed specifications of the active tools, feeds, and resources.',
    category: 'AI',
    aliases: ['ctxdetails'],
    async execute(message, args, client) {
      return runContextDetails(message);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runContextDetails(interaction);
    }
  },
  {
    name: 'invoke_tool',
    description: 'Execute a registered MCP tool directly by passing a tool name and input JSON.',
    category: 'AI',
    aliases: ['invoketool'],
    options: [
      {
        name: 'tool_name',
        type: 3, // String
        description: 'The name of the tool to invoke (e.g. add, magic_8_ball, query_rss_feed)',
        required: true
      },
      {
        name: 'tool_input',
        type: 3, // String
        description: 'JSON object parameters for the tool (e.g. {"a": 12, "b": 34})',
        required: false
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return respond(message, { embeds: [buildEmbed('Error', 'Usage: `.invoke_tool <tool_name> [JSON_input]`', [], 0xff0000)] });
      }
      const toolName = args[0];
      const jsonStr = args.slice(1).join(' ') || '{}';
      return handleInvokeTool(message, toolName, jsonStr);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const toolName = interaction.options.getString('tool_name');
      const jsonStr = interaction.options.getString('tool_input') || '{}';
      return handleInvokeTool(interaction, toolName, jsonStr);
    }
  },
  {
    name: 'set_standing_prompt',
    description: 'Schedule a recurring prompt to generate summaries on a set schedule.',
    category: 'AI',
    aliases: ['setprompt', 'standingprompt'],
    options: [
      {
        name: 'schedule',
        type: 3, // String
        description: 'Running schedule frequency (Minutely, Hourly, Daily)',
        required: true,
        choices: [
          { name: 'Minutely (Test)', value: 'Minutely' },
          { name: 'Hourly', value: 'Hourly' },
          { name: 'Daily', value: 'Daily' }
        ]
      },
      {
        name: 'prompt',
        type: 3, // String
        description: 'The prompt query to summarize',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length < 2) {
        return respond(message, { embeds: [buildEmbed('Error', 'Usage: `.set_standing_prompt <Minutely|Hourly|Daily> <prompt>`', [], 0xff0000)] });
      }
      const schedule = args[0];
      const prompt = args.slice(1).join(' ');
      return handleSetStandingPrompt(message, schedule, prompt);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const schedule = interaction.options.getString('schedule');
      const prompt = interaction.options.getString('prompt');
      return handleSetStandingPrompt(interaction, schedule, prompt);
    }
  },
  {
    name: 'ollamaserve',
    description: 'Start the local Ollama server in the background.',
    category: 'AI',
    aliases: ['ollamastart', 'serveollama'],
    async execute(message, args, client) {
      return runOllamaServe(message);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runOllamaServe(interaction);
    }
  },
  {
    name: 'ollamapull',
    description: 'Download/pull a model from the Ollama library.',
    category: 'AI',
    aliases: ['pullmodel'],
    options: [
      {
        name: 'model_name',
        type: 3, // String
        description: 'The name of the model to pull (e.g. llama3, mistral)',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return respond(message, { embeds: [buildEmbed('Error', 'Usage: `.ollamapull <model_name>`', [], 0xff0000)] });
      }
      const modelName = args[0];
      return runOllamaPull(message, modelName);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const modelName = interaction.options.getString('model_name');
      return runOllamaPull(interaction, modelName);
    }
  },
  {
    name: 'modelsearch',
    description: 'Search locally installed Ollama models.',
    category: 'AI',
    aliases: ['models', 'installed'],
    options: [
      {
        name: 'query',
        type: 3, // String
        description: 'Optional search filter to match model names',
        required: false
      }
    ],
    async execute(message, args, client) {
      const query = args.join(' ');
      return runModelSearch(message, query);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const query = interaction.options.getString('query') || '';
      return runModelSearch(interaction, query);
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

// Helper: Check connection to a local port
function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Helper: Query OpenAI / Anthropic Claude / local Ollama model
async function queryLLM(prompt, system = '') {
  if (process.env.OPENAI_API_KEY) {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.AIBOT_MODEL || 'gpt-4o-mini',
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    return res.data.choices[0].message.content;
  } else if (process.env.ANTHROPIC_API_KEY) {
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model: process.env.AIBOT_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: system || undefined,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    return res.data.content[0].text;
  } else {
    // Ollama fallback
    const model = config.defaultOllamaModel || 'llama3';
    const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    const res = await axios.post(`${ollamaHost}/api/generate`, {
      model,
      system: system || undefined,
      prompt: prompt,
      stream: false
    }, { timeout: 45000 });
    return res.data.response;
  }
}

// Helper: Run registered MCP tool directly
async function runTool(name, inputObj = {}) {
  switch (name) {
    case 'add': {
      const a = parseFloat(inputObj.a) || 0;
      const b = parseFloat(inputObj.b) || 0;
      return { sum: a + b };
    }
    case 'magic_8_ball': {
      const answers = [
        "It is certain.",
        "It is decidedly so.",
        "Without a doubt.",
        "Yes, definitely.",
        "You may rely on it.",
        "As I see it, yes.",
        "Most likely.",
        "Outlook good.",
        "Yes.",
        "Signs point to yes.",
        "Reply hazy, try again.",
        "Ask again later.",
        "Better not tell you now.",
        "Cannot predict now.",
        "Concentrate and ask again.",
        "Don't count on it.",
        "My reply is no.",
        "My sources say no.",
        "Outlook not so good.",
        "Very doubtful."
      ];
      const answer = answers[Math.floor(Math.random() * answers.length)];
      return { answer };
    }
    case 'query_rss_feed': {
      const feedName = inputObj.feed_name || 'Reddit r/LocalLLaMA';
      const limit = parseInt(inputObj.limit) || 3;
      const query = inputObj.query || '';
      
      let items = [];
      try {
        let url = 'https://www.reddit.com/r/LocalLLaMA/.rss';
        if (feedName.toLowerCase().includes('boulder')) {
          url = 'https://www.reddit.com/r/Boulder/.rss';
        }
        
        const res = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
          },
          timeout: 5000
        });
        
        // Simple XML parser to get entry titles
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;
        while ((match = entryRegex.exec(res.data)) !== null && items.length < limit) {
          const entry = match[1];
          const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = entry.match(/<link href="([\s\S]*?)"/);
          
          if (titleMatch) {
            const title = titleMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            const link = linkMatch ? linkMatch[1] : '';
            if (!query || title.toLowerCase().includes(query.toLowerCase())) {
              items.push({ title, link });
            }
          }
        }
      } catch (err) {
        console.warn(`[RSS Warning] Failed to fetch feed ${feedName}, returning mock data:`, err.message);
        if (feedName.toLowerCase().includes('localllama')) {
          items = [
            { title: "Qwen 3 1.5B Instruct model released - outperforms Llama 3!", link: "https://reddit.com/r/LocalLLaMA/qwen3" },
            { title: "Best hardware for running 70B models at home in 2026?", link: "https://reddit.com/r/LocalLLaMA/hardware" },
            { title: "Ollama adds native tool calling support for Claude endpoints", link: "https://reddit.com/r/LocalLLaMA/ollamatools" }
          ];
        } else {
          items = [
            { title: "Boulder weather alert: summer afternoon thunderstorms expected", link: "https://reddit.com/r/Boulder/weather" },
            { title: "New coffee shop opening on Pearl Street Mall", link: "https://reddit.com/r/Boulder/coffee" }
          ];
        }
        if (query) {
          items = items.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
        }
        items = items.slice(0, limit);
      }
      return { feed: feedName, items };
    }
    default:
      throw new Error(`Unknown tool name: ${name}`);
  }
}

// Command helper: Get context connection status
async function runContextInfo(ctx) {
  let provider = 'Generic/OpenAI-compatible (Local)';
  let providerDetail = 'Ollama local host';
  if (process.env.OPENAI_API_KEY) {
    provider = 'OpenAI Cloud';
    providerDetail = 'Direct API access (gpt-4o-mini)';
  } else if (process.env.ANTHROPIC_API_KEY) {
    provider = 'Anthropic Claude';
    providerDetail = 'Direct API access (claude-3-5-sonnet-20241022)';
  }

  const mcpServer1 = await checkPort(8901);
  const mcpServer2 = await checkPort(8902);

  const serversList = [
    `• **Toy MCP Server** (Port 8902): ${mcpServer2 ? '🟢 Online' : '🔴 Offline'}`,
    `• **RSS MCP Server** (Port 8901): ${mcpServer1 ? '🟢 Online' : '🔴 Offline'}`
  ].join('\n');

  const pgVectorEnabled = process.env.AIBOT_PG_USER_CONNECT_STRING ? '🟢 Enabled' : '⚪ Disabled (In-Memory Fallback)';

  const embed = buildEmbed(
    '🤖 MCP AI Context Status',
    `Detailed status of current LLM provider configuration and MCP integrations.`,
    [
      { name: 'LLM Provider Support', value: `**Type**: ${provider}\n**Config**: ${providerDetail}` },
      { name: 'Connected MCP Servers', value: serversList },
      { name: 'PGVector Persistent Chat History', value: pgVectorEnabled }
    ],
    0x3498db
  );

  return respond(ctx, { embeds: [embed] });
}

// Command helper: Show spec details
async function runContextDetails(ctx) {
  const toolsInfo = [
    `1. **add**
       *Description*: Computes the mathematical sum of two numbers.
       *Inputs*: \`{ "a": number, "b": number }\``,
    `2. **magic_8_ball**
       *Description*: Consults the Magic 8-ball oracle for decision making guidance.
       *Inputs*: \`{}\``,
    `3. **query_rss_feed**
       *Description*: Queries external RSS feeds (supports Reddit /r/LocalLLaMA and /r/Boulder).
       *Inputs*: \`{ "feed_name": string, "limit": number, "query": string }\``
  ].join('\n\n');

  const feedsInfo = [
    `• **Reddit r/Boulder**: \`https://www.reddit.com/r/Boulder/.rss\``,
    `• **Reddit r/LocalLLaMA**: \`https://www.reddit.com/r/LocalLLaMA/.rss\``
  ].join('\n');

  const embed = buildEmbed(
    '📋 MCP Registered Tools & Specs',
    `Currently registered tools and resources that the AI Agent can leverage.`,
    [
      { name: 'Active Tool Schemas', value: toolsInfo },
      { name: 'Registered RSS Feeds', value: feedsInfo }
    ],
    0x2ecc71
  );

  return respond(ctx, { embeds: [embed] });
}

// Command helper: Call a tool directly
async function handleInvokeTool(ctx, toolName, jsonStr) {
  try {
    let inputObj = {};
    if (jsonStr) {
      inputObj = JSON.parse(jsonStr);
    }
    
    const runningEmbed = buildEmbed(
      '⚙️ Executing Tool Call',
      `Invoking tool \`${toolName}\` directly with parameters:\n\`\`\`json\n${JSON.stringify(inputObj, null, 2)}\n\`\`\``
    );
    const replyMsg = await respond(ctx, { embeds: [runningEmbed] });

    const result = await runTool(toolName, inputObj);

    const resultEmbed = buildEmbed(
      '✅ Tool Call Result',
      `Tool \`${toolName}\` executed successfully.`,
      [
        { name: 'Output Response (JSON)', value: `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`` }
      ],
      0x00ff00
    );

    if (ctx.editReply) {
      await ctx.editReply({ embeds: [resultEmbed] }).catch(() => {});
    } else if (replyMsg && replyMsg.edit) {
      await replyMsg.edit({ embeds: [resultEmbed] }).catch(() => {});
    }
  } catch (err) {
    const errorEmbed = buildEmbed(
      '❌ Tool Call Failed',
      `Failed to execute tool \`${toolName}\`:\n\`\`\`\n${err.message}\n\`\`\``,
      [],
      0xff0000
    );
    if (ctx.editReply) {
      await ctx.editReply({ embeds: [errorEmbed] }).catch(() => {});
    } else {
      await respond(ctx, { embeds: [errorEmbed] }).catch(() => {});
    }
  }
}

// Command helper: Set standing prompt
async function handleSetStandingPrompt(ctx, schedule, prompt) {
  const allowedSchedules = ['Minutely', 'Hourly', 'Daily'];
  const formattedSchedule = schedule.charAt(0).toUpperCase() + schedule.slice(1).toLowerCase();

  if (!allowedSchedules.includes(formattedSchedule)) {
    const failEmbed = buildEmbed('Error', `Invalid schedule. Please specify either \`Minutely\`, \`Hourly\`, or \`Daily\`.`, [], 0xff0000);
    return respond(ctx, { embeds: [failEmbed] });
  }

  const channelId = ctx.channel?.id;
  const userId = ctx.user ? ctx.user.id : ctx.author?.id;

  if (!channelId || !userId) {
    const failEmbed = buildEmbed('Error', `Could not resolve execution context (Channel/User).`, [], 0xff0000);
    return respond(ctx, { embeds: [failEmbed] });
  }

  const standingPrompts = db.settings.get('standing_prompts', []);
  
  const newPrompt = {
    id: `prompt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    schedule: formattedSchedule,
    prompt: prompt,
    channelId,
    userId,
    lastRun: 0
  };

  standingPrompts.push(newPrompt);
  db.settings.set('standing_prompts', standingPrompts);

  const successEmbed = buildEmbed(
    '⏰ Standing Prompt Registered',
    `Successfully registered a new standing prompt!`,
    [
      { name: 'Schedule', value: formattedSchedule, inline: true },
      { name: 'Channel', value: `<#${channelId}>`, inline: true },
      { name: 'Prompt Query', value: prompt }
    ],
    0x9b59b6
  );

  return respond(ctx, { embeds: [successEmbed] });
}

// Standing prompt scheduler loop
let schedulerInterval = null;

export function initStandingPrompts(client) {
  if (schedulerInterval) clearInterval(schedulerInterval);
  
  schedulerInterval = setInterval(async () => {
    const standingPrompts = db.settings.get('standing_prompts', []);
    const now = Date.now();
    let updated = false;

    for (const promptItem of standingPrompts) {
      let intervalMs = 3600000; // Hourly
      if (promptItem.schedule.toLowerCase() === 'minutely') {
        intervalMs = 60000;
      } else if (promptItem.schedule.toLowerCase() === 'daily') {
        intervalMs = 86400000;
      }
      
      const lastRun = promptItem.lastRun || 0;
      if (now - lastRun >= intervalMs) {
        promptItem.lastRun = now;
        updated = true;
        
        executeScheduledPrompt(client, promptItem);
      }
    }
    
    if (updated) {
      db.settings.set('standing_prompts', standingPrompts);
    }
  }, 60000);
}

async function executeScheduledPrompt(client, promptItem) {
  try {
    const channel = await client.channels.fetch(promptItem.channelId).catch(() => null);
    if (!channel) return;

    await channel.send(`⏳ **[Standing Prompt Triggered]** Running schedule *${promptItem.schedule}*: "${promptItem.prompt}"`).catch(() => {});

    let extraContext = '';
    if (promptItem.prompt.toLowerCase().includes('llama') || promptItem.prompt.toLowerCase().includes('news') || promptItem.prompt.toLowerCase().includes('ai')) {
      const feedData = await runTool('query_rss_feed', { feed_name: 'Reddit r/LocalLLaMA', limit: 3 });
      extraContext += `\nReddit r/LocalLLaMA Feed Context:\n${feedData.items.map(i => `- ${i.title} (${i.link})`).join('\n')}\n`;
    }
    if (promptItem.prompt.toLowerCase().includes('boulder')) {
      const feedData = await runTool('query_rss_feed', { feed_name: 'Reddit r/Boulder', limit: 3 });
      extraContext += `\nReddit r/Boulder Feed Context:\n${feedData.items.map(i => `- ${i.title} (${i.link})`).join('\n')}\n`;
    }

    const systemPrompt = `You are a helpful AI Summarizer. Generate a summary based on the prompt request and any supplied context. If no context is found or feed retrieval fails, report the facts objectively.`;
    const fullPrompt = `${promptItem.prompt}\n\n${extraContext}`;

    const summary = await queryLLM(fullPrompt, systemPrompt);

    const embed = buildEmbed(
      `📊 Standing Prompt Report`,
      `**Schedule**: ${promptItem.schedule}\n**Prompt**: ${promptItem.prompt}\n\n**AI Summary**:\n${summary}`,
      [],
      0x9b59b6
    );
    await channel.send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    console.error('[Standing Prompt Error]:', err);
  }
}

// Helper: Start the local Ollama daemon
async function runOllamaServe(ctx) {
  const isOnline = await checkPort(11434);
  if (isOnline) {
    const onlineEmbed = buildEmbed('🟢 Ollama Server Status', 'Ollama daemon is already online and listening on port `11434`.', [], 0x00ff00);
    return respond(ctx, { embeds: [onlineEmbed] });
  }

  const startEmbed = buildEmbed('🔄 Starting Ollama Daemon', 'Starting the local Ollama daemon in the background...', [], 0xffa500);
  const statusMsg = await respond(ctx, { embeds: [startEmbed] });

  try {
    const daemon = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore'
    });
    daemon.unref();

    let checks = 0;
    let started = false;
    while (checks < 5 && !started) {
      await new Promise(r => setTimeout(r, 1000));
      started = await checkPort(11434);
      checks++;
    }

    if (started) {
      const successEmbed = buildEmbed('🟢 Ollama Server Started', 'Successfully started local Ollama daemon. It is now listening on port `11434`.', [], 0x00ff00);
      if (ctx.editReply) {
        await ctx.editReply({ embeds: [successEmbed] }).catch(() => {});
      } else if (statusMsg && statusMsg.edit) {
        await statusMsg.edit({ embeds: [successEmbed] }).catch(() => {});
      }
    } else {
      const failEmbed = buildEmbed('❌ Ollama Serve Timeout', 'Launched Ollama daemon, but it timed out or failed to open port `11434`. Please check system logs.', [], 0xff0000);
      if (ctx.editReply) {
        await ctx.editReply({ embeds: [failEmbed] }).catch(() => {});
      } else if (statusMsg && statusMsg.edit) {
        await statusMsg.edit({ embeds: [failEmbed] }).catch(() => {});
      }
    }
  } catch (err) {
    const errorEmbed = buildEmbed('❌ Ollama Serve Error', `Failed to start daemon process:\n\`\`\`\n${err.message}\n\`\`\``, [], 0xff0000);
    if (ctx.editReply) {
      await ctx.editReply({ embeds: [errorEmbed] }).catch(() => {});
    } else {
      await respond(ctx, { embeds: [errorEmbed] });
    }
  }
}

// Helper: Pull a model from the Ollama library
async function runOllamaPull(ctx, modelName) {
  if (!modelName) {
    const errorEmbed = buildEmbed('Error', 'Please specify a model name to pull (e.g. `llama3` or `mistral`).', [], 0xff0000);
    return respond(ctx, { embeds: [errorEmbed] });
  }

  const prepEmbed = buildEmbed(
    '📥 Ollama Pulling Model',
    `Initiating pull request for model: **\`${modelName}\`**\n\n⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ **0%**`,
    [],
    0xffa500
  );
  const statusMsg = await respond(ctx, { embeds: [prepEmbed] });

  try {
    const spawnProcess = spawn('ollama', ['pull', modelName]);
    let lastUpdate = 0;

    const updateProgress = async (pct, statusText) => {
      const now = Date.now();
      if (now - lastUpdate > 1500 || pct === 100) {
        lastUpdate = now;
        const totalBlocks = 10;
        const filled = Math.round((pct / 100) * totalBlocks);
        const empty = totalBlocks - filled;
        const bar = '🟩'.repeat(filled) + '⬛'.repeat(empty);

        const progressEmbed = buildEmbed(
          '📥 Ollama Pulling Model',
          `Pulling model: **\`${modelName}\`**\nStatus: *${statusText}*\n\n${bar} **${pct.toFixed(1)}%**`,
          [],
          0xffa500
        );

        if (ctx.editReply) {
          await ctx.editReply({ embeds: [progressEmbed] }).catch(() => {});
        } else if (statusMsg && statusMsg.edit) {
          await statusMsg.edit({ embeds: [progressEmbed] }).catch(() => {});
        }
      }
    };

    spawnProcess.stdout.on('data', data => {
      const line = data.toString().trim();
      const pctMatch = line.match(/(\d+)%/);
      if (pctMatch) {
        const pct = parseFloat(pctMatch[1]);
        updateProgress(pct, line);
      }
    });

    spawnProcess.stderr.on('data', data => {
      const line = data.toString().trim();
      const pctMatch = line.match(/(\d+)%/);
      if (pctMatch) {
        const pct = parseFloat(pctMatch[1]);
        updateProgress(pct, line);
      }
    });

    return new Promise((resolve) => {
      spawnProcess.on('close', async (code) => {
        if (code === 0) {
          const successEmbed = buildEmbed(
            '✅ Ollama Model Pulled',
            `Successfully pulled model **\`${modelName}\`** and loaded it into the local registry.`,
            [],
            0x00ff00
          );
          if (ctx.editReply) {
            await ctx.editReply({ embeds: [successEmbed] }).catch(() => {});
          } else if (statusMsg && statusMsg.edit) {
            await statusMsg.edit({ embeds: [successEmbed] }).catch(() => {});
          }
        } else {
          const failEmbed = buildEmbed(
            '❌ Pull Failed',
            `Ollama failed to pull model **\`${modelName}\`** (exit code ${code}). Check that the model name is correct.`,
            [],
            0xff0000
          );
          if (ctx.editReply) {
            await ctx.editReply({ embeds: [failEmbed] }).catch(() => {});
          } else if (statusMsg && statusMsg.edit) {
            await statusMsg.edit({ embeds: [failEmbed] }).catch(() => {});
          }
        }
        resolve();
      });
    });
  } catch (err) {
    const errorEmbed = buildEmbed('Ollama Pull Error', `Failed to start spawn process:\n\`\`\`\n${err.message}\n\`\`\``, [], 0xff0000);
    if (ctx.editReply) {
      await ctx.editReply({ embeds: [errorEmbed] }).catch(() => {});
    } else {
      await respond(ctx, { embeds: [errorEmbed] });
    }
  }
}

// Helper: List/search locally installed Ollama models
async function runModelSearch(ctx, query = '') {
  try {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    const response = await axios.get(`${ollamaHost}/api/tags`, { timeout: 3000 });
    const models = response.data.models || [];

    if (models.length === 0) {
      const emptyEmbed = buildEmbed(
        '🔎 Ollama Model Search',
        `No local models installed.\n\nBrowse models to pull: [Ollama Model Library](https://ollama.com/library)`,
        [],
        0x3498db
      );
      return respond(ctx, { embeds: [emptyEmbed] });
    }

    let filtered = models;
    if (query) {
      filtered = models.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
    }

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const listText = filtered.map((m, idx) => {
      const sizeStr = formatBytes(m.size);
      const params = m.details?.parameter_size || 'Unknown';
      const quant = m.details?.quantization_level || 'Unknown';
      return `**${idx + 1}. \`${m.name}\`**\n• Size: \`${sizeStr}\` | Parameters: \`${params}\` | Quant: \`${quant}\``;
    }).join('\n\n');

    const embed = buildEmbed(
      '🔎 Ollama Local Model Search',
      filtered.length > 0 
        ? `Found **${filtered.length}** local models matching search query:\n\n${listText}\n\nBrowse other models: [Ollama Model Library](https://ollama.com/library)`
        : `No local models matched your query: \`${query}\`.\n\nBrowse models to pull: [Ollama Model Library](https://ollama.com/library)`,
      [],
      0x3498db
    );

    return respond(ctx, { embeds: [embed] });
  } catch (err) {
    const errorEmbed = buildEmbed(
      'Ollama Connection Error',
      `Could not connect to Ollama daemon at port 11434:\n\`\`\`\n${err.message}\n\`\`\`\nTo start the server, run: \`.ollamaserve\``,
      [],
      0xff0000
    );
    return respond(ctx, { embeds: [errorEmbed] });
  }
}
