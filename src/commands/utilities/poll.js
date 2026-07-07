/**
 * .poll — native button polls with live tallies.
 *   .poll "Best headset?" "Quest 3" "Index" "Bigscreen Beyond"
 * With no options, becomes a yes/no (👍/👎) poll.
 *
 * Votes are buttons, not reactions: one vote per person (tap again to
 * retract, tap another to switch), live progress bars in the embed, and an
 * End-poll control for the author/moderators. State persists in the
 * database keyed by message ID and is dispatched through the component
 * router, so polls keep working across bot restarts.
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionsBitField } from 'discord.js';
import { db } from '../../database/index.js';
import { brandEmbed } from '../../core/embeds.js';
import { registerComponentHandler } from '../../core/componentRouter.js';
import { flavor } from '../../utils/humanize.js';
import { truncate } from '../../utils/text.js';

const NUMBER_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const YES_NO_EMOJI = ['👍', '👎'];
const BAR_WIDTH = 12;

/** Extracts "quoted segments"; falls back to bar-splitting, then raw text. */
function parseSegments(raw) {
  const quoted = [...raw.matchAll(/"([^"]+)"/g)].map((match) => match[1].trim()).filter(Boolean);
  if (quoted.length) return quoted;
  if (raw.includes('|')) return raw.split('|').map((part) => part.trim()).filter(Boolean);
  return raw.trim() ? [raw.trim()] : [];
}

function choiceEmoji(doc, index) {
  return doc.yesNo ? YES_NO_EMOJI[index] : NUMBER_EMOJI[index];
}

/** Renders the live (or final) results embed with unicode progress bars. */
function renderPollEmbed(doc) {
  const tallies = doc.choices.map(() => 0);
  for (const choice of Object.values(doc.votes)) {
    if (tallies[choice] !== undefined) tallies[choice] += 1;
  }
  const total = tallies.reduce((sum, count) => sum + count, 0);
  const top = Math.max(...tallies);

  const lines = doc.choices.map((choice, index) => {
    const count = tallies[index];
    const share = total ? count / total : 0;
    const filled = Math.round(share * BAR_WIDTH);
    const bar = '▰'.repeat(filled) + '▱'.repeat(BAR_WIDTH - filled);
    const crown = doc.closed && total && count === top ? ' 🏆' : '';
    return `${choiceEmoji(doc, index)} **${truncate(choice, 80)}**${crown}\n${bar}  ${count} · ${Math.round(share * 100)}%`;
  });

  const embed = brandEmbed()
    .setTitle(`📊 ${truncate(doc.question, 250)}`)
    .setDescription(lines.join('\n\n'))
    .addFields(
      { name: 'Votes', value: String(total), inline: true },
      { name: 'Started by', value: `<@${doc.authorId}>`, inline: true },
      { name: 'Status', value: doc.closed ? '🔒 Closed' : `🟢 Live — ${flavor('pollFooter')}` }
    );
  return embed;
}

/** Vote buttons in rows of five, plus the end-poll control row. */
function buildPollRows(doc, { disabled = false } = {}) {
  const rows = [];
  for (let start = 0; start < doc.choices.length; start += 5) {
    const row = new ActionRowBuilder();
    doc.choices.slice(start, start + 5).forEach((choice, offset) => {
      const index = start + offset;
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`poll:vote:${index}`)
          .setEmoji(choiceEmoji(doc, index))
          .setLabel(truncate(choice, 20))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled)
      );
    });
    rows.push(row);
  }
  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('poll:end').setLabel('End poll').setEmoji('🔒').setStyle(ButtonStyle.Danger).setDisabled(disabled)
    )
  );
  return rows;
}

/** Router entry — resolves the poll from the pressed message, applies the action. */
async function handlePollComponent(interaction, parts) {
  const polls = db.collection('polls');
  const doc = polls.get(interaction.message.id);
  if (!doc || doc.closed) {
    await interaction.reply({ content: 'This poll has already closed.', flags: MessageFlags.Ephemeral }).catch(() => {});
    return;
  }

  if (parts[0] === 'vote') {
    const index = Number.parseInt(parts[1], 10);
    if (!Number.isInteger(index) || index < 0 || index >= doc.choices.length) return;
    // Toggle semantics: same choice retracts, different choice switches.
    if (doc.votes[interaction.user.id] === index) delete doc.votes[interaction.user.id];
    else doc.votes[interaction.user.id] = index;
    polls.set(interaction.message.id, doc);
    await interaction.update({ embeds: [renderPollEmbed(doc)] }).catch(() => {});
    return;
  }

  if (parts[0] === 'end') {
    const isAuthor = interaction.user.id === doc.authorId;
    const isModerator = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages) ?? false;
    if (!isAuthor && !isModerator) {
      await interaction
        .reply({ content: 'Only the poll author (or a moderator) can end this one.', flags: MessageFlags.Ephemeral })
        .catch(() => {});
      return;
    }
    doc.closed = true;
    doc.closedAt = Date.now();
    doc.closedBy = interaction.user.id;
    polls.set(interaction.message.id, doc);
    await interaction
      .update({ embeds: [renderPollEmbed(doc)], components: buildPollRows(doc, { disabled: true }) })
      .catch(() => {});
  }
}

registerComponentHandler('poll', handlePollComponent);

export default {
  name: 'poll',
  category: 'Utilities',
  description: 'Creates a live button poll with real-time tallies from quoted strings.',
  usage: '.poll "Question" "Option 1" "Option 2" …',
  aliases: [],
  guildOnly: true,
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

    const doc = {
      question,
      choices: choices.length ? choices : ['Yes', 'No'],
      yesNo: !choices.length,
      votes: {},
      authorId: ctx.user.id,
      channelId: ctx.channel.id,
      guildId: ctx.guild.id,
      closed: false,
      createdAt: Date.now(),
    };

    const pollMessage = await ctx.reply({ embeds: [renderPollEmbed(doc)], components: buildPollRows(doc) });
    db.collection('polls').set(pollMessage.id, doc);
  },
};
