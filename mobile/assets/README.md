# Assets

Drop the following files here before running `npm run start`:

| File | Size | Source |
| --- | --- | --- |
| `icon.png` | 1024×1024 | resize `../../wzwz/public/raw-logo-512.png` |
| `adaptive-icon.png` | 1024×1024 (transparent foreground) | crop the raw logo, keep ~25% padding |
| `splash.png` | 1242×2436 | dark bg `#0d0d0d` + centered logo |
| `favicon.png` | 48×48 | favicon for `npm run web` only |

Expo will fail to start if any of these are missing.
