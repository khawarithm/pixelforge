// src/config/audio.js
// Drop matching audio files into public/assets/audio/ with these exact
// filenames and they'll be picked up automatically — nothing else to wire.
// Same convention as config/assets.js for sprites: a missing file just
// fails silently (see audio/audio-manager.js), so you can add sound one
// file at a time without breaking anything.
//
// Formats: .mp3 is the safest cross-browser choice (iOS Safari doesn't
// support .ogg). Keep music files reasonably compressed (~128kbps mono/
// stereo is plenty) since the service worker caches everything for
// offline play — a folder full of huge WAVs will make the first install
// slow.

export const AUDIO_BASE = './assets/audio/';

// ---- Music (looping tracks — exact duration doesn't matter since it
// loops; a clip that already loops cleanly at 30s works just as well as
// one that loops at 2min) ----
export const MUSIC_PATHS = {
  menu: AUDIO_BASE + 'music_menu.mp3',        // main menu screen
  village: AUDIO_BASE + 'music_village.mp3',  // Village
  mine: AUDIO_BASE + 'music_mine.mp3',        // early_mine, deep_mine, crystal_mine, molten_mine, abyssal_mine
  dungeon: AUDIO_BASE + 'music_dungeon.mp3',  // Abandoned Mine (combat dungeon)
};

// ---- Sound effects (short one-shots) ----
// Suggested length noted per file — see the durasi column in
// public/assets/audio/README.md for the full table. Keep every SFX short:
// it plays once per event (sometimes several times per second in combat),
// so anything longer than ~1.5s starts to feel laggy/muddy when it overlaps
// itself or the next hit.
export const SFX_PATHS = {
  button_click: AUDIO_BASE + 'sfx_button_click.mp3',   // ~0.1–0.2s
  mine_hit: AUDIO_BASE + 'sfx_mine_hit.mp3',            // ~0.2–0.3s
  ore_drop: AUDIO_BASE + 'sfx_ore_drop.mp3',            // ~0.4–0.6s
  attack_swing: AUDIO_BASE + 'sfx_attack_swing.mp3',    // ~0.2–0.4s
  attack_hit: AUDIO_BASE + 'sfx_attack_hit.mp3',        // ~0.2–0.3s
  player_hurt: AUDIO_BASE + 'sfx_player_hurt.mp3',      // ~0.3–0.5s
  enemy_death: AUDIO_BASE + 'sfx_enemy_death.mp3',      // ~0.4–0.6s
  level_up: AUDIO_BASE + 'sfx_level_up.mp3',            // ~1–1.5s
  purchase: AUDIO_BASE + 'sfx_purchase.mp3',            // ~0.3–0.5s
  forge_success: AUDIO_BASE + 'sfx_forge_success.mp3',  // ~1–1.5s
  enchant_success: AUDIO_BASE + 'sfx_enchant_success.mp3', // ~1–1.5s
  skill_activate: AUDIO_BASE + 'sfx_skill_activate.mp3',   // ~0.4–0.7s
  skill_ready: AUDIO_BASE + 'sfx_skill_ready.mp3',      // ~0.2–0.4s
  rare_drop: AUDIO_BASE + 'sfx_rare_drop.mp3',          // ~1–1.5s
  door_enter: AUDIO_BASE + 'sfx_door_enter.mp3',        // ~0.8–1.2s
  floor_clear: AUDIO_BASE + 'sfx_floor_clear.mp3',      // ~1.5–2s
  defeat: AUDIO_BASE + 'sfx_defeat.mp3',                // ~1–1.5s
};

