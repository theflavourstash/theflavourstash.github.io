# Flavour Lab

A local-first e-liquid flavour inventory and recipe notebook. Vue 3, Pinia, Vue Router, Tailwind CSS 4 and Vite. No database, login, third-party API or runtime CDN.

## Run the prebuilt app (no npm required)

Extract the ZIP, open a terminal in the `flavour-lab` folder, then:

```sh
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080 in your browser. Do not double-click index.html: browser storage and service workers require a web server.

For a phone on the same Wi-Fi, open `http://YOUR-COMPUTER-LAN-IP:8080`. Your computer must stay on while serving. Ordinary HTTP on a LAN supports the app but not service workers or PWA installation; use HTTPS for installation on another device. On localhost, supported browsers can install the production app. Allow the first load to complete before going offline.

## Develop

Use Node.js 22+ and npm:

```sh
npm ci
npm run dev
```

Open the URL Vite prints. To produce a fresh offline-ready build:

```sh
npm test
npm run build
npm run preview
```

## Features

- Empty starting collection. Add your own flavours or import a private backup.
- Add/edit flavours, remaining stock, manufacturer, icon and PG carrier percentage.
- Search, brand filters, low/out-of-stock filters and sorting.
- Personal 0–5 ratings, dated comments and notes for flavours and recipes.
- Save/edit recipes with batch volume, VG target, nicotine strength and carrier settings.
- Calculate flavour, nicotine base, PG and VG volumes. Duplicate flavour lines are combined before stock checks.
- Confirming a batch atomically saves its history and deducts flavour stock. Insufficient stock or impossible ratios block mixing.
- Undo restores exactly the deducted amounts once, preserving batch history.
- JSON backup export/import with validation and an explicit replacement step.
- Local storage persistence with write-error handling, corruption protection and cross-tab edit blocking.
- Responsive pastel UI, rem/clamp sizing, keyboard-accessible native dialogs.
- Production service worker pre-caches the compiled JS/CSS and app shell.

## Important data assumptions

New flavour carriers default to 100% PG. Check the product information before relying on PG/VG calculations. Personal inventory is not included in this public repository.

PG, VG and nicotine base stock are not tracked, but their required volumes are calculated. Quantities are in ml, not grams. Nicotine defaults to 0 mg/ml. Use the concentration on your own bottle. Displayed values round to 2 decimal places; stock maths retains 6 decimal places.

Ratings/comments are personal, not a community system. Data stays in the browser for that exact origin (protocol, host and port). Changing the URL/port creates a separate collection. Export a backup before moving devices or URLs, or clearing browser data. Browser storage is not a substitute for backups.

## Architecture

- `src/seed.js`: editable starting inventory, only used when no saved data exists.
- `src/calc.js`: pure calculation and stock deduction functions.
- `src/store.js`: versioned local storage, validation and atomic Pinia actions.
- `src/App.vue`: inventory, recipe editor, history, settings and detail dialogs.
- `src/style.css`: Tailwind import and responsive design system.
- `scripts/cache-assets.mjs`: adds hashed build assets to the production service-worker cache.

The store is the persistence boundary for a future API/database adapter. Hash routing makes static hosting simple.

## Verification

Seven automated calculation tests pass, covering volume conservation, duplicate lines, stock deduction, impossible ratios, invalid inputs, VG carriers and exact stock exhaustion. Browser checks confirmed inventory rendering, recipe saving, a 5 ml deduction and undo persistence after reload. Mobile layout is implemented with CSS breakpoints; a real-device install/offline test remains recommended. Development mode intentionally does not install a service worker.
