# UI/UX Revamp — Design Spec
**Date:** 2026-04-05  
**Scope:** Tab navigation, Foil Collection tab, Variant Collection tab, Portfolio tab

---

## 1. Tab Navigation Revamp

### Problem
The `.tabs` pill tray has 7 buttons with long labels ("Foil Collection", "Variant Collection"). On mobile the buttons use `flex-shrink:0; white-space:nowrap`, causing overflow and text spilling outside the visible area on narrow screens.

### Solution — Option A (approved)

**Mobile (<700px):**
- Hide `.tabs` pill tray via `display:none`.
- Add a new `<nav class="bottom-nav">` element (sibling to `#app`, fixed to viewport bottom).
- Contains 7 `<button class="bnav-btn" data-tab="...">` elements, icon-only (SVG, no text labels).
- Active tab button gets `.active` class with accent background.
- `#app` gets extra `padding-bottom` (≈70px + safe-area-inset-bottom) to prevent content hiding behind nav.
- Foil and Variant buttons use IDs `id="bnav-btn-foil"` / `id="bnav-btn-variants"` (distinct from the tray's `tab-btn-foil` / `tab-btn-variants` to avoid duplicate IDs).
- `applyConfigToTabs()` is updated to also show/hide `#bnav-btn-foil` and `#bnav-btn-variants`.

**Desktop (≥700px):**
- `.tabs` pill tray remains visible; `.bottom-nav` is hidden.
- Tab labels shortened: "Foil Collection" → "Foil ✦", "Variant Collection" → "Variants ◈".
- All other labels unchanged (Dashboard, Portfolio, Timeline, Binder, Settings).

**Tab switching logic:**
- The existing `document.querySelectorAll('.tab-btn')` event delegation won't reach `.bnav-btn` buttons.
- A second `querySelectorAll('.bnav-btn')` handler is added with identical logic, keeping both in sync.
- Active class on `.tab-btn` and `.bnav-btn` updated in tandem whenever a tab switch occurs.

**CSS variables used:** `--accent`, `--surface`, `--surface2`, `--text`, `--text-muted`.

---

## 2. Foil & Variant Tab Grid Navigation

### Problem
Both tabs use small `← Prev` / `Next →` text buttons centered below the grid. These are easy to miss on mobile and inconsistent with the Binder tab's flanking arrow style.

### Solution
Replace pagination buttons with binder-style flanking arrows in both tabs.

**Layout (flex row):**
```
[binder-nav ‹]  [card grid — flex:1]  [binder-nav ›]
```

- Reuse the existing `.binder-nav` CSS class (circular buttons, 48px, accent on hover).
- IDs: `foil-prev-page`, `foil-next-page`, `variant-prev-page`, `variant-next-page`.
- Disabled + faded (opacity 0.2) at first/last page, same as binder.
- Page counter label stays between arrows (or can be omitted — kept for parity with binder).
- Layout wrapped in a `<div class="binder-layout">` container matching the binder tab structure.

---

## 3. Foil Collection Tab Fixes

### 3a. "Most Valuable Foil (Owned)" hover animation

**Problem:** The `topFoilItem(c, i, false)` branch (owned) produces items without hover styles or the inspect magnifier icon, unlike the "Missing" branch.

**Fix in `topFoilItem()`:**
- Add `missing-inspect` class to ALL items (both owned and missing).
- Add the inspect SVG icon to ALL items.
- Clicking any item calls `openModal(card)` via the existing `.missing-inspect` event delegation.
- Color distinction preserved: owned price in `var(--owned-border)` (green), missing in `var(--accent)` (red).

### 3b. Surge Foil filter detection

**Problem:** Filter `variantCards.filter(c => (c.frame_effects || []).includes('surge'))` returns 0 cards because Scryfall may tag surge foil in the FIN set via `finishes: ['surge_foil']` rather than (or in addition to) `frame_effects: ['surge']`.

**Fix — all surge detection sites:**
```js
// Canonical surge check (used everywhere)
function isSurgeFoil(card) {
  return (card.frame_effects || []).includes('surge')
      || (card.finishes || []).includes('surge_foil');
}
```
Apply this helper at:
1. `buildGrid()` Surge filter in `renderFoilBinder()` (line ~5333)
2. `buildVariantGrid()` Surge Foil filter in `renderVariantBinder()` (line ~5609)
3. `getFoilVariantLabel()` (line ~3168)
4. `getFoilSlotClass()` (line ~3181)

---

## 4. Variant Collection Tab Overhaul

### 4a. Inspection View

**Problem:** Slot clicks call `addCard(cn)` / `removeCard(cn)` (regular ownership toggle). No card modal is opened.

**Fix:** Replace the slot-click handler in `renderVariantBinder()` event delegation:
```js
// Before
const slot = e.target.closest('.card-slot[data-cn]');
if (slot) {
  const cn = slot.dataset.cn;
  if (ownedSet.has(cn)) removeCard(cn);
  else addCard(cn);
  return;
}

// After
const slot = e.target.closest('.card-slot[data-cn]');
if (slot) {
  const cn = slot.dataset.cn;
  const card = variantCards.find(c => c.collector_number === cn);
  if (card) openModal(card);
  return;
}
```
Foil toggle continues to work via the "Add Foil ✦" button inside the existing card modal.

### 4b. Foil Shimmer Visuals

The shimmer CSS animations already exist for `.foil-variant-surge`, `.foil-variant-neon`, `.foil-variant-serialized`, `.foil-variant-collector`. The issue is the correct class is only applied when `isFoilOwned`. This is **correct behavior** — shimmer only shows on foil-owned cards. No change needed here.

The foil type **label badge** at the bottom of each variant card slot is currently rendered as tiny illegible text. Improve the badge:
- Increase font-size, add pill background
- Always show on all cards (not just foil-owned), so users know what type each card is
- Use proper names from the revamped category list below

### 4c. Filter Category Revamp

**Old categories:** `['All', 'Owned', 'Traditional', 'Surge', 'Neon Ink', 'Chocobo Track']`

**New categories:**

| Filter Label | Detection Logic | Notes |
|---|---|---|
| All | show all variantCards | unchanged |
| Foil Owned | `hasFoil(c.collector_number)` | was "Owned" using ownedSet |
| Showcase | `(c.frame_effects\|\|[]).includes('showcase')` | was "Traditional" (partial) |
| Extended Art | `(c.frame_effects\|\|[]).includes('extendedart')` | new |
| Surge Foil | `isSurgeFoil(c)` (helper from §3b) | was "Surge" (broken) |
| Neon Ink | `(c.promo_types\|\|[]).includes('neon_ink')` | unchanged logic |
| Chocobo Track | `c.name.toLowerCase().includes('chocobo')` | unchanged logic |
| Serialized | `(c.frame_effects\|\|[]).includes('serialized')` | new |

**State variable rename:** `activeFilter` default value changes from `'All'` to `'All'` (unchanged).

The foil collection tab's `filterTypes` array is **not** changed — it uses a different set of categories (All / Owned / Traditional / Surge / Neon Ink / Chocobo Track) that refer to main-set foil filtering, not variant art treatments.

---

## 5. Portfolio Tab Additions

### 5a. Label fix

In `renderPortfolio()`, the value-box currently reads:
```html
<div class="value-label">Full Set (USD)</div>
<div class="value-sub">${total} cards total</div>
```
Change to:
```html
<div class="value-label">Main Set (USD)</div>
<div class="value-sub">${total} main set cards</div>
```

### 5b. Variant Portfolio dash-card

Add a new `dash-card` (shown only when `variantCards.length > 0`) after the existing "Most Valuable (Missing)" card:

Contents:
- Header: "◈ Variant Portfolio"
- Owned/total count + completion progress bar
- Estimated value in USD and MYR
- Top 3 owned variant card thumbnails (clickable → `openModal`)
- If no variants loaded: prompt to enable Collector Variants in Settings

### 5c. Foil Collection dash-card

Add a new `dash-card` (shown only when `binderConfig.scope?.foilBinder`) after the Variant Portfolio card:

Contents:
- Header: "✦ Foil Collection"
- Foil-owned/foil-capable count + completion progress bar
- Foil collection value in USD and MYR
- Top 3 owned foil card thumbnails with shimmer overlay (clickable → `openModal`)
- If no foils: show "No foils collected yet"

Both cards use the same grid/card structure as "Most Valuable (Owned)" and "Most Valuable (Missing)" for visual consistency.

---

## Summary of All Changes (index.html only)

| Area | Type | Notes |
|---|---|---|
| CSS — `.tabs` media query | Edit | hide on mobile |
| CSS — `.bottom-nav` | Add | fixed bottom bar, icon buttons |
| CSS — `.bnav-btn` | Add | styles for bottom nav buttons |
| CSS — `#app` padding | Edit | extra bottom padding on mobile |
| HTML — `<nav class="bottom-nav">` | Add | after `<div class="tabs">` |
| `applyConfigToTabs()` | Edit | also show/hide `.bnav-btn` counterparts |
| Tab switch event handler | Edit | add `.bnav-btn` handler alongside `.tab-btn` |
| `renderFoilBinder()` — grid layout | Edit | flanking binder-nav arrows |
| `renderFoilBinder()` — `topFoilItem()` | Edit | add missing-inspect + icon to owned items |
| `renderFoilBinder()` — Surge filter | Edit | use `isSurgeFoil()` helper |
| `renderVariantBinder()` — grid layout | Edit | flanking binder-nav arrows |
| `renderVariantBinder()` — slot click | Edit | `openModal(card)` instead of addCard/removeCard |
| `renderVariantBinder()` — filter types | Edit | revamped category array + detection |
| `renderVariantBinder()` — label badge | Edit | improved pill badge, larger font |
| `getFoilVariantLabel()` | Edit | use `isSurgeFoil()` helper |
| `getFoilSlotClass()` | Edit | use `isSurgeFoil()` helper |
| `isSurgeFoil()` helper | Add | new shared function near other helpers |
| `renderPortfolio()` — label | Edit | "Full Set" → "Main Set" |
| `renderPortfolio()` — variant card | Add | ◈ Variant Portfolio dash-card |
| `renderPortfolio()` — foil card | Add | ✦ Foil Collection dash-card |
