// src/utils/dom-safe.js
//
// The game is solo-only, so there's no other player who could send a
// crafted item to exploit right now — but escaping text before it touches
// innerHTML is cheap and harmless, and keeps the game safe by default if a
// future feature (cloud saves, item import/export, etc.) ever reintroduces
// data that didn't originate from this device.
export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}
