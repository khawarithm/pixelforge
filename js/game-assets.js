// src/game/assets.js
// Loads optional PNG spritesheets. If a file is missing, load() resolves to
// null instead of throwing — callers keep drawing the procedural placeholder
// shapes until real art is dropped in. This means you can add art
// incrementally (just the tileset, just the player, etc.) without breaking
// anything that isn't ready yet.

export class AssetLoader {
  constructor() {
    this.images = new Map();
  }

  load(key, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.images.set(key, img); resolve(img); };
      img.onerror = () => { resolve(null); };
      img.src = src;
    });
  }

  loadAll(entries) {
    return Promise.all(entries.map(([key, src]) => this.load(key, src)));
  }

  get(key) {
    return this.images.get(key) || null;
  }
}
