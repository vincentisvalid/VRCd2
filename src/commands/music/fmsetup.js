/**
 * .fmsetup — music platform account linking.
 *
 * Bare invocation opens an interactive select-menu wizard (Last.fm / Apple
 * Music). Explicit subcommands allow direct linking, including the secure
 * Spotify developer-credential workflow:
 *   .fmsetup lastfm <username>
 *   .fmsetup applemusic <handle>
 *   .fmsetup spotify <client_id> <client_secret>
 *
 * Spotify safety pattern: the credential-bearing message is purged from
 * history immediately, credentials are stored only on the caller's own DB
 * profile, and only a masked suffix is ever echoed back.
 */
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} from 'discord.js';
import { db } from '../../database/index.js';
import { brandEmbed, successEmbed, errorEmbed } from '../../core/embeds.js';

function saveMusicField(userId, mutator) {
  db.collection('users').update(userId, (profile) => {
    profile.music = mutator(profile.music ?? {});
    return profile;
  });
}

const mask = (secret) => `••••${String(secret).slice(-4)}`;

export default {
  name: 'fmsetup',
  category: 'Music',
  description: 'Links Last.fm, Apple Music, or Spotify credentials to your profile.',
  usage: '.fmsetup [lastfm <username> | applemusic <handle> | spotify <client_id> <client_secret>]',
  aliases: [],
  cooldownMs: 4000,
  defaultSubcommand: 'wizard',
  subcommands: [
    { name: 'wizard', description: 'Interactive platform-linking menu', options: [] },
    {
      name: 'lastfm',
      description: 'Link your Last.fm username',
      options: [{ name: 'username', type: 'string', description: 'Your Last.fm handle', required: true }],
    },
    {
      name: 'applemusic',
      description: 'Link your Apple Music handle',
      options: [{ name: 'handle', type: 'string', description: 'Your Apple Music profile handle', required: true }],
    },
    {
      name: 'spotify',
      description: 'Securely tie Spotify developer API credentials to your profile',
      options: [
        { name: 'client_id', type: 'string', description: 'Spotify app client ID', required: true },
        { name: 'client_secret', type: 'string', description: 'Spotify app client secret', required: true },
      ],
    },
  ],
  async execute(ctx) {
    switch (ctx.subcommand) {
      case 'lastfm': {
        const username = ctx.getOption('username').trim();
        if (!/^[\w.\-]{1,32}$/.test(username)) {
          return ctx.replyError('Invalid username', 'Last.fm usernames are 1–32 characters of letters, digits, `._-`.');
        }
        saveMusicField(ctx.user.id, (music) => ({ ...music, lastfm: username }));
        return ctx.replySuccess('Last.fm linked', `Now spinning as **${username}** — try \`.fm\`.`);
      }

      case 'applemusic': {
        const handle = ctx.getOption('handle').trim();
        if (handle.length < 2 || handle.length > 64) {
          return ctx.replyError('Invalid handle', 'Apple Music handles must be 2–64 characters.');
        }
        saveMusicField(ctx.user.id, (music) => ({ ...music, appleMusic: handle }));
        return ctx.replySuccess('Apple Music linked', `Handle **${handle}** saved to your profile.`);
      }

      case 'spotify': {
        const clientId = ctx.getOption('client_id').trim();
        const clientSecret = ctx.getOption('client_secret').trim();

        // Purge the credential-bearing message before anything else.
        if (!ctx.isSlash) await ctx.message.delete().catch(() => {});

        if (!/^[a-f0-9]{32}$/i.test(clientId) || !/^[a-f0-9]{32}$/i.test(clientSecret)) {
          return ctx.replyError('Invalid credentials', 'Spotify client IDs and secrets are 32-character hex strings — check your developer dashboard.');
        }

        saveMusicField(ctx.user.id, (music) => ({
          ...music,
          spotify: { clientId, clientSecret, linkedAt: Date.now() },
        }));
        return ctx.replySuccess(
          'Spotify credentials secured',
          `Your triggering message was purged and the credentials were stored on your profile only.\nClient ID: \`${mask(clientId)}\` · Secret: \`${mask(clientSecret)}\``
        );
      }

      default: {
        // ── Interactive wizard ──────────────────────────────────────────
        const menu = new StringSelectMenuBuilder()
          .setCustomId(`fmsetup:${ctx.user.id}`)
          .setPlaceholder('Pick a platform to link…')
          .addOptions(
            new StringSelectMenuOptionBuilder().setValue('lastfm').setLabel('Last.fm').setEmoji('🎵'),
            new StringSelectMenuOptionBuilder().setValue('applemusic').setLabel('Apple Music').setEmoji('🍎')
          );

        const wizardMessage = await ctx.reply({
          embeds: [
            brandEmbed()
              .setTitle('🎧 Music account linking')
              .setDescription('Choose the platform to link. (Spotify uses `.fmsetup spotify <client_id> <client_secret>` — ideally in DMs.)'),
          ],
          components: [new ActionRowBuilder().addComponents(menu)],
        });

        let selection;
        try {
          selection = await wizardMessage.awaitMessageComponent({
            componentType: ComponentType.StringSelect,
            filter: (component) => component.user.id === ctx.user.id,
            time: 60_000,
          });
        } catch {
          return wizardMessage.edit({ embeds: [errorEmbed('Setup timed out', 'No platform chosen within 60 seconds.')], components: [] });
        }

        const platform = selection.values[0];
        await selection.update({
          embeds: [
            brandEmbed()
              .setTitle(platform === 'lastfm' ? '🎵 Last.fm' : '🍎 Apple Music')
              .setDescription('Reply with your username/handle — you have 60 seconds.'),
          ],
          components: [],
        });

        let handle;
        try {
          const collected = await ctx.channel.awaitMessages({
            filter: (candidate) => candidate.author.id === ctx.user.id,
            max: 1,
            time: 60_000,
            errors: ['time'],
          });
          handle = collected.first().content.trim();
        } catch {
          return ctx.followUp({ embeds: [errorEmbed('Setup timed out', 'No handle received — run `.fmsetup` again.')] });
        }

        if (handle.length < 1 || handle.length > 64 || /\s/.test(handle)) {
          return ctx.followUp({ embeds: [errorEmbed('Invalid handle', 'Handles must be a single word up to 64 characters.')] });
        }

        saveMusicField(ctx.user.id, (music) =>
          platform === 'lastfm' ? { ...music, lastfm: handle } : { ...music, appleMusic: handle }
        );
        return ctx.followUp({
          embeds: [successEmbed('Account linked', `**${platform === 'lastfm' ? 'Last.fm' : 'Apple Music'}** → \`${handle}\``)],
        });
      }
    }
  },
};
