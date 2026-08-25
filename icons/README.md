# Icons

The game currently ships with placeholder SVG icons (`icon.svg`,
`icon-192.svg`, `icon-512.svg`) and is already wired up to prefer PNG
versions if present (see `manifest.webmanifest`, `index.html`, and
`service-worker.js`).

To switch to a custom PNG icon, drop these files into this folder using
these **exact names**:

| File                        | Size      | Used for                                              |
|------------------------------|-----------|--------------------------------------------------------|
| `icon-192.png`               | 192x192   | Manifest icon, browser tab favicon, iOS home screen    |
| `icon-512.png`               | 512x512   | Manifest icon (large), Android splash/app icon         |
| `icon-512-maskable.png`      | 512x512   | Android "maskable" icon — keep the logo inside the center ~80% (a safe circle), since Android may crop the edges into a circle/squircle/rounded-square depending on the device launcher |

Notes:
- PNG should be square, ideally with a transparent or solid background
  matching the game's theme color (`#0d0c0f`).
- You don't need to remove the `.svg` files — they're kept as a fallback
  and nothing breaks if you only add some of the PNGs above.
- After adding/replacing icons, bump `CACHE_NAME` in `service-worker.js`
  (e.g. `pixelforge-shell-v17`) so installed PWAs actually pick up the new
  files instead of serving the old cached ones.
