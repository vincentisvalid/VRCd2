/**
 * Last.fm service — scrobble + now-playing lookups for the .fm module.
 */
import axios from 'axios';
import { config } from '../core/config.js';

const API_BASE = 'https://ws.audioscrobbler.com/2.0/';

function requireKey() {
  if (!config.env.lastfmApiKey) {
    throw new Error('LASTFM_API_KEY is not configured — ask the bot host to set it in .env.');
  }
  return config.env.lastfmApiKey;
}

async function call(method, params) {
  const response = await axios.get(API_BASE, {
    params: { method, api_key: requireKey(), format: 'json', ...params },
    timeout: 15_000,
    validateStatus: (status) => status < 500,
  });
  if (response.data?.error) {
    throw new Error(`Last.fm error ${response.data.error}: ${response.data.message ?? 'unknown'}`);
  }
  return response.data;
}

/** Latest (or currently spinning) track for a Last.fm user. */
export async function getRecentTrack(username) {
  const data = await call('user.getrecenttracks', { user: username, limit: 1, extended: 1 });
  const track = data?.recenttracks?.track?.[0];
  if (!track) return null;
  return {
    name: track.name,
    artist: track.artist?.name ?? track.artist?.['#text'] ?? 'Unknown artist',
    album: track.album?.['#text'] ?? null,
    url: track.url ?? null,
    image: [...(track.image ?? [])].reverse().find((img) => img['#text'])?.['#text'] ?? null,
    nowPlaying: track['@attr']?.nowplaying === 'true',
    loved: track.loved === '1',
  };
}

/** Profile info — includes lifetime scrobble count. */
export async function getUserInfo(username) {
  const data = await call('user.getinfo', { user: username });
  const user = data?.user;
  if (!user) return null;
  return {
    name: user.name,
    url: user.url,
    scrobbles: Number.parseInt(user.playcount ?? '0', 10),
    country: user.country || null,
    registered: user.registered?.unixtime ? new Date(Number(user.registered.unixtime) * 1000) : null,
  };
}
