import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'help',
    description: 'Displays a category-sorted index of all available bot commands.',
    category: 'System',
    aliases: ['commands', 'h'],
    options: [
      {
        name: 'command',
        type: 3, // String
        description: 'Check details of a specific command',
        required: false
      }
    ],
    async execute(message, args, client) {
      return runHelp(message, client, args);
    },
    async executeSlash(interaction, client) {
      const cmdName = interaction.options.getString('command');
      return runHelp(interaction, client, cmdName ? [cmdName] : []);
    }
  }
];

function runHelp(ctx, client, args = []) {
  if (args && args.length > 0) {
    const search = args[0].toLowerCase();
    const command = client.commands.get(search) || client.aliases.get(search);
    
    if (!command) {
      return respond(ctx, { content: `❌ Command \`${search}\` not found in registry.` });
    }

    const fields = [
      { name: 'Category', value: command.category || 'General', inline: true },
      { name: 'Aliases', value: command.aliases && command.aliases.length > 0 ? command.aliases.map(a => `\`${a}\``).join(', ') : 'None', inline: true }
    ];

    if (command.options && command.options.length > 0) {
      const optsStr = command.options.map(o => `\`${o.name}\` - *${o.description || 'No description'}*`).join('\n');
      fields.push({ name: 'Arguments / Options', value: optsStr });
    }

    const embed = buildEmbed(
      `Command: .${command.name}`,
      command.description || 'No description provided.',
      fields,
      0x00ffcc
    );
    return respond(ctx, { embeds: [embed] });
  }

  const commands = client.commands;
  const categories = {};
  const excludedFiles = [
    'conversion.js', 'crypto.js', 'dev.js', 'dictionary.js', 
    'fun.js', 'math.js', 'servertools.js', 'textutils.js', 'time.js'
  ];

  // Group commands by category, excluding voluminous utility files
  commands.forEach(cmd => {
    if (excludedFiles.includes(cmd.sourceFile)) return;
    const cat = cmd.category || 'General';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(cmd);
  });

  const embeds = [];
  let currentEmbed = buildEmbed(
    'VRCd Bot Commands Help Index',
    'Here is a list of all commands. Use `.help <command>` to view detailed usage options.'
  );
  
  let fieldsCount = 0;

  for (const [cat, cmdList] of Object.entries(categories)) {
    if (fieldsCount >= 15) {
      embeds.push(currentEmbed);
      currentEmbed = buildEmbed(
        'VRCd Bot Commands Help (Continued)',
        'Additional command categories:'
      );
      fieldsCount = 0;
    }

    // List only command names to avoid exceeding Discord's 6,000 character limit
    const value = cmdList.map(cmd => `\`${cmd.name}\``).join(', ');
    
    currentEmbed.addFields({ name: `== ${cat.toUpperCase()} ==`, value: value.slice(0, 1024) });
    fieldsCount++;
  }
  
  embeds.push(currentEmbed);

  return respond(ctx, { embeds });
}
