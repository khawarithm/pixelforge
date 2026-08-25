// src/utils/player-name.js
const CACHE_KEY = 'pixelforge_username_v1';
const MAX_LEN = 16;

export function sanitizeUsername(raw) {
  return (raw ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_LEN);
}

export function getCachedUsername() {
  try {
    return localStorage.getItem(CACHE_KEY) || null;
  } catch {
    return null;
  }
}

export function saveUsername(name) {
  try {
    localStorage.setItem(CACHE_KEY, name);
  } catch {
    // storage unavailable — name still works for this session
  }
}
