# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page MTG binder tracker for the Final Fantasy (FIN) set. Tracks card collection in a ClearEdge 360 binder (9-pocket pages). Uses Scryfall API for card data.

## Running

Open `index.html` in a browser. No build step, no dependencies — plain HTML/CSS/JS.

## Architecture

Everything lives in `index.html`:
- **Data layer**: Fetches FIN set from Scryfall API (`/cards/search?q=set:fin+is:booster+game:paper`), caches in localStorage for 7 days. Collection state (owned card collector numbers) stored separately in localStorage.
- **Collector number sorting**: Handles non-numeric suffixes (e.g. `99b`) via `collectorKey()` parser. Binder slot placement is derived from array index after sorting.
- **Binder math**: 300 cards / 9 per page = 34 pages. Spread view shows 2 pages side-by-side.

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
