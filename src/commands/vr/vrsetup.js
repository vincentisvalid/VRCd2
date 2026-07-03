/**
 * .vrsetup — interactive VR profile wizard.
 *
 * Step 1: component select menu → choose a headset profile.
 * Step 2: awaited follow-up message → validated SteamID64.
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
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`vrsetup:${ctx.user.id}`)
      .setPlaceholder('Select your VR headset…')
      .addOptions(
        HEADSET_PROFILES.map((profile) =>
          new StringSelectMenuOptionBuilder().setValue(profile.id).setLabel(profile.label).setEmoji(profile.emoji)
        )
      );

    const wizardMessage = await ctx.reply({
      embeds: [brandEmbed().setTitle('🥽 VR Setup — Step 1/2').setDescription('Pick the headset profile you play on.')],
      components: [new ActionRowBuilder().addComponents(menu)],
    });

    let selection;
    try {
      selection = await wizardMessage.awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        filter: (component) => component.user.id === ctx.user.id && component.customId === `vrsetup:${ctx.user.id}`,
        time: 60_000,
      });
    } catch {
      await wizardMessage.edit({ embeds: [errorEmbed('Setup timed out', 'No headset selected within 60 seconds — run `.vrsetup` again.')], components: [] });
      return;
    }

    const headset = HEADSET_PROFILES.find((profile) => profile.id === selection.values[0]);
    await selection.update({
      embeds: [
        brandEmbed()
          .setTitle('🥽 VR Setup — Step 2/2')
          .setDescription(`Headset locked in: **${headset.label}**\n\nNow reply with your **SteamID64** (17 digits, starts with \`7656119\`).\nFind it via https://steamid.io — you have 90 seconds.`),
      ],
      components: [],
    });

    let steam64 = null;
    try {
      const collected = await ctx.channel.awaitMessages({
        filter: (candidate) => candidate.author.id === ctx.user.id,
        max: 1,
        time: 90_000,
        errors: ['time'],
      });
      steam64 = collected.first().content.trim();
    } catch {
      await ctx.followUp({ embeds: [errorEmbed('Setup timed out', 'No SteamID64 received — run `.vrsetup` again.')] });
      return;
    }

    if (!isValidSteam64(steam64)) {
      await ctx.followUp({
        embeds: [errorEmbed('Invalid SteamID64', `\`${steam64.slice(0, 30)}\` is not a valid SteamID64. It must be 17 digits beginning with \`7656119\`.`)],
      });
      return;
    }

    db.collection('users').update(ctx.user.id, (profile) => ({
      ...profile,
      vr: { headsetId: headset.id, headsetLabel: headset.label, steam64, linkedAt: Date.now() },
    }));

    await ctx.followUp({
      embeds: [successEmbed('VR profile saved', `**Headset:** ${headset.emoji} ${headset.label}\n**SteamID64:** \`${steam64}\`\n\nTry \`.vrstats\` to see your aggregated VR metrics.`)],
    });
  },
};
