// src/utils/orientation.js
const CACHE_KEY = 'pixelforge_orientation_v1';

export function getSavedOrientationPref() {
  try {
    const v = localStorage.getItem(CACHE_KEY);
    // No saved preference yet: default the whole game to landscape (per the
    // brief — the game should auto-force landscape on first open) rather
    // than leaving orientation unlocked. Once a preference is ever saved
    // it's respected as-is.
    return v === 'portrait' || v === 'landscape' || v === 'auto' ? v : 'landscape';
  } catch {
    return 'landscape';
  }
}

function saveOrientationPref(pref) {
  try { localStorage.setItem(CACHE_KEY, pref); } catch { /* ignore */ }
}

// CSS fallback: rotates the whole page 90deg and swaps the effective
// width/height so "landscape content" can be forced onto a physically
// portrait screen (or vice versa) even on browsers with no Screen
// Orientation Lock API at all — notably iOS Safari, which has never
// implemented `screen.orientation.lock()`, standalone PWA or not.
function applyCssFallback(pref) {
  const root = document.documentElement;
  root.classList.remove('force-rotate');
  if (pref === 'auto') return;

  const isPhysicallyLandscape = window.innerWidth > window.innerHeight;
  const mismatch = (pref === 'landscape' && !isPhysicallyLandscape)
    || (pref === 'portrait' && isPhysicallyLandscape);
  if (mismatch) root.classList.add('force-rotate');
}

// Best-effort native lock. Requires a fullscreen element on most browsers
// that support it at all (Android Chrome, mainly) — call this from a real
// click/tap handler, not on page load, since fullscreen requests need a
// user gesture.
async function tryNativeLock(pref) {
  try {
    if (pref === 'auto') {
      if (screen.orientation?.unlock) screen.orientation.unlock();
      if (document.fullscreenElement) await document.exitFullscreen?.();
      return;
    }
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    }
    await screen.orientation?.lock?.(pref);
  } catch {
    // Not supported (iOS Safari, or user declined fullscreen) — the CSS
    // fallback above already covers the visual result either way.
  }
}

export function applyOrientationPreference(pref) {
  applyCssFallback(pref);
}

export async function setOrientationPreference(pref) {
  saveOrientationPref(pref);
  applyCssFallback(pref);
  await tryNativeLock(pref);
}

export function initOrientationWatcher() {
  const reapply = () => applyCssFallback(getSavedOrientationPref());
  window.addEventListener('resize', reapply);
  window.addEventListener('orientationchange', reapply);
  reapply();
}
