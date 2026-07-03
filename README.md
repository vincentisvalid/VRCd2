# VRCd Bot 🌌
> Elite, high-performance, production-grade modular Discord Bot framework matching VRCd Bot design specifications.

VRCd Bot is a hybrid, event-driven, production-ready Discord framework utilizing `discord.js v14` to deliver a feature-complete bot with AI integrations, virtual reality player profiles, music scraping, and heavy video filter processing. 

Designed for both classical text prefix interactions (default prefix `.`) and modern Slack-style Slash Commands, VRCd Bot leverages native Node.js ES Modules, local database abstractions, and child process streaming pipelines.

---

## 🛠️ ARCHITECTURAL DESIGN

VRCd Bot utilizes a highly optimized modular folder hierarchy that splits core event loops, storage systems, and command actions:

```
VRCd/
├── .env.example
├── .gitignore
├── config.json
├── package.json
├── README.md
├── src/
│   ├── index.js
│   ├── database/
│   │   └── db.js
│   ├── utils/
│   │   └── helpers.js
│   └── commands/
│       ├── help.js
│       ├── ai.js
│       ├── vr.js
│       ├── music.js
│       ├── media.js
│       ├── embeds.js
│       ├── moderation.js
│       ├── userinfo.js
│       ├── admin.js
│       ├── voice.js
│       ├── settings.js
│       ├── roles.js
│       ├── quotes.js
│       └── bonus.js
└── tmp/
```

- **Runtime Engine (`src/index.js`):** The primary process boots the Discord client gateway, maps commands/aliases collections, restores scheduled reminders from disk, registers listeners for reaction roles and boosts, and handles global thread failures.
- **Dynamic Database Layer (`src/database/db.js`):** A custom, atomic, file-backed local JSON storage engine. Avoids compile dependencies of SQLite or NeDB, offering extremely high speed and thread-safe data isolation.
- **FFmpeg Subprocess Graph (`src/commands/media.js`):** Downloads incoming media clips to the local memory buffers inside `/tmp/`, executes complex video/audio conversion parameters via native `ffmpeg` child processes, enforces file upload limits, and clears buffers.
- **AI Processing Channels (`src/commands/ai.js`):** Directly queries a local running `Ollama` API or streams queue requests to `fal.ai` media models, verifying keys using SHA-512.

---

## 📦 SYSTEM DEPENDENCIES & PREREQUISITES

### 1. Node.js Environment
Requires **Node.js LTS (v18 or v20+)**. Verify version with:
```bash
node -v
```

### 2. FFmpeg & FFprobe
Required for the **Media Effects** & **Voice Subsystems**. Must be installed and registered in your system PATH.
- **Debian/Ubuntu:** `sudo apt-get install ffmpeg`
- **MacOS:** `brew install ffmpeg`
- **Windows:** Download binary builds from [ffmpeg.org](https://ffmpeg.org/) and add the `bin` directory to system Environment variables.

### 3. Local AI: Ollama
Required for `.llm`, `.askxipra`, and `.translate` commands.
- Download and run Ollama from [ollama.ai](https://ollama.com/).
- Fetch required models (e.g., Llama3/Mistral):
  ```bash
  ollama run llama3
  ```
- Ollama must be running locally at `http://127.0.0.1:11434` (or configured via environment).

---

## 🚀 INSTALLATION & STARTUP

### 1. Clone & Install Packages
```bash
cd ~/Projects/VRCd2
npm install
```

### 2. Configure Environment variables
Copy the template configuration:
```bash
cp .env.example .env
```
Fill in the values in your `.env` file:
- `DISCORD_TOKEN`: Your Discord Developer Portal bot token.
- `DISCORD_CLIENT_ID`: Your application Client ID (required for deploying Slash Commands).
- `STEAM_API_KEY`: Obtain from [steamcommunity.com/dev](https://steamcommunity.com/dev/apikey) (required for Steam statistics lookup).
- `LASTFM_API_KEY`: Obtain from [last.fm/api](https://www.last.fm/api) (required for `.fm` album art retrieval).

### 3. Run the Bot
To start in production mode:
```bash
npm start
```
To run the development server with live reload:
```bash
npm run dev
```

---

## 💻 COMPLETE COMMAND SUMMARY REFERENCE

### 🌌 AI Engine
- `.llm <modelname> <query>` - Direct prompt querying of local running Ollama instance.
- `.askxipra <query>` - Strict behavior prompt mapping virtual reality questions to Xipra.
- `.text2vid <apikey> <prompt>` - Deletes plaintext input, logs SHA-512 hash, and requests video generation from Fal.ai.
- `.text2img <apikey> <prompt>` - Fast SDXL image creation via Fal.ai queue.
- `.editimage <apikey> <prompt>` - Sync image manipulation using instructions.

### 🕶️ VR Logging
- `.vrsetup <steam64id>` - Choose your headset profile (Quest 3, Index, Pico 4, HTC Vive) and link to Steam ID.
- `.vrstats <@user>` - Retrieve playtime metrics and Steam Status.

### 🎵 Music Scraper
- `.fmsetup lastfm <username>` - Link your Last.fm profile.
- `.fmsetup spotify <id> <secret>` - Map Spotify developer applications.
- `.fm <@user>` - Render album art now-playing embeds.

### 🎬 Media Processing Filters (FFmpeg Engine)
- `.glitch` - Apply blocky low-res color glitch parameters.
- `.ascii` - Monospace character rendering of images using native HTML5 Canvas.
- `.vhs` - Overlays tape color bleeds and tracking noise.
- `.greenscreen <bg_url>` - Chromakeys green color vectors and inserts a background.
- `.removebg` - Split white background pixels out of an image.
- `.cut <start_time> <duration>` - Cut segments without re-encoding.
- `.vredit` - Map flat media side-by-side into stereoscopic double-circular lenses.

### 📜 Extended Quotes
- `.createquote <author> | <text>` - Commit quotes to local JSON database.
- `.randomquote` - Pull random quotes with local Ollama text fallbacks.

### 🛡️ Enterprise Moderation
- `.jail <@user> [reason]` - Strips roles and locks user into isolated channels.
- `.mute <@user> <duration> [reason]` - Places an API timeout lock.
- `.warn <@user> [reason]` - Increment warnings and logs to profile.
- `.kick` / `.ban` - Gateway member exclusions.

---

## 📄 LICENSE
This project is open-source software licensed under the **MIT License**.
