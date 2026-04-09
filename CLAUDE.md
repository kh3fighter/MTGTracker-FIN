# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page MTG binder tracker for the Final Fantasy (FIN) set. Tracks a 309-card main set plus collector booster variants. Uses Scryfall API for card data.

## Running

Open `index.html` in a browser. No build step, no dependencies — plain HTML/CSS/JS.

## Architecture

Everything lives in `index.html` — no build step, no external JS files. The script is structured into named sections marked with `// ──` comments:

- **State / localStorage keys**:
  - `fin-card-data-v6` — Scryfall main set cache (7-day TTL)
  - `fin-collection` — owned collector numbers
  - `fin-booster-packs` — booster pack history
  - `fin-timeline` — timeline events
  - `fin-theme` — dark/light theme
  - `fin-fx-rate` — USD→MYR exchange rate (12h cache)
  - `fin-gist-config` — GitHub Gist sync config (token + gistId)
  - `fin-binder-config` — binder setup (gridRows, gridCols, slotsPerPage, pageCount, scope flags)
  - `fin-foil-collection` — foil ownership map `{ collector_number: ['foil'] }`
  - `fin-variant-data-v2` — collector booster variant card cache (7-day TTL)
  - `fin-hash-db` — perceptual hash index for visual card matching `{ version, hashes: { cn: hex } }`
  - `fin-ocr-usage` — OCR.space monthly usage counter

- **Data layer**: Fetches FIN set from Scryfall (`/cards/search?q=set:fin+is:booster+game:paper+lang:en&unique=prints`), caches 7 days. Optional second fetch for collector variants (`-is:booster+lang:en&unique=prints`) linked via `oracle_id`. The `unique=prints` parameter is critical — without it Scryfall deduplicates by `oracle_id`, hiding variant printings. Cards carry `finishes`, `frame_effects`, `promo_types`, and `foil_only` flags.
- **Collector number sorting**: Handles non-numeric suffixes (e.g. `99b`) via `collectorKey()` parser. Binder slot placement is derived from array index after sorting.
- **Binder math**: Config-driven via `fin-binder-config` (gridRows, gridCols, slotsPerPage, pageCount). Default: 309 cards / 9 per page = 35 pages. Spread view shows 2 pages side-by-side. Binder-style flanking nav arrows (`‹` / `›`) for page navigation.
- **Tab navigation**: Dual nav system — desktop pill tray (`.tabs` with `.tab-btn`) and mobile bottom nav bar (`.bottom-nav` with `.bnav-btn`). Shared `switchTab(tabName)` handler wires both. `applyConfigToTabs()` shows/hides conditional tabs based on `binderConfig.scope`.
- **Tabs**: Dashboard, Portfolio, Timeline, Binder, Collector (conditional), Settings.
- **Booster Pack Mode**: Simulates opening packs, logs pulls to `fin-booster-packs` and `fin-timeline`.
- **Card Scanner**: Three-engine scan mode picker — Visual Match (dhash perceptual image hashing, offline), Tesseract OCR (local WASM text recognition), OCR.space (cloud API). Mode picker shown on scan open. Visual Match precomputes dhash of all card images from Scryfall `image_uris.small` (cached in `fin-hash-db`), crops the viewfinder guide rect region from the camera feed, and matches via Hamming distance. OCR modes use collector number regex + fuzzy name matching.
- **PWA**: Manifest and icons generated at runtime via canvas; supports iOS/Android home-screen install.
- **Celebration**: Rarity-tiered fanfare animations on card adds. Foil adds trigger `celebrateFoil()` — rainbow burst particle effect and shimmer toast.

## Foil System

- Foil ownership tracked separately in `fin-foil-collection` as `{ collector_number: ['foil'] }`.
- Cards expose `finishes: ['nonfoil','foil']`, `price_usd_foil`, and a `foil_only` flag.
- Variant types detected via `promo_types` array using dedicated helpers:
  - `isSurgeFoil(card)` — checks `promo_types.includes('surgefoil')`
  - `isChocoboTrack(card)` — checks `promo_types.includes('chocobotrackfoil')`
  - `isShowcase(card)` — checks `frame_effects.includes('inverted')`
