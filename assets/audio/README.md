# Audio assets go here

The game checks for these `.mp3` files and plays them automatically — a
missing file just plays silently (same fallback convention as the missing
sprite handling in `public/assets/sprites/`). See `src/config/audio.js` for
the exact filenames/paths and a full list of free-asset source suggestions
(Kenney.nl, OpenGameArt.org, freesound.org, incompetech.com, Pixabay Audio).

Durasi di kolom "Saran Durasi" itu perkiraan enak-didengar, bukan aturan
kaku — musik itu loop jadi durasi klip sumber bebas asal titik loop-nya
mulus, sementara tiap SFX diputar sekali per event (mine_hit bahkan bisa
berkali-kali per detik saat menambang), jadi sebaiknya tetap pendek supaya
tidak numpuk/kepotong saat event berikutnya terjadi.

| File | Dipakai untuk | Saran Durasi |
|---|---|---|
| `music_menu.mp3` | Layar menu utama | +- 30-60 detik (loop) |
| `music_village.mp3` | Village | +- 45-90 detik (loop) |
| `music_mine.mp3` | 5 lantai tambang (Early/Deep/Crystal/Molten/Abyssal Mine) | +- 45-90 detik (loop) |
| `music_dungeon.mp3` | Abandoned Mine (dungeon combat) | +- 45-90 detik (loop) |
| `sfx_button_click.mp3` | Klik tombol UI | +- 0.1-0.2 detik |
| `sfx_mine_hit.mp3` | Setiap ayunan pickaxe ke node bijih | +- 0.2-0.3 detik |
| `sfx_ore_drop.mp3` | Node bijih selesai ditambang | +- 0.4-0.6 detik |
| `sfx_attack_swing.mp3` | Serangan player di dungeon | +- 0.2-0.4 detik |
| `sfx_attack_hit.mp3` | Serangan player kena musuh | +- 0.2-0.3 detik |
| `sfx_player_hurt.mp3` | Player kena damage | +- 0.3-0.5 detik |
| `sfx_enemy_death.mp3` | Musuh mati | +- 0.4-0.6 detik |
| `sfx_level_up.mp3` | Player naik level | +- 1-1.5 detik |
| `sfx_purchase.mp3` | Beli barang di Shop | +- 0.3-0.5 detik |
| `sfx_forge_success.mp3` | Forge di Blacksmith selesai | +- 1-1.5 detik |
| `sfx_enchant_success.mp3` | Enchant berhasil di Enchanter | +- 1-1.5 detik |
| `sfx_skill_activate.mp3` | Skill yang terpasang diaktifkan | +- 0.4-0.7 detik |
| `sfx_skill_ready.mp3` | Cooldown skill selesai / skill naik level | +- 0.2-0.4 detik |
| `sfx_rare_drop.mp3` | Passive Tome atau Skill Scroll drop | +- 1-1.5 detik |
| `sfx_door_enter.mp3` | Masuk dungeon Abandoned Mine | +- 0.8-1.2 detik |
| `sfx_floor_clear.mp3` | Boss lantai dungeon dikalahkan | +- 1.5-2 detik |
| `sfx_defeat.mp3` | Player kalah di dungeon | +- 1-1.5 detik |

All optional and independent — add just the music tracks first for the
biggest atmosphere jump, then fill in SFX over time.
