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
    let hash = '';
    let algo = '';
    const cmd = ctx.commandName || '';
    const content = ctx.content || '';
    
    if (cmd === 'md5' || content.includes('md5')) {
      hash = crypto.createHash('md5').update(str).digest('hex');
      algo = 'md5';
    } else if (cmd === 'sha1' || content.includes('sha1')) {
      hash = crypto.createHash('sha1').update(str).digest('hex');
      algo = 'sha1';
    } else if (cmd === 'sha256' || content.includes('sha256')) {
      hash = crypto.createHash('sha256').update(str).digest('hex');
      algo = 'sha256';
    } else if (cmd === 'sha512' || content.includes('sha512')) {
      hash = crypto.createHash('sha512').update(str).digest('hex');
      algo = 'sha512';
    } else {
      hash = crypto.createHash('sha256').update(str).digest('hex');
      algo = cmd || 'crypto';
    }
    
    return respond(ctx, { embeds: [buildEmbed(`Hash Output: ${algo}`, `Hash: \`${hash}\``, [], 0xe6c619)] });
  } catch (err) {
    return respond(ctx, { content: 'Hashing failed.' });
  }
}
