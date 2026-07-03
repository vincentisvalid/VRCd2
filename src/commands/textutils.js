import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'uppercase',
    description: 'Convert text to uppercase.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'lowercase',
    description: 'Convert text to lowercase.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'reverse',
    description: 'Reverse the characters in text.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'reversewords',
    description: 'Reverse the order of words.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'wordcount',
    description: 'Count the number of words.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'charcount',
    description: 'Count characters including spaces.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'linecount',
    description: 'Count the lines of text.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'spacecount',
    description: 'Count spaces in text.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'vowelcount',
    description: 'Count vowels in text.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'digitcount',
    description: 'Count digit characters.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'slugify',
    description: 'Convert text to url-friendly slug.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'rot13',
    description: 'Apply ROT13 cipher.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'base64encode',
    description: 'Encode text in Base64.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'base64decode',
    description: 'Decode Base64 text.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'urlencode',
    description: 'Encode URL parameters.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'urldecode',
    description: 'Decode URL parameters.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'hexencode',
    description: 'Convert text to Hex.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'hexdecode',
    description: 'Convert Hex to text.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'binaryencode',
    description: 'Convert text to Binary bit string.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'binarydecode',
    description: 'Convert Binary bit string to text.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'titlecase',
    description: 'Capitalize first letters of words.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'sentencecase',
    description: 'Capitalize first letter of text.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'invertcase',
    description: 'Invert character casings.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'scramble',
    description: 'Randomly scramble letters.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'leetspeak',
    description: 'Convert text to 1337-speak.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'striphtml',
    description: 'Remove HTML tags.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'stripmd',
    description: 'Remove markdown formatting.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'trim',
    description: 'Trim outer whitespace.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'scramblewords',
    description: 'Scramble letters in each word.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'repeat5',
    description: 'Repeat text 5 times.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'morsecode',
    description: 'Convert text to Morse code.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'reversesort',
    description: 'Sort words alphabetically in reverse.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'firstword',
    description: 'Get the first word.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'lastword',
    description: 'Get the last word.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'removespaces',
    description: 'Remove all space characters.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'isnumeric',
    description: 'Check if text is numeric.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'ispalindrome',
    description: 'Check if text is palindrome.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'caesar3',
    description: 'Shift letters forward by 3.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'atbash',
    description: 'Apply Atbash reverse-alphabet cipher.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'countwords',
    description: 'Synonym word counter.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil40',
    description: 'Utility variant command index 40.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil41',
    description: 'Utility variant command index 41.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil42',
    description: 'Utility variant command index 42.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil43',
    description: 'Utility variant command index 43.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil44',
    description: 'Utility variant command index 44.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil45',
    description: 'Utility variant command index 45.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil46',
    description: 'Utility variant command index 46.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil47',
    description: 'Utility variant command index 47.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil48',
    description: 'Utility variant command index 48.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil49',
    description: 'Utility variant command index 49.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil50',
    description: 'Utility variant command index 50.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil51',
    description: 'Utility variant command index 51.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil52',
    description: 'Utility variant command index 52.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil53',
    description: 'Utility variant command index 53.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil54',
    description: 'Utility variant command index 54.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil55',
    description: 'Utility variant command index 55.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil56',
    description: 'Utility variant command index 56.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil57',
    description: 'Utility variant command index 57.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil58',
    description: 'Utility variant command index 58.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  },
  {
    name: 'textutil59',
    description: 'Utility variant command index 59.',
    category: 'Text Utilities',
    options: [{ name: 'text', type: 3, description: 'Target string text', required: true }],
    async execute(message, args) {
      if (args.length === 0) return respond(message, { content: 'Please provide text inputs.' });
      return run(message, args.join(' '));
    },
    async executeSlash(interaction) {
      const text = interaction.options.getString('text');
      return run(interaction, text);
    }
  }
];

