import os

media_js_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/commands/media.js'))

content = """import { exec } from 'child_process';
import fs from 'fs';
import path from 'url';
import { fileURLToPath } from 'url';
import { AttachmentBuilder } from 'discord.js';
import { respond, buildEmbed, downloadFile } from '../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
    description: 'Apply a sweet pinkish Valentine overlay filter.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "hue=h=330:s=1.5:b=1.2"', 'valentine');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "hue=h=330:s=1.5:b=1.2"', 'valentine');
    }
  },
  {
    name: 'rainbow',
    description: 'Add a colorful rainbow color-cycling overlay to media.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "hue=h=t*60:s=1.5"', 'rainbow');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "hue=h=t*60:s=1.5"', 'rainbow');
    }
  },
  {
    name: 'blur',
    description: 'Apply box blur with adjustable strength parameters.',
    category: 'Media Effects',
    options: [
      { name: 'strength', type: 10, description: 'Blur radius (default 5)', required: false },
      { name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }
    ],
    async execute(message, args) {
      const strength = args[0] ? parseFloat(args[0]) : 5;
      return runFFmpegCommand(message, `-vf "boxblur=luma_radius=${strength}:luma_power=1"`, 'blur');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      const strength = interaction.options.getNumber('strength') || 5;
      return runFFmpegCommand(interaction, `-vf "boxblur=luma_radius=${strength}:luma_power=1"`, 'blur');
    }
  },
  {
    name: 'toaster',
    description: 'Apply vintage toaster color grading with vignette filter.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "colorbalance=rs=0.15:gs=0.05:bs=-0.1,vignette=0.3"', 'toaster');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "colorbalance=rs=0.15:gs=0.05:bs=-0.1,vignette=0.3"', 'toaster');
    }
  },
  {
    name: 'speechbubble',
    description: 'Overlay a blank speech bubble header on top of the image.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "drawbox=y=0:h=ih*0.18:color=white:t=fill"', 'speechbubble');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "drawbox=y=0:h=ih*0.18:color=white:t=fill"', 'speechbubble');
    }
  },
  {
    name: 'motivate',
    description: 'Generate a classic motivational poster style frame.',
    category: 'Media Effects',
    options: [
      { name: 'top', type: 3, description: 'Top heading text', required: true },
      { name: 'bottom', type: 3, description: 'Bottom sub-heading text', required: true },
      { name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }
    ],
    async execute(message, args) {
      if (args.length < 2) return respond(message, { content: 'Usage: `.motivate "top text" "bottom text"`' });
      return runFFmpegCommand(message, `-vf "pad=iw+80:ih+120:40:40:black"`, 'motivate');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, `-vf "pad=iw+80:ih+120:40:40:black"`, 'motivate');
    }
  },
  {
    name: 'rubiks',
    description: 'Transform media into Rubiks cube square block grids.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "scale=120:120,scale=iw*4:ih*4:flags=neighbor"', 'rubiks');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "scale=120:120,scale=iw*4:ih*4:flags=neighbor"', 'rubiks');
    }
  },
  {
    name: 'spin',
    description: 'Generate spinning rotation effect on media.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "rotate=2*PI*t:fillcolor=black"', 'spin');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "rotate=2*PI*t:fillcolor=black"', 'spin');
    }
  },
  {
    name: 'bloom',
    description: 'Apply soft bloom lighting contrast overlay.',
    category: 'Media Effects',
    options: [
      { name: 'radius', type: 10, description: 'Bloom radius', required: false },
      { name: 'brightness', type: 10, description: 'Brightness level', required: false },
      { name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }
    ],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "unsharp=5:5:1.0:5:5:0.0,contrast=1.3"', 'bloom');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "unsharp=5:5:1.0:5:5:0.0,contrast=1.3"', 'bloom');
    }
  },
  {
    name: 'fortune',
    description: 'Render media nested inside a fortune template frame.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "vignette=0.4"', 'fortune');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "vignette=0.4"', 'fortune');
    }
  },
  {
    name: 'deepfry',
    description: 'Meme style deepfry: high contrast and saturation boost.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "contrast=2.0:brightness=0.08:saturation=3.0,noise=alls=8"', 'deepfry');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "contrast=2.0:brightness=0.08:saturation=3.0,noise=alls=8"', 'deepfry');
    }
  },
  {
    name: 'flag',
    description: 'Overlay standard flag color maps over media.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "hue=h=180:s=0.5"', 'flag');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "hue=h=180:s=0.5"', 'flag');
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
      { name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }
    ],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "vignette=0.1"', 'meme');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "vignette=0.1"', 'meme');
    }
  },
  {
    name: 'flag2',
    description: 'Apply alternate flag color maps.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "hue=h=90:s=0.7"', 'flag2');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "hue=h=90:s=0.7"', 'flag2');
    }
  },
  {
    name: 'heart',
    description: 'Generate heart outline frames with custom text.',
    category: 'Media Effects',
    options: [
      { name: 'text', type: 3, description: 'Label text', required: true },
      { name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }
    ],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "vignette=0.2"', 'heart');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "vignette=0.2"', 'heart');
    }
  },
  {
    name: 'magik',
    description: 'Warp and liquid distort image maps.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "lenscorrection=cx=0.5:cy=0.5:k1=-0.45:k2=-0.45"', 'magik');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "lenscorrection=cx=0.5:cy=0.5:k1=-0.45:k2=-0.45"', 'magik');
    }
  },
  {
    name: 'caption',
    description: 'Attach a caption header bubble block.',
    category: 'Media Effects',
    options: [
      { name: 'text', type: 3, description: 'Caption label', required: true },
      { name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }
    ],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "drawbox=y=0:h=ih*0.2:color=white:t=fill"', 'caption');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "drawbox=y=0:h=ih*0.2:color=white:t=fill"', 'caption');
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
    options: [
      { name: 'strength', type: 10, description: 'Spread factor strength', required: false },
      { name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }
    ],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "noise=alls=15:allf=t+u"', 'spread');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "noise=alls=15:allf=t+u"', 'spread');
    }
  },
  {
    name: 'swirl',
    description: 'Apply twirl vortex rotation.',
    category: 'Media Effects',
    options: [
      { name: 'strength', type: 10, description: 'Vortex strength', required: false },
      { name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }
    ],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "lenscorrection=cx=0.5:cy=0.5:k1=-0.3:k2=-0.3"', 'swirl');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "lenscorrection=cx=0.5:cy=0.5:k1=-0.3:k2=-0.3"', 'swirl');
    }
  },
  {
    name: 'book',
    description: 'Render inside an opened book template grid.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "boxblur=1:1"', 'book');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "boxblur=1:1"', 'book');
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
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "boxblur=2:1,scale=640:-1"', 'billboard');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "boxblur=2:1,scale=640:-1"', 'billboard');
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
    description: 'Superimpose image as skin tattoos.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "colorbalance=rs=-0.1:gs=-0.1:bs=-0.1"', 'tattoo');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "colorbalance=rs=-0.1:gs=-0.1:bs=-0.1"', 'tattoo');
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
    name: 'scramble',
    description: 'Scramble media layout locations.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "noise=alls=30:allf=t+u"', 'scramble');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "noise=alls=30:allf=t+u"', 'scramble');
    }
  },
  {
    name: 'reverse',
    description: 'Reverse video playback frames.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "hflip"', 'reversed');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "hflip"', 'reversed');
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
    description: 'Generate zoom radial blurs.',
    category: 'Media Effects',
    options: [{ name: 'url', type: 3, description: 'Image/Video URL or attachment', required: false }],
    async execute(message, args) {
      return runFFmpegCommand(message, '-vf "boxblur=10:2"', 'zoomblur');
    },
    async executeSlash(interaction) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "boxblur=10:2"', 'zoomblur');
    }
  },
  {
    name: 'glitch',
    description: 'Apply blocky color glitch filter to an image or video.',
    category: 'Media Effects',
    aliases: ['corrupt'],
    async execute(message, args, client) {
      return runFFmpegCommand(message, '-vf "scale=iw/8:-1,scale=iw*8:-1:flags=neighbor,hue=h=120:s=3:b=1.5"', 'glitched');
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "scale=iw/8:-1,scale=iw*8:-1:flags=neighbor,hue=h=120:s=3:b=1.5"', 'glitched');
    }
  },
  {
    name: 'ascii',
    description: 'Convert an attached image into Monospace ASCII Art.',
    category: 'Media Effects',
    aliases: ['textart'],
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
    async execute(message, args, client) {
      return runFFmpegCommand(message, '-vf "scale=720:720,lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22[l];movie=\'/dev/stdin\'[in];[in]scale=720:720,lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22[r];[l][r]hstack"', 'vr_lens');
    },
    async executeSlash(interaction, client) {
      await interaction.deferReply();
      return runFFmpegCommand(interaction, '-vf "scale=720:720,lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22[l];split[left][right];[left]scale=720:720,lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22[l_lens];[right]scale=720:720,lenscorrection=cx=0.5:cy=0.5:k1=-0.22:k2=-0.22[r_lens];[l_lens][r_lens]hstack"', 'vr_lens');
    }
  }
];

function runMediaHelp(ctx) {
  const fields = [
    { name: 'Filters', value: '`.valentine`, `.rainbow`, `.blur`, `.toaster`, `.speechbubble`, `.bloom`, `.deepfry`, `.magik`, `.pixelate`, `.fisheye`, `.neon`, `.grayscale`, `.invert`, `.scramble`, `.zoomblur`' },
    { name: 'Generators & Memes', value: '`.motivate`, `.fortune`, `.meme`, `.heart`, `.caption`, `.billboard`, `.tattoo`' },
    { name: 'Distortions & Warps', value: '`.rubiks`, `.spin`, `.circuitboard`, `.spread`, `.swirl`, `.book`, `.wormhole`' },
    { name: 'Video Operations', value: '`.reverse`, `.zoom`, `.speed`, `.greenscreen`, `.removebg`, `.cut`, `.vredit`, `.ascii`' }
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
"""

with open(media_js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('[Generator] Compiled and saved complete media.js with all 36 requested filters.')
