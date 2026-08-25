# Sprite assets go here

The game now checks for PNGs in this folder and uses them automatically — if
a file is missing it just keeps the current flat-color placeholder shapes, so
nothing breaks either way. Drop files in with these exact names and layouts
(see `src/config/assets.js` for the source of truth):

| File | Size | Layout |
|---|---|---|
| `tileset.png` | 160×32px | 1 row × 5 tiles, 32×32 each: grass, path, water, wall/rock, stone floor |
| `player.png` | 64×128px | 2 cols (walk frame A/B) × 4 rows (down, left, right, up), 32×32 each |
| `ore_*.png` (27 files, see list below) | 24×24px | single icon, transparent background |
| `landmark_*.png` (19 files, see list below) | 32×32px | single icon |
| `enemy_*.png` (4 files, see list below) | 32×32px or 48×48px | single icon, transparent background |

All optional and independent — add just `tileset.png` and `player.png` first
for the biggest visual jump, then fill in ore/landmark icons over time. Any
file that isn't present just falls back to a flat-color placeholder shape, so
you can ship art incrementally without breaking anything.

### Ore icons (`ore_<id>.png`), 24×24px transparent PNG

Filenames must match the ore `id` in `src/config/ore.js` exactly.

| Mine floor (unlock level) | Ore ids → filenames |
|---|---|
| Early Mine (Lv.1) | `copper`, `iron`, `coal`, `tin` |
| Deep Mine (Lv.5) | `silver`, `gold`, `platinum`, `diamond` |
| Crystal Mine (Lv.10) | `quartz_crystal`, `opal`, `amethyst`, `obsidian_shard`, `ruby`, `sapphire`, `emerald`, `mythril` |
| Molten Mine (Lv.15) | `sulfur_crystal`, `magma_shard`, `volcanic_glass`, `phoenix_ore` |
| Abyssal Mine (Lv.20) | `abyssal_pearl`, `star_fragment`, `void_shard`, `chaos_ore`, `ancient_ore`, `magical_ore`, `tyrant_ore` |

e.g. `ore_quartz_crystal.png`, `ore_phoenix_ore.png`, `ore_void_shard.png`.

### Landmark icons (`landmark_<type>.png`), 32×32px

| Where | Filenames |
|---|---|
| Village | `landmark_blacksmith.png`, `landmark_mine_entrance.png`, `landmark_shop.png`, `landmark_dungeon_npc.png`, `landmark_auction_house.png`, `landmark_storage.png`, `landmark_enchanter.png`, `landmark_spawn.png` |
| Early Mine ↔ Deep Mine | `landmark_mine_exit.png`, `landmark_deep_mine_entrance.png`, `landmark_deep_mine_exit.png` |
| Deep Mine ↔ Crystal Mine (Lv.10) | `landmark_crystal_mine_entrance.png`, `landmark_crystal_mine_exit.png` |
| Crystal Mine ↔ Molten Mine (Lv.15) | `landmark_molten_mine_entrance.png`, `landmark_molten_mine_exit.png` |
| Molten Mine ↔ Abyssal Mine (Lv.20) | `landmark_abyssal_mine_entrance.png`, `landmark_abyssal_mine_exit.png` |
| Abandoned Mine dungeon | `landmark_dungeon_exit.png` |

### Enemy icons (`enemy_<id>.png`), 32×32px or 48×48px transparent PNG

Filenames must match the enemy `id` in `src/dungeon/index.js`'s `ENEMY_DEFS` exactly. All four live in the Abandoned Mine dungeon.

| Enemy | Filename |
|---|---|
| Cave Rat | `enemy_cave_rat.png` |
| Miner Zombie | `enemy_miner_zombie.png` |
| Stone Golem | `enemy_stone_golem.png` |
| Stone Titan (boss) | `enemy_stone_titan.png` |

## Where to get medieval pixel-art tiles

I can't generate or embed third-party image files directly in this build, but
a few well-known **free, commercial-use-friendly** pixel-art sources for a
medieval/mining theme are worth checking (verify each pack's specific license
before shipping):

- **Kenney.nl** — large CC0 (public domain) asset library, including
  "Tiny Dungeon" and medieval-themed tile/character packs sized in clean
  16/32px grids that map directly onto the layout above.
- **itch.io** "pixel art" + "medieval" or "mining" tags — many packs are
  CC0 or cheap one-time purchases with commercial licenses; check each
  listing's license file.
- **OpenGameArt.org** — filter by license (CC0 / CC-BY) for dungeon, village,
  and mining-themed sets.

Once you've picked a set, resize/crop the tiles into the exact grids above
(most image editors or a quick script can slice a spritesheet) and drop the
files in here — no code changes needed.
