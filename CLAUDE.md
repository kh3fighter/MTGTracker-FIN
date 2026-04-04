# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page MTG binder tracker for the Final Fantasy (FIN) set. Tracks card collection in a ClearEdge 360 binder (9-pocket pages). Uses Scryfall API for card data.

## Running

Open `index.html` in a browser. No build step, no dependencies — plain HTML/CSS/JS.

## Architecture

Everything lives in `index.html` — no build step, no external JS files. The script is structured into named sections marked with `// ──` comments:

- **State / localStorage keys**: `fin-card-data-v4` (Scryfall cache), `fin-collection` (owned collector numbers), `fin-booster-packs`, `fin-timeline`, `fin-theme`, `fin-fx-rate`, `fin-gist-config`.
- **Data layer**: Fetches FIN set from Scryfall API (`/cards/search?q=set:fin+is:booster+game:paper`), caches for 7 days. Collection state (owned card collector numbers) stored separately.
- **Collector number sorting**: Handles non-numeric suffixes (e.g. `99b`) via `collectorKey()` parser. Binder slot placement is derived from array index after sorting.
- **Binder math**: 300 cards / 9 per page = 34 pages. Spread view shows 2 pages side-by-side.
- **Tabs**: Binder, Dashboard, Portfolio, Timeline, Pack Simulator.
- **Booster Pack Mode**: Simulates opening packs, logs pulls to `fin-booster-packs` and `fin-timeline`.
- **PWA**: Manifest and icons generated at runtime via canvas; supports iOS/Android home-screen install.
- **Celebration**: Rarity-tiered fanfare animations on card adds.

## Scryfall API

- Rate limit: 100ms between requests. Only 2 paginated requests needed for the full set.
- Card images: `image_uris.small` for grid thumbnails, `image_uris.normal` for modal detail view.
- Card prices: `prices.usd` from TCGPlayer via Scryfall. FX rate from open.er-api.com (cached 12h).
- Docs: https://scryfall.com/docs/api

## Cloud Sync

- Collection data syncs to a private GitHub Gist via the GitHub API.
- User provides a Personal Access Token with `gist` scope. Stored in localStorage key `fin-gist-config`.
- Auto-pushes 5 seconds after any save (debounced). Manual push/pull via sync button in header.
- Gist contains a single file `fin-binder-data.json` with collection, packs, and timeline data.
