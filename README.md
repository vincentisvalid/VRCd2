# VRCd Bot

> A production-grade, modular, all-in-one Discord bot framework for VR communities — hybrid prefix + slash commands, an FFmpeg media-effects engine, a local-first AI subsystem (Ollama), voice playback, enterprise moderation, and a dozen more modules. MIT licensed.

```
        ██╗   ██╗██████╗  ██████╗██████╗
        ██║   ██║██╔══██╗██╔════╝██╔══██╗
        ██║   ██║██████╔╝██║     ██║  ██║
        ╚██╗ ██╔╝██╔══██╗██║     ██║  ██║
         ╚████╔╝ ██║  ██║╚██████╗██████╔╝
          ╚═══╝  ╚═╝  ╚═╝ ╚═════╝╚═════╝   bot
```

## Feature matrix

| Module | Commands |
| --- | --- |
| **System** | `help` |
| **AI** | `llm` `askxipra` `text2img` `text2vid` `editimage` |
| **VR** | `vrsetup` `vrstats` |
| **Music** | `fmsetup` `fm` |
| **Media Effects** | `glitch` `ascii` `vhs` `greenscreen` `removebg` `cut` `vredit` |
| **Embeds** | `sendembed` `editembed` `delembed` |
| **Moderation** | `jail` `unjail` `kick` `ban` `mute` `warn` |
| **UserInfo** | `tz` `pfp` `banner` `setbio` `games` `musicgenre` `career` |
| **Admin Utils** | `troll` `stickbug` *(role-ID locked)* |
| **Voice** | `play` `pause` `stop` |
| **Settings** | `prefix` *(global / self / server)* |
| **Roles** | `reactionroles` `boosterrole` `booster` `autorole` `createrole` |
| **Quotes** | `createquote` `randomquote` |
| **Utilities** | `translate` `weather` `crypto` `urban` `poll` `reminder` `calculate` `serverinfo` `avatar-compare` `steamstatus` `github` `lyrics` `slowmode` `qr` `backup-channel` |

Every command is registered on **both** transports: classic text prefix (default `.`) and Discord slash commands — both funnel into the exact same execution logic.

---

## Requirements

| Dependency | Why | Notes |
| --- | --- | --- |
| **Node.js ≥ 18** (LTS recommended) | runtime | native ESM (`"type": "module"`) |
| **FFmpeg + FFprobe** | all Media Effects, voice transcoding | must be on `PATH` |
| **Ollama** *(optional)* | `.llm`, `.askxipra`, AI fallbacks | local instance at `127.0.0.1:11434` |
| **yt-dlp** | `.play` audio sourcing | auto-downloaded to `./bin` on first use |
| **Cairo/Pango system libs** | `canvas` (`.avatar-compare`) | only needed if npm falls back to a source build |

### Installing FFmpeg

```bash
# Debian / Ubuntu
sudo apt install ffmpeg
# macOS
brew install ffmpeg
# Windows (winget)
winget install Gyan.FFmpeg
```

### Setting up Ollama (optional but recommended)

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3        # default model for .askxipra / fallbacks
ollama serve              # listens on http://127.0.0.1:11434
```

Point the bot elsewhere with `OLLAMA_BASE_URL` in `.env`, and change the persona/default models in `config.json → ai`.

---

## Installation

```bash
git clone https://github.com/vincentisvalid/VRCd2.git
cd VRCd2
npm install

