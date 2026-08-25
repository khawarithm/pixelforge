// src/audio/audio-manager.js
// Deliberately simple — plain HTMLAudioElement, no Web Audio graph. Fine at
// this game's scale (a handful of overlapping one-shots at most). Missing
// audio files (see config/audio.js) just fail silently via the .catch(()=>{})
// below, same fallback convention as missing sprites in game/assets.js.

const STORAGE_KEY = 'pixelforge_audio_v1';

export class AudioManager {
  constructor() {
    this.master = 0.8;
    this.music = 0.6;
    this.sfx = 0.9;
    this._loadSettings();
    this._musicEl = null;
    this._currentMusicKey = null;

    // Most mobile browsers block audio until a user gesture — queue the
    // pending music track (if any) and start it on the first tap/click.
    this._pendingMusic = null;
    const unlock = () => {
      if (this._pendingMusic) {
        const { key, path } = this._pendingMusic;
        this._pendingMusic = null;
        this.playMusic(key, path);
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
  }

  _loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.master === 'number') this.master = s.master;
      if (typeof s.music === 'number') this.music = s.music;
      if (typeof s.sfx === 'number') this.sfx = s.sfx;
    } catch {
      // storage unavailable — defaults above are fine
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ master: this.master, music: this.music, sfx: this.sfx }));
    } catch {
      // storage full/unavailable — settings just won't persist this session
    }
  }

  setMaster(v) { this.master = Math.max(0, Math.min(1, v)); this._save(); this._applyMusicVolume(); }
  setMusic(v) { this.music = Math.max(0, Math.min(1, v)); this._save(); this._applyMusicVolume(); }
  setSfx(v) { this.sfx = Math.max(0, Math.min(1, v)); this._save(); }

  _applyMusicVolume() {
    if (this._musicEl) this._musicEl.volume = this.master * this.music;
  }

  playMusic(key, path) {
    if (this._currentMusicKey === key) return;
    this._currentMusicKey = key;
    if (this._musicEl) { this._musicEl.pause(); this._musicEl = null; }
    if (!path) return;
    const audio = new Audio(path);
    audio.loop = true;
    audio.volume = this.master * this.music;
    audio.play().catch(() => {
      // Autoplay blocked (no user gesture yet) or file missing — queue it
      // so the next tap retries; harmless either way.
      this._pendingMusic = { key, path };
    });
    this._musicEl = audio;
  }

  stopMusic() {
    if (this._musicEl) { this._musicEl.pause(); this._musicEl = null; }
    this._currentMusicKey = null;
    this._pendingMusic = null;
  }

  playSfx(path) {
    if (!path) return;
    try {
      const audio = new Audio(path);
      audio.volume = this.master * this.sfx;
      audio.play().catch(() => {}); // missing file / not-yet-unlocked — fail silently
    } catch {
      // ignore
    }
  }
}
