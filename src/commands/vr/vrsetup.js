/**
 * .vrsetup — interactive VR profile wizard.
 *
 * Step 1: component select menu → choose a headset profile.
 * Step 2: modal popup → validated SteamID64 (typed privately, never posted
 *         to the channel).
 * The pair is persisted on the user's database profile for .vrstats.
 */
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} from 'discord.js';
import { db } from '../../database/index.js';
import { brandEmbed, successEmbed, errorEmbed } from '../../core/embeds.js';
import { promptModal } from '../../core/components.js';
import { flavor } from '../../utils/humanize.js';
import { isValidSteam64 } from '../../services/steam.js';

export const HEADSET_PROFILES = Object.freeze([
  { id: 'quest3', label: 'Meta Quest 3', emoji: '🥽' },
  { id: 'quest2', label: 'Meta Quest 2', emoji: '🥽' },
  { id: 'index', label: 'Valve Index', emoji: '🎛️' },
  { id: 'pico4', label: 'Pico 4', emoji: '🛸' },
  { id: 'vive', label: 'HTC Vive', emoji: '📡' },
  { id: 'vivepro2', label: 'HTC Vive Pro 2', emoji: '📡' },
  { id: 'bigscreen', label: 'Bigscreen Beyond', emoji: '👓' },
  { id: 'psvr2', label: 'PlayStation VR2', emoji: '🎮' },
  { id: 'other', label: 'Other / DIY', emoji: '🔧' },
]);

export default {
  name: 'vrsetup',
  category: 'VR',
  description: 'Interactive wizard: pick your VR headset and link a SteamID64.',
  usage: '.vrsetup',
  aliases: [],
  cooldownMs: 5000,
  options: [],
  async execute(ctx) {
    const existing = db.collection('users').get(ctx.user.id)?.vr ?? null;

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`vrsetup:${ctx.user.id}`)
      .setPlaceholder('Select your VR headset…')
      .addOptions(
        HEADSET_PROFILES.map((profile) =>
          new StringSelectMenuOptionBuilder()
            .setValue(profile.id)
            .setLabel(profile.label)
            .setEmoji(profile.emoji)
            .setDefault(existing?.headsetId === profile.id)
        )
      );

    const wizardMessage = await ctx.reply({
      embeds: [
        brandEmbed()
          .setTitle('🥽 VR Setup — Step 1/2')
          .setDescription(
            existing
              ? `Welcome back! You're currently set up as **${existing.headsetLabel}**.\nPick a headset to update your profile.`
              : 'Pick the headset profile you play on — a quick popup will then ask for your SteamID64.'
          ),
      ],
      components: [new ActionRowBuilder().addComponents(menu)],
    });

    let selection;
    try {
      selection = await wizardMessage.awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        filter: (component) => component.user.id === ctx.user.id && component.customId === `vrsetup:${ctx.user.id}`,
        time: 120_000,
      });
    } catch {
      await wizardMessage.edit({ embeds: [errorEmbed('Setup closed', flavor('timeout'))], components: [] });
      return;
    }

    const headset = HEADSET_PROFILES.find((profile) => profile.id === selection.values[0]);

    // Step 2: modal popup — the ID is typed privately, never into the channel.
    const submit = await promptModal(selection, {
      title: `Link Steam — ${headset.label}`,
      timeoutMs: 180_000,
      inputs: [
        {
          id: 'steam64',
          label: 'SteamID64 (17 digits, starts 7656119…)',
          placeholder: '76561198000000000',
          value: existing?.steam64 ?? undefined,
          required: true,
          minLength: 17,
          maxLength: 17,
        },
      ],
    });

    if (!submit) {
      await wizardMessage.edit({ embeds: [errorEmbed('Setup closed', flavor('timeout'))], components: [] }).catch(() => {});
      return;
    }

    const steam64 = submit.fields.getTextInputValue('steam64').trim();
    if (!isValidSteam64(steam64)) {
      const rejection = {
        embeds: [errorEmbed('Invalid SteamID64', 'That doesn’t look right — it must be **17 digits** beginning with `7656119`. Find yours at https://steamid.io, then run `.vrsetup` again.')],
        components: [],
      };
      if (submit.isFromMessage()) await submit.update(rejection).catch(() => {});
      else await submit.reply(rejection).catch(() => {});
      return;
    }

    db.collection('users').update(ctx.user.id, (profile) => ({
      ...profile,
      vr: { headsetId: headset.id, headsetLabel: headset.label, steam64, linkedAt: Date.now() },
    }));

    const confirmation = {
      embeds: [
        successEmbed(
          'VR profile saved',
          `${flavor('done')}\n\n**Headset:** ${headset.emoji} ${headset.label}\n**SteamID64:** \`${steam64}\`\n\nTry \`.vrstats\` to see your aggregated VR metrics.`
        ),
      ],
      components: [],
    };
    if (submit.isFromMessage()) await submit.update(confirmation).catch(() => {});
    else await submit.reply(confirmation).catch(() => {});
  },
};