cp .env.example .env      # fill in your secrets
npm start
```

### Environment variables (`.env`)

| Variable | Required | Used by |
| --- | --- | --- |
| `DISCORD_TOKEN` | ✅ | gateway login |
| `DISCORD_CLIENT_ID` | ✅ | slash-command registration |
| `STEAM_API_KEY` | for `.vrstats` | Steam Web API lookups |
| `LASTFM_API_KEY` | for `.fm` | scrobble / now-playing queries |
| `OPENWEATHER_API_KEY` | for `.weather` | current conditions |
| `REMOVEBG_API_KEY` | optional | `.removebg` AI path (local filter fallback otherwise) |
| `GITHUB_TOKEN` | optional | raises `.github` rate limits |
| `OLLAMA_BASE_URL` | optional | overrides the Ollama host |
| `BACKUP_SECRET` | for `.backup-channel` | AES-256-GCM key derivation |

`config.json` holds all non-secret knobs: default prefix, embed colours, dev-guild slash scoping, fal.ai model routes, media size caps, the Admin Utils role allowlist, and more.

---

## Architecture

```
src/
├── index.js                 # boot: client, DB, caches, crash guards, login
├── core/
│   ├── config.js            # config.json + .env merge (deep-frozen)
│   ├── context.js           # CommandContext — the hybrid transport unifier
│   ├── options.js           # declarative option schema → prefix parser + slash getters
│   ├── dispatcher.js        # gates: guild / admin-role / owner / perms / cooldown
│   ├── components.js        # UI kit: confirm dialogs, modal popups, pagination
│   ├── componentRouter.js   # restart-proof button/select routing (polls, player)
│   ├── loader.js            # recursive command collection loader
│   ├── registrar.js         # option schema → SlashCommandBuilder manifest
│   ├── prefixes.js          # user → guild → global → default prefix chain
│   ├── resolvers.js         # mention/ID/name → User/Role/Channel
│   ├── embeds.js            # branded embeds (footer: “VRCd Bot • <UTC>”)
│   └── logger.js
├── database/index.js        # JSON KV data-access layer (atomic, debounced)
├── services/                # ollama, falai, media (FFmpeg), steam, lastfm,
│   …                        # player (voice), reminders, reactionRoles
├── events/                  # gateway listeners (messages, interactions,
│   …                        # reactions, member joins/updates)
└── commands/<category>/     # one module per command
```

### The hybrid command handler

Commands declare a **typed option schema once**:

```js
options: [
  { name: 'user',   type: 'user',   description: 'Member to warn', required: true },
  { name: 'reason', type: 'string', description: 'Why',            rest: true },
]
```

- **Prefix path** (`messageCreate`): a quote-aware tokenizer + entity resolvers materialise the schema from positional text (`.warn @Bob spamming again`).
- **Slash path** (`interactionCreate`): the same schema is materialised through the interaction's typed getters.

Both paths construct an identical `CommandContext` (`ctx.reply/edit/defer/getOption/attachments`) and pass through one dispatcher enforcing guild scoping, the **immutable Admin Utils role gate** (IDs frozen in `config.json`), permissions, and cooldowns, with every failure converted into a graceful error embed (tracebacks go to the console, never to chat).

### The interactive UI layer

Every high-touch flow uses native Discord components instead of "type your answer in chat", built from a shared kit (`src/core/components.js`: confirm dialogs, modal popups, button pagination) with varied human phrasing (`src/utils/humanize.js`):

- **Modal popups** — `.vrsetup` (SteamID64), `.fmsetup` (all three platforms — Spotify credentials are typed into a private popup and never enter channel history), and the `.sendembed` builder (title/body/colour/image with a private preview and Send / Edit / Discard buttons).
- **Select menus** — `.help` is a live category browser; `.autorole` uses a native role picker.
- **Confirm dialogs** — `.ban`, `.kick`, and `.jail` ask for a styled button confirmation before acting.
- **Persistent buttons** — `.poll` votes (live tallies, retract/switch, End-poll control) and the `.play` control deck (pause/resume, skip, stop) route through `src/core/componentRouter.js` by `customId` namespace, so they keep working **across bot restarts**; short-lived wizards use local collectors instead.

### The media pipeline

Every effect command shares one hardened lifecycle (`src/services/media.js`):

1. **Resolve** — attachment, slash option, replied-to message, or URL.
2. **Download** — streamed to `./tmp` with a hard byte cap (aborts mid-stream).
3. **Process** — `ffmpeg`/`ffprobe` child processes (never the event loop), wall-clock timeouts, stderr-tail error surfaces.
4. **Compress** — adaptive re-encode passes until under the Discord upload threshold.
5. **Deliver + wipe** — upload, then unconditionally destroy all temp buffers.

Highlights: `.glitch` performs *real* bitstream datamoshing (long-GOP encode → JS bit-flips sparing the container header → error-concealed decode); `.vredit` reprojects flat footage into dual-fisheye SBS stereo via `v360` with a ±1.5° parallax yaw; `.cut` stream-copies (`-c copy`) so untouched streams stay bit-exact.

### AI key security (`.text2img` / `.text2vid` / `.editimage`)

Inline fal.ai keys are handled under a strict contract: the triggering message is **purged before any network round-trip**, the key is **SHA-512 fingerprinted** and echoed only as a spoilered hash (`||…||`), and the plaintext never touches the database, logs, or embeds. Prefer the slash variants (no key-bearing message ever enters channel history) and grant the bot `Manage Messages` so prefix-mode purges succeed.

### Database layer

A dependency-free JSON key-value store (`data/*.json`, atomic write-then-rename, debounced flushes) behind a document-store surface (`db.collection('users').get/set/update/find`). Swap in better-sqlite3 or NeDB by reimplementing that one surface — nothing above the data-access layer changes.

### Channel backups

`.backup-channel` exports the channel's settings + full permission tree encrypted with AES-256-GCM (scrypt-derived key, random salt). Decrypt offline:

```bash
BACKUP_SECRET=yourpassphrase node scripts/decrypt-backup.js backup-general-1234.vrcd.enc out.json
```

---

## Prefix system

| Command | Scope | Who |
| --- | --- | --- |
| `.prefix <new>` | global runtime default | bot owners (`config.json → bot.ownerIds`) |
| `.prefix set <new>` | this server | `ManageGuild` |
| `.prefix self <new>` | just you, everywhere | anyone |

Resolution order: **user → guild → global → config default**. Mentioning the bot always works as a prefix.

## Admin Utils lock

`.troll` and `.stickbug` execute **only** for members holding one of the exact role IDs in `config.json → adminUtils.allowedRoleIds`. The config object is deep-frozen at boot, so no runtime code path can widen the allowlist.

## Discord portal checklist

1. Create an application → Bot at <https://discord.com/developers/applications>.
2. Enable the **Message Content**, **Server Members** privileged gateway intents.
3. Invite with scopes `bot applications.commands` and sensible permissions (Manage Roles/Channels/Messages, Connect, Speak, Add Reactions, Moderate Members).
4. Set `bot.devGuildId` in `config.json` during development for instant slash-command propagation (global registration can take up to an hour).

## Development

```bash
npm run dev     # auto-restarting watcher
npm run check   # compile-only syntax gate over src/
```

Adding a command = dropping one module into `src/commands/<category>/` exporting `{ name, category, description, usage, options, execute }` — the loader, help index, and slash registrar pick it up automatically.

## License

[MIT](LICENSE) — build, fork, and ship your own community bot on top of it.
