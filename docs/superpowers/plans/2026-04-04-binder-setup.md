# Binder Setup & Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable binder system with a first-run wizard, Settings tab, Foil Binder tab, and collector variant support — replacing all hardcoded binder math with user-defined config.

**Architecture:** Everything lives in `index.html` (single-file app, no build step). New features are layered in as: (1) config data model → (2) CSS design system → (3) HTML structure → (4) JS logic per feature → (5) cross-cutting wiring. The `binderConfig` object loaded from localStorage drives all binder math that was previously hardcoded.

**Tech Stack:** Vanilla HTML/CSS/JS, localStorage, Scryfall REST API, GitHub Gist API (cloud sync). No frameworks, no build step. Open `index.html` in a browser to verify each task.

---

## File Map

| File | Changes |
|------|---------|
| `index.html` | All changes — CSS additions (~300 lines), HTML structure additions, JS additions (~600 lines), JS modifications |

Key anchors in `index.html` (do not rely on line numbers — search for these strings):
- Constants block: `const CACHE_KEY =`  (~line 1793)
- State variables: `let allCards =` (~line 1835)
- Card normalization: `collector_number: c.collector_number` (~line 2143)
- `collectorKey()` function (~line 2120)
- `getPlacement()` function (~line 2224)
- `renderSpread()` function (~line 3345)
- Tab buttons HTML: `<button class="tab-btn" data-tab="binder">` (~line 1634)
- Tab content divs: `<div class="tab-content" id="tab-binder">` (~line 1640)
- `openModal()` function (~line 3761)
- Modal HTML: `<div class="modal-overlay"` (~line 1754)
- `buildSyncPayload()` function (~line 1894)
- `gistPull()` function (~line 1948)
- `renderDashboard()` function (~line 2879)
- `renderPortfolio()` function (~line 3012)

---

## Task 1: Config Constants & State

**Files:**
- Modify: `index.html` — constants block, state variables block

- [ ] **Step 1: Add new localStorage key constants**

Find `const CACHE_KEY =` and add after the existing constants block:

```js
const BINDER_CONFIG_KEY = 'fin-binder-config';
const FOIL_KEY         = 'fin-foil-collection';
const VARIANT_KEY      = 'fin-variant-data-v1';
const VARIANT_TTL      = 7 * 24 * 60 * 60 * 1000;

const BINDER_PRESETS = [
  { label: '4-pocket (2×2)',          rows: 2, cols: 2 },
  { label: '9-pocket (3×3)',          rows: 3, cols: 3 },
  { label: '12-pocket (3×4)',         rows: 3, cols: 4 },
  { label: '16-pocket (4×4)',         rows: 4, cols: 4 },
  { label: '18-pocket (3×6)',         rows: 3, cols: 6 },
  { label: 'Custom…',                rows: 0, cols: 0 },
];
```

- [ ] **Step 2: Add config state variables**

Find `let allCards = []` and add alongside the other state variables:

```js
let binderConfig = loadConfig();
let foilOwned    = {};   // { collector_number: ['foil'] }
let variantCards = [];   // collector booster exclusive cards
let wizardStep   = 1;    // 1 | 2 | 3 — current wizard step
```

- [ ] **Step 3: Add loadConfig() and saveConfig() functions**

Add after the state variable block (before the first function definition):

```js
function loadConfig() {
  try {
    const raw = localStorage.getItem(BINDER_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    gridRows: 3, gridCols: 3, slotsPerPage: 9, pageCount: 34,
    presetName: '9-pocket (3×3)',
    scope: { mainSet: true, collectorVariants: false, foilBinder: false },
    configured: false,
  };
}

function saveConfig(cfg) {
  binderConfig = cfg;
  localStorage.setItem(BINDER_CONFIG_KEY, JSON.stringify(cfg));
}

function calcPageCount(slotsPerPage) {
  const total = allCards.length || 300;
  return Math.ceil(total / slotsPerPage);
}
```

- [ ] **Step 4: Add foil helper functions**

Add immediately after `saveConfig()`:

```js
function loadFoil() {
  try {
    const raw = localStorage.getItem(FOIL_KEY);
    if (raw) foilOwned = JSON.parse(raw);
  } catch (e) { foilOwned = {}; }
}

function saveFoil() {
  localStorage.setItem(FOIL_KEY, JSON.stringify(foilOwned));
  triggerSync();
}

function hasFoil(cn) {
  return !!(foilOwned[cn] && foilOwned[cn].includes('foil'));
}

function addFoil(cn) {
  if (!foilOwned[cn]) foilOwned[cn] = [];
  if (!foilOwned[cn].includes('foil')) foilOwned[cn].push('foil');
  saveFoil();
}

function removeFoil(cn) {
  if (!foilOwned[cn]) return;
  foilOwned[cn] = foilOwned[cn].filter(f => f !== 'foil');
  if (!foilOwned[cn].length) delete foilOwned[cn];
  saveFoil();
}
```

- [ ] **Step 5: Call loadFoil() on init**

Find the section where `ownedSet` is populated on load (search for `new Set(JSON.parse`) and add `loadFoil();` immediately after.

- [ ] **Step 6: Open index.html in browser, open DevTools console**

Verify no JS errors. Type `binderConfig` in console — should return the default config object with `configured: false`.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add binder config state, constants, and foil helpers"
```

---

## Task 2: Bump Card Cache & Add New Scryfall Fields

**Files:**
- Modify: `index.html` — card normalization in `fetchFromScryfall()`, cache key constant

- [ ] **Step 1: Bump the cache key**

Find `const CACHE_KEY = 'fin-card-data-v4'` and change to:

```js
const CACHE_KEY = 'fin-card-data-v5';
```

- [ ] **Step 2: Add new fields to card normalization**

Find the card normalization object (search for `collector_number: c.collector_number`). Add these three fields after `scryfall_uri`:

```js
finishes:   c.finishes   || ['nonfoil', 'foil'],
oracle_id:  c.oracle_id  || '',
foil_only:  Array.isArray(c.finishes) && c.finishes.every(f => f !== 'nonfoil'),
```

- [ ] **Step 3: Verify in browser**

Open browser, open DevTools → Application → Local Storage. Delete the old `fin-card-data-v4` key if present. Reload page. After cards load, type `allCards[0]` in console — confirm it has `finishes`, `oracle_id`, `foil_only` fields.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: bump card cache to v5, add finishes/oracle_id/foil_only fields"
```

---

## Task 3: Replace Hardcoded Binder Math

**Files:**
- Modify: `index.html` — `getPlacement()`, `renderSpread()`, `renderBinder()`, `renderDashboard()`, all uses of hardcoded `9` and `34`

- [ ] **Step 1: Update getPlacement()**

Find `function getPlacement(card)` and replace its body:

