/**
 * Component UI kit — shared building blocks for native Discord interaction
 * surfaces: confirmation dialogs, modal popups, and button pagination.
 * Centralising these keeps every command's UX identical and human.
 */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { brandEmbed, errorEmbed } from './embeds.js';
import { flavor } from '../utils/humanize.js';

/** Short unique suffix so concurrent dialogs never cross wires. */
const nonce = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Returns copies of the given action rows with every component disabled. */
export function disableRows(rows = []) {
  return rows.map((row) => {
    const copy = ActionRowBuilder.from(row);
    for (const component of copy.components) component.setDisabled(true);
    return copy;
  });
}

/**
 * Confirmation dialog with native buttons.
 *
 * Sends `embed` with a styled Confirm + Cancel row, waits for the invoker's
 * press, and resolves `{ confirmed, finalize }`. Cancel/timeout paths update
 * the dialog themselves; on confirm the caller performs its action, then
 * calls `finalize(payload)` to morph the dialog into the result card.
 */
export async function confirmDialog(ctx, {
  embed,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmStyle = ButtonStyle.Danger,
  confirmEmoji = null,
  timeoutMs = 30_000,
} = {}) {
  const id = nonce();
  const confirmId = `confirm:${id}:yes`;
  const cancelId = `confirm:${id}:no`;

  const confirmButton = new ButtonBuilder().setCustomId(confirmId).setLabel(confirmLabel).setStyle(confirmStyle);
  if (confirmEmoji) confirmButton.setEmoji(confirmEmoji);
  const row = new ActionRowBuilder().addComponents(
    confirmButton,
    new ButtonBuilder().setCustomId(cancelId).setLabel(cancelLabel).setStyle(ButtonStyle.Secondary)
  );

  const dialog = await ctx.reply({ embeds: [embed], components: [row] });

  let press = null;
  try {
    press = await dialog.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (component) =>
        (component.customId === confirmId || component.customId === cancelId) &&
        (component.user.id === ctx.user.id
          ? true
          : (component.reply({ content: flavor('notYours'), flags: MessageFlags.Ephemeral }).catch(() => {}), false)),
      time: timeoutMs,
    });
  } catch {
    /* timed out */
  }

  const finalize = async (payload) => {
    const body = { components: [], ...payload };
    try {
      if (press && !press.deferred && !press.replied) return await press.update(body);
      return await dialog.edit(body);
    } catch {
      return null;
    }
  };

  if (!press) {
    await finalize({ embeds: [errorEmbed('Timed out', flavor('timeout'))] });
    return { confirmed: false, timedOut: true, finalize };
  }
  if (press.customId === cancelId) {
    await finalize({ embeds: [brandEmbed().setTitle('👍 Cancelled').setDescription(flavor('cancelled'))] });
    return { confirmed: false, timedOut: false, finalize };
  }
  // Ack immediately so callers can run slow work before finalizing the card.
  await press.deferUpdate().catch(() => {});
  return { confirmed: true, timedOut: false, press, finalize };
}

/**
 * Modal popup helper. Shows a modal on any repliable interaction (component
 * press or slash command) and awaits the matching submit from the same user.
 *
 * `inputs`: [{ id, label, style: 'short'|'paragraph', placeholder, value,
 *             required, minLength, maxLength }]
 * Resolves the ModalSubmitInteraction, or null on timeout/dismissal.
 * Read values via `submit.fields.getTextInputValue(id)`.
 */
export async function promptModal(interaction, { title, inputs, timeoutMs = 300_000 }) {
  const modalId = `modal:${nonce()}`;
  const modal = new ModalBuilder().setCustomId(modalId).setTitle(title.slice(0, 45));

  for (const input of inputs.slice(0, 5)) {
    const text = new TextInputBuilder()
      .setCustomId(input.id)
      .setLabel(input.label.slice(0, 45))
      .setStyle(input.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(input.required ?? true);
    if (input.placeholder) text.setPlaceholder(input.placeholder.slice(0, 100));
    if (input.value) text.setValue(String(input.value).slice(0, input.maxLength ?? 4000));
    if (input.minLength) text.setMinLength(input.minLength);
    if (input.maxLength) text.setMaxLength(input.maxLength);
    modal.addComponents(new ActionRowBuilder().addComponents(text));
  }

  await interaction.showModal(modal);
  try {
    return await interaction.awaitModalSubmit({
      filter: (submit) => submit.customId === modalId && submit.user.id === interaction.user.id,
      time: timeoutMs,
    });
  } catch {
    return null; // dismissed or timed out — callers treat both as "changed their mind"
  }
}

/**
 * Button paginator for multi-page embeds. Locks navigation to the invoker
 * (others get a friendly ephemeral nudge), shows a live page counter, and
 * disables itself after `timeoutMs` of inactivity.
 */
export async function paginate(ctx, pages, { timeoutMs = 120_000 } = {}) {
  if (!pages.length) return null;
  if (pages.length === 1) return ctx.reply({ embeds: [pages[0]] });

  const id = nonce();
  let index = 0;

  const buildRow = () =>
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`page:${id}:first`).setEmoji('⏮️').setStyle(ButtonStyle.Secondary).setDisabled(index === 0),
      new ButtonBuilder().setCustomId(`page:${id}:prev`).setEmoji('◀️').setStyle(ButtonStyle.Primary).setDisabled(index === 0),
      new ButtonBuilder().setCustomId(`page:${id}:counter`).setLabel(`${index + 1} / ${pages.length}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId(`page:${id}:next`).setEmoji('▶️').setStyle(ButtonStyle.Primary).setDisabled(index === pages.length - 1),
      new ButtonBuilder().setCustomId(`page:${id}:last`).setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setDisabled(index === pages.length - 1)
    );

  const message = await ctx.reply({ embeds: [pages[0]], components: [buildRow()] });

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (component) => component.customId.startsWith(`page:${id}:`),
    time: timeoutMs,
  });

  collector.on('collect', async (component) => {
    if (component.user.id !== ctx.user.id) {
      await component.reply({ content: flavor('notYours'), flags: MessageFlags.Ephemeral }).catch(() => {});
      return;
    }
    const action = component.customId.split(':')[2];
    if (action === 'first') index = 0;
    else if (action === 'prev') index = Math.max(0, index - 1);
    else if (action === 'next') index = Math.min(pages.length - 1, index + 1);
    else if (action === 'last') index = pages.length - 1;
    collector.resetTimer();
    await component.update({ embeds: [pages[index]], components: [buildRow()] }).catch(() => {});
  });

  collector.on('end', async () => {
    await message.edit({ components: disableRows([buildRow()]) }).catch(() => {});
  });

  return message;
}