/*
 * ---- Saran audio (semua sumber di bawah punya lisensi gratis/CC0 untuk
 *      game non-komersial maupun komersial — selalu baca lisensi tepatnya
 *      di halaman masing-masing sebelum rilis) ----
 *
 * Musik latar (loop, jadi durasi file sebenarnya bebas — yang penting titik
 * loop-nya mulus. Berikut estimasi panjang klip sumber yang biasanya
 * tersedia dan enak dipotong jadi loop; chiptune/8-bit cocok dengan gaya
 * pixel-art game ini):
 *   - music_menu.mp3    = +- 30-60 detik (loop) — tenang & megah, tempo
 *     lambat. Cari "title screen chiptune" di opengameart.org atau
 *     "8-bit menu theme" di Pixabay Audio.
 *   - music_village.mp3 = +- 45-90 detik (loop) — ceria, ringan,
 *     folk/chiptune. Cari "village theme 8bit" di incompetech.com (Kevin
 *     MacLeod, "Fluffing a Duck" / "8bit Dungeon Level") atau
 *     opengameart.org tag "town".
 *   - music_mine.mp3    = +- 45-90 detik (loop) — misterius, sedikit
 *     tegang, tempo sedang. Cari "cave ambient loop" / "mining theme" di
 *     opengameart.org atau freesound.org.
 *   - music_dungeon.mp3 = +- 45-90 detik (loop) — gelap & mendebarkan,
 *     tempo lebih cepat untuk combat. Cari "dungeon battle theme 8bit" di
 *     incompetech.com atau itch.io asset pack "Leohpaz — Free RPG Music
 *     Pack".
 *
 * Efek suara (durasi klip, bukan durasi loop — semuanya one-shot):
 *   - sfx_button_click.mp3    = +- 0.1-0.2 detik — klik UI netral, kenney.nl
 *     "Interface Sounds" pack.
 *   - sfx_mine_hit.mp3        = +- 0.2-0.3 detik — cari "pickaxe hit rock"
 *     di freesound.org atau kenney.nl "RPG Audio".
 *   - sfx_ore_drop.mp3        = +- 0.4-0.6 detik — cari "coin pickup 8bit"
 *     di freesound.org atau kenney.nl "RPG Audio".
 *   - sfx_attack_swing.mp3    = +- 0.2-0.4 detik — whoosh pedang pendek,
 *     kenney.nl "RPG Audio" pack.
 *   - sfx_attack_hit.mp3      = +- 0.2-0.3 detik — dari pack yang sama
 *     supaya gaya swing/hit/death konsisten.
 *   - sfx_player_hurt.mp3     = +- 0.3-0.5 detik — nada pendek & tajam,
 *     cari "hurt grunt 8bit" di opengameart.org.
 *   - sfx_enemy_death.mp3     = +- 0.4-0.6 detik — dari kenney.nl "RPG
 *     Audio" pack.
 *   - sfx_level_up.mp3        = +- 1-1.5 detik — fanfare pendek naik nada,
 *     cari "level up jingle" di Pixabay Audio atau kenney.nl.
 *   - sfx_purchase.mp3        = +- 0.3-0.5 detik — cari "coin purchase" /
 *     "cash register 8bit" di freesound.org.
 *   - sfx_forge_success.mp3   = +- 1-1.5 detik — dentingan logam + sparkle,
 *     cari "anvil hit" di freesound.org.
 *   - sfx_enchant_success.mp3 = +- 1-1.5 detik — "anvil hit" dicampur
 *     "magic sparkle" (kenney.nl "Magic Pack").
 *   - sfx_skill_activate.mp3  = +- 0.4-0.7 detik — whoosh magis pendek,
 *     kenney.nl "Magic Pack".
 *   - sfx_skill_ready.mp3     = +- 0.2-0.4 detik — klik/ping halus.
 *   - sfx_rare_drop.mp3       = +- 1-1.5 detik — cari "achievement
 *     unlocked" di Pixabay Audio atau kenney.nl.
 *   - sfx_door_enter.mp3      = +- 0.8-1.2 detik — gerbang/pintu berat
 *     terbuka, freesound.org "heavy door".
 *   - sfx_floor_clear.mp3     = +- 1.5-2 detik — fanfare kemenangan
 *     singkat.
 *   - sfx_defeat.mp3          = +- 1-1.5 detik — nada turun pendek, jangan
 *     terlalu panjang/mengganggu.
 *
 * Sumber yang direkomendasikan (gratis, gampang dicari):
 *   - kenney.nl/assets      -> paket audio siap pakai, gaya konsisten, CC0.
 *   - opengameart.org        -> filter by "sound effect" / "music", banyak CC0.
 *   - freesound.org          -> database SFX terbesar, cek lisensi per file.
 *   - incompetech.com        -> musik karya Kevin MacLeod, gratis dgn atribusi.
 *   - pixabay.com/music      -> musik & SFX bebas royalti, tanpa atribusi wajib.
 */
