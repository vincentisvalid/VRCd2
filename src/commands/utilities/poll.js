/**
 * .poll — parses multi-quoted strings into a clean reaction poll.
 *   .poll "Best headset?" "Quest 3" "Index" "Bigscreen Beyond"
 * With no options, becomes a yes/no (👍/👎) poll.
 */
import { brandEmbed } from '../../core/embeds.js';
import { truncate } from '../../utils/text.js';

const NUMBER_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

/** Extracts "quoted segments"; falls back to bar-splitting, then raw text. */
function parseSegments(raw) {
  const quoted = [...raw.matchAll(/"([^"]+)"/g)].map((match) => match[1].trim()).filter(Boolean);
  if (quoted.length) return quoted;
  if (raw.includes('|')) return raw.split('|').map((part) => part.trim()).filter(Boolean);
  return raw.trim() ? [raw.trim()] : [];
}

export default {
  name: 'poll',
  category: 'Utilities',
  description: 'Creates a reaction poll from quoted strings.',
  usage: '.poll "Question" "Option 1" "Option 2" …',
  aliases: [],
  guildOnly: true,
  botPermissions: ['AddReactions'],
  cooldownMs: 5000,
  options: [
    { name: 'poll', type: 'string', description: '"Question" "Opt1" "Opt2" … (or bar-separated)', required: true, rest: true },
  ],
  async execute(ctx) {
    const segments = parseSegments(ctx.getOption('poll'));
    if (!segments.length) return ctx.replyError('Empty poll', 'Give me at least a question: `.poll "Pizza tonight?"`');

    const [question, ...choices] = segments;
    if (choices.length === 1) return ctx.replyError('Need two options', 'Polls need zero options (yes/no) or at least two.');
    if (choices.length > NUMBER_EMOJI.length) return ctx.replyError('Too many options', `Polls cap at ${NUMBER_EMOJI.length} options.`);

    const embed = brandEmbed().setTitle(`📊 ${truncate(question, 250)}`);
    const reactions = choices.length
      ? NUMBER_EMOJI.slice(0, choices.length)
      : ['👍', '👎'];
    if (choices.length) {
      embed.setDescription(choices.map((choice, index) => `${NUMBER_EMOJI[index]}  ${truncate(choice, 100)}`).join('\n'));
    } else {
      embed.setDescription('👍 Yes · 👎 No');
    }
    embed.addFields({ name: 'Started by', value: `<@${ctx.user.id}>`, inline: true });

    const pollMessage = await ctx.reply({ embeds: [embed] });
    for (const emoji of reactions) {
      await pollMessage.react(emoji).catch(() => {
        /* one blocked reaction should not kill the rest */
      });
    }
  },
};
