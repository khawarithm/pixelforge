# Pixelforge — Solo RPG

> *Mine your fortune. Forge your legend.*

2D pixel-art top-down solo mining & forging RPG. Plain HTML/CSS/JS, no
build step, no backend, no account to sign up for — install it as a PWA and
play. Originally spec'd as a multiplayer game with Firebase; that entire
layer was removed by request to keep setup down to "open the folder and
run a static server." Everything that made the game fun standalone is
still here — mining, forging, combat, dungeons, a shop, an auto-drill,
leveling, and an auction house — just running entirely on your own device.

## Status: fully playable, solo-only

### Core loop

Mine ore → forge it into a sword or armor (skill-based mini-game, not a
single click) → equip it → fight through the Abandoned Mine dungeon and its
boss → sell or auction what you don't need → buy an Auto Drill so ore
trickles in even while you're offline → level up from mining/forging/combat
→ unlock the Deep Mine for better ore → repeat with better gear.

### What's in the village

Walk up to any of these and tap the **MINE** button (it doubles as the
general interact button) — a prompt tells you what it does:

- **Blacksmith** — forge Sword/Armor from **1-12 ore total, freely mixed
  across any types you own** (not locked to a single ore type or a fixed
  amount). Pick quantities per ore with a stepper, then play a 4-stage
  mini-game (Heating → Hammering → Shaping → Tempering). Your performance
  sets the item's quality, which — blended proportionally from whichever
  ores went in, plus your luck stat — rolls the final rarity, stats, and a
  chance at a special effect (Double Strike, Lifesteal — Burn/Freeze/Poison
  roll onto items but aren't simulated in combat yet, noted below). Mixed
  items show their blend on the item card and in Inventory/Shop, e.g.
  `ore=iron:66%,copper:33%` (percentages are rounded independently and may
  not sum to exactly 100 — that's expected, not a bug). Using more total ore
  modestly raises the odds of extra bonus stats, so committing more
  material is meant to feel worthwhile.
- **Mining Entrance** → **Early Mine** (Copper/Iron/Coal/Tin), then a chain of
  gated deeper floors: **Deep Mine** (Silver/Gold/Platinum/Diamond, Lv.5) →
  **Crystal Mine** (Quartz Crystal/Opal/Amethyst/Obsidian Shard/Ruby/Sapphire/
  Emerald/Mythril, Lv.10) → **Molten Mine** (Sulfur Crystal/Magma Shard/
  Volcanic Glass/Phoenix Ore, Lv.15) → **Abyssal Mine** (Abyssal Pearl/Star
  Fragment/Void Shard/Chaos Ore/Ancient Ore/Magical Ore/Tyrant Ore, Lv.20).
  27 ore types total across 5 floors.
- **NPC Shop** — two tabs. **Buy**: stronger Pickaxes and Auto Drills (each
  gated by player level, matching the mine floor they're meant for), Abandoned
  Mine dungeon tickets (pre-buy at a small discount vs. paying at the door),
  and a Health Potion (instant full heal). **Sell**: ore stacks or equipment
  for gold — price is the item's computed value times a random 55-80%
  "shopkeeper's cut," re-rolled every visit, never a flat price, never full
  value.
- **Storage** — read-only status view of your active Auto Drill (buy one from
  the Shop's Buy tab first). It mines a slow trickle of ore while you're
  playing, and keeps going (capped by its storage size) while you're logged
  out — you get a summary the next time you open the game. Five tiers, from
  the 800g Basic drill (Early Mine ore) up to the 26,000g Singularity drill
  (Lv.20, Abyssal Mine ore).
- **Auction House** — list one item at a time with an asking price and a
  timer (5/15/60 min). Instead of live bidders, the sale is decided by a
  seeded random roll the moment you list it, revealed once the timer runs
  out — ask too high and it might not sell; ask fair and you'll usually
  clear a bit more than your asking price. No network, no other player —
  just a bit of "wait and see" tension on top of a guaranteed-fair roll.
- **Dungeon Board** — buy a ticket (30g) and enter the **Abandoned Mine**:
  Cave Rats, Miner Zombies, and Stone Golems roaming a hall, with a
  **Stone Titan** boss behind a corridor gate. The action button becomes
  **ATTACK** here. Dying or retreating both send you back to the village
  healed — the ticket's spent either way, that's the risk of the dive.

### Progression

Mining (+2xp/ore), forging (+15xp/item), and dungeon kills (enemy-specific
xp) all feed a `50 x level` curve. Each level adds a small combat bonus
(+5 max HP, +1 attack) and, at **Level 5**, opens the Deep Mine. A level
badge sits in the HUD; leveling up shows a toast.

### Ore Index

A "have I found this yet" catalog lives in the Inventory panel, below
Equipment. Every ore the game knows about — including ones from areas that
don't have a mine map yet — shows up either with full detail (name, color,
base price) once you've mined/collected it at least once, or as a
grayed-out `??? Undiscovered` entry until then. Nothing to unlock manually;
it just tracks itself as you play.

### Settings

A ⚙️ button in the HUD opens orientation controls (Auto / Portrait /
Landscape). It tries your browser's native rotation lock first, and falls
back to an on-screen CSS rotation if that's not supported — notably on iOS
Safari, which has never implemented a rotation-lock API at all, standalone
PWA or not.

## Run it

No build step — it's ES modules loaded directly by the browser, but it
still needs to be served over HTTP (module scripts + the service worker
don't work over `file://`):

```bash
npx serve .
# or: python3 -m http.server 5173
```

Then open the printed local URL. Works fine in Termux on-device too:

```bash
pkg install nodejs
cd pixelforge
npx serve .
```

Once loaded, the service worker caches the entire game, so it plays fully
offline afterward — there's no "some features need internet" caveat
anymore, since nothing talks to a network at all.

## Project structure

Flattened to 3 top-level folders on purpose — no nested `src/<module>/`
tree — so the whole thing can be dragged straight into any static host
(Netlify, Vercel, GitHub Pages, cPanel, etc.) with zero build step and no
path surprises:

```
index.html, style.css, manifest.webmanifest, service-worker.js
package.json, capacitor.config.json, README.md

js/        all 43 game modules, flat (one file per module, e.g.
           engine.js, world.js, player.js, mining.js, inventory.js,
           hud.js, joystick.js, menu.js, ore-config.js, pickaxe-config.js,
           config-assets.js, audio-config.js, audio-manager.js, i18n.js,
           passives.js, skills.js, quality.js, debug.js, debug-ui.js,
           enchant.js, enchant-ui.js, forging.js, forge-ui.js,
           composition.js, combat.js, enemy.js, dungeon.js, dungeon-ui.js,
           economy.js, auto-drill.js, shop-ui.js, drill-ui.js, auction.js,
           auction-ui.js, achievements.js, progress-ui.js, quests.js,
           storage.js, dom-safe.js, player-name.js, orientation.js,
           game-assets.js, main.js)
           Two module pairs that shared a name in the old nested layout
           are disambiguated by prefix: config-assets.js (path config)
           vs game-assets.js (the AssetLoader class).

assets/    sprites/, audio/, icons/ (ui/, skills/, passives/ subfolders) —
           all game art and sound, referenced from js/config-assets.js
           and js/audio-config.js

icons/     icon.svg, icon-192.svg, icon-512.svg — the PWA install icon
           (see "PWA install icon" below)
```

### Sprites are optional

The renderer checks `assets/sprites/` for real PNGs and uses them
automatically if present; otherwise it draws simple colored shapes. See
`assets/sprites/README.md` for exact filenames/layouts and where to
find free medieval pixel-art packs.

## PWA install icon

The icon shown when a user installs the app (Android "Add to Home
Screen", desktop Chrome/Edge install prompt, iOS "Add to Home Screen")
lives at:

```
icons/icon.svg        — favicon / tab icon
icons/icon-192.svg     — manifest icon, 192x192, purpose "any"
icons/icon-512.svg     — manifest icon, 512x512, purpose "any" + "maskable"
```

Wired up in three places, already pointing at this folder:

- `manifest.webmanifest` → `icons` array (`src: "./icons/icon-192.svg"` etc.)
- `index.html` → `<link rel="icon">` and `<link rel="apple-touch-icon">`
- `service-worker.js` → `SHELL_ASSETS` (so the icon is cached for offline
  installs too)

To swap the logo, replace the three SVGs in `icons/` with your own art at
the same filenames/sizes — nothing else needs to change. If you want a
raster (PNG) icon instead of SVG, add the files (e.g. `icon-192.png`),
update the `src`/`type` fields in `manifest.webmanifest`, and add them to
`SHELL_ASSETS` in `service-worker.js`.

## What got removed, and why

This was originally built out over several phases as a multiplayer game --
Firebase Auth, Firestore, Realtime Database, live position sync, trading
between two players, a real-money-style auction with live bidders. All of
that added real setup cost (enabling Auth providers, creating a Realtime
Database, writing and testing security rules) for a game that's more fun
to just open and play. By request, the entire `js/multiplayer/` and
`firebase/` layers were deleted, and the systems that depended on another
player were either removed or reworked to stand on their own:

- **Removed entirely**: live multiplayer movement/presence, direct
  player-to-player Trading (it fundamentally needs a second live player --
  there's no honest solo version of "trade with someone else").
- **Reworked to be solo-native**: the Auction House no longer needs bidders
  -- see the "wait and see" seeded-roll design above. A username is still a
  nice personal touch (shown on your own name tag, canvas-rendered) but is
  now just a local nickname with no account behind it.
- **Unaffected**: mining, forging, combat, dungeons, the shop, the auto
  drill, offline mining, and leveling never depended on a network to begin
  with.

## Known scope cuts (documented, not silently dropped)

- **Burn/Freeze/Poison special effects** roll onto forged equipment and are
  readable on the item card, but combat currently only *simulates* Double
  Strike and Lifesteal. Wiring the three damage-over-time effects into the
  enemy update loop (`js/enemy.js`) is a small, isolated addition.
- **More content** (Lava Cavern / Frozen Cavern / Ancient Ruins dungeons;
  Rare Area / Ancient Area mining with Ruby/Sapphire/Emerald/Mythril and
  Ancient/Magical/Tyrant ore) -- the ore config for all of these has existed
  since the very first pass and is ready to use; it just needs a new world
  map + entrance landmark, the same shape as the Deep Mine addition. This
  is a content pass, not new engineering.
- **Events, quests** -- not built. The core loop (mine, forge, fight,
  sell/auction, level, repeat) stands on its own without them, but there's
  no time-limited or narrative content layer yet.

## Security note (much smaller scope now)

With no server and no other player, the biggest risk category from the
multiplayer version -- a modified client lying about gold/items to cheat
another player -- no longer exists; there's no one else to cheat. What's
still worth knowing:

- `js/dom-safe.js`'s `escapeHtml()` is applied wherever text touches
  `innerHTML`, kept as a harmless default in case a future feature (cloud
  saves, item import/export) ever reintroduces data that didn't originate
  from this device.
- Your save (`localStorage`) is, naturally, editable by you in devtools if
  you want to. That's not a vulnerability in a solo game -- it's just your
  own save file.

## Performance

## Bug fixes worth knowing about

- **Tap-to-open menus (Blacksmith/Shop/Storage/Auction House) could
  silently fail to open.** The action button used to reset its "held"
  state on `pointerleave`, and on touch devices `pointerleave` frequently
  fires *before* `pointerup` — ordinary finger jitter during a tap can
  register as "left the button's bounds" even though the finger never
  lifted. That silently ate the tap before the release handler ever saw
  it. Mining wasn't affected because it reads the button's held state
  continuously every frame rather than waiting for a release event — only
  menus depending on a clean tap were. Fixed by using pointer capture (the
  same technique the virtual joystick already used) so the button keeps
  tracking the same touch regardless of small movement, and dropping the
  `pointerleave` reset entirely.


- Canvas-only rendering for the world/entities; the DOM is reserved for
  HUD/menus, per the original brief's low-end-device requirement.
- Device pixel ratio capped at 2x, camera-frustum culling on tile rendering,
  and a few small object-pooling fixes (avoiding per-frame allocations in
  the render loop) applied during an optimization pass.

## Android packaging via Capacitor

`capacitor.config.json` is already set up. Actual steps (run where npm and
Android Studio are installed -- a phone-only Termux setup can't run Gradle
builds):

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync      # re-run after any change to the web assets
npx cap open android
```

Notes:

- **Icons**: the SVGs in `icons/` work for the web manifest, but
  Android needs real PNG mipmap assets. Use Android Studio's *Image Asset
  Studio* (`res/` -> New -> Image Asset) on a PNG export of
  `icon-512.svg`, or `npx capacitor-assets generate` to automate it.
- **`webDir`** in `capacitor.config.json` points at the project root since
  there's no bundler -- update it if you add a build step later.
- Test on an actual low-end device before publishing if you can; emulator
  default profiles tend to be far more powerful than real budget phones.

## Development principles this followed

- Every phase stayed independently playable before the next one started.
- Scope cuts and known limitations are called out explicitly in code
  comments and here, rather than silently shipping something half-done.
- Sprites, dungeons, and mining areas are all data-driven (see `config/` and
  `game/world.js`) -- adding more content later doesn't require touching the
  engine.
