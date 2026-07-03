import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'dict1',
    description: 'Dictionary lookups reference command 1.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict2',
    description: 'Dictionary lookups reference command 2.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict3',
    description: 'Dictionary lookups reference command 3.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict4',
    description: 'Dictionary lookups reference command 4.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict5',
    description: 'Dictionary lookups reference command 5.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict6',
    description: 'Dictionary lookups reference command 6.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict7',
    description: 'Dictionary lookups reference command 7.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict8',
    description: 'Dictionary lookups reference command 8.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict9',
    description: 'Dictionary lookups reference command 9.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict10',
    description: 'Dictionary lookups reference command 10.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict11',
    description: 'Dictionary lookups reference command 11.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict12',
    description: 'Dictionary lookups reference command 12.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict13',
    description: 'Dictionary lookups reference command 13.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict14',
    description: 'Dictionary lookups reference command 14.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict15',
    description: 'Dictionary lookups reference command 15.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict16',
    description: 'Dictionary lookups reference command 16.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict17',
    description: 'Dictionary lookups reference command 17.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict18',
    description: 'Dictionary lookups reference command 18.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict19',
    description: 'Dictionary lookups reference command 19.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict20',
    description: 'Dictionary lookups reference command 20.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict21',
    description: 'Dictionary lookups reference command 21.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict22',
    description: 'Dictionary lookups reference command 22.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict23',
    description: 'Dictionary lookups reference command 23.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict24',
    description: 'Dictionary lookups reference command 24.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict25',
    description: 'Dictionary lookups reference command 25.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict26',
    description: 'Dictionary lookups reference command 26.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict27',
    description: 'Dictionary lookups reference command 27.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict28',
    description: 'Dictionary lookups reference command 28.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict29',
    description: 'Dictionary lookups reference command 29.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict30',
    description: 'Dictionary lookups reference command 30.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict31',
    description: 'Dictionary lookups reference command 31.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict32',
    description: 'Dictionary lookups reference command 32.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict33',
    description: 'Dictionary lookups reference command 33.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict34',
    description: 'Dictionary lookups reference command 34.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict35',
    description: 'Dictionary lookups reference command 35.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict36',
    description: 'Dictionary lookups reference command 36.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict37',
    description: 'Dictionary lookups reference command 37.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict38',
    description: 'Dictionary lookups reference command 38.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict39',
    description: 'Dictionary lookups reference command 39.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  },
  {
    name: 'dict40',
    description: 'Dictionary lookups reference command 40.',
    category: 'Quotes',
    options: [{ name: 'term', type: 3, description: 'Search query', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please specify search term.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      return run(interaction, interaction.options.getString('term'));
    }
  }
];

function run(ctx, term) {
  return respond(ctx, { embeds: [buildEmbed('Reference Index Lookup', `Query Term: **${term}**\n\nDefinition: General purpose reference indexes entries resolved successfully.`, [], 0xffa500)] });
}
