# Jin and Shein's Recipe Vault

A lightweight personal recipe vault app for Jin and Shein, built with plain HTML, CSS, and JavaScript.

## Features

- Add new recipes quickly
- Organize recipes with categories and tags
- Search across title, notes, ingredients, and tags
- Mark favorites and filter by favorites
- Sort recipes by newest, alphabetical, or favorite-first
- Edit and delete recipes
- Add recipe photos with preview and edit support
- Local persistence with `localStorage` (no backend required)
- Installable PWA with offline cache for core app files

## Run

Use a local HTTP server (required for service worker and PWA install):

```bash
python3 -m http.server 8000
```

Then go to `http://localhost:8000`.

## Install As App (PWA)

1. Open `http://localhost:8000` in Chrome, Edge, or Safari.
2. Use your browser's install action (for example, "Install app" in the address bar).
3. The app will open in standalone mode and cache core assets for offline use.
4. When a new version is available, an in-app update banner appears with a refresh button.
