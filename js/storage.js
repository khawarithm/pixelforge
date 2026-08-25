// src/utils/storage.js
// The game's entire save — gold, inventory, equipment, level/xp, drill,
// auction listing — lives here in localStorage. This is a fully solo game,
// so this IS the source of truth, not a cache of something else.

const KEY = 'pixelforge_save_v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // storage full / unavailable — fail silently, don't break gameplay
  }
}
