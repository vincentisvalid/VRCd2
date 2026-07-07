/**
 * .sendembed — custom embed workshop.
 *
 * Two ways in:
 *   1. Quick mode — `.sendembed title | subtitle | line…` (bar-separated,
 *      attachments ride along), exactly as before.
 *   2. Builder mode — bare `.sendembed` opens a native modal popup (title,
 *      description, colour, image URL), then shows a live preview with
 *      Send / Edit again / Discard buttons before anything goes public.
 *
 * The deployed message ID is retained in the database for .editembed /
 * .delembed.
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from 'discord.js';
import { db } from '../../database/index.js';
import { brandEmbed, errorEmbed, successEmbed } from '../../core/embeds.js';
import { promptModal, disableRows } from '../../core/components.js';
import { flavor } from '../../utils/humanize.js';
import { truncate } from '../../utils/text.js';

const HEX_COLOR = /^#?[0-9a-f]{6}$/i;
const HTTP_URL = /^https?:\/\/\S+$/i;

/** Records a deployed embed so .editembed / .delembed can find it later. */
function trackDeployedEmbed(ctx, deployed) {
  db.collection('embeds').set(ctx.channel.id, {
    messageId: deployed.id,
    channelId: ctx.channel.id,
    guildId: ctx.guild.id,
    authorId: ctx.user.id,
    createdAt: Date.now(),
  });
}

const BUILDER_INPUTS = (draft = {}) => [
  { id: 'title', label: 'Title', placeholder: 'The headline of your embed', value: draft.title, required: true, maxLength: 256 },
  { id: 'description', label: 'Description', style: 'paragraph', placeholder: 'Body text — markdown works here', value: draft.description, required: false, maxLength: 4000 },
  { id: 'color', label: 'Accent colour (hex, optional)', placeholder: '#8A2BE2', value: draft.color, required: false, maxLength: 7 },
  { id: 'image', label: 'Image URL (optional)', placeholder: 'https://…', value: draft.image, required: false, maxLength: 500 },
];

function draftFromModal(submit) {
  return {
    title: submit.fields.getTextInputValue('title').trim(),
    description: submit.fields.getTextInputValue('description').trim(),
    color: submit.fields.getTextInputValue('color').trim(),
    image: submit.fields.getTextInputValue('image').trim(),
  };
}

function draftToEmbed(draft) {
  const embed = brandEmbed().setTitle(truncate(draft.title, 256));
  if (draft.description) embed.setDescription(truncate(draft.description, 4096));
  if (draft.color && HEX_COLOR.test(draft.color)) embed.setColor(`#${draft.color.replace('#', '')}`);
  if (draft.image && HTTP_URL.test(draft.image)) embed.setImage(draft.image);
  return embed;
}

function previewRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('embuild:send').setLabel('Send it').setEmoji('📨').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('embuild:edit').setLabel('Edit again').setEmoji('🛠️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('embuild:discard').setLabel('Discard').setEmoji('🗑️').setStyle(ButtonStyle.Secondary)
  );
}

/**
 * Preview → (Send | Edit-loop | Discard). `submit` is the modal submission
 * that produced the current draft; the preview lives on its reply.
 */
async function runPreviewLoop(ctx, submit, draft) {
  const previewPayload = {
    content: `**Preview** — nobody else has seen this yet. ${flavor('done')}`,
    embeds: [draftToEmbed(draft)],
    components: [previewRow()],
  };
  const preview = submit.isFromMessage()
    ? await submit.update({ ...previewPayload }).then(() => submit.message)
    : await submit.reply({ ...previewPayload, fetchReply: true });

  for (;;) {
    let press;
    try {
      press = await preview.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (component) =>
          component.customId.startsWith('embuild:') &&
          (component.user.id === ctx.user.id
            ? true
            : (component.reply({ content: flavor('notYours'), flags: MessageFlags.Ephemeral }).catch(() => {}), false)),
        time: 300_000,
      });
    } catch {
      await preview.edit({ content: null, embeds: [errorEmbed('Builder closed', flavor('timeout'))], components: [] }).catch(() => {});
      return;
    }

    if (press.customId === 'embuild:discard') {
      await press.update({ content: null, embeds: [brandEmbed().setTitle('🗑️ Draft discarded').setDescription(flavor('cancelled'))], components: [] }).catch(() => {});
      return;
    }

    if (press.customId === 'embuild:send') {
      const deployed = await ctx.channel.send({ embeds: [draftToEmbed(draft)] });
      trackDeployedEmbed(ctx, deployed);
      await press
        .update({
          content: null,
          embeds: [successEmbed('Embed deployed', `Tracked as \`${deployed.id}\` — \`.editembed\` and \`.delembed\` now target it.`)],
          components: [],
        })
        .catch(() => {});
      return;
    }

    // Edit again → reopen the modal pre-filled with the current draft.
    const resubmit = await promptModal(press, { title: 'Edit your embed', inputs: BUILDER_INPUTS(draft), timeoutMs: 300_000 });
    if (!resubmit) {
      await preview.edit({ components: disableRows([previewRow()]) }).catch(() => {});
      return;
    }
    draft = draftFromModal(resubmit);
    const refreshed = { content: '**Preview** — updated.', embeds: [draftToEmbed(draft)], components: [previewRow()] };
    if (resubmit.isFromMessage()) await resubmit.update(refreshed).catch(() => {});
    else await resubmit.reply(refreshed).catch(() => {});
  }
}

