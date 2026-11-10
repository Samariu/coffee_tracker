# Coffee Tracker

A phone-first app for logging your coffee brews, tracking your beans, and dialling in your grinder. It's built for speed: once you've logged a brew, the next one is usually two taps.

It works offline, installs to your home screen like a native app, and keeps everything on your own device. There is no account and no server.

## What you can do

- **Brew** – Log a brew in a couple of taps. The form starts pre-filled from your most recent brew, so you usually just rate it and save. One-tap cards offer your most-used setups and saved recipes. Saved a brew by mistake? Tap Undo in the confirmation toast.
- **Journal** – Browse past brews grouped by day, open one to view or edit it, or hit "Brew again" to repeat it. Export your history as CSV.
- **Insights** – See overall stats, rating trends, and how your beans and brew methods compare.
- **Beans** – Keep an inventory of your beans. Remaining grams are deducted automatically when you log a brew with a bean from your inventory.
- **Recipes** – Save reusable presets and start a brew from one.
- **Grinder** – The grind setting is recorded as a click count (0–120) for a K2 grinder (40 clicks per rotation), shown as rotations plus clicks (for example "1R + 12").
- **Methods** – V60, French Press, AeroPress, Moka Pot, Chemex, Cold Brew, Espresso, and Other. Choose which ones show up in Settings.

## Using it

Open the app in your phone's browser, then add it to your home screen:

- **iPhone (Safari):** Share → *Add to Home Screen*
- **Android (Chrome):** menu → *Install app* / *Add to Home screen*

After the first load it works without a connection. When a new version is available the app offers a Reload button; Settings also lets you check for updates manually.

## Your data

Everything is stored locally in your browser (IndexedDB) on the device you use. That means:

- Nothing is uploaded anywhere, and the data does not sync between devices.
- Clearing your browser or site data deletes it.

To protect your history, go to **Settings → Backup** and export a backup now and then, and always before switching phones. **Restore from backup** loads it on the new device. Restoring replaces the data currently in the app.

## Running it yourself

You need [Node.js](https://nodejs.org/) and npm.

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build locally
```

The `dist/` folder is a static site and can be hosted anywhere. A Netlify configuration is included.

## For developers

Built with Svelte 5, TypeScript, Vite, and `idb`, plus `vite-plugin-pwa` for offline support. Architecture notes and contribution guidance are in [CLAUDE.md](CLAUDE.md). Run `npm run check` before building.