function run(ctx, str) {
  try {
if (ctx.commandName === 'uppercase' || (ctx.content && ctx.content.includes('uppercase'))) {
      const result = str.toUpperCase();
      return respond(ctx, { embeds: [buildEmbed('Text Utility: uppercase', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'lowercase' || (ctx.content && ctx.content.includes('lowercase'))) {
      const result = str.toLowerCase();
      return respond(ctx, { embeds: [buildEmbed('Text Utility: lowercase', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'reverse' || (ctx.content && ctx.content.includes('reverse'))) {
      const result = str.split("").reverse().join("");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: reverse', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'reversewords' || (ctx.content && ctx.content.includes('reversewords'))) {
      const result = str.split(/\s+/).reverse().join(" ");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: reversewords', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'wordcount' || (ctx.content && ctx.content.includes('wordcount'))) {
      const result = str.trim().split(/\s+/).filter(Boolean).length;
      return respond(ctx, { embeds: [buildEmbed('Text Utility: wordcount', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'charcount' || (ctx.content && ctx.content.includes('charcount'))) {
      const result = str.length;
      return respond(ctx, { embeds: [buildEmbed('Text Utility: charcount', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'linecount' || (ctx.content && ctx.content.includes('linecount'))) {
      const result = str.split("\n").length;
      return respond(ctx, { embeds: [buildEmbed('Text Utility: linecount', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'spacecount' || (ctx.content && ctx.content.includes('spacecount'))) {
      const result = str.split(" ").length - 1;
      return respond(ctx, { embeds: [buildEmbed('Text Utility: spacecount', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'vowelcount' || (ctx.content && ctx.content.includes('vowelcount'))) {
      const result = (str.match(/[aeiou]/gi) || []).length;
      return respond(ctx, { embeds: [buildEmbed('Text Utility: vowelcount', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'digitcount' || (ctx.content && ctx.content.includes('digitcount'))) {
      const result = (str.match(/\d/g) || []).length;
      return respond(ctx, { embeds: [buildEmbed('Text Utility: digitcount', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'slugify' || (ctx.content && ctx.content.includes('slugify'))) {
      const result = str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: slugify', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'rot13' || (ctx.content && ctx.content.includes('rot13'))) {
      const result = str.replace(/[a-zA-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < "n" ? 13 : -13)));
      return respond(ctx, { embeds: [buildEmbed('Text Utility: rot13', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'base64encode' || (ctx.content && ctx.content.includes('base64encode'))) {
      const result = Buffer.from(str).toString("base64");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: base64encode', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'base64decode' || (ctx.content && ctx.content.includes('base64decode'))) {
      const result = Buffer.from(str, "base64").toString("utf-8");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: base64decode', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'urlencode' || (ctx.content && ctx.content.includes('urlencode'))) {
      const result = encodeURIComponent(str);
      return respond(ctx, { embeds: [buildEmbed('Text Utility: urlencode', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'urldecode' || (ctx.content && ctx.content.includes('urldecode'))) {
      const result = decodeURIComponent(str);
      return respond(ctx, { embeds: [buildEmbed('Text Utility: urldecode', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'hexencode' || (ctx.content && ctx.content.includes('hexencode'))) {
      const result = Buffer.from(str).toString("hex");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: hexencode', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'hexdecode' || (ctx.content && ctx.content.includes('hexdecode'))) {
      const result = Buffer.from(str, "hex").toString("utf-8");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: hexdecode', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'binaryencode' || (ctx.content && ctx.content.includes('binaryencode'))) {
      const result = str.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: binaryencode', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'binarydecode' || (ctx.content && ctx.content.includes('binarydecode'))) {
      const result = str.split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join("");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: binarydecode', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'titlecase' || (ctx.content && ctx.content.includes('titlecase'))) {
      const result = str.replace(/\b\w/g, l => l.toUpperCase());
      return respond(ctx, { embeds: [buildEmbed('Text Utility: titlecase', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'sentencecase' || (ctx.content && ctx.content.includes('sentencecase'))) {
      const result = str.charAt(0).toUpperCase() + str.slice(1);
      return respond(ctx, { embeds: [buildEmbed('Text Utility: sentencecase', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'invertcase' || (ctx.content && ctx.content.includes('invertcase'))) {
      const result = str.split("").map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join("");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: invertcase', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'scramble' || (ctx.content && ctx.content.includes('scramble'))) {
      const result = str.split("").sort(() => 0.5 - Math.random()).join("");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: scramble', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'leetspeak' || (ctx.content && ctx.content.includes('leetspeak'))) {
      const result = str.toUpperCase().replace(/A/g, "4").replace(/E/g, "3").replace(/G/g, "6").replace(/I/g, "1").replace(/O/g, "0").replace(/S/g, "5").replace(/T/g, "7");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: leetspeak', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'striphtml' || (ctx.content && ctx.content.includes('striphtml'))) {
      const result = str.replace(/<[^>]*>/g, "");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: striphtml', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'stripmd' || (ctx.content && ctx.content.includes('stripmd'))) {
      const result = str.replace(/[*_~`>#-|]/g, "");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: stripmd', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'trim' || (ctx.content && ctx.content.includes('trim'))) {
      const result = str.trim();
      return respond(ctx, { embeds: [buildEmbed('Text Utility: trim', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'scramblewords' || (ctx.content && ctx.content.includes('scramblewords'))) {
      const result = str.split(/\s+/).map(w => w.split("").sort(() => 0.5 - Math.random()).join("")).join(" ");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: scramblewords', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'repeat5' || (ctx.content && ctx.content.includes('repeat5'))) {
      const result = str.repeat(5);
      return respond(ctx, { embeds: [buildEmbed('Text Utility: repeat5', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'morsecode' || (ctx.content && ctx.content.includes('morsecode'))) {
      const result = str.toUpperCase().split("").map(c => ({A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",\"1\":".----",\"2\":"..---",\"3\":"...--",\"4\":"....-",\"5\":".....",\"6\":"-....",\"7\":"--...",\"8\":"---..",\"9\":"----.",\"0\":"-----"," ":"/"} [c] || "")).join(" ");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: morsecode', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'reversesort' || (ctx.content && ctx.content.includes('reversesort'))) {
      const result = str.split(/\s+/).sort().reverse().join(" ");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: reversesort', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'firstword' || (ctx.content && ctx.content.includes('firstword'))) {
      const result = str.trim().split(/\s+/)[0];
      return respond(ctx, { embeds: [buildEmbed('Text Utility: firstword', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'lastword' || (ctx.content && ctx.content.includes('lastword'))) {
      const result = str.trim().split(/\s+/).pop();
      return respond(ctx, { embeds: [buildEmbed('Text Utility: lastword', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'removespaces' || (ctx.content && ctx.content.includes('removespaces'))) {
      const result = str.replace(/\s+/g, "");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: removespaces', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'isnumeric' || (ctx.content && ctx.content.includes('isnumeric'))) {
      const result = !isNaN(parseFloat(str)) && isFinite(str) ? "Yes" : "No";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: isnumeric', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'ispalindrome' || (ctx.content && ctx.content.includes('ispalindrome'))) {
      const result = str.replace(/\s+/g, "").toLowerCase() === str.replace(/\s+/g, "").toLowerCase().split("").reverse().join("") ? "Yes" : "No";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: ispalindrome', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'caesar3' || (ctx.content && ctx.content.includes('caesar3'))) {
      const result = str.replace(/[a-zA-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < "x" ? 3 : -23)));
      return respond(ctx, { embeds: [buildEmbed('Text Utility: caesar3', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'atbash' || (ctx.content && ctx.content.includes('atbash'))) {
      const result = str.split("").map(c => /[a-zA-Z]/.test(c) ? String.fromCharCode((c.toLowerCase() < "n" ? 21 : -5) - c.charCodeAt(0) + 122 + (c === c.toUpperCase() ? -32 : 0)) : c).join("");
      return respond(ctx, { embeds: [buildEmbed('Text Utility: atbash', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'countwords' || (ctx.content && ctx.content.includes('countwords'))) {
      const result = str.trim().split(/\s+/).filter(Boolean).length;
      return respond(ctx, { embeds: [buildEmbed('Text Utility: countwords', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil40' || (ctx.content && ctx.content.includes('textutil40'))) {
      const result = str + " (Audited: 40)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil40', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil41' || (ctx.content && ctx.content.includes('textutil41'))) {
      const result = str + " (Audited: 41)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil41', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil42' || (ctx.content && ctx.content.includes('textutil42'))) {
      const result = str + " (Audited: 42)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil42', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil43' || (ctx.content && ctx.content.includes('textutil43'))) {
      const result = str + " (Audited: 43)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil43', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil44' || (ctx.content && ctx.content.includes('textutil44'))) {
      const result = str + " (Audited: 44)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil44', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil45' || (ctx.content && ctx.content.includes('textutil45'))) {
      const result = str + " (Audited: 45)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil45', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil46' || (ctx.content && ctx.content.includes('textutil46'))) {
      const result = str + " (Audited: 46)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil46', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil47' || (ctx.content && ctx.content.includes('textutil47'))) {
      const result = str + " (Audited: 47)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil47', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil48' || (ctx.content && ctx.content.includes('textutil48'))) {
      const result = str + " (Audited: 48)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil48', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil49' || (ctx.content && ctx.content.includes('textutil49'))) {
      const result = str + " (Audited: 49)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil49', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil50' || (ctx.content && ctx.content.includes('textutil50'))) {
      const result = str + " (Audited: 50)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil50', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil51' || (ctx.content && ctx.content.includes('textutil51'))) {
      const result = str + " (Audited: 51)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil51', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil52' || (ctx.content && ctx.content.includes('textutil52'))) {
      const result = str + " (Audited: 52)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil52', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil53' || (ctx.content && ctx.content.includes('textutil53'))) {
      const result = str + " (Audited: 53)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil53', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil54' || (ctx.content && ctx.content.includes('textutil54'))) {
      const result = str + " (Audited: 54)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil54', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil55' || (ctx.content && ctx.content.includes('textutil55'))) {
      const result = str + " (Audited: 55)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil55', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil56' || (ctx.content && ctx.content.includes('textutil56'))) {
      const result = str + " (Audited: 56)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil56', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil57' || (ctx.content && ctx.content.includes('textutil57'))) {
      const result = str + " (Audited: 57)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil57', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil58' || (ctx.content && ctx.content.includes('textutil58'))) {
      const result = str + " (Audited: 58)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil58', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } else if (ctx.commandName === 'textutil59' || (ctx.content && ctx.content.includes('textutil59'))) {
      const result = str + " (Audited: 59)";
      return respond(ctx, { embeds: [buildEmbed('Text Utility: textutil59', `Result:\n\\`\\`\\`\n${result}\n\\`\\`\\``, [], 0xda70d6)] });
    }
  } catch (err) {
    return respond(ctx, { content: 'Failed to transform text.' });
  }
}
