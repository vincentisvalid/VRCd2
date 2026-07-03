import crypto from 'crypto';
import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'md5',
    description: 'Compute MD5 checksum.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'sha1',
    description: 'Compute SHA-1 checksum.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'sha256',
    description: 'Compute SHA-256 checksum.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'sha512',
    description: 'Compute SHA-512 checksum.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto4',
    description: 'Checksum utility node 4.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto5',
    description: 'Checksum utility node 5.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto6',
    description: 'Checksum utility node 6.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto7',
    description: 'Checksum utility node 7.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto8',
    description: 'Checksum utility node 8.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto9',
    description: 'Checksum utility node 9.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto10',
    description: 'Checksum utility node 10.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto11',
    description: 'Checksum utility node 11.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto12',
    description: 'Checksum utility node 12.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto13',
    description: 'Checksum utility node 13.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto14',
    description: 'Checksum utility node 14.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto15',
    description: 'Checksum utility node 15.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto16',
    description: 'Checksum utility node 16.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto17',
    description: 'Checksum utility node 17.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto18',
    description: 'Checksum utility node 18.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto19',
    description: 'Checksum utility node 19.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto20',
    description: 'Checksum utility node 20.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto21',
    description: 'Checksum utility node 21.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto22',
    description: 'Checksum utility node 22.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto23',
    description: 'Checksum utility node 23.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto24',
    description: 'Checksum utility node 24.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto25',
    description: 'Checksum utility node 25.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto26',
    description: 'Checksum utility node 26.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto27',
    description: 'Checksum utility node 27.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto28',
    description: 'Checksum utility node 28.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto29',
    description: 'Checksum utility node 29.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto30',
    description: 'Checksum utility node 30.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto31',
    description: 'Checksum utility node 31.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto32',
    description: 'Checksum utility node 32.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto33',
    description: 'Checksum utility node 33.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto34',
    description: 'Checksum utility node 34.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  },
  {
    name: 'crypto35',
    description: 'Checksum utility node 35.',
    category: 'Cryptography',
    options: [{ name: 'text', type: 3, description: 'Input string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Input text required.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('text'));
    }
  }
];

function run(ctx, str) {
  try {
if (ctx.commandName === 'md5' || (ctx.content && ctx.content.includes('md5'))) {
      const hash = crypto.createHash('md5').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: md5', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'sha1' || (ctx.content && ctx.content.includes('sha1'))) {
      const hash = crypto.createHash('sha1').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: sha1', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'sha256' || (ctx.content && ctx.content.includes('sha256'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: sha256', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'sha512' || (ctx.content && ctx.content.includes('sha512'))) {
      const hash = crypto.createHash('sha512').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: sha512', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto4' || (ctx.content && ctx.content.includes('crypto4'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto4', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto5' || (ctx.content && ctx.content.includes('crypto5'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto5', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto6' || (ctx.content && ctx.content.includes('crypto6'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto6', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto7' || (ctx.content && ctx.content.includes('crypto7'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto7', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto8' || (ctx.content && ctx.content.includes('crypto8'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto8', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto9' || (ctx.content && ctx.content.includes('crypto9'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto9', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto10' || (ctx.content && ctx.content.includes('crypto10'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto10', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto11' || (ctx.content && ctx.content.includes('crypto11'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto11', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto12' || (ctx.content && ctx.content.includes('crypto12'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto12', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto13' || (ctx.content && ctx.content.includes('crypto13'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto13', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto14' || (ctx.content && ctx.content.includes('crypto14'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto14', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto15' || (ctx.content && ctx.content.includes('crypto15'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto15', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto16' || (ctx.content && ctx.content.includes('crypto16'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto16', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto17' || (ctx.content && ctx.content.includes('crypto17'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto17', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto18' || (ctx.content && ctx.content.includes('crypto18'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto18', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto19' || (ctx.content && ctx.content.includes('crypto19'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto19', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto20' || (ctx.content && ctx.content.includes('crypto20'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto20', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto21' || (ctx.content && ctx.content.includes('crypto21'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto21', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto22' || (ctx.content && ctx.content.includes('crypto22'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto22', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto23' || (ctx.content && ctx.content.includes('crypto23'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto23', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto24' || (ctx.content && ctx.content.includes('crypto24'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto24', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto25' || (ctx.content && ctx.content.includes('crypto25'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto25', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto26' || (ctx.content && ctx.content.includes('crypto26'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto26', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto27' || (ctx.content && ctx.content.includes('crypto27'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto27', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto28' || (ctx.content && ctx.content.includes('crypto28'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto28', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto29' || (ctx.content && ctx.content.includes('crypto29'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto29', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto30' || (ctx.content && ctx.content.includes('crypto30'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto30', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto31' || (ctx.content && ctx.content.includes('crypto31'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto31', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto32' || (ctx.content && ctx.content.includes('crypto32'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto32', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto33' || (ctx.content && ctx.content.includes('crypto33'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto33', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto34' || (ctx.content && ctx.content.includes('crypto34'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto34', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } else if (ctx.commandName === 'crypto35' || (ctx.content && ctx.content.includes('crypto35'))) {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return respond(ctx, { embeds: [buildEmbed('Hash Output: crypto35', `Hash: \\`${hash}\\``, [], 0xe6c619)] });
    }
  } catch (err) {
    return respond(ctx, { content: 'Hashing failed.' });
  }
}