export default {
  name: 'sendembed',
  category: 'Embeds',
  description: 'Sends a custom embed — bar-separated quick mode, or an interactive popup builder.',
  usage: '.sendembed [title | subtitle | …]',
  aliases: ['embed'],
  guildOnly: true,
  userPermissions: ['ManageMessages'],
  cooldownMs: 3000,
  options: [
    { name: 'text', type: 'string', description: 'Bar-separated content: title | subtitle | … (omit to open the builder)', required: false, rest: true },
    { name: 'file', type: 'attachment', description: 'Optional attachment to include', required: false },
  ],
  async execute(ctx) {
    const raw = ctx.getOption('text');

    // ── Builder mode ─────────────────────────────────────────────────────
    if (!raw || !raw.trim()) {
      if (ctx.isSlash) {
        // A slash command interaction can open the popup directly.
        const submit = await promptModal(ctx.interaction, { title: 'Build your embed', inputs: BUILDER_INPUTS(), timeoutMs: 300_000 });
        if (!submit) return;
        return runPreviewLoop(ctx, submit, draftFromModal(submit));
      }

      // A plain message cannot spawn a modal — offer a launch button.
      const launcher = await ctx.reply({
        embeds: [
          brandEmbed()
            .setTitle('📝 Embed workshop')
            .setDescription('Hit the button and a popup will walk you through title, body, colour, and image — with a private preview before anything is posted.'),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('embuild:open').setLabel('Open builder').setEmoji('🛠️').setStyle(ButtonStyle.Primary)
          ),
        ],
      });

      let press;
      try {
        press = await launcher.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (component) =>
            component.customId === 'embuild:open' &&
            (component.user.id === ctx.user.id
              ? true
              : (component.reply({ content: flavor('notYours'), flags: MessageFlags.Ephemeral }).catch(() => {}), false)),
          time: 120_000,
        });
      } catch {
        return launcher.edit({ embeds: [errorEmbed('Builder closed', flavor('timeout'))], components: [] }).catch(() => {});
      }

      const submit = await promptModal(press, { title: 'Build your embed', inputs: BUILDER_INPUTS(), timeoutMs: 300_000 });
      if (!submit) {
        return launcher.edit({ embeds: [errorEmbed('Builder closed', flavor('timeout'))], components: [] }).catch(() => {});
      }
      return runPreviewLoop(ctx, submit, draftFromModal(submit));
    }

    // ── Quick mode (bar-separated) ───────────────────────────────────────
    const segments = raw
      .split('|')
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (!segments.length) {
      return ctx.replyError('Nothing to send', 'Provide at least a title: `.sendembed My title | my subtitle` — or run bare `.sendembed` for the popup builder.');
    }

    const [title, ...body] = segments;
    const embed = brandEmbed().setTitle(truncate(title, 256));
    if (body.length) embed.setDescription(truncate(body.join('\n'), 4096));

    // Attachments: slash option or raw message uploads pass straight through.
    const files = ctx.attachments.map((attachment) => attachment.url ?? attachment);

    const deployed = await ctx.channel.send({ embeds: [embed], files });
    trackDeployedEmbed(ctx, deployed);

    if (ctx.isSlash) {
      await ctx.reply({ content: `✅ Embed deployed (\`${deployed.id}\`).`, ephemeral: true });
    } else {
      await ctx.message.delete().catch(() => {
        /* keep the original if we lack ManageMessages */
      });
    }
  },
};
