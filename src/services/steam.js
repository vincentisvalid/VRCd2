/**
 * Steam Web API service — secure lookups powering the VR logging module.
 */
import axios from 'axios';
import { config } from '../core/config.js';

const API_BASE = 'https://api.steampowered.com';

/** Well-known VR titles (appid → name) used to aggregate VR playtime logs. */
export const VR_APP_IDS = Object.freeze({
  438100: 'VRChat',
  620980: 'Beat Saber',
  546560: 'Half-Life: Alyx',
  823500: 'BONEWORKS',
  555160: 'Pavlov VR',
  629730: 'Blade & Sorcery',
  450390: 'The Lab',
  617830: 'SUPERHOT VR',
  1533390: 'Gorilla Tag',
  916840: 'BONELAB',
  418650: 'Space Pirate Trainer',
  327140: 'Tabletop Simulator',
  548430: 'Deep Rock Galactic',
  739630: 'Phasmophobia',
});

function requireKey() {
  if (!config.env.steamApiKey) {
    throw new Error('STEAM_API_KEY is not configured — ask the bot host to set it in .env.');
  }
  return config.env.steamApiKey;
}

/** Validates the canonical SteamID64 shape (17 digits, 7656119 prefix). */
export function isValidSteam64(id) {
  return /^7656119\d{10}$/.test(String(id ?? '').trim());
}

/** Fetches a player's public profile summary. */
export async function getPlayerSummary(steam64) {
  const key = requireKey();
  const response = await axios.get(`${API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, {
    params: { key, steamids: steam64 },
    timeout: 15_000,
  });
  return response.data?.response?.players?.[0] ?? null;
}

/** Fetches owned games with playtime, including app metadata. */
export async function getOwnedGames(steam64) {
  const key = requireKey();
  const response = await axios.get(`${API_BASE}/IPlayerService/GetOwnedGames/v1/`, {
    params: { key, steamid: steam64, include_appinfo: 1, include_played_free_games: 1 },
    timeout: 15_000,
  });
  return response.data?.response?.games ?? [];
}

/** Aggregates VR playtime (minutes) across the curated VR title set. */
export function aggregateVrPlaytime(games) {
  const vrGames = games
    .filter((game) => Object.hasOwn(VR_APP_IDS, game.appid))
    .map((game) => ({ appid: game.appid, name: VR_APP_IDS[game.appid], minutes: game.playtime_forever ?? 0 }))
    .sort((a, b) => b.minutes - a.minutes);
  const totalMinutes = vrGames.reduce((sum, game) => sum + game.minutes, 0);
  return { vrGames, totalMinutes };
}

/** Unauthenticated availability probe of the Steam Web API front door. */
export async function getServerInfo() {
  const start = Date.now();
  const response = await axios.get(`${API_BASE}/ISteamWebAPIUtil/GetServerInfo/v1/`, { timeout: 10_000 });
  return { info: response.data, latencyMs: Date.now() - start };
}

/** Steam persona state codes → human labels. */
export const PERSONA_STATES = Object.freeze({
  0: 'Offline',
  1: 'Online',
  2: 'Busy',
  3: 'Away',
  4: 'Snooze',
  5: 'Looking to trade',
  6: 'Looking to play',
});
