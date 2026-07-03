import { respond, buildEmbed } from '../utils/helpers.js';

export default [
  {
    name: 'help',
    description: 'Displays a category-sorted index of all available bot commands.',
    category: 'System',
    aliases: ['commands', 'h'],
    options: [],
    async execute(message, args, client) {
      return runHelp(message, client);
    },
    async executeSlash(interaction, client) {
      return runHelp(interaction, client);
    }
  }
];

function runHelp(ctx, client) {
  const commands = client.commands;
  const categories = {};

  // Group commands by category
  commands.forEach(cmd => {
    const cat = cmd.category || 'General';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(cmd);
  });

  const embeds = [];
  let currentEmbed = buildEmbed(
    'VRCd Bot Commands Help Index',
    'Here are all available commands categorized. Use them with Prefix `.` or as Slash Commands.'
  );
  
  let fieldsCount = 0;

  for (const [cat, cmdList] of Object.entries(categories)) {
    if (fieldsCount >= 15) {
      embeds.push(currentEmbed);
      currentEmbed = buildEmbed(
        'VRCd Bot Commands Help Index (Continued)',
        'Additional command categories:'
      );
      fieldsCount = 0;
    }

    const value = cmdList.map(cmd => {
      const aliasesStr = cmd.aliases && cmd.aliases.length > 0 ? ` (Aliases: ${cmd.aliases.join(', ')})` : '';
      return `\`${cmd.name}\` - *${cmd.description}*${aliasesStr}`;
    }).join('\n');
    
    currentEmbed.addFields({ name: `== ${cat.toUpperCase()} ==`, value: value.slice(0, 1024) });
    fieldsCount++;
  }
  
  embeds.push(currentEmbed);

  return respond(ctx, { embeds });
}
