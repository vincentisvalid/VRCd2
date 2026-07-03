import os

media_js_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/commands/media.js'))

content = """import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AttachmentBuilder } from 'discord.js';
import { respond, buildEmbed, downloadFile } from '../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_DIR = path.join(__dirname, '../../tmp');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

export default [
  {
    name: 'media',
    description: 'Lists all available media processing filters and commands.',
    category: 'Media Effects',
    async execute(message, args) {
      return runMediaHelp(message);
    },
    async executeSlash(interaction) {
      return runMediaHelp(interaction);
    }
  },
  {
    name: 'valentine',
    description: 'Generates an animated heart opening GIF from any image.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args) {
      return runValentineGif(message);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runValentineGif(interaction);
    }
  },
  {
    name: 'rainbow',
    description: 'Apply an animated cycling rainbow RGB gradient overlay.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runRainbowEffect(message);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runRainbowEffect(interaction);
    }
  },
  {
    name: 'blur',
    description: 'Apply Gaussian blur with adjustable strength parameters.',
    category: 'Media Effects',
    options: [
      { name: 'strength', type: 10, description: 'Blur strength (1-20, default 5)', required: false },
      { name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }
    ],
    async execute(message, args) {
      const strength = args[0] ? parseFloat(args[0]) : 5;
      return runFFmpegCommand(message, `-vf "gblur=sigma=${strength}"`, 'blur');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      const strength = interaction.options.getNumber('strength') || 5;
      return runFFmpegCommand(interaction, `-vf "gblur=sigma=${strength}"`, 'blur');
    }
  },
  {
    name: 'toaster',
    description: 'Apply high-quality vintage warm toaster color grading.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "curves=preset=vintage,colorbalance=rs=0.15:gs=0.05:bs=-0.1,vignette=0.2"', 'toaster');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "curves=preset=vintage,colorbalance=rs=0.15:gs=0.05:bs=-0.1,vignette=0.2"', 'toaster');
    }
  },
  {
    name: 'speechbubble',
    description: 'Overlay a transparent speech bubble cutout at the top of the image.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args) {
      return runSpeechBubble(message);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runSpeechBubble(interaction);
    }
  },
  {
    name: 'motivate',
    description: 'Generate a classic motivational poster style frame with text.',
    category: 'Media Effects',
    options: [
      { name: 'top', type: 3, description: 'Top heading text', required: true },
      { name: 'bottom', type: 3, description: 'Bottom sub-heading text', required: true },
      { name: 'url', type: 3, description: 'Image URL or attachment', required: false }
    ],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.motivate <text>` or `.motivate <top> | <bottom>`' });
      const commandName = 'motivate';
      const activePrefix = message.content.startsWith('.') ? '.' : '/';
      const rawText = message.content.slice(activePrefix.length + commandName.length).trim();
      
      let topText = '';
      let bottomText = '';
      
      if (rawText.includes('|')) {
        const parts = rawText.split('|');
        topText = parts[0].trim();
        bottomText = parts[1].trim();
      } else if (rawText.includes(',')) {
        const parts = rawText.split(',');
        topText = parts[0].trim();
        bottomText = parts[1].trim();
      } else {
        const words = rawText.split(/\\s+/).filter(Boolean);
        if (words.length === 1) {
          topText = words[0];
          bottomText = '';
        } else {
          const half = Math.ceil(words.length / 2);
          topText = words.slice(0, half).join(' ');
          bottomText = words.slice(half).join(' ');
        }
      }
      
      // Clean quotes
      topText = topText.replace(/^["']|["']$/g, '');
      bottomText = bottomText.replace(/^["']|["']$/g, '');
      
      return runMotivate(message, topText, bottomText);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      const top = interaction.options.getString('top');
      const bottom = interaction.options.getString('bottom');
      return runMotivate(interaction, top, bottom);
    }
  },
  {
    name: 'rubiks',
    description: 'Transform media into Rubiks cube square block grids.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "scale=120:120,scale=600:600:flags=neighbor,drawgrid=w=60:h=60:t=2:c=black"', 'rubiks');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "scale=120:120,scale=600:600:flags=neighbor,drawgrid=w=60:h=60:t=2:c=black"', 'rubiks');
    }
  },
  {
    name: 'spin',
    description: 'Generate spinning rotation effect on media.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runSpinEffect(message);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runSpinEffect(interaction);
    }
  },
  {
    name: 'bloom',
    description: 'Apply high-end soft bloom lighting contrast overlay.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-filter_complex "[0:v]split[orig][glow];[glow]threshold=180,boxblur=15:15[blurred];[orig][blurred]blend=all_mode=screen:all_opacity=0.6"', 'bloom');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-filter_complex "[0:v]split[orig][glow];[glow]threshold=180,boxblur=15:15[blurred];[orig][blurred]blend=all_mode=screen:all_opacity=0.6"', 'bloom');
    }
  },
  {
    name: 'fortune',
    description: 'Render media nested inside a fortune template frame.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args) {
      return runFortuneFrame(message);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFortuneFrame(interaction);
    }
  },
  {
    name: 'deepfry',
    description: 'Meme style deepfry: high contrast and saturation boost with JPEG artifacts.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "eq=contrast=3.0:saturation=5.0:brightness=-0.05,unsharp=5:5:5.0:5:5:5.0" -q:v 1', 'deepfry');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "eq=contrast=3.0:saturation=5.0:brightness=-0.05,unsharp=5:5:5.0:5:5:5.0" -q:v 1', 'deepfry');
    }
  },
  {
    name: 'flag',
    description: 'Overlay standard flag color maps over media.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args) {
      return runFlagOverlay(message, false);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFlagOverlay(interaction, false);
    }
  },
  {
    name: 'gifmagik',
    description: 'Liquid rescale warp mapping on animated GIFs.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "scale=iw/2:-1,scale=iw*2:-1"', 'gifmagik');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "scale=iw/2:-1,scale=iw*2:-1"', 'gifmagik');
    }
  },
  {
    name: 'meme',
    description: 'Superimpose white text on top and bottom of media.',
    category: 'Media Effects',
    options: [
      { name: 'top', type: 3, description: 'Top text', required: true },
      { name: 'bottom', type: 3, description: 'Bottom text', required: true },
      { name: 'url', type: 3, description: 'Image URL or attachment', required: false }
    ],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Usage: `.meme "top text" "bottom text"`' });
      return runMemeText(message, args[0], args[1]);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      const top = interaction.options.getString('top');
      const bottom = interaction.options.getString('bottom');
      return runMemeText(interaction, top, bottom);
    }
  },
  {
    name: 'flag2',
    description: 'Apply alternate flag color maps (Pride stripes).',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFlagOverlay(message, true);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFlagOverlay(interaction, true);
    }
  },
  {
    name: 'heart',
    description: 'Generate heart outline frames with custom text.',
    category: 'Media Effects',
    options: [
      { name: 'text', type: 3, description: 'Label text', required: true },
      { name: 'url', type: 3, description: 'Image URL or attachment', required: false }
    ],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.heart <text>`' });
      return runHeartBorder(message, args.join(' '));
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      const text = interaction.options.getString('text');
      return runHeartBorder(interaction, text);
    }
  },
  {
    name: 'magik',
    description: 'Warp and liquid distort image maps (content-aware style wave).',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, `-vf "geq=r='r(X+15*sin(2*PI*Y/100),Y)':g='g(X+15*sin(2*PI*Y/100),Y)':b='b(X+15*sin(2*PI*Y/100),Y)'"`, 'magik');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, `-vf "geq=r='r(X+15*sin(2*PI*Y/100),Y)':g='g(X+15*sin(2*PI*Y/100),Y)':b='b(X+15*sin(2*PI*Y/100),Y)'"`, 'magik');
    }
  },
  {
    name: 'caption',
    description: 'Attach a caption header bubble block.',
    category: 'Media Effects',
    options: [
      { name: 'text', type: 3, description: 'Caption label', required: true },
      { name: 'url', type: 3, description: 'Image URL or attachment', required: false }
    ],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Usage: `.caption <text>`' });
      return runCaptionText(message, args.join(' '));
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      const text = interaction.options.getString('text');
      return runCaptionText(interaction, text);
    }
  },
  {
    name: 'circuitboard',
    description: 'Convert media into green electric circuit boards outlines.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "edgedetect=low=0.1:high=0.3,colorbalance=rs=-0.6:gs=0.6:bs=-0.6"', 'circuitboard');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "edgedetect=low=0.1:high=0.3,colorbalance=rs=-0.6:gs=0.6:bs=-0.6"', 'circuitboard');
    }
  },
  {
    name: 'spread',
    description: 'Scatters and spreads pixels randomly.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args) {
      return runSpreadEffect(message);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runSpreadEffect(interaction);
    }
  },
  {
    name: 'swirl',
    description: 'Apply twirl vortex rotation.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "lenscorrection=cx=0.5:cy=0.5:k1=-0.6:k2=0.2"', 'swirl');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "lenscorrection=cx=0.5:cy=0.5:k1=-0.6:k2=0.2"', 'swirl');
    }
  },
  {
    name: 'book',
    description: 'Render inside an opened book template grid.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args) {
      return runBookOverlay(message);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runBookOverlay(interaction);
    }
  },
  {
    name: 'wormhole',
    description: 'Distort media into wormhole tunnels.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "lenscorrection=cx=0.5:cy=0.5:k1=0.4:k2=-0.4"', 'wormhole');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "lenscorrection=cx=0.5:cy=0.5:k1=0.4:k2=-0.4"', 'wormhole');
    }
  },
  {
    name: 'billboard',
    description: 'Project media maps onto outdoor billboards templates.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args) {
      return runBillboardFrame(message);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runBillboardFrame(interaction);
    }
  },
  {
    name: 'pixelate',
    description: 'Reduces resolution using large square pixel blocks.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "scale=iw/16:-1,scale=iw*16:-1:flags=neighbor"', 'pixelate');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "scale=iw/16:-1,scale=iw*16:-1:flags=neighbor"', 'pixelate');
    }
  },
  {
    name: 'tattoo',
    description: 'Superimpose image as skin tattoos using blend multiply overlays.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args) {
      return runTattooEffect(message);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runTattooEffect(interaction);
    }
  },
  {
    name: 'fisheye',
    description: 'Simulates wide angle focal length lenses.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22"', 'fisheye');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22"', 'fisheye');
    }
  },
  {
    name: 'neon',
    description: 'Add glowing neon border edge mappings.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "edgedetect=low=0.1:high=0.3,hue=h=180:s=2"', 'neon');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "edgedetect=low=0.1:high=0.3,hue=h=180:s=2"', 'neon');
    }
  },
  {
    name: 'grayscale',
    description: 'Convert media to gray monochrome.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "format=gray"', 'grayscale');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "format=gray"', 'grayscale');
    }
  },
  {
    name: 'invert',
    description: 'Negate and invert color maps.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "negate"', 'inverted');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "negate"', 'inverted');
    }
  },
  {
    name: 'zoom',
    description: 'Zooms and crops center region scales.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "scale=2*iw:-1,crop=iw/2:ih/2"', 'zoom');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "scale=2*iw:-1,crop=iw/2:ih/2"', 'zoom');
    }
  },
  {
    name: 'speed',
    description: 'Increase or decrease video speed.',
    category: 'Media Effects',
    options: [
      { name: 'multiplier', type: 10, description: 'Playback speed factor', required: true },
      { name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }
    ],
    async execute(message, args) {
      const mult = args[0] ? parseFloat(args[0]) : 1.5;
      return runSpeedup(message, mult);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      const mult = interaction.options.getNumber('multiplier') || 1.5;
      return runSpeedup(interaction, mult);
    }
  },
  {
    name: 'zoomblur',
    description: 'Generate high-quality radial zoom motion blur overlays.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args) {
      return runZoomBlur(message);
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runZoomBlur(interaction);
    }
  },
  {
    name: 'glitch',
    description: 'Apply digital channel split and block shift glitches.',
    category: 'Media Effects',
    aliases: ['corrupt'],
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args, client) {
      return runGlitchEffect(message);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runGlitchEffect(interaction);
    }
  },
  {
    name: 'ascii',
    description: 'Convert an attached image into Monospace ASCII Art.',
    category: 'Media Effects',
    aliases: ['textart'],
    options: [{ name: 'url', type: 3, description: 'Image URL or attachment', required: false }],
    async execute(message, args, client) {
      return runAsciiCommand(message);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runAsciiCommand(interaction);
    }
  },
  {
    name: 'vhs',
    description: 'Apply retro VHS noise and tape bleed simulation to media.',
    category: 'Media Effects',
    aliases: ['retro'],
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args, client) {
      return runFFmpegCommand(message, '-vf "colorbalance=rs=0.15:gs=-0.05:bs=-0.1,boxblur=1:1,noise=alls=15:allf=t+u,scale=720:576"', 'vhs');
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "colorbalance=rs=0.15:gs=-0.05:bs=-0.1,boxblur=1:1,noise=alls=15:allf=t+u,scale=720:576"', 'vhs');
    }
  },
  {
    name: 'greenscreen',
    description: 'Replace greenscreen color key with a background image link.',
    category: 'Media Effects',
    aliases: ['chromakey'],
    options: [
      {
        name: 'bg_url',
        type: 3, // String
        description: 'Background image URL',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length === 0) {
        return respond(message, { content: 'Please provide a background image URL. Usage: `.greenscreen <bg_url>`' });
      }
      return runGreenscreen(message, args[0]);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const bgUrl = interaction.options.getString('bg_url');
      return runGreenscreen(interaction, bgUrl);
    }
  },
  {
    name: 'removebg',
    description: 'Remove background by keying out white background pixels.',
    category: 'Media Effects',
    aliases: ['nobg'],
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args, client) {
      return runFFmpegCommand(message, '-vf "colorkey=0xFFFFFF:0.1:0.1,format=rgba"', 'nobg', '.png');
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "colorkey=0xFFFFFF:0.1:0.1,format=rgba"', 'nobg', '.png');
    }
  },
  {
    name: 'cut',
    description: 'Cut a precise segment out of a video file without re-encoding.',
    category: 'Media Effects',
    aliases: ['trim'],
    options: [
      {
        name: 'start',
        type: 3, // String
        description: 'Start time (e.g., 00:15 or 01:20)',
        required: true
      },
      {
        name: 'duration',
        type: 3, // String
        description: 'Duration in seconds or MM:SS format',
        required: true
      }
    ],
    async execute(message, args, client) {
      if (args.length < 2) {
        return respond(message, { content: 'Usage: `.cut <start_time> <duration>` (e.g. `.cut 00:10 15`)' });
      }
      return runCutVideo(message, args[0], args[1]);
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      const start = interaction.options.getString('start');
      const duration = interaction.options.getString('duration');
      return runCutVideo(interaction, start, duration);
    }
  },
  {
    name: 'vredit',
    description: 'Apply Side-By-Side dual circular barrel VR filter.',
    category: 'Media Effects',
    aliases: ['vrfilter'],
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args, client) {
      return runFFmpegCommand(message, '-vf "scale=720:720,lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22[l];movie=\\\'/dev/stdin\\\'[in];[in]scale=720:720,lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22[r];[l][r]hstack"', 'vr_lens');
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "scale=720:720,lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22[l];split[left][right];[left]scale=720:720,lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22[l_lens];[right]scale=720:720,lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22[r_lens];[l_lens][r_lens]hstack"', 'vr_lens');
    }
  }
];

function runMediaHelp(ctx) {
  const fields = [
    { name: 'Filters', value: '`.valentine`, `.rainbow`, `.blur`, `.toaster`, `.speechbubble`, `.bloom`, `.deepfry`, `.magik`, `.pixelate`, `.fisheye`, `.neon`, `.grayscale`, `.invert`, `.zoomblur`' },
    { name: 'Generators & Memes', value: '`.motivate`, `.fortune`, `.meme`, `.heart`, `.caption`, `.billboard`, `.tattoo`' },
    { name: 'Distortions & Warps', value: '`.rubiks`, `.spin`, `.circuitboard`, `.spread`, `.swirl`, `.book`, `.wormhole`' },
    { name: 'Video Operations', value: '`.zoom`, `.speed`, `.greenscreen`, `.removebg`, `.cut`, `.vredit`, `.ascii`' }
  ];
  return respond(ctx, { embeds: [buildEmbed('🎬 VRCd2 Media Processing Engine', 'Select from the following FFmpeg filter presets:', fields, 0x1fc2c2)] });
}

function getAttachment(ctx) {
  const message = ctx.message || ctx;
  if (message.attachments && message.attachments.size > 0) {
    return message.attachments.first();
  }
  return null;
}

async function runFFmpegCommand(ctx, filterString, suffix, forceExt = null) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach a media file (image/video) to execute this command.' });
  }

  const ext = forceExt || path.extname(attachment.name) || '.mp4';
  const inputPath = path.join(TMP_DIR, `input_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `output_${Date.now()}_${suffix}${ext}`);

  try {
    await downloadFile(attachment.url, inputPath);
    const cmd = `ffmpeg -y -i "${inputPath}" ${filterString} -c:a copy "${outputPath}"`;
    await executeShell(cmd);

    const stats = fs.statSync(outputPath);
    if (stats.size > 25 * 1024 * 1024) {
      return respond(ctx, { content: 'Processed file exceeded Discord limits. Try a shorter or smaller input.' });
    }

    const file = new AttachmentBuilder(outputPath, { name: `${suffix}_output${ext}` });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[FFmpeg Exec Error]:', err.message);
    await respond(ctx, { content: `Failed to process video/image. FFmpeg error logged.` });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runAsciiCommand(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment || !/\\\\.(jpg|jpeg|png)$/i.test(attachment.name)) {
    return respond(ctx, { content: 'Please attach a valid image file (PNG/JPG).' });
  }

  const inputPath = path.join(TMP_DIR, `ascii_in_${Date.now()}.png`);
  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const width = 60;
    const height = Math.round((img.height / img.width) * width * 0.55);

    const canvas = createCanvas(width, height);
    const g = canvas.getContext('2d');
    g.drawImage(img, 0, 0, width, height);

    const imgData = g.getImageData(0, 0, width, height).data;
    const asciiChars = '@#S%?*+;:-. ';
    let asciiStr = '';

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const r = imgData[offset];
        const gVal = imgData[offset + 1];
        const b = imgData[offset + 2];
        const brightness = (0.2126 * r + 0.7152 * gVal + 0.0722 * b);
        const charIdx = Math.floor((brightness / 255) * (asciiChars.length - 1));
        asciiStr += asciiChars[charIdx];
      }
      asciiStr += '\\n';
    }

    if (asciiStr.length > 1900) {
      const txtPath = path.join(TMP_DIR, `ascii_${Date.now()}.txt`);
      fs.writeFileSync(txtPath, asciiStr, 'utf-8');
      const file = new AttachmentBuilder(txtPath, { name: 'ascii_art.txt' });
      await respond(ctx, { files: [file] });
      fs.unlinkSync(txtPath);
    } else {
      await respond(ctx, { content: `\`\`\`\\n${asciiStr}\`\`\`` });
    }

  } catch (err) {
    console.error('[ASCII Error]:', err.message);
    await respond(ctx, { content: 'Failed to convert image to ASCII art. Canvas module issues.' });
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
  }
}

async function runCutVideo(ctx, start, duration) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach a video file to cut.' });
  }

  const ext = path.extname(attachment.name) || '.mp4';
  const inputPath = path.join(TMP_DIR, `cut_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `cut_out_${Date.now()}${ext}`);

  try {
    await downloadFile(attachment.url, inputPath);
    const cmd = `ffmpeg -y -ss ${start} -i "${inputPath}" -t ${duration} -c copy "${outputPath}"`;
    await executeShell(cmd);

    const file = new AttachmentBuilder(outputPath, { name: `cut_segment${ext}` });
    await respond(ctx, { files: [file] });
  } catch (err) {
    console.error('[Video Cut Error]:', err.message);
    await respond(ctx, { content: 'Failed to trim video file.' });
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}

async function runGreenscreen(ctx, bgUrl) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach a greenscreen image/video to key.' });
  }

  const ext = path.extname(attachment.name) || '.mp4';
  const inputPath = path.join(TMP_DIR, `gs_in_${Date.now()}${ext}`);
  const bgPath = path.join(TMP_DIR, `gs_bg_${Date.now()}.png`);
  const outputPath = path.join(TMP_DIR, `gs_out_${Date.now()}${ext}`);

  try {
    await downloadFile(attachment.url, inputPath);
    await downloadFile(bgUrl, bgPath);

    const filter = `-filter_complex "[0:v]colorkey=0x00FF00:0.35:0.1[ck];[1:v]scale=iw:ih[bg];[bg][ck]overlay=shortest=1[out]" -map "[out]"`;
    const cmd = `ffmpeg -y -i "${inputPath}" -i "${bgPath}" ${filter} "${outputPath}"`;
    await executeShell(cmd);

    const file = new AttachmentBuilder(outputPath, { name: `greenscreen_composite${ext}` });
    await respond(ctx, { files: [file] });
  } catch (err) {
    console.error('[Greenscreen Error]:', err.message);
    await respond(ctx, { content: 'Failed to composite greenscreen video with background.' });
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(bgPath)) fs.unlinkSync(bgPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}

async function runSpeedup(ctx, speed) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach a video file to change speed.' });
  }

  const ext = path.extname(attachment.name) || '.mp4';
  const inputPath = path.join(TMP_DIR, `speed_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `speed_out_${Date.now()}${ext}`);

  try {
    await downloadFile(attachment.url, inputPath);
    const setptsVal = (1.0 / speed).toFixed(2);
    let filter = `-vf "setpts=${setptsVal}*PTS"`;
    if (speed >= 2.0) {
      filter += ` -af "atempo=2.0"`;
    } else if (speed <= 0.5) {
      filter += ` -af "atempo=0.5"`;
    }
    const cmd = `ffmpeg -y -i "${inputPath}" ${filter} "${outputPath}"`;
    await executeShell(cmd);

    const file = new AttachmentBuilder(outputPath, { name: `speed_${speed}x${ext}` });
    await respond(ctx, { files: [file] });
  } catch (err) {
    console.error('[Video Speed Error]:', err.message);
    await respond(ctx, { content: 'Failed to adjust video speed.' });
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}

function executeShell(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout, stderr });
    });
  });
}

// ---------------------------------------------------------
// CUSTOM PREMIUM ANIMATIONS & OVERLAYS (CANVAS & FFmpeg)
// ---------------------------------------------------------

async function runValentineGif(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image to create the valentine GIF.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `val_in_${Date.now()}${ext}`);
  const frameDir = path.join(TMP_DIR, `val_frames_${Date.now()}`);
  const outputPath = path.join(TMP_DIR, `val_out_${Date.now()}.gif`);

  try {
    await downloadFile(attachment.url, inputPath);
    fs.mkdirSync(frameDir);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = 400;
    const h = Math.round((img.height / img.width) * w);
    const totalFrames = 15;

    for (let i = 0; i < totalFrames; i++) {
      const canvas = createCanvas(w, h);
      const g = canvas.getContext('2d');

      g.fillStyle = '#ff6b8b';
      g.fillRect(0, 0, w, h);

      const t = i / (totalFrames - 1);
      const maxHeartSize = Math.sqrt(w * w + h * h);
      const size = t * maxHeartSize;

      g.save();
      if (size > 5) {
        g.beginPath();
        drawHeartInCenter(g, w / 2, h / 2, size);
        g.clip();
      } else {
        g.beginPath();
        g.rect(0, 0, 0, 0);
        g.clip();
      }

      g.drawImage(img, 0, 0, w, h);
      g.restore();

      const framePath = path.join(frameDir, `frame_${String(i).padStart(3, '0')}.png`);
      fs.writeFileSync(framePath, canvas.toBuffer('image/png'));
    }

    const cmd = `ffmpeg -y -framerate 12 -i "${frameDir}/frame_%03d.png" -vf "split[a][b];[a]palettegen[p];[b][p]paletteuse" "${outputPath}"`;
    await executeShell(cmd);

    const file = new AttachmentBuilder(outputPath, { name: 'valentine.gif' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Valentine GIF Error]:', err.message);
    await respond(ctx, { content: 'Failed to generate Valentine heart opening GIF.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(frameDir)) {
        fs.readdirSync(frameDir).forEach(f => fs.unlinkSync(path.join(frameDir, f)));
        fs.rmdirSync(frameDir);
      }
    } catch (_) {}
  }
}

function drawHeartInCenter(g, cx, cy, size) {
  g.beginPath();
  g.moveTo(cx, cy - size / 4);
  g.bezierCurveTo(cx - size / 2, cy - size, cx - size, cy - size / 3, cx, cy + size * 0.7);
  g.bezierCurveTo(cx + size, cy - size / 3, cx + size / 2, cy - size, cx, cy - size / 4);
  g.closePath();
}

async function runRainbowEffect(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach a media file.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const isVideo = /\\\\.(mp4|mov|m4v|gif)$/i.test(ext);

  if (isVideo) {
    return runFFmpegCommand(ctx, '-vf "hue=h=t*120:s=1.5"', 'rainbow');
  }

  const inputPath = path.join(TMP_DIR, `rb_in_${Date.now()}${ext}`);
  const frameDir = path.join(TMP_DIR, `rb_frames_${Date.now()}`);
  const outputPath = path.join(TMP_DIR, `rb_out_${Date.now()}.gif`);

  try {
    await downloadFile(attachment.url, inputPath);
    fs.mkdirSync(frameDir);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = 400;
    const h = Math.round((img.height / img.width) * w);
    const totalFrames = 12;

    for (let i = 0; i < totalFrames; i++) {
      const canvas = createCanvas(w, h);
      const g = canvas.getContext('2d');

      g.drawImage(img, 0, 0, w, h);

      const hue = (i / totalFrames) * 360;
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = `hsla(${hue}, 100%, 50%, 0.35)`;
      g.fillRect(0, 0, w, h);

      const framePath = path.join(frameDir, `frame_${String(i).padStart(3, '0')}.png`);
      fs.writeFileSync(framePath, canvas.toBuffer('image/png'));
    }

    const cmd = `ffmpeg -y -framerate 10 -i "${frameDir}/frame_%03d.png" -vf "split[a][b];[a]palettegen[p];[b][p]paletteuse" "${outputPath}"`;
    await executeShell(cmd);

    const file = new AttachmentBuilder(outputPath, { name: 'rainbow.gif' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Rainbow GIF Error]:', err.message);
    await respond(ctx, { content: 'Failed to generate cycling rainbow GIF.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(frameDir)) {
        fs.readdirSync(frameDir).forEach(f => fs.unlinkSync(path.join(frameDir, f)));
        fs.rmdirSync(frameDir);
      }
    } catch (_) {}
  }
}

async function runSpeechBubble(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image to create the speech bubble.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `sb_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `sb_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = img.width;
    const h = img.height;
    const headerHeight = Math.max(60, Math.round(h * 0.15));

    const canvas = createCanvas(w, h + headerHeight);
    const g = canvas.getContext('2d');

    g.drawImage(img, 0, headerHeight, w, h);

    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, headerHeight);

    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    
    const cx = w / 2;
    const cy = headerHeight * 0.55;
    const rx = w * 0.42;
    const ry = headerHeight * 0.38;
    g.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    g.fill();

    // Fix speech bubble tail pointing up correctly
    g.beginPath();
    g.moveTo(cx - 20, cy - ry + 5);
    g.lineTo(cx + 20, cy - ry + 5);
    g.lineTo(cx - 15, 0);
    g.closePath();
    g.fill();

    g.globalCompositeOperation = 'source-over';

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'speechbubble.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Speechbubble Error]:', err.message);
    await respond(ctx, { content: 'Failed to apply speechbubble cutout overlay.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runMotivate(ctx, topText, bottomText) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image to create the motivational poster.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `mot_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `mot_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    // Responsive design scaling
    const borderW = Math.max(60, Math.round(img.width * 0.1));
    const borderH = Math.max(160, Math.round(img.height * 0.22));
    const w = img.width + borderW;
    const h = img.height + borderH;

    const canvas = createCanvas(w, h);
    const g = canvas.getContext('2d');

    // Draw black background
    g.fillStyle = '#000000';
    g.fillRect(0, 0, w, h);

    // Draw inner white frame box
    g.strokeStyle = '#ffffff';
    g.lineWidth = Math.max(2, Math.round(w * 0.003));
    g.strokeRect(borderW / 2 - 4, borderW / 2 - 4, img.width + 8, img.height + 8);

    // Draw original image
    g.drawImage(img, borderW / 2, borderW / 2, img.width, img.height);

    // Render texts
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    // Top Header (Title)
    const titleSize = Math.max(20, Math.round(w * 0.05));
    g.font = `bold ${titleSize}px Georgia, serif`;
    const titleY = img.height + borderW/2 + Math.round((borderH - borderW/2) * 0.35);
    g.fillText(topText.toUpperCase(), w / 2, titleY);

    // Bottom Subtext (Subtitle)
    const subSize = Math.max(12, Math.round(w * 0.025));
    g.font = `italic ${subSize}px Georgia, serif`;
    const subY = img.height + borderW/2 + Math.round((borderH - borderW/2) * 0.7);
    g.fillText(bottomText, w / 2, subY);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'motivational.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Motivate Error]:', err.message);
    await respond(ctx, { content: 'Failed to generate motivational poster.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runSpinEffect(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach a media file.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const isVideo = /\\\\.(mp4|mov|m4v|gif)$/i.test(ext);

  if (isVideo) {
    return runFFmpegCommand(ctx, '-vf "rotate=2*PI*t:fillcolor=black"', 'spin');
  }

  const inputPath = path.join(TMP_DIR, `spin_in_${Date.now()}${ext}`);
  const frameDir = path.join(TMP_DIR, `spin_frames_${Date.now()}`);
  const outputPath = path.join(TMP_DIR, `spin_out_${Date.now()}.gif`);

  try {
    await downloadFile(attachment.url, inputPath);
    fs.mkdirSync(frameDir);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = 350;
    const h = 350;
    const totalFrames = 16;

    for (let i = 0; i < totalFrames; i++) {
      const canvas = createCanvas(w, h);
      const g = canvas.getContext('2d');

      g.fillStyle = '#000000';
      g.fillRect(0, 0, w, h);

      const angle = (i / totalFrames) * 2 * Math.PI;

      g.save();
      g.translate(w / 2, h / 2);
      g.rotate(angle);
      g.drawImage(img, -w / 2, -h / 2, w, h);
      g.restore();

      const framePath = path.join(frameDir, `frame_${String(i).padStart(3, '0')}.png`);
      fs.writeFileSync(framePath, canvas.toBuffer('image/png'));
    }

    const cmd = `ffmpeg -y -framerate 14 -i "${frameDir}/frame_%03d.png" -vf "split[a][b];[a]palettegen[p];[b][p]paletteuse" "${outputPath}"`;
    await executeShell(cmd);

    const file = new AttachmentBuilder(outputPath, { name: 'spin.gif' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Spin GIF Error]:', err.message);
    await respond(ctx, { content: 'Failed to generate spinning GIF.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(frameDir)) {
        fs.readdirSync(frameDir).forEach(f => fs.unlinkSync(path.join(frameDir, f)));
        fs.rmdirSync(frameDir);
      }
    } catch (_) {}
  }
}

async function runMemeText(ctx, topText, bottomText) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image to create the meme.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `meme_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `meme_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = img.width;
    const h = img.height;

    const canvas = createCanvas(w, h);
    const g = canvas.getContext('2d');

    g.drawImage(img, 0, 0, w, h);

    // Meme Style Text settings
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#000000';
    g.lineWidth = Math.max(3, Math.round(w * 0.008));
    g.textAlign = 'center';
    
    const fontSize = Math.max(20, Math.round(w * 0.075));
    g.font = `bold ${fontSize}px Impact, ArialBlack, sans-serif`;

    // Render Top text
    g.textBaseline = 'top';
    g.strokeText(topText.toUpperCase(), w / 2, 20);
    g.fillText(topText.toUpperCase(), w / 2, 20);

    // Render Bottom text
    g.textBaseline = 'bottom';
    g.strokeText(bottomText.toUpperCase(), w / 2, h - 20);
    g.fillText(bottomText.toUpperCase(), w / 2, h - 20);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'meme.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Meme Error]:', err.message);
    await respond(ctx, { content: 'Failed to generate meme text overlays.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runCaptionText(ctx, text) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image to add a caption.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `cap_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `cap_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = img.width;
    const h = img.height;
    
    // Draw white top header
    const headerHeight = Math.max(50, Math.round(h * 0.16));
    const canvas = createCanvas(w, h + headerHeight);
    const g = canvas.getContext('2d');

    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, headerHeight);

    // Render Text
    g.fillStyle = '#000000';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `bold ${Math.max(14, Math.round(w * 0.038))}px Futura, "Helvetica Neue", Arial, sans-serif`;
    g.fillText(text, w / 2, headerHeight / 2);

    // Draw Image
    g.drawImage(img, 0, headerHeight, w, h);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'caption.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Caption Error]:', err.message);
    await respond(ctx, { content: 'Failed to render caption.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runFortuneFrame(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image to create the fortune card.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `for_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `for_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = img.width;
    const h = img.height;

    const canvas = createCanvas(w + 60, h + 80);
    const g = canvas.getContext('2d');

    // Draw celestial dark gold border
    g.fillStyle = '#1e1c24';
    g.fillRect(0, 0, w + 60, h + 80);

    g.strokeStyle = '#d4af37'; // gold
    g.lineWidth = 6;
    g.strokeRect(10, 10, w + 40, h + 60);

    g.strokeStyle = '#d4af37';
    g.lineWidth = 1;
    g.strokeRect(16, 16, w + 28, h + 48);

    // Draw original image centered
    g.drawImage(img, 30, 30, w, h);

    // Add stars in corners
    g.fillStyle = '#d4af37';
    g.font = '24px serif';
    g.fillText('✦', 20, 26);
    g.fillText('✦', w + 22, 26);
    g.fillText('✦', 20, h + 46);
    g.fillText('✦', w + 22, h + 46);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'fortune_card.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Fortune Frame Error]:', err.message);
    await respond(ctx, { content: 'Failed to generate fortune tarot frame.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runHeartBorder(ctx, text) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image to create the heart card.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `heart_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `heart_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = img.width;
    const h = img.height;

    const canvas = createCanvas(w, h);
    const g = canvas.getContext('2d');

    g.drawImage(img, 0, 0, w, h);

    // Draw thick heart border outline overlay
    g.strokeStyle = '#ff3366';
    g.lineWidth = Math.max(5, Math.round(w * 0.02));
    g.beginPath();
    drawHeartInCenter(g, w / 2, h / 2, w * 0.85);
    g.stroke();

    // Draw text banner ribbon
    g.fillStyle = '#ff3366';
    const bannerH = Math.max(30, Math.round(h * 0.1));
    g.fillRect(0, h - bannerH, w, bannerH);

    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `bold ${Math.max(12, Math.round(w * 0.038))}px Arial, sans-serif`;
    g.fillText(text, w / 2, h - bannerH / 2);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'heart_frame.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Heart Border Error]:', err.message);
    await respond(ctx, { content: 'Failed to generate heart frame.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runFlagOverlay(ctx, isPride) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image to apply the flag overlay.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `flag_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `flag_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = img.width;
    const h = img.height;

    const canvas = createCanvas(w, h);
    const g = canvas.getContext('2d');

    g.drawImage(img, 0, 0, w, h);

    // Overlay colors
    g.globalAlpha = 0.4;
    
    if (isPride) {
      // 6 Pride Stripes
      const colors = ['#e40303', '#ff8c00', '#ffeb00', '#008026', '#004cff', '#732982'];
      const stripeH = h / colors.length;
      for (let i = 0; i < colors.length; i++) {
        g.fillStyle = colors[i];
        g.fillRect(0, i * stripeH, w, stripeH + 1);
      }
    } else {
      // Tricolor Standard Red/White/Blue Blend
      const colors = ['#00209f', '#ffffff', '#e40303'];
      const stripeW = w / colors.length;
      for (let i = 0; i < colors.length; i++) {
        g.fillStyle = colors[i];
        g.fillRect(i * stripeW, 0, stripeW + 1, h);
      }
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'flag_composite.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Flag Overlay Error]:', err.message);
    await respond(ctx, { content: 'Failed to apply flag overlay.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runSpreadEffect(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `spr_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `spr_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = img.width;
    const h = img.height;

    const canvas = createCanvas(w, h);
    const g = canvas.getContext('2d');
    g.drawImage(img, 0, 0, w, h);

    const imgData = g.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Displace chunks of pixels randomly
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        if (Math.random() < 0.35) {
          const shiftX = Math.round((Math.random() - 0.5) * 20);
          const shiftY = Math.round((Math.random() - 0.5) * 20);
          
          const newX = Math.min(w - 1, Math.max(0, x + shiftX));
          const newY = Math.min(h - 1, Math.max(0, y + shiftY));

          // Swap 4x4 block
          for (let dy = 0; dy < 4; dy++) {
            if (y + dy >= h || newY + dy >= h) continue;
            for (let dx = 0; dx < 4; dx++) {
              if (x + dx >= w || newX + dx >= w) continue;
              const sourceIdx = ((y + dy) * w + (x + dx)) * 4;
              const destIdx = ((newY + dy) * w + (newX + dx)) * 4;

              for (let c = 0; c < 4; c++) {
                const temp = data[sourceIdx + c];
                data[sourceIdx + c] = data[destIdx + c];
                data[destIdx + c] = temp;
              }
            }
          }
        }
      }
    }

    g.putImageData(imgData, 0, 0);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'dispersed.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Spread Error]:', err.message);
    await respond(ctx, { content: 'Failed to process pixel spread dispersion.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runBookOverlay(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `bk_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `bk_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = img.width;
    const h = img.height;

    const canvas = createCanvas(w, h);
    const g = canvas.getContext('2d');

    // Draw book pages distortion (curled spine shadow)
    g.drawImage(img, 0, 0, w, h);

    // Central spine shadow gradient
    const grad = g.createLinearGradient(w / 2 - 40, 0, w / 2 + 40, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.48, 'rgba(0,0,0,0.65)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.52, 'rgba(0,0,0,0.65)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    // Left and right edges page curls
    const edgeL = g.createLinearGradient(0, 0, 30, 0);
    edgeL.addColorStop(0, 'rgba(0,0,0,0.5)');
    edgeL.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = edgeL;
    g.fillRect(0, 0, 30, h);

    const edgeR = g.createLinearGradient(w - 30, 0, w, 0);
    edgeR.addColorStop(0, 'rgba(0,0,0,0)');
    edgeR.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = edgeR;
    g.fillRect(w - 30, 0, 30, h);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'book_render.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Book Error]:', err.message);
    await respond(ctx, { content: 'Failed to render inside book frames.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runBillboardFrame(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `bill_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `bill_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = 600;
    const h = 400;

    const canvas = createCanvas(w, h + 150);
    const g = canvas.getContext('2d');

    // Sky background
    const sky = g.createLinearGradient(0, 0, 0, h + 150);
    sky.addColorStop(0, '#87ceeb');
    sky.addColorStop(1, '#e0f6ff');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h + 150);

    // Draw steel support poles at bottom
    g.fillStyle = '#666666';
    g.fillRect(w / 2 - 25, h, 50, 150);
    g.fillRect(w / 4 - 15, h, 30, 150);
    g.fillRect(w * 3/4 - 15, h, 30, 150);

    // Draw gray billboard support frame
    g.fillStyle = '#444444';
    g.fillRect(20, 20, w - 40, h - 20);

    // Draw original image inside poster board area
    g.drawImage(img, 40, 40, w - 80, h - 60);

    // Draw spotlights at the top shining down
    g.fillStyle = 'rgba(255,255,255,0.2)';
    g.beginPath();
    g.moveTo(w / 4, 0); g.lineTo(w / 4 - 50, 200); g.lineTo(w / 4 + 100, 200); g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(w * 3/4, 0); g.lineTo(w * 3/4 - 100, 200); g.lineTo(w * 3/4 + 50, 200); g.closePath(); g.fill();

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'billboard.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Billboard Error]:', err.message);
    await respond(ctx, { content: 'Failed to overlay billboard template.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runTattooEffect(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image to create the tattoo.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `tat_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `tat_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = 500;
    const h = 500;

    const canvas = createCanvas(w, h);
    const g = canvas.getContext('2d');

    // 1. Draw skin background texture
    g.fillStyle = '#f3d2b9'; // base skin tone
    g.fillRect(0, 0, w, h);
    
    // Add noise for pores texture
    const pores = g.createRadialGradient(w/2, h/2, 10, w/2, h/2, w);
    pores.addColorStop(0, '#f9dfcc');
    pores.addColorStop(1, '#e3be9f');
    g.fillStyle = pores;
    g.fillRect(0, 0, w, h);

    // 2. Overlay tattoo image using MULTIPLY blend mode
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = 0.85;
    g.drawImage(img, 50, 50, w - 100, h - 100);
    g.restore();

    // 3. Add soft skin-bleed blur filter
    g.save();
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 0.08;
    g.drawImage(canvas, 1, 1);
    g.restore();

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'tattoo.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Tattoo Error]:', err.message);
    await respond(ctx, { content: 'Failed to overlay tattoo skin textures.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runZoomBlur(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `zb_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `zb_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = img.width;
    const h = img.height;

    const canvas = createCanvas(w, h);
    const g = canvas.getContext('2d');

    g.drawImage(img, 0, 0, w, h);

    // Draw 12 concentric zoomed overlays with fading opacity
    g.globalAlpha = 0.07;
    for (let i = 1; i <= 12; i++) {
      const scale = 1.0 + (i * 0.015);
      const nw = w * scale;
      const nh = h * scale;
      const dx = (w - nw) / 2;
      const dy = (h - nh) / 2;
      g.drawImage(img, dx, dy, nw, nh);
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'radial_blur.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Zoom Blur Error]:', err.message);
    await respond(ctx, { content: 'Failed to apply radial zoom blur.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

async function runGlitchEffect(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment) {
    return respond(ctx, { content: 'Please attach an image.' });
  }

  const ext = path.extname(attachment.name) || '.png';
  const inputPath = path.join(TMP_DIR, `gl_in_${Date.now()}${ext}`);
  const outputPath = path.join(TMP_DIR, `gl_out_${Date.now()}.png`);

  try {
    await downloadFile(attachment.url, inputPath);

    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    const w = img.width;
    const h = img.height;

    const canvas = createCanvas(w, h);
    const g = canvas.getContext('2d');

    // Draw normal image
    g.drawImage(img, 0, 0, w, h);

    // Chromatic Aberration channel shifts
    g.save();
    g.globalCompositeOperation = 'screen';
    g.globalAlpha = 0.55;
    
    // Cyan shift
    g.fillStyle = '#00ffff';
    g.fillRect(0, 0, w, h);
    g.drawImage(img, -10, 0, w, h);

    // Magenta shift
    g.fillStyle = '#ff00ff';
    g.fillRect(0, 0, w, h);
    g.drawImage(img, 10, 0, w, h);
    g.restore();

    // Slice horizontal strips and translate them left/right
    for (let i = 0; i < 8; i++) {
      const sy = Math.floor(Math.random() * (h - 40));
      const sh = Math.max(10, Math.floor(Math.random() * 45));
      const shift = Math.round((Math.random() - 0.5) * 35);
      g.drawImage(canvas, 0, sy, w, sh, shift, sy, w, sh);
    }

    // Add green scanner line overlays
    g.fillStyle = 'rgba(0, 255, 0, 0.1)';
    for (let y = 0; y < h; y += 4) {
      g.fillRect(0, y, w, 1);
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    const file = new AttachmentBuilder(outputPath, { name: 'glitched.png' });
    await respond(ctx, { files: [file] });

  } catch (err) {
    console.error('[Glitch Error]:', err.message);
    await respond(ctx, { content: 'Failed to generate digital glitch art.' });
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}
"""

with open(media_js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('[Generator] Compiled and saved speechbubble + motivate upgrades.')
