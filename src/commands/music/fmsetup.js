/**
 * .fmsetup — music platform account linking.
 *
 * Bare invocation opens an interactive select-menu wizard (Last.fm / Apple
 * Music / Spotify) where every value is entered through a private modal
 * popup — nothing sensitive ever appears in the channel. Explicit
 * subcommands remain for direct/scripted linking:
 *   .fmsetup lastfm <username>
 *   .fmsetup applemusic <handle>
 *   .fmsetup spotify <client_id> <client_secret>
 *
 * Spotify safety pattern (subcommand path): the credential-bearing message
 * is purged from history immediately, credentials are stored only on the
 * caller's own DB profile, and only a masked suffix is ever echoed back.
 * The wizard path is stronger still — modal inputs never enter chat history.
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

function saveMusicField(userId, mutator) {
  db.collection('users').update(userId, (profile) => {
    profile.music = mutator(profile.music ?? {});
    return profile;
  });
}

const mask = (secret) => `••••${String(secret).slice(-4)}`;
const HANDLE_PATTERN = /^[\w.\-]{1,32}$/;
const SPOTIFY_HEX = /^[a-f0-9]{32}$/i;

/** Applies a modal outcome back onto the wizard message (or as a reply). */
async function respondToModal(submit, payload) {
  const body = { components: [], ...payload };
  if (submit.isFromMessage()) return submit.update(body).catch(() => {});
  return submit.reply(body).catch(() => {});
}

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
        if (!HANDLE_PATTERN.test(username)) {
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

        if (!SPOTIFY_HEX.test(clientId) || !SPOTIFY_HEX.test(clientSecret)) {
          return ctx.replyError('Invalid credentials', 'Spotify client IDs and secrets are 32-character hex strings — check your developer dashboard.');
        }

        saveMusicField(ctx.user.id, (music) => ({
          ...music,
          spotify: { clientId, clientSecret, linkedAt: Date.now() },
        }));
        return ctx.replySuccess(
          'Spotify credentials secured',
          `Your triggering message was purged and the credentials were stored on your profile only.\nClient ID: \`${mask(clientId)}\` · Secret: \`${mask(clientSecret)}\`\n\n💡 Next time, the \`.fmsetup\` wizard lets you enter these in a private popup instead.`
        );
      }

      default: {
        // ── Interactive wizard — everything flows through modal popups ──
        const existing = db.collection('users').get(ctx.user.id)?.music ?? {};

        const menu = new StringSelectMenuBuilder()
          .setCustomId(`fmsetup:${ctx.user.id}`)
          .setPlaceholder('Pick a platform to link…')
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue('lastfm')
              .setLabel('Last.fm')
              .setEmoji('🎵')
              .setDescription(existing.lastfm ? `Linked as ${existing.lastfm}` : 'Scrobbles & now-playing'),
            new StringSelectMenuOptionBuilder()
              .setValue('applemusic')
              .setLabel('Apple Music')
              .setEmoji('🍎')
              .setDescription(existing.appleMusic ? `Linked as ${existing.appleMusic}` : 'Profile handle'),
            new StringSelectMenuOptionBuilder()
              .setValue('spotify')
              .setLabel('Spotify')
              .setEmoji('🟢')
              .setDescription(existing.spotify ? 'Credentials linked' : 'Developer credentials — private popup')
          );

        const wizardMessage = await ctx.reply({
          embeds: [
            brandEmbed()
              .setTitle('🎧 Music account linking')
              .setDescription('Choose a platform — a private popup will collect the details.\nNothing you type in the popup ever appears in this channel.'),
          ],
          components: [new ActionRowBuilder().addComponents(menu)],
        });

        let selection;
        try {
          selection = await wizardMessage.awaitMessageComponent({
            componentType: ComponentType.StringSelect,
            filter: (component) => component.user.id === ctx.user.id,
            time: 120_000,
          });
        } catch {
          return wizardMessage.edit({ embeds: [errorEmbed('Setup closed', flavor('timeout'))], components: [] });
        }

        const platform = selection.values[0];

        // ── Spotify: two-field credential modal ─────────────────────────
        if (platform === 'spotify') {
          const submit = await promptModal(selection, {
            title: 'Link Spotify developer app',
            timeoutMs: 300_000,
            inputs: [
              { id: 'client_id', label: 'Client ID (32 hex characters)', placeholder: 'from developer.spotify.com/dashboard', required: true, minLength: 32, maxLength: 32 },
              { id: 'client_secret', label: 'Client secret (32 hex characters)', placeholder: 'keep this private — it stays off the channel', required: true, minLength: 32, maxLength: 32 },
            ],
          });
          if (!submit) {
            return wizardMessage.edit({ embeds: [errorEmbed('Setup closed', flavor('timeout'))], components: [] }).catch(() => {});
          }

          const clientId = submit.fields.getTextInputValue('client_id').trim();
          const clientSecret = submit.fields.getTextInputValue('client_secret').trim();
          if (!SPOTIFY_HEX.test(clientId) || !SPOTIFY_HEX.test(clientSecret)) {
            return respondToModal(submit, {
              embeds: [errorEmbed('Invalid credentials', 'Spotify client IDs and secrets are 32-character hex strings — double-check your developer dashboard and run `.fmsetup` again.')],
            });
          }

          saveMusicField(ctx.user.id, (music) => ({
            ...music,
            spotify: { clientId, clientSecret, linkedAt: Date.now() },
          }));
          return respondToModal(submit, {
            embeds: [
              successEmbed(
                'Spotify credentials secured',
                `${flavor('done')} Entered privately, stored on your profile only.\nClient ID: \`${mask(clientId)}\` · Secret: \`${mask(clientSecret)}\``
              ),
            ],
          });
        }

        // ── Last.fm / Apple Music: single-handle modal ──────────────────
        const isLastfm = platform === 'lastfm';
        const submit = await promptModal(selection, {
          title: isLastfm ? 'Link Last.fm' : 'Link Apple Music',
          timeoutMs: 300_000,
          inputs: [
            {
              id: 'handle',
              label: isLastfm ? 'Your Last.fm username' : 'Your Apple Music handle',
              placeholder: isLastfm ? 'e.g. rj' : 'e.g. vrcd-listener',
              value: (isLastfm ? existing.lastfm : existing.appleMusic) ?? undefined,
              required: true,
              minLength: 1,
              maxLength: 64,
            },
          ],
        });
        if (!submit) {
          return wizardMessage.edit({ embeds: [errorEmbed('Setup closed', flavor('timeout'))], components: [] }).catch(() => {});
        }

        const handle = submit.fields.getTextInputValue('handle').trim();
        if (/\s/.test(handle) || (isLastfm && !HANDLE_PATTERN.test(handle))) {
          return respondToModal(submit, {
            embeds: [errorEmbed('Invalid handle', 'Handles must be a single word (letters, digits, `._-`) up to 64 characters.')],
          });
        }

        saveMusicField(ctx.user.id, (music) =>
          isLastfm ? { ...music, lastfm: handle } : { ...music, appleMusic: handle }
        );
        return respondToModal(submit, {
          embeds: [successEmbed('Account linked', `${flavor('done')} **${isLastfm ? 'Last.fm' : 'Apple Music'}** → \`${handle}\`${isLastfm ? '\nTry `.fm` to flex what you’re listening to.' : ''}`)],
        });
      }
    }
  },
};