```js
function getPlacement(card) {
  const idx = allCards.indexOf(card);
  if (idx === -1) return { page: '?', slot: '?' };
  const spp = binderConfig.slotsPerPage;
  const page = Math.floor(idx / spp) + 1;
  const slot = (idx % spp) + 1;
  return { page, slot };
}
```

- [ ] **Step 2: Replace all hardcoded `9` in binder spread/page render**

Search for every occurrence of `/ 9` and `% 9` and `* 9` and `< 9` in the render functions and replace with `/ binderConfig.slotsPerPage`, `% binderConfig.slotsPerPage`, `* binderConfig.slotsPerPage`, `< binderConfig.slotsPerPage`.

Key locations to fix (search for these patterns):
- `Math.floor(idx / 9)` → `Math.floor(idx / binderConfig.slotsPerPage)`
- `idx % 9` → `idx % binderConfig.slotsPerPage`
- `allCards.slice(i * 9, i * 9 + 9)` → `allCards.slice(i * binderConfig.slotsPerPage, (i + 1) * binderConfig.slotsPerPage)`
- `allCards.length / 9` → `allCards.length / binderConfig.slotsPerPage`
- `startIdx = pageIdx * 9` → `startIdx = pageIdx * binderConfig.slotsPerPage`
- `for (let i = 0; i < 9; i++)` → `for (let i = 0; i < binderConfig.slotsPerPage; i++)`
- `i * 2 * 9` → `i * 2 * binderConfig.slotsPerPage`

- [ ] **Step 3: Update renderBinder() totalPages calculation**

Find `totalPages = Math.ceil(allCards.length / 9)` and replace:

```js
totalPages = Math.ceil(allCards.length / binderConfig.slotsPerPage);
binderConfig.pageCount = totalPages;
```

- [ ] **Step 4: Fix the spread view grid layout**

In `renderSpread()`, find where the page grid is rendered with hardcoded 3-column CSS. Add dynamic grid-template-columns based on config:

```js
// When building the page HTML for a spread, set the grid style dynamically:
// Find the element that wraps card slots and set:
// style="grid-template-columns: repeat(${binderConfig.gridCols}, 1fr)"
```

Search for `grid-template-columns` in the binder section and update to use `binderConfig.gridCols`.

- [ ] **Step 5: Update hardcoded "34 Pages" display text**

Search for `<span>34 Pages</span>` in the HTML and replace:

```html
<span id="binder-page-count-display">34 Pages</span>
```

Then in `renderBinder()` or init, update it:
```js
const el = document.getElementById('binder-page-count-display');
if (el) el.textContent = `${binderConfig.pageCount} Pages`;
```

- [ ] **Step 6: Verify in browser**

