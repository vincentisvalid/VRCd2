import { exec } from 'child_process';
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

// Helper: Get attachments from context
function getAttachment(ctx) {
  const message = ctx.message || ctx;
  if (message.attachments && message.attachments.size > 0) {
    return message.attachments.first();
  }
  // Try searching channel messages for recent uploads if none on this message
  return null;
}

// Helper: Generic FFmpeg executor
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
    
    // Command execution structure
    const cmd = `ffmpeg -y -i "${inputPath}" ${filterString} -c:a copy "${outputPath}"`;
    
    await executeShell(cmd);

    // Limit check (Discord max upload size is usually 8MB / 25MB depending on level)
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
    // Cleanup temporary files
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (_) {}
  }
}

// Helper: ASCII Image converter using canvas
async function runAsciiCommand(ctx) {
  const attachment = getAttachment(ctx);
  if (!attachment || !/\.(jpg|jpeg|png)$/i.test(attachment.name)) {
    return respond(ctx, { content: 'Please attach a valid image file (PNG/JPG).' });
  }

  const inputPath = path.join(TMP_DIR, `ascii_in_${Date.now()}.png`);
  try {
    await downloadFile(attachment.url, inputPath);

    // Dynamic import to avoid crash if Canvas fails compile
    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(inputPath);

    // Resize image for text resolution
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
      asciiStr += '\n';
    }

    if (asciiStr.length > 1900) {
      // Send as txt attachment if too large
      const txtPath = path.join(TMP_DIR, `ascii_${Date.now()}.txt`);
      fs.writeFileSync(txtPath, asciiStr, 'utf-8');
      const file = new AttachmentBuilder(txtPath, { name: 'ascii_art.txt' });
      await respond(ctx, { files: [file] });
      fs.unlinkSync(txtPath);
    } else {
      await respond(ctx, { content: `\`\`\`\n${asciiStr}\`\`\`` });
    }

  } catch (err) {
    console.error('[ASCII Error]:', err.message);
    await respond(ctx, { content: 'Failed to convert image to ASCII art. Canvas module issues.' });
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
  }
}

// Helper: Cut video segment
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
    
    // Perform fast cut using stream copy
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

// Helper: Greenscreen replacement
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

    // Filtergraph overlays chromakeyed video over background image
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

function executeShell(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout, stderr });
    });
  });
}