- **Collector Tab** (enabled via `binderConfig.scope.collectorBinder`): unified tab for foils and collector variants. Filter bar (All / Owned / Foil / Extended Art / Showcase / Surge Foil / Chocobo Track + rarity filters C/U/R/M), free-text search, stats cards (owned count, foil count, total value), paginated grid with binder-style flanking nav arrows, foil shimmer on owned slots. Includes both main set `allCards` and `variantCards`. Rendered by `renderCollectorTab()`.
- **FAB search autocomplete**: shows ✦ foil indicator and quick-add foil button inline.
- **Card modal**: "Add Foil ✦" toggle button; shimmer overlay when foil owned; foil type info panel via `buildFoilInfoHTML(card)`.
- **Portfolio tab**: foil badges on owned cards, effective price = max(regular, foil). Variant Portfolio card (variant owned count/%, top variants). Foil Stats card (foil capable vs owned).
- **Dashboard**: Foil Collection stats card — owned/capable count (both main set and collector variants), completion %, top 3 foils by price.
- **Foil shimmer CSS**: variant-specific overlay effects — traditional (diagonal sweep), surge (bold diagonal stripes), neon/chocobo (radial glow pulse), serialized (gold sweep), collector (silver gradient). Glow borders per variant type. Stagger delay classes (`.foil-delay-1`, `.foil-delay-2`).
- **Key helpers**: `getFoilVariantLabel(card)` returns human-readable foil type (SURGE FOIL, CHOCOBO TRACK FOIL, EXTENDED ART, SHOWCASE, COLLECTOR FOIL, FOIL); `getFoilSlotClass(card)` returns CSS class; `getCardByNumber(cn)` searches both `allCards` and `variantCards`; `getVariantLabel(v)` returns readable variant names for modal buttons.

## Tabs

| Tab | Key features |
|-----|-------------|
| Dashboard | Collection progress, rarity breakdown/completion, binder stats, foil collection card, booster packs, session activity |
| Portfolio | Collection valuation (USD/MYR), Pack ROI, value by rarity, top 5 owned/missing, variant portfolio card, foil stats card, clickable owned cards |
| Timeline | Chronological pull log |
| Binder | Paginated binder grid with flanking nav arrows, spread view, page slider widget, slot-click to add/remove |
| Collector | Unified foil + variant grid with filter bar, search, pagination, foil shimmer, slot-click ownership (requires `collectorBinder` scope enabled) |
| Settings | Binder config wizard, Gist sync config, cache controls |

## Scryfall API

**IMPORTANT: Always reference https://scryfall.com/docs/api when working with any Scryfall API code.**

- Rate limit: 100ms between requests. Only 2 paginated requests needed for the full main set.
- Card images: `image_uris.small` for grid thumbnails, `image_uris.normal` for modal detail view.
- Card prices: `prices.usd` and `prices.usd_foil` from TCGPlayer via Scryfall. FX rate from open.er-api.com (cached 12h).
- Docs: https://scryfall.com/docs/api

## Git / Commits

When committing and pushing, only stage the actual application files (`index.html`, `.gitignore`, `CLAUDE.md`). Never commit screenshots, images, media, node_modules, spec docs, or other dev artifacts. The `.gitignore` is configured to exclude these, but always double-check `git status` before staging.

## Cloud Sync

- Collection data syncs to a private GitHub Gist via the GitHub API.
- User provides a Personal Access Token with `gist` scope. Stored in `fin-gist-config`.
- Auto-pushes 5 seconds after any save (debounced). Manual push/pull via sync button in header.
- Gist file `fin-binder-data.json` payload includes: `collection`, `packs`, `timeline`, `binderConfig`, and `foil` objects.