Open browser. Binder should still look correct with the default 3×3 config. Open console, type `binderConfig.slotsPerPage` — should be `9`. Navigate binder pages — should work as before.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "refactor: replace hardcoded binder math (9/34) with config-driven values"
```

---

## Task 4: CSS — Design System for New UI

**Files:**
- Modify: `index.html` — `<style>` block

- [ ] **Step 1: Add toggle switch CSS**

Add in the `<style>` block (after the existing `.top-card-item` styles):

```css
/* ── Toggle Switch ── */
.toggle-wrap {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; gap: 12px;
}
.toggle-wrap .toggle-label { flex: 1; }
.toggle-wrap .toggle-label strong { display: block; font-size: 0.9rem; font-weight: 600; }
.toggle-wrap .toggle-label span { font-size: 0.78rem; color: var(--text-muted); }
.toggle-switch {
  position: relative; width: 44px; height: 26px; flex-shrink: 0;
  cursor: pointer;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-track {
  position: absolute; inset: 0;
  background: var(--surface2); border-radius: 13px;
  transition: background 0.2s ease;
}
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  transition: transform 0.22s cubic-bezier(0.34,1.4,0.64,1);
}
.toggle-switch input:checked ~ .toggle-track { background: var(--accent); }
.toggle-switch input:checked ~ .toggle-thumb { transform: translateX(18px); }
.toggle-switch.locked { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
.toggle-switch:focus-within .toggle-track { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- [ ] **Step 2: Add wizard CSS**

```css
/* ── Settings / Wizard ── */
.settings-wrap { max-width: 560px; margin: 0 auto; padding: 8px 0 40px; }
.wizard-card {
  background: var(--surface); border-radius: 16px;
  box-shadow: 0 8px 32px var(--shadow);
  padding: 28px 24px;
  animation: card-enter 0.4s cubic-bezier(0.34,1.4,0.64,1) both;
}
.wizard-progress {
  height: 4px; background: var(--surface2); border-radius: 2px;
  margin-bottom: 28px; overflow: hidden;
}
.wizard-progress-fill {
  height: 100%; background: var(--accent); border-radius: 2px;
  transition: width 0.4s ease;
}
.wizard-step {
  animation: wizard-enter 0.3s cubic-bezier(0.4,0,0.2,1) both;
}
.wizard-step.exit {
  animation: wizard-exit 0.3s cubic-bezier(0.4,0,0.2,1) both;
  position: absolute; width: 100%;
}
@keyframes wizard-enter {
  from { opacity: 0; transform: translateX(32px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes wizard-exit {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-32px); }
}
@keyframes wizard-enter-back {
  from { opacity: 0; transform: translateX(-32px); }
  to   { opacity: 1; transform: translateX(0); }
}
.wizard-step h2 { font-size: 1.15rem; font-weight: 700; margin-bottom: 6px; }
.wizard-step .step-sub { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px; }
.wizard-nav {
  display: flex; gap: 10px; margin-top: 28px;
  position: sticky; bottom: 0; background: var(--surface);
  padding: 12px 0 4px;
}
.wizard-nav .btn { flex: 1; min-height: 48px; font-size: 0.95rem; font-weight: 600; }
.wizard-cta {
  position: relative; overflow: hidden;
}
.wizard-cta::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  transform: translateX(-120%);
  transition: transform 0.55s ease;
  pointer-events: none;
}
.wizard-cta:hover::after { transform: translateX(120%); }

/* ── Settings Form ── */
.settings-section {
  margin-bottom: 28px;
  padding: 18px 20px;
  background: var(--surface); border-radius: 12px;
  border-left: 3px solid var(--accent);
}
.settings-section.danger { border-left-color: #f38ba8; }
[data-theme="light"] .settings-section.danger { border-left-color: #d20f39; }
.settings-section-title {
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 14px;
}
.settings-live-summary {
  font-size: 0.8rem; color: var(--text-muted);
  margin-top: 10px; min-height: 1.2em;
}
.settings-live-summary .pop {
  display: inline-block;
  animation: num-pop 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes num-pop {
  from { transform: scale(1.18); }
  to   { transform: scale(1); }
}
.settings-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.settings-row label { font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; }
.custom-inputs { display: none; align-items: center; gap: 8px; }
.custom-inputs.visible { display: flex; }
.custom-inputs input {
  width: 56px; padding: 6px 8px; background: var(--slot-bg);
  border: 1px solid var(--surface2); border-radius: 8px;
  color: var(--text); font-size: 0.9rem; text-align: center;
  transition: box-shadow 0.15s ease;
}
.custom-inputs input:focus { outline: none; box-shadow: 0 0 0 2px var(--accent); }
.danger-toggle { font-size: 0.82rem; color: var(--accent); cursor: pointer; background: none; border: none; padding: 4px 0; }
.danger-actions { display: none; flex-direction: column; gap: 8px; margin-top: 12px; }
.danger-actions.visible { display: flex; }

/* ── Save Button States ── */
.save-btn-wrap { margin-top: 20px; }
.save-btn-wrap .btn-save {
  width: 100%; min-height: 48px; font-size: 0.95rem; font-weight: 700;
  position: relative; overflow: hidden;
  transition: transform 0.08s cubic-bezier(0.34,1.56,0.64,1), background 0.2s;
}
.save-btn-wrap .btn-save:active { transform: scale(0.96); }
.save-btn-wrap .btn-save.success { background: var(--owned-border); color: #1e1e2e; }

/* ── Toast ── */
.toast {
  position: fixed; bottom: calc(env(safe-area-inset-bottom, 0px) + 80px); left: 50%;
  transform: translateX(-50%) translateY(100%);
  background: var(--surface); border: 1px solid var(--surface2);
  border-radius: 10px; padding: 10px 20px;
  font-size: 0.85rem; font-weight: 600;
  box-shadow: 0 4px 20px var(--shadow); z-index: 2000;
  transition: transform 0.3s cubic-bezier(0.34,1.4,0.64,1), opacity 0.25s ease;
  opacity: 0; pointer-events: none; white-space: nowrap;
}
.toast.visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* ── Bottom Sheet (mobile confirmation) ── */
.sheet-backdrop {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0); z-index: 1100;
  transition: background 0.25s ease;
}
.sheet-backdrop.visible { display: block; background: rgba(0,0,0,0.55); }
.bottom-sheet {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 1200;
  background: var(--surface); border-radius: 20px 20px 0 0;
  padding: 12px 24px calc(env(safe-area-inset-bottom, 16px) + 16px);
  box-shadow: 0 -4px 32px var(--shadow);
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.34,1.4,0.64,1);
}
.bottom-sheet.visible { transform: translateY(0); }
.sheet-handle {
  width: 32px; height: 4px; background: var(--surface2);
  border-radius: 2px; margin: 0 auto 20px;
}
.sheet-title { font-size: 1rem; font-weight: 700; margin-bottom: 6px; }
.sheet-body { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; }
.sheet-actions { display: flex; flex-direction: column; gap: 8px; }
.sheet-actions .btn { min-height: 48px; font-size: 0.95rem; }

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Add Foil Binder CSS**

```css
/* ── Foil Binder ── */
@keyframes foil-shimmer {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.slot-foil-owned {
  background: linear-gradient(135deg,
    rgba(255,107,157,0.25),rgba(255,217,61,0.25),
    rgba(107,203,119,0.25),rgba(77,150,255,0.25),rgba(199,125,255,0.25)) !important;
  background-size: 300% 300% !important;
  animation: foil-shimmer 3s ease infinite;
  border: 1.5px solid rgba(255,255,255,0.3) !important;
  box-shadow: 0 0 14px rgba(255,200,100,0.25) !important;
}
.slot-foil-missing {
  opacity: 0.45;
  border: 1px dashed var(--surface3) !important;
}
.foil-badge {
  position: absolute; top: 2px; right: 3px;
  font-size: 0.55rem; color: #ffd93d;
  text-shadow: 0 0 6px rgba(255,217,61,0.9);
  pointer-events: none;
}
/* Foil tab button entrance */
.tab-btn[data-tab="foil"] {
  animation: tab-foil-appear 0.3s cubic-bezier(0.34,1.4,0.64,1) both;
}
@keyframes tab-foil-appear {
  from { opacity: 0; transform: scale(0.82); }
  to   { opacity: 1; transform: scale(1); }
}
/* Modal foil button */
.btn-foil {
  background: linear-gradient(135deg, #ff6b9d, #ffd93d, #6bcb77, #4d96ff, #c77dff);
  background-size: 300% 300%;
  animation: foil-shimmer 3s ease infinite;
  color: #fff; font-weight: 700; border: none; cursor: pointer;
}
.btn-foil:hover { filter: brightness(1.1); }
```

- [ ] **Step 4: Open browser**

Verify no CSS parse errors (DevTools Console tab should be clean).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add CSS design system for settings, wizard, toggles, toast, bottom sheet, foil"
```

---

## Task 5: HTML Structure Additions

**Files:**
- Modify: `index.html` — tab buttons, tab content divs, modal, toast, bottom sheet

- [ ] **Step 1: Add Settings and Foil tab buttons**

Find the existing tab buttons (search for `<button class="tab-btn" data-tab="binder">`). Add two new buttons at the end of the tab button group:

```html
<button class="tab-btn" data-tab="foil" id="tab-btn-foil" style="display:none">✦ Foil</button>
<button class="tab-btn" data-tab="settings">⚙ Settings</button>
```

- [ ] **Step 2: Add Settings and Foil tab content divs**

Find the existing tab content divs (search for `id="tab-binder"`). Add after the last existing tab-content div:

```html
<div class="tab-content" id="tab-foil"></div>
<div class="tab-content" id="tab-settings"></div>
```

- [ ] **Step 3: Add foil button to the modal**

Find the modal actions div (search for `<div class="modal-actions">`). Add the foil button alongside the existing buttons:

```html
<button class="btn btn-foil" id="modal-foil-toggle" style="display:none">Add Foil ✦</button>
```

- [ ] **Step 4: Add toast element**

Add just before the closing `</body>` tag:

```html
<div class="toast" id="toast"></div>
```

- [ ] **Step 5: Add bottom sheet and backdrop**

Add after the toast element, before `</body>`:

```html
<div class="sheet-backdrop" id="sheet-backdrop"></div>
<div class="bottom-sheet" id="bottom-sheet">
  <div class="sheet-handle"></div>
  <div class="sheet-title" id="sheet-title"></div>
  <div class="sheet-body" id="sheet-body"></div>
  <div class="sheet-actions" id="sheet-actions"></div>
</div>
```

- [ ] **Step 6: Verify in browser**

Open browser — app should look and work exactly the same as before (new elements are hidden). The Settings tab button should appear in the tab bar. Foil tab button is hidden.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add HTML structure for settings tab, foil tab, modal foil button, toast, bottom sheet"
```

---

## Task 6: Toast & Bottom Sheet JS

**Files:**
- Modify: `index.html` — add utility functions

- [ ] **Step 1: Add showToast() function**

Add after `saveFoil()`:

```js
function showToast(msg, duration = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('visible'), duration);
}
```

- [ ] **Step 2: Add showSheet() and closeSheet() functions**

Add after `showToast()`:

```js
function showSheet({ title, body, actions }) {
  document.getElementById('sheet-title').textContent = title;
  document.getElementById('sheet-body').textContent = body;
  const actionsEl = document.getElementById('sheet-actions');
  actionsEl.innerHTML = '';
  actions.forEach(({ label, className, onClick }) => {
    const btn = document.createElement('button');
    btn.className = `btn ${className}`;
    btn.textContent = label;
    btn.onclick = () => { closeSheet(); onClick(); };
    actionsEl.appendChild(btn);
  });
  document.getElementById('sheet-backdrop').classList.add('visible');
  document.getElementById('bottom-sheet').classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeSheet() {
  document.getElementById('sheet-backdrop').classList.remove('visible');
  document.getElementById('bottom-sheet').classList.remove('visible');
  document.body.style.overflow = '';
}
```

- [ ] **Step 3: Wire backdrop click to close sheet**

Add after the existing modal close event listener:

```js
document.getElementById('sheet-backdrop').addEventListener('click', closeSheet);
```

- [ ] **Step 4: Verify in browser console**

Type `showToast('Binder updated.')` in console — toast should slide up and disappear after ~2 seconds.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add showToast and showSheet/closeSheet utility functions"
```

---

## Task 7: Settings Tab — First-Run Wizard

**Files:**
- Modify: `index.html` — add `renderSettings()` function and wizard logic

- [ ] **Step 1: Add renderSettings() dispatcher**

Add after `saveFoil()` function area:

```js
function renderSettings() {
  const el = document.getElementById('tab-settings');
  if (binderConfig.configured) {
    renderSettingsForm(el);
  } else {
    wizardStep = 1;
    renderWizard(el);
  }
}
```

- [ ] **Step 2: Add renderWizard() function**

```js
function renderWizard(el) {
  const pct = ((wizardStep - 1) / 2) * 100;
  // wizard state held in module-level vars
  el.innerHTML = `
    <div class="settings-wrap">
      <div class="wizard-card">
        <div class="wizard-progress">
          <div class="wizard-progress-fill" id="wiz-progress" style="width:${pct}%"></div>
        </div>
        <div id="wiz-step-container" style="position:relative; overflow:hidden;">
          ${renderWizardStep(wizardStep)}
        </div>
      </div>
    </div>`;
  bindWizardEvents();
}

function renderWizardStep(step) {
  if (step === 1) return wizardStep1();
  if (step === 2) return wizardStep2();
  return wizardStep3();
}
```

- [ ] **Step 3: Add wizardStep1() function**

```js
function wizardStep1() {
  const presetOptions = BINDER_PRESETS.map(p =>
    `<option value="${p.label}" ${binderConfig.presetName === p.label ? 'selected' : ''}>${p.label}</option>`
  ).join('');
  const isCustom = binderConfig.presetName === 'Custom…';
  const spp = binderConfig.slotsPerPage || 9;
  const pages = calcPageCount(spp);
  return `
    <div class="wizard-step" id="wiz-step">
      <h2>Choose your binder</h2>
      <p class="step-sub">Select the pocket size that matches your physical binder.</p>
      <div class="settings-row">
        <label>Binder type</label>
        <select id="wiz-preset" class="btn btn-secondary" style="padding:8px 12px">
          ${presetOptions}
        </select>
      </div>
      <div class="custom-inputs ${isCustom ? 'visible' : ''}" id="wiz-custom">
        <input id="wiz-rows" type="number" inputmode="numeric" min="1" max="10" value="${binderConfig.gridRows}" placeholder="Rows">
        <span style="color:var(--text-muted)">×</span>
        <input id="wiz-cols" type="number" inputmode="numeric" min="1" max="10" value="${binderConfig.gridCols}" placeholder="Cols">
      </div>
      <p class="settings-live-summary" id="wiz-step1-summary">
        <span class="pop">${spp}</span> slots per page · approx <span class="pop">${pages}</span> pages
      </p>
      <div class="wizard-nav">
        <button class="btn btn-primary wizard-cta" id="wiz-next">Next →</button>
      </div>
    </div>`;
}
```

- [ ] **Step 4: Add wizardStep2() function**

```js
function wizardStep2() {
  const cv = binderConfig.scope.collectorVariants;
  const fb = binderConfig.scope.foilBinder;
  const spp = binderConfig.slotsPerPage || 9;
  const pages = calcPageCount(spp);
  return `
    <div class="wizard-step" id="wiz-step">
      <h2>What will you collect?</h2>
      <p class="step-sub">Choose the card pools you want to track.</p>

      <div class="toggle-wrap">
        <div class="toggle-label">
          <strong>Main Set</strong>
          <span>~300 booster-pack cards (always included)</span>
        </div>
        <label class="toggle-switch locked">
          <input type="checkbox" checked disabled>
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </label>
      </div>

      <div class="toggle-wrap">
        <div class="toggle-label">
          <strong>Collector Variants</strong>
          <span>Borderless, showcase, surge foil, neon ink &amp; more</span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="wiz-cv" ${cv ? 'checked' : ''}>
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </label>
      </div>

      <div class="toggle-wrap">
        <div class="toggle-label">
          <strong>Foil Binder</strong>
          <span>Adds a separate tab to track foil ownership</span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="wiz-fb" ${fb ? 'checked' : ''}>
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </label>
      </div>

      <p class="settings-live-summary" id="wiz-step2-summary">
        Tracking <span class="pop">300</span> cards across <span class="pop">${pages}</span> pages
      </p>
      <div class="wizard-nav">
        <button class="btn btn-secondary" id="wiz-back">← Back</button>
        <button class="btn btn-primary wizard-cta" id="wiz-next">Next →</button>
      </div>
    </div>`;
}
```

- [ ] **Step 5: Add wizardStep3() function**

```js
function wizardStep3() {
  const cv = binderConfig.scope.collectorVariants;
  const fb = binderConfig.scope.foilBinder;
  const spp = binderConfig.slotsPerPage || 9;
  const pages = calcPageCount(spp);
  return `
    <div class="wizard-step" id="wiz-step">
      <h2>Ready to go</h2>
      <p class="step-sub">Your binder is configured. You can change this later in Settings.</p>
      <div class="settings-section" style="margin-top:0">
        <div class="settings-section-title">Summary</div>
        <p style="font-size:0.88rem;margin-bottom:6px">
          <strong>${binderConfig.presetName}</strong> · ${spp} slots/page · ${pages} pages
        </p>
        <p style="font-size:0.85rem;color:var(--text-muted)">
          Main Set ${cv ? '· Collector Variants ' : ''}${fb ? '· Foil Binder' : ''}
        </p>
      </div>
      <div class="wizard-nav">
        <button class="btn btn-secondary" id="wiz-back">← Back</button>
        <button class="btn btn-primary wizard-cta" id="wiz-finish">Set Up My Binder</button>
      </div>
    </div>`;
}
```

- [ ] **Step 6: Add bindWizardEvents() function**

```js
function bindWizardEvents() {
  // Step 1 preset change
  const presetEl = document.getElementById('wiz-preset');
  if (presetEl) {
    presetEl.addEventListener('change', () => {
      const preset = BINDER_PRESETS.find(p => p.label === presetEl.value);
      const customWrap = document.getElementById('wiz-custom');
      if (preset && preset.rows === 0) {
        customWrap.classList.add('visible');
      } else {
        customWrap.classList.remove('visible');
        if (preset) {
          binderConfig.gridRows = preset.rows;
          binderConfig.gridCols = preset.cols;
          binderConfig.slotsPerPage = preset.rows * preset.cols;
          binderConfig.presetName = preset.label;
          updateWizardStep1Summary();
        }
      }
    });
    // custom row/col inputs
    ['wiz-rows','wiz-cols'].forEach(id => {
      const inp = document.getElementById(id);
      if (inp) inp.addEventListener('input', () => {
        const r = parseInt(document.getElementById('wiz-rows').value) || 3;
        const c = parseInt(document.getElementById('wiz-cols').value) || 3;
        binderConfig.gridRows = r; binderConfig.gridCols = c;
        binderConfig.slotsPerPage = r * c;
        binderConfig.presetName = 'Custom…';
        updateWizardStep1Summary();
      });
    });
  }

  // Step 2 toggles
  const cvEl = document.getElementById('wiz-cv');
  const fbEl = document.getElementById('wiz-fb');
  if (cvEl) cvEl.addEventListener('change', () => {
    binderConfig.scope.collectorVariants = cvEl.checked;
    updateWizardStep2Summary();
  });
  if (fbEl) fbEl.addEventListener('change', () => {
    binderConfig.scope.foilBinder = fbEl.checked;
    updateWizardStep2Summary();
  });

  // Navigation
  document.getElementById('wiz-next')?.addEventListener('click', () => advanceWizard(1));
  document.getElementById('wiz-back')?.addEventListener('click', () => advanceWizard(-1));
  document.getElementById('wiz-finish')?.addEventListener('click', finishWizard);
}

function updateWizardStep1Summary() {
  const el = document.getElementById('wiz-step1-summary');
  if (!el) return;
  const spp = binderConfig.slotsPerPage;
  const pages = calcPageCount(spp);
  el.innerHTML = `<span class="pop">${spp}</span> slots per page · approx <span class="pop">${pages}</span> pages`;
}

function updateWizardStep2Summary() {
  const el = document.getElementById('wiz-step2-summary');
  if (!el) return;
  const pages = calcPageCount(binderConfig.slotsPerPage);
  el.innerHTML = `Tracking <span class="pop">300</span> cards across <span class="pop">${pages}</span> pages`;
}

function advanceWizard(dir) {
  wizardStep = Math.max(1, Math.min(3, wizardStep + dir));
  const pct = ((wizardStep - 1) / 2) * 100;
  const progressEl = document.getElementById('wiz-progress');
  if (progressEl) progressEl.style.width = pct + '%';
  const container = document.getElementById('wiz-step-container');
  if (container) {
    container.innerHTML = renderWizardStep(wizardStep);
    bindWizardEvents();
  }
}

function finishWizard() {
  binderConfig.configured = true;
  binderConfig.pageCount = calcPageCount(binderConfig.slotsPerPage);
  saveConfig(binderConfig);
  applyConfigToTabs();
  // Navigate to Binder tab
  document.querySelector('[data-tab="binder"]').click();
  showToast('Binder configured! Welcome.');
}
```

- [ ] **Step 7: Add applyConfigToTabs() function**

```js
function applyConfigToTabs() {
  // Show/hide foil tab button
  const foilBtn = document.getElementById('tab-btn-foil');
  if (foilBtn) foilBtn.style.display = binderConfig.scope.foilBinder ? '' : 'none';
  // Update page count display
  const pcEl = document.getElementById('binder-page-count-display');
  if (pcEl) pcEl.textContent = `${binderConfig.pageCount} Pages`;
  // Re-render binder if active
  totalPages = binderConfig.pageCount;
}
```

- [ ] **Step 8: Wire Settings tab click to renderSettings()**

Find the existing tab click handler (search for `if (btn.dataset.tab === 'portfolio') renderPortfolio()`). Add:

```js
if (btn.dataset.tab === 'settings') renderSettings();
if (btn.dataset.tab === 'foil') renderFoilBinder();
```

- [ ] **Step 9: Verify wizard in browser**

Delete `fin-binder-config` from localStorage (DevTools → Application → Local Storage). Reload. Settings tab should appear. Click it — wizard should render with Step 1. Select a preset, click Next → Step 2 slides in. Toggle Foil Binder on. Click Next → Step 3 review. Click "Set Up My Binder" → navigates to Binder tab, toast appears.

- [ ] **Step 10: Commit**

```bash
git add index.html
git commit -m "feat: add first-run wizard in Settings tab with 3-step flow"
```

---

## Task 8: Settings Tab — Reconfiguration Form

**Files:**
- Modify: `index.html` — add `renderSettingsForm()` function

- [ ] **Step 1: Add renderSettingsForm() function**

```js
function renderSettingsForm(el) {
  const cfg = binderConfig;
  const presetOptions = BINDER_PRESETS.map(p =>
    `<option value="${p.label}" ${cfg.presetName === p.label ? 'selected' : ''}>${p.label}</option>`
  ).join('');
  const isCustom = cfg.presetName === 'Custom…';
  const spp = cfg.slotsPerPage;
  const totalSlots = spp * cfg.pageCount;

  el.innerHTML = `
    <div class="settings-wrap">

      <div class="settings-section">
        <div class="settings-section-title">Binder Setup</div>
        <div class="settings-row">
          <label>Type</label>
          <select id="sf-preset" class="btn btn-secondary" style="padding:8px 12px">
            ${presetOptions}
          </select>
        </div>
        <div class="custom-inputs ${isCustom ? 'visible' : ''}" id="sf-custom">
          <input id="sf-rows" type="number" inputmode="numeric" min="1" max="10" value="${cfg.gridRows}" placeholder="Rows">
          <span style="color:var(--text-muted)">×</span>
          <input id="sf-cols" type="number" inputmode="numeric" min="1" max="10" value="${cfg.gridCols}" placeholder="Cols">
        </div>
        <div class="settings-row" style="margin-top:10px">
          <label>Pages</label>
          <input id="sf-pages" type="number" inputmode="numeric" min="1" max="999"
            value="${cfg.pageCount}" style="width:64px;padding:6px 8px;background:var(--slot-bg);border:1px solid var(--surface2);border-radius:8px;color:var(--text);font-size:0.9rem;transition:box-shadow 0.15s ease">
        </div>
        <p class="settings-live-summary" id="sf-summary">
          <span id="sf-s1">${spp}</span> slots/page · <span id="sf-s2">${cfg.pageCount}</span> pages · <span id="sf-s3">${totalSlots}</span> total slots
        </p>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Collection Scope</div>
        <div class="toggle-wrap">
          <div class="toggle-label">
            <strong>Main Set</strong>
            <span>~300 booster-pack cards</span>
          </div>
          <label class="toggle-switch locked">
            <input type="checkbox" checked disabled>
            <span class="toggle-track"></span><span class="toggle-thumb"></span>
          </label>
        </div>
        <div class="toggle-wrap">
          <div class="toggle-label">
            <strong>Collector Variants</strong>
            <span>Borderless, showcase, surge foil, neon ink &amp; more</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="sf-cv" ${cfg.scope.collectorVariants ? 'checked' : ''}>
            <span class="toggle-track"></span><span class="toggle-thumb"></span>
          </label>
        </div>
        <div class="toggle-wrap">
          <div class="toggle-label">
            <strong>Foil Binder</strong>
            <span>Separate tab for foil ownership tracking</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="sf-fb" ${cfg.scope.foilBinder ? 'checked' : ''}>
            <span class="toggle-track"></span><span class="toggle-thumb"></span>
          </label>
        </div>
      </div>

      <div class="save-btn-wrap">
        <button class="btn btn-primary btn-save" id="sf-save">Save Changes</button>
      </div>

      <div class="settings-section danger">
        <div class="settings-section-title" style="color:var(--accent)">Danger Zone</div>
        <button class="danger-toggle" id="sf-danger-toggle">▸ Show options</button>
        <div class="danger-actions" id="sf-danger-actions">
          <button class="btn btn-secondary" id="sf-reset-collection">Reset Collection</button>
          <button class="btn btn-secondary" id="sf-reset-foil">Reset Foil Collection</button>
          <button class="btn btn-danger" id="sf-reset-all">Reset Everything</button>
        </div>
      </div>

    </div>`;

  bindSettingsFormEvents();
}
```

- [ ] **Step 2: Add bindSettingsFormEvents() function**

```js
function bindSettingsFormEvents() {
  const presetEl = document.getElementById('sf-preset');
  const customWrap = document.getElementById('sf-custom');

  function updateSfSummary() {
    const r = parseInt(document.getElementById('sf-rows')?.value) || binderConfig.gridRows;
    const c = parseInt(document.getElementById('sf-cols')?.value) || binderConfig.gridCols;
    const pages = parseInt(document.getElementById('sf-pages')?.value) || binderConfig.pageCount;
    const spp = r * c;
    const s1 = document.getElementById('sf-s1');
    const s2 = document.getElementById('sf-s2');
    const s3 = document.getElementById('sf-s3');
    if (s1) { s1.textContent = spp; s1.classList.remove('pop'); void s1.offsetWidth; s1.classList.add('pop'); }
    if (s2) { s2.textContent = pages; s2.classList.remove('pop'); void s2.offsetWidth; s2.classList.add('pop'); }
    if (s3) { s3.textContent = spp * pages; s3.classList.remove('pop'); void s3.offsetWidth; s3.classList.add('pop'); }
  }

  presetEl?.addEventListener('change', () => {
    const preset = BINDER_PRESETS.find(p => p.label === presetEl.value);
    if (preset && preset.rows === 0) {
      customWrap.classList.add('visible');
    } else {
      customWrap.classList.remove('visible');
      if (preset) {
        document.getElementById('sf-rows').value = preset.rows;
        document.getElementById('sf-cols').value = preset.cols;
        const autoPages = Math.ceil((allCards.length || 300) / (preset.rows * preset.cols));
        document.getElementById('sf-pages').value = autoPages;
        updateSfSummary();
      }
    }
  });

  ['sf-rows','sf-cols','sf-pages'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateSfSummary);
  });

  document.getElementById('sf-danger-toggle')?.addEventListener('click', () => {
    const el = document.getElementById('sf-danger-actions');
    el.classList.toggle('visible');
    document.getElementById('sf-danger-toggle').textContent =
      el.classList.contains('visible') ? '▾ Hide options' : '▸ Show options';
  });

  document.getElementById('sf-reset-collection')?.addEventListener('click', () => {
    showSheet({
      title: 'Reset Collection?',
      body: 'This will clear all owned card data. Your binder settings and foil collection will be kept.',
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: () => {} },
        { label: 'Reset Collection', className: 'btn-danger', onClick: () => {
          ownedSet.clear(); localStorage.setItem(COLLECTION_KEY, '[]');
          renderSettings(); showToast('Collection reset.');
        }},
      ]
    });
  });

  document.getElementById('sf-reset-foil')?.addEventListener('click', () => {
    showSheet({
      title: 'Reset Foil Collection?',
      body: 'This will clear all foil ownership data. Your main collection and settings will be kept.',
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: () => {} },
        { label: 'Reset Foil', className: 'btn-danger', onClick: () => {
          foilOwned = {}; saveFoil();
          renderSettings(); showToast('Foil collection reset.');
        }},
      ]
    });
  });

  document.getElementById('sf-reset-all')?.addEventListener('click', () => {
    showSheet({
      title: 'Reset Everything?',
      body: 'All your collection data, foil data, and binder settings will be permanently deleted.',
      actions: [
        { label: 'Cancel', className: 'btn-secondary', onClick: () => {} },
        { label: 'Delete Everything', className: 'btn-danger', onClick: () => {
          localStorage.clear();
          location.reload();
        }},
      ]
    });
  });

  document.getElementById('sf-save')?.addEventListener('click', () => {
    const r = parseInt(document.getElementById('sf-rows')?.value) || binderConfig.gridRows;
    const c = parseInt(document.getElementById('sf-cols')?.value) || binderConfig.gridCols;
    const pages = parseInt(document.getElementById('sf-pages')?.value) || binderConfig.pageCount;
    const presetName = presetEl.value;
    const newCfg = {
      ...binderConfig,
      gridRows: r, gridCols: c,
      slotsPerPage: r * c, pageCount: pages,
      presetName,
      scope: {
        mainSet: true,
        collectorVariants: document.getElementById('sf-cv').checked,
        foilBinder: document.getElementById('sf-fb').checked,
      },
      configured: true,
    };
    saveConfig(newCfg);
    applyConfigToTabs();
    // Fetch variants if newly enabled
    if (newCfg.scope.collectorVariants && variantCards.length === 0) {
      fetchVariants();
    }
    // Save button success state
    const btn = document.getElementById('sf-save');
    btn.textContent = '✓ Saved';
    btn.classList.add('success');
    setTimeout(() => { btn.textContent = 'Save Changes'; btn.classList.remove('success'); }, 1500);
    showToast('Binder updated.');
  });
}
```

- [ ] **Step 3: Verify settings form in browser**

With `configured: true` in localStorage, click Settings tab → compact form should render. Change preset to 12-pocket → summary updates live. Toggle Foil Binder on → Save → Foil tab button should appear. Open Danger Zone → three buttons visible.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add settings form for returning users with save, summary, danger zone"
```

---

## Task 9: First-Run Auto-Navigation

**Files:**
- Modify: `index.html` — app initialization block

- [ ] **Step 1: Trigger Settings tab on unconfigured load**

Find the section where tabs are initialized on page load (search for the block that calls `renderBinder()` or `renderDashboard()` on load — typically near the bottom of the script). Add a check:

```js
// After cards are loaded and tabs are set up:
if (!binderConfig.configured) {
  // Auto-navigate to Settings tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const settingsBtn = document.querySelector('[data-tab="settings"]');
  const settingsTab = document.getElementById('tab-settings');
  if (settingsBtn && settingsTab) {
    settingsBtn.classList.add('active');
    settingsTab.classList.add('active');
    renderSettings();
  }
} else {
  applyConfigToTabs();
}
```

- [ ] **Step 2: Call applyConfigToTabs() on load when already configured**

Ensure `applyConfigToTabs()` is called during init so the Foil tab button is shown/hidden correctly based on saved config.

- [ ] **Step 3: Verify first-run flow**

Clear all localStorage. Reload. App should land on Settings tab showing the wizard. Complete wizard. Reload again — app should land on the normal Binder tab.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: auto-navigate to Settings wizard on first run"
```

---

## Task 10: Foil Binder Tab

**Files:**
- Modify: `index.html` — add `renderFoilBinder()` function, foil modal button wiring

- [ ] **Step 1: Add renderFoilBinder() function**

```js
function renderFoilBinder() {
  const el = document.getElementById('tab-foil');
  if (!el) return;

  const foilCards = allCards.filter(c => (c.finishes || []).includes('foil'));
  const ownedFoils = foilCards.filter(c => hasFoil(c.collector_number));
  const totalFoilValue = ownedFoils.reduce((s, c) => s + (c.price_usd_foil || 0), 0);
  const pct = foilCards.length > 0 ? Math.round((ownedFoils.length / foilCards.length) * 100) : 0;

  el.innerHTML = `
    <div class="dash-grid" style="margin-bottom:20px">
      <div class="dash-card">
        <div class="dash-label">Foil Progress</div>
        <div class="dash-value">${ownedFoils.length}<span style="font-size:1rem;color:var(--text-muted)"> / ${foilCards.length}</span></div>
        <div class="dash-sub">${pct}% complete</div>
        <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="dash-card">
        <div class="dash-label">Foil Collection Value</div>
        <div class="dash-value">$${totalFoilValue.toFixed(2)}</div>
        <div class="dash-sub">RM ${(totalFoilValue * USD_TO_MYR).toFixed(2)}</div>
      </div>
    </div>
    <div id="foil-grid" class="binder-spread" style="display:grid;grid-template-columns:repeat(${binderConfig.gridCols},1fr);gap:4px;max-width:600px;margin:0 auto">
      ${foilCards.map((c, i) => {
        const owned = hasFoil(c.collector_number);
        return `<div class="card-slot ${owned ? 'slot-foil-owned' : 'slot-foil-missing'}"
          data-cn="${c.collector_number}"
          style="animation-delay:${i * 0.015}s;cursor:pointer;position:relative"
          onclick="openModal(allCards.find(x=>x.collector_number==='${c.collector_number}'))">
          <img src="${c.image_small}" alt="${c.name}" style="width:100%;border-radius:4px;${owned ? '' : 'filter:grayscale(0.6)'}">
          ${owned ? '<span class="foil-badge">✦</span>' : ''}
        </div>`;
      }).join('')}
    </div>`;
}
```

- [ ] **Step 2: Update openModal() to show foil button**

Find `function openModal(card)` and add foil button logic after the existing `toggleBtn` setup:

```js
const foilBtn = document.getElementById('modal-foil-toggle');
const hasFoilFinish = (card.finishes || []).includes('foil');
if (hasFoilFinish) {
  const owned = hasFoil(card.collector_number);
  foilBtn.textContent = owned ? 'Remove Foil' : 'Add Foil ✦';
  foilBtn.className = owned ? 'btn btn-secondary' : 'btn btn-foil';
  foilBtn.style.display = '';
  foilBtn.onclick = () => {
    if (hasFoil(card.collector_number)) removeFoil(card.collector_number);
    else addFoil(card.collector_number);
    closeModal();
    if (document.getElementById('tab-foil').classList.contains('active')) renderFoilBinder();
  };
} else {
  foilBtn.style.display = 'none';
}
```

- [ ] **Step 3: Verify foil binder in browser**

Enable Foil Binder in Settings and save. Click the Foil tab. Grid of cards should render (all greyed). Click a card → modal shows "Add Foil ✦" rainbow button. Click it → card gets shimmer in foil grid, badge appears. Stats update.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add Foil Binder tab with shimmer grid and modal foil toggle button"
```

---

## Task 11: Collector Variant Fetch

**Files:**
- Modify: `index.html` — add `fetchVariants()` function and wiring

- [ ] **Step 1: Add fetchVariants() function**

```js
async function fetchVariants() {
  // Check cache
  try {
    const cached = JSON.parse(localStorage.getItem(VARIANT_KEY) || 'null');
    if (cached && Date.now() - cached.ts < VARIANT_TTL) {
      variantCards = cached.cards;
      linkVariantsToMain();
      return;
    }
  } catch (e) {}

  // Fetch all FIN paper cards NOT in boosters
  let cards = [], page = 1, hasMore = true;
  while (hasMore) {
    await new Promise(r => setTimeout(r, 100)); // Scryfall rate limit
    const url = `https://api.scryfall.com/cards/search?q=set:fin+game:paper+-is:booster&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    cards = cards.concat(data.data.map(c => ({
      collector_number: c.collector_number,
      name:             c.name,
      rarity:           c.rarity,
      type_line:        c.type_line || '',
      mana_cost:        c.mana_cost || '',
      image_small:      c.image_uris?.small || c.card_faces?.[0]?.image_uris?.small || '',
      image_normal:     c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal || '',
      image_back_small: c.card_faces?.[1]?.image_uris?.small || '',
      image_back_normal:c.card_faces?.[1]?.image_uris?.normal || '',
      price_usd:        parseFloat(c.prices?.usd)       || 0,
      price_usd_foil:   parseFloat(c.prices?.usd_foil)  || 0,
      scryfall_uri:     c.scryfall_uri || '',
      finishes:         c.finishes    || ['foil'],
      oracle_id:        c.oracle_id   || '',
      foil_only:        Array.isArray(c.finishes) && c.finishes.every(f => f !== 'nonfoil'),
      variant_of:       null,
    })));
    hasMore = data.has_more;
    page++;
  }

  localStorage.setItem(VARIANT_KEY, JSON.stringify({ ts: Date.now(), cards }));
  variantCards = cards;
  linkVariantsToMain();
}

function linkVariantsToMain() {
  const oracleMap = {};
  allCards.forEach(c => { if (c.oracle_id) oracleMap[c.oracle_id] = c.collector_number; });
  variantCards.forEach(v => {
    v.variant_of = oracleMap[v.oracle_id] || null;
  });
}
```

- [ ] **Step 2: Call fetchVariants() on load if scope enabled**

Find where `loadCards()` is called on init. After cards are loaded, add:

```js
if (binderConfig.scope.collectorVariants) fetchVariants();
```

- [ ] **Step 3: Verify variant fetch in browser**

Enable Collector Variants in Settings → Save. Open DevTools Network tab. A series of requests to `api.scryfall.com/cards/search?q=set:fin+game:paper+-is:booster` should fire. After completion, type `variantCards.length` in console — should be > 0. Type `variantCards[0]` — should have `variant_of` field.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add fetchVariants() for collector booster cards with caching and oracle_id linking"
```

---

## Task 12: Gist Sync — Add Config & Foil to Payload

**Files:**
- Modify: `index.html` — `buildSyncPayload()`, `gistPull()`

- [ ] **Step 1: Update buildSyncPayload()**

Find `function buildSyncPayload()` (search for `buildSyncPayload`). Add `binderConfig` and `foilOwned` to the returned object:

```js
function buildSyncPayload() {
  return {
    collection:   [...ownedSet],
    packs:        boosterPacks,
    timeline:     timelineEvents,
    binderConfig: binderConfig,      // NEW
    foilOwned:    foilOwned,         // NEW
  };
}
```

- [ ] **Step 2: Update gistPull() to read new fields**

Find `function gistPull()` and in the block where synced data is applied (search for `if (data.collection)`), add:

```js
if (data.binderConfig) {
  saveConfig(data.binderConfig);
  applyConfigToTabs();
}
if (data.foilOwned) {
  foilOwned = data.foilOwned;
  localStorage.setItem(FOIL_KEY, JSON.stringify(foilOwned));
}
```

- [ ] **Step 3: Verify sync in browser (if Gist is configured)**

If a Gist token is configured: trigger a manual push (sync button). Check the Gist JSON in GitHub — should contain `binderConfig` and `foilOwned` keys alongside `collection`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: include binderConfig and foilOwned in Gist cloud sync payload"
```

---

## Task 13: Final Wiring & Verification

**Files:**
- Modify: `index.html` — any remaining wiring

- [ ] **Step 1: Verify full first-run flow**

1. Clear all localStorage in DevTools
2. Reload → lands on Settings wizard (Step 1)
3. Select "12-pocket (3×4)" → summary shows "12 slots per page · 25 pages"
4. Click Next → Step 2 slides in from right
5. Enable Foil Binder toggle → summary updates
6. Click Next → Step 3 review card shows correct summary
7. Click "Set Up My Binder" → navigates to Binder tab, toast appears
8. Binder renders 3×4 grid per page

- [ ] **Step 2: Verify reconfiguration flow**

1. Click Settings tab → compact form renders (not wizard)
2. Change to "16-pocket (4×4)" → summary updates live
3. Click Save → toast "Binder updated." appears, binder reflows to 4×4

- [ ] **Step 3: Verify foil flow**

1. Enable Foil Binder in Settings → Save
2. Foil tab button appears with spring animation
3. Click Foil tab → grid renders all greyed cards
4. Click a card → modal shows "Add Foil ✦" rainbow button
5. Add foil → slot gets rainbow shimmer, stats update, ✦ badge appears

- [ ] **Step 4: Verify mobile at 390px viewport**

1. Open DevTools → Device toolbar → iPhone 14 (390×844)
2. Wizard steps are full-width, Back/Next buttons are large and thumb-reachable
3. Tab bar scrolls horizontally when 7 tabs present
4. Danger Zone confirmation appears as a bottom sheet sliding up from below

- [ ] **Step 5: Verify data persistence**

1. Add a foil card, configure a custom binder
2. Reload page
3. Foil ownership and binder config should be restored

- [ ] **Step 6: Final commit**

```bash
git add index.html
git commit -m "feat: complete binder setup system — wizard, settings, foil binder, variant fetch, sync"
```

---

## Self-Review Checklist

- [x] **Config data model** → Task 1
- [x] **Preset sizes + custom** → Task 7 (wizard step 1), Task 8 (settings form)
- [x] **First-run wizard 3 steps** → Task 7
- [x] **Step transitions (slide L/R)** → `advanceWizard()` in Task 7 + CSS keyframes in Task 4
- [x] **Toggle switches (custom CSS, locked Main Set)** → Task 4 CSS + Tasks 7/8 HTML
- [x] **Live summary updates** → `updateWizardStep1Summary()`, `updateWizardStep2Summary()`, `updateSfSummary()` in Tasks 7/8
- [x] **Settings form with save button success state** → Task 8
- [x] **Toast** → Task 6
- [x] **Danger Zone bottom sheet** → Tasks 6, 8
- [x] **Foil binder tab (conditional)** → Task 5, 10
- [x] **Foil shimmer CSS** → Task 4
- [x] **Modal foil button** → Task 10
- [x] **Hardcoded 9/34 replaced** → Task 3
- [x] **Card cache bumped to v5** → Task 2
- [x] **finishes/oracle_id fields** → Task 2
- [x] **Collector variant fetch** → Task 11
- [x] **Gist sync updated** → Task 12
- [x] **First-run auto-navigation** → Task 9
- [x] **prefers-reduced-motion** → Task 4 CSS
- [x] **Mobile: 48px touch targets, numeric inputs, full-width buttons** → Tasks 4/7/8 CSS+HTML
- [x] **applyConfigToTabs() wires foil tab visibility** → Tasks 7, 8
