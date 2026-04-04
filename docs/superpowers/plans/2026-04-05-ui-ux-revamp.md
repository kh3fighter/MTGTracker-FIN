# UI/UX Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp the tab navigation (mobile bottom nav + desktop pills), add binder-style flanking arrows to Foil/Variant tabs, fix Surge Foil detection, overhaul Variant tab categories and inspection, and add Variant/Foil cards to the Portfolio tab.

**Architecture:** All changes are in a single file `index.html`. The file is structured in named sections separated by `// ──` comments. CSS lives in a `<style>` block at the top, HTML in the body, JS in a `<script>` block. No build step — open in browser to test.

**Tech Stack:** Plain HTML/CSS/JS, no dependencies. Test by opening `index.html` in a browser.

---

## File Map

| File | Changes |
|---|---|
| `index.html` lines ~244–278 | `.tabs` CSS — add mobile hide rule |
| `index.html` lines ~1147–1160 | Add `.bottom-nav` + `.bnav-btn` CSS after `.binder-layout` |
| `index.html` lines ~1232–1259 | Mobile media query — add bottom-nav show, tabs hide, app padding |
| `index.html` lines ~1983–2012 | Tab bar HTML — shorten desktop labels |
| `index.html` after line 2012 | Add `<nav class="bottom-nav">` HTML |
| `index.html` lines ~2495–2505 | `applyConfigToTabs()` — also toggle `#bnav-btn-foil` / `#bnav-btn-variants` |
| `index.html` lines ~3164–3185 | `getFoilVariantLabel()` + `getFoilSlotClass()` — add `isSurgeFoil()` helper before these |
| `index.html` lines ~4174–4177 | `renderPortfolio()` — rename "Full Set" label |
| `index.html` after line 4246 | `renderPortfolio()` — add Variant Portfolio + Foil Collection dash-cards |
| `index.html` lines ~5047–5061 | Tab switch handler — add `.bnav-btn` handler |
| `index.html` lines ~5324–5380 | `renderFoilBinder()` `buildGrid()` — fix Surge filter, replace Prev/Next with binder-nav |
| `index.html` lines ~5392–5400 | `topFoilItem()` — add missing-inspect + icon to owned items |
| `index.html` lines ~5418–5425 | `renderFoilBinder()` `el.innerHTML` — wrap grid in binder-layout |
| `index.html` lines ~5585–5668 | `renderVariantBinder()` — revamp filter categories, fix Surge, replace Prev/Next |
| `index.html` lines ~5703–5710 | Variant slot click — `openModal(card)` instead of addCard/removeCard |

---

## Task 1: Add `isSurgeFoil()` helper + fix `getFoilVariantLabel` / `getFoilSlotClass`

**Files:**
- Modify: `index.html` lines ~3163–3185

- [ ] **Step 1.1: Add `isSurgeFoil` helper and update the two label/class functions**

Find the line `function getFoilVariantLabel(card) {` (around line 3164). Insert the helper immediately before it, then update both functions:

```js
  function isSurgeFoil(card) {
    return (card.frame_effects || []).includes('surge')
        || (card.finishes || []).includes('surge_foil');
  }

  function getFoilVariantLabel(card) {
    const fe = card.frame_effects || [];
    const pt = card.promo_types  || [];
    if (isSurgeFoil(card))           return 'SURGE FOIL';
    if (pt.includes('neon_ink'))     return 'NEON INK FOIL';
    if (fe.includes('serialized'))   return 'SERIALIZED';
    if (fe.includes('showcase'))     return 'SHOWCASE';
    if (fe.includes('extendedart'))  return 'EXTENDED ART';
    return 'FOIL';
  }

  function getFoilSlotClass(card) {
    const fe = card.frame_effects || [];
    const pt = card.promo_types  || [];
    if (isSurgeFoil(card))                                              return 'foil-variant-surge';
    if (pt.includes('neon_ink') || (card.name || '').toLowerCase().includes('chocobo')) return 'foil-variant-neon';
    if (fe.includes('serialized'))                                      return 'foil-variant-serialized';
    if ((card.finishes || []).every(f => f !== 'nonfoil'))              return 'foil-variant-collector';
    return '';
  }
```

Replace the **entire existing** `getFoilVariantLabel` and `getFoilSlotClass` functions (the old versions starting at ~line 3164 and ~3177 respectively) with the above. Keep the new `isSurgeFoil` helper inserted just before `getFoilVariantLabel`.

- [ ] **Step 1.2: Verify in browser**

Open `index.html`. Open DevTools console and run:
```js
isSurgeFoil({frame_effects:['surge']})       // true
isSurgeFoil({finishes:['surge_foil']})       // true
isSurgeFoil({frame_effects:[], finishes:[]}) // false
getFoilVariantLabel({frame_effects:['showcase']}) // 'SHOWCASE'
```
Expected: all return the values shown above. No console errors.

- [ ] **Step 1.3: Commit**

```bash
git add index.html
git commit -m "fix: add isSurgeFoil helper, fix getFoilVariantLabel/getFoilSlotClass for surge detection"
```

---

## Task 2: Fix Surge filter in Foil Collection tab + fix Variant tab Surge filter

**Files:**
- Modify: `index.html` — `buildGrid()` inside `renderFoilBinder()` (~line 5333) and `buildVariantGrid()` inside `renderVariantBinder()` (~line 5609)

- [ ] **Step 2.1: Fix Foil tab Surge filter**

Find (inside `buildGrid()` in `renderFoilBinder()`):
```js
      } else if (activeFilter === 'Surge') {
        cards = variantCards.filter(c => (c.frame_effects || []).includes('surge'));
```
Replace with:
```js
      } else if (activeFilter === 'Surge') {
        cards = variantCards.filter(c => isSurgeFoil(c));
```

- [ ] **Step 2.2: Fix Variant tab Surge filter**

Find (inside `buildVariantGrid()` in `renderVariantBinder()`):
```js
    } else if (activeFilter === 'Surge') {
      cards = variantCards.filter(c => (c.frame_effects || []).includes('surge'));
```
Replace with:
```js
    } else if (activeFilter === 'Surge Foil') {
      cards = variantCards.filter(c => isSurgeFoil(c));
```

- [ ] **Step 2.3: Commit**

```bash
git add index.html
git commit -m "fix: use isSurgeFoil() in all Surge filter sites"
```

---

## Task 3: Revamp Variant tab filter categories

**Files:**
- Modify: `index.html` — `renderVariantBinder()` filter state, filter bar HTML, and `buildVariantGrid()` (~lines 5534, 5585, 5602–5634)

- [ ] **Step 3.1: Update filter types array and buildVariantGrid switch**

Find in `renderVariantBinder()`:
```js
  const filterTypes = ['All', 'Owned', 'Traditional', 'Surge', 'Neon Ink', 'Chocobo Track'];
```
Replace with:
```js
  const filterTypes = ['All', 'Foil Owned', 'Showcase', 'Extended Art', 'Surge Foil', 'Neon Ink', 'Chocobo Track', 'Serialized'];
```

- [ ] **Step 3.2: Update `buildVariantGrid()` filter logic**

Find the entire if/else block inside `buildVariantGrid()` that switches on `activeFilter` (currently starting around line 5606). Replace it with:

```js
    if (activeFilter === 'Foil Owned') {
      cards = variantCards.filter(c => hasFoil(c.collector_number));
    } else if (activeFilter === 'Showcase') {
      cards = variantCards.filter(c => (c.frame_effects || []).includes('showcase'));
    } else if (activeFilter === 'Extended Art') {
      cards = variantCards.filter(c => (c.frame_effects || []).includes('extendedart'));
    } else if (activeFilter === 'Surge Foil') {
      cards = variantCards.filter(c => isSurgeFoil(c));
    } else if (activeFilter === 'Neon Ink') {
      cards = variantCards.filter(c => (c.promo_types || []).includes('neon_ink'));
    } else if (activeFilter === 'Chocobo Track') {
      cards = variantCards.filter(c => (c.name || '').toLowerCase().includes('chocobo'));
    } else if (activeFilter === 'Serialized') {
      cards = variantCards.filter(c => (c.frame_effects || []).includes('serialized'));
    } else {
      cards = variantCards.slice();
    }
```

- [ ] **Step 3.3: Reset default filter state from 'Owned' to 'All'**

Find:
```js
  let activeFilter = el._variantFilter || 'All';
```
This is already `'All'` — no change needed. But if `el._variantFilter` was previously set to `'Owned'` or `'Traditional'` it will silently fall through to the `else` (All) branch — that is safe.

- [ ] **Step 3.4: Verify in browser**

Open the Variant Collection tab. Check that:
- All 8 filter buttons render
- "Foil Owned" shows only foil-owned cards
- "Showcase", "Extended Art", "Surge Foil", "Neon Ink", "Chocobo Track", "Serialized" each filter correctly (or show "No cards match" if none exist in the loaded data)
- "Surge Foil" no longer returns 0 when surge foil cards are loaded

- [ ] **Step 3.5: Commit**

```bash
git add index.html
git commit -m "feat: revamp variant tab filter categories with correct Scryfall labels"
```

---

## Task 4: Improve variant card label badge

**Files:**
- Modify: `index.html` — slot HTML inside `buildVariantGrid()` (~line 5656)

- [ ] **Step 4.1: Improve the label badge style**

Find inside `buildVariantGrid()` the slot template. The current badge line reads:
```js
        <span style="position:absolute;bottom:2px;left:2px;right:2px;font-size:0.5rem;color:rgba(255,255,255,0.7);text-align:center;pointer-events:none;line-height:1.2;background:rgba(0,0,0,0.45);border-radius:0 0 4px 4px;padding:1px 2px">${label}</span>
```
Replace with:
```js
        ${label ? `<span style="position:absolute;bottom:3px;left:50%;transform:translateX(-50%);font-size:0.58rem;font-weight:700;letter-spacing:0.03em;color:#fff;background:rgba(0,0,0,0.7);border-radius:4px;padding:2px 5px;pointer-events:none;white-space:nowrap;max-width:90%;overflow:hidden;text-overflow:ellipsis">${label}</span>` : ''}
```

- [ ] **Step 4.2: Verify in browser**

Open Variant Collection tab. Card slots should show a small pill badge at the bottom showing "SURGE FOIL", "SHOWCASE", "NEON INK FOIL", etc. Badge should be readable, centered, and not clip the card art excessively.

- [ ] **Step 4.3: Commit**

```bash
git add index.html
git commit -m "fix: improve variant card label badge readability"
```

---

## Task 5: Fix Variant tab slot click → open modal instead of toggle ownership

**Files:**
- Modify: `index.html` — variant slot click handler inside `renderVariantBinder()` (~line 5703)

- [ ] **Step 5.1: Replace slot-click ownership toggle with modal open**

Find the slot click block in the variant event delegation:
```js
    // Slot click — toggle ownership
    const slot = e.target.closest('.card-slot[data-cn]');
    if (slot) {
      const cn = slot.dataset.cn;
      if (ownedSet.has(cn)) removeCard(cn);
      else addCard(cn);
      return;
    }
```
Replace with:
```js
    // Slot click — open inspection modal
    const slot = e.target.closest('.card-slot[data-cn]');
    if (slot) {
      const cn = slot.dataset.cn;
      const card = variantCards.find(c => c.collector_number === cn);
      if (card) openModal(card);
      return;
    }
```

- [ ] **Step 5.2: Verify in browser**

Open Variant Collection tab, click any card slot. The card detail modal should open showing the card image, name, prices, and "Add Foil ✦" toggle. Clicking "Add Foil ✦" inside the modal should mark it foil-owned. The slot shimmer should appear after closing the modal and the tab re-renders.

- [ ] **Step 5.3: Commit**

```bash
git add index.html
git commit -m "feat: variant tab slot click opens inspection modal"
```

---

## Task 6: Replace Foil tab pagination with binder-style flanking arrows

**Files:**
- Modify: `index.html` — `renderFoilBinder()` grid layout and pagination HTML (~lines 5376–5425)

- [ ] **Step 6.1: Update `buildGrid()` to return only the grid, no nav**

Inside `renderFoilBinder()`, find `buildGrid()`. It currently appends a `navHTML` string with `← Prev` / `Next →` buttons at the bottom of its return. Remove the `navHTML` construction and the concatenation ��� the grid wrapper should only return the `<div class="page-grid foil-card-grid">` part:

Find:
```js
      const navHTML = `
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:14px">
      <button class="btn btn-secondary foil-prev" style="padding:6px 16px" ${foilPage === 0 ? 'disabled' : ''}>&larr; Prev</button>
      <span style="font-size:0.85rem;color:var(--text-muted)">Page ${foilPage + 1} of ${totalPages}</span>
      <button class="btn btn-secondary foil-next" style="padding:6px 16px" ${foilPage >= totalPages - 1 ? 'disabled' : ''}>Next &rarr;</button>
    </div>`;

    return `<div class="page-grid foil-card-grid" style="grid-template-columns:repeat(${binderConfig.gridCols},1fr);gap:6px">${slotsHTML}</div>${navHTML}`;
```
Replace with:
```js
    return `<div class="page-grid foil-card-grid" style="grid-template-columns:repeat(${binderConfig.gridCols},1fr);gap:6px">${slotsHTML}</div>`;
```

- [ ] **Step 6.2: Update `el.innerHTML` to wrap grid in binder-layout with flanking arrows**

Find the `el.innerHTML = ...` assignment in `renderFoilBinder()` (around line 5419):
```js
    el.innerHTML = `
      <div style="padding:16px 12px">
        ${statsHTML}
        ${filterBarHTML}
        <div id="foil-grid-container">${buildGrid()}</div>
        ${topValueHTML}
      </div>`;
```
Replace with:
```js
    const totalFoilPages = (() => {
      const spp = binderConfig.slotsPerPage;
      let cards;
      if (activeFilter === 'Owned') {
        cards = [...allCards, ...variantCards].filter(c => hasFoil(c.collector_number));
      } else if (activeFilter === 'Surge') {
        cards = variantCards.filter(c => isSurgeFoil(c));
      } else if (activeFilter === 'Neon Ink') {
        cards = variantCards.filter(c => (c.promo_types || []).includes('neon_ink'));
      } else if (activeFilter === 'Chocobo Track') {
        cards = variantCards.filter(c => (c.name || '').toLowerCase().includes('chocobo'));
      } else if (activeFilter === 'Traditional') {
        cards = allCards.slice();
      } else {
        cards = [...allCards];
      }
      if (activeRarity) cards = cards.filter(c => c.rarity === ({C:'common',U:'uncommon',R:'rare',M:'mythic'})[activeRarity]);
      if (searchQuery.trim()) cards = cards.filter(c => c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
      return Math.max(1, Math.ceil(cards.length / spp));
    })();

    el.innerHTML = `
      <div style="padding:16px 12px">
        ${statsHTML}
        ${filterBarHTML}
        <div class="binder-layout">
          <button class="binder-nav" id="foil-prev-page" ${foilPage === 0 ? 'disabled' : ''}>&lsaquo;</button>
          <div style="flex:1;min-width:0">
            <div id="foil-grid-container">${buildGrid()}</div>
            <div style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:6px">Page ${foilPage + 1} of ${totalFoilPages}</div>
          </div>
          <button class="binder-nav" id="foil-next-page" ${foilPage >= totalFoilPages - 1 ? 'disabled' : ''}>&rsaquo;</button>
        </div>
        ${topValueHTML}
      </div>`;
```

- [ ] **Step 6.3: Update the foil pagination event listeners**

Find the event listener block that wires `foil-prev` / `foil-next` class buttons (around line 5511):
```js
    if (el._onFoilPaginate) el.removeEventListener('click', el._onFoilPaginate);
    el._onFoilPaginate = function(e) {
      if (e.target.classList.contains('foil-prev')) {
        foilPage = Math.max(0, foilPage - 1);
        persist();
        reRenderGrid();
        return;
      }
      if (e.target.classList.contains('foil-next')) {
        foilPage++;
        persist();
        reRenderGrid();
        return;
      }
    };
    el.addEventListener('click', el._onFoilPaginate);
```
Replace with:
```js
    if (el._onFoilPaginate) el.removeEventListener('click', el._onFoilPaginate);
    el._onFoilPaginate = function(e) {
      if (e.target.closest('#foil-prev-page')) {
        foilPage = Math.max(0, foilPage - 1);
        persist();
        renderFoilBinder();
        return;
      }
      if (e.target.closest('#foil-next-page')) {
        foilPage++;
        persist();
        renderFoilBinder();
        return;
      }
    };
    el.addEventListener('click', el._onFoilPaginate);
```

- [ ] **Step 6.4: Verify in browser**

Open Foil Collection tab. Large circular ‹ › arrows should flank the card grid. Arrows disable at boundaries. Page counter shows below the grid.

- [ ] **Step 6.5: Commit**

```bash
git add index.html
git commit -m "feat: foil tab — binder-style flanking nav arrows"
```

---

## Task 7: Replace Variant tab pagination with binder-style flanking arrows

**Files:**
- Modify: `index.html` — `buildVariantGrid()` nav HTML and `renderVariantBinder()` layout (~lines 5660–5671)

- [ ] **Step 7.1: Remove nav from `buildVariantGrid()` return**

Find inside `buildVariantGrid()`:
```js
    const navHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:14px">
        <button class="btn btn-secondary variant-prev" style="padding:6px 16px" ${variantPage === 0 ? 'disabled' : ''}>&larr; Prev</button>
        <span style="font-size:0.85rem;color:var(--text-muted)">Page ${variantPage + 1} of ${totalPages}</span>
        <button class="btn btn-secondary variant-next" style="padding:6px 16px" ${variantPage >= totalPages - 1 ? 'disabled' : ''}>Next &rarr;</button>
      </div>`;

    return `<div class="page-grid foil-card-grid" style="grid-template-columns:repeat(${binderConfig.gridCols},1fr);gap:6px">${slotsHTML}</div>${navHTML}`;
```
Replace with:
```js
    return `<div class="page-grid foil-card-grid" style="grid-template-columns:repeat(${binderConfig.gridCols},1fr);gap:6px">${slotsHTML}</div>`;
```

Also update `buildVariantGrid()` to return `totalPages` so the outer layout can use it. Change the function signature approach: add a variable `lastVariantTotalPages` in closure scope before `buildVariantGrid` is defined:

Before `function buildVariantGrid()` add:
```js
  let lastVariantTotalPages = 1;
```

Inside `buildVariantGrid()`, after `const totalPages = ...` line, add:
```js
    lastVariantTotalPages = totalPages;
```

- [ ] **Step 7.2: Update `el.innerHTML` in `renderVariantBinder()` to use binder-layout**

Find:
```js
  el.innerHTML = statsHTML + filterBarHTML + `<div id="variant-grid-wrap">${buildVariantGrid()}</div>`;
```
Replace with:
```js
  const gridHTML = buildVariantGrid();
  el.innerHTML = statsHTML + filterBarHTML + `
    <div class="binder-layout">
      <button class="binder-nav" id="variant-prev-page" ${variantPage === 0 ? 'disabled' : ''}>&lsaquo;</button>
      <div style="flex:1;min-width:0">
        <div id="variant-grid-wrap">${gridHTML}</div>
        <div style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:6px">Page ${variantPage + 1} of ${lastVariantTotalPages}</div>
      </div>
      <button class="binder-nav" id="variant-next-page" ${variantPage >= lastVariantTotalPages - 1 ? 'disabled' : ''}>&rsaquo;</button>
    </div>`;
```

- [ ] **Step 7.3: Update variant pagination event listeners**

Find the variant event delegation handler block. The `variant-prev` / `variant-next` class-based checks need to become ID-based, and re-render should call `renderVariantBinder()` (full re-render) to update arrow disabled states:

Find:
```js
    if (e.target.classList.contains('variant-prev')) {
      variantPage = Math.max(0, variantPage - 1); persist();
      renderVariantBinder(); return;
    }
    if (e.target.classList.contains('variant-next')) {
      variantPage++; persist();
```
Replace with:
```js
    if (e.target.closest('#variant-prev-page')) {
      variantPage = Math.max(0, variantPage - 1); persist();
      renderVariantBinder(); return;
    }
    if (e.target.closest('#variant-next-page')) {
      variantPage++; persist();
```

- [ ] **Step 7.4: Verify in browser**

Open Variant Collection tab. Large circular ‹ › arrows should flank the card grid. Arrows disable at boundaries. Page counter visible below grid.

- [ ] **Step 7.5: Commit**

```bash
git add index.html
git commit -m "feat: variant tab — binder-style flanking nav arrows"
```

---

## Task 8: Fix "Most Valuable Foil (Owned)" hover animation

**Files:**
- Modify: `index.html` — `topFoilItem()` function (~line 5392)

- [ ] **Step 8.1: Add `missing-inspect` class and inspect icon to owned items**

Find:
```js
    function topFoilItem(c, i, missing) {
      return `<div class="top-card-item${missing ? ' missing-inspect' : ''}" data-cn="${c.collector_number}" style="cursor:pointer">
        <span class="rank">${i + 1}</span>
        <img src="${c.image_small}" alt="${c.name}">
        <span class="tc-name">${c.name}</span>
        <span class="tc-price" style="color:${missing ? 'var(--accent)' : 'var(--owned-border)'};white-space:nowrap">$${c.price_usd_foil.toFixed(2)}</span>
        ${missing ? `<span class="inspect-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>` : ''}
      </div>`;
    }
```
Replace with:
```js
    function topFoilItem(c, i, missing) {
      return `<div class="top-card-item missing-inspect" data-cn="${c.collector_number}" style="cursor:pointer">
        <span class="rank">${i + 1}</span>
        <img src="${c.image_small}" alt="${c.name}">
        <span class="tc-name">${c.name}</span>
        <span class="tc-price" style="color:${missing ? 'var(--accent)' : 'var(--owned-border)'};white-space:nowrap">$${c.price_usd_foil.toFixed(2)}</span>
        <span class="inspect-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
      </div>`;
    }
```

- [ ] **Step 8.2: Remove the now-redundant separate owned-click listener**

Find in `renderFoilBinder()` (around line 5458):
```js
    // ── Top owned foil clicks ──
    el.querySelectorAll('.top-card-item:not(.missing-inspect)').forEach(item => {
      item.addEventListener('click', () => {
        const cn = item.dataset.cn;
        const card = allCards.find(c => c.collector_number === cn);
        if (card) openModal(card);
      });
    });
```
Delete this block entirely — owned items now carry `missing-inspect` class so the existing `.missing-inspect` delegation already handles them.

- [ ] **Step 8.3: Verify in browser**

Open Foil Collection tab. Scroll to "Most Valuable Foil (Owned)" section. Hover over owned foil items — they should show the same hover background highlight as the "Missing" items. Clicking an owned foil item should open the card modal.

- [ ] **Step 8.4: Commit**

```bash
git add index.html
git commit -m "fix: foil tab — owned foils now have hover animation and inspect icon"
```

---

## Task 9: Portfolio tab — label fix + Variant Portfolio + Foil Collection dash-cards

**Files:**
- Modify: `index.html` — `renderPortfolio()` (~lines 4174, 4235–4248)

- [ ] **Step 9.1: Rename "Full Set (USD)" label**

Find in `renderPortfolio()`:
```js
              <div class="value-label">Full Set (USD)</div>
              <div class="value-amount usd" style="font-size:1rem">$${fullSetValueUSD.toFixed(2)}</div>
              <div class="value-sub">${total} cards total</div>
```
Replace with:
```js
              <div class="value-label">Main Set (USD)</div>
              <div class="value-amount usd" style="font-size:1rem">$${fullSetValueUSD.toFixed(2)}</div>
              <div class="value-sub">${total} main set cards</div>
```

- [ ] **Step 9.2: Add computed variables for the new cards**

Find near the top of `renderPortfolio()` (after the existing foil calculations ~line 4116), add:
```js
    // Variant stats for portfolio cards
    const variantOwned = variantCards.filter(c => ownedSet.has(c.collector_number));
    const variantOwnedCount = variantOwned.length;
    const variantTotalCount = variantCards.length;
    const variantOwnedPct = variantTotalCount > 0 ? (variantOwnedCount / variantTotalCount * 100) : 0;
    const variantOwnedValueUSD = variantOwned.reduce((s, c) => s + Math.max(c.price_usd || 0, c.price_usd_foil || 0), 0);
    const topOwnedVariants = [...variantOwned].sort((a, b) => Math.max(b.price_usd||0,b.price_usd_foil||0) - Math.max(a.price_usd||0,a.price_usd_foil||0)).slice(0, 3);

    // Foil stats for portfolio card
    const foilCapableCards = allCards.filter(c => (c.finishes || []).includes('foil'));
    const foilCapableCount = foilCapableCards.length;
    const foilOwnedPortfolioCount = foilCapableCards.filter(c => hasFoil(c.collector_number)).length;
    const foilOwnedPct = foilCapableCount > 0 ? (foilOwnedPortfolioCount / foilCapableCount * 100) : 0;
    const topOwnedFoils = [...allCards].filter(c => hasFoil(c.collector_number) && c.price_usd_foil > 0)
      .sort((a, b) => b.price_usd_foil - a.price_usd_foil).slice(0, 3);
```

- [ ] **Step 9.3: Add the two new dash-cards after "Most Valuable (Missing)"**

Find the closing of the existing last dash-card (the "Most Valuable (Missing)" card):
```js
        </div>

      </div>
    `;
  }
```
Replace with:
```js
        </div>

        ${variantTotalCount > 0 ? `
        <div class="dash-card">
          <h3>◈ Variant Portfolio</h3>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <div>
              <div class="dash-big-num" style="font-size:1.2rem">${variantOwnedCount} / ${variantTotalCount}</div>
              <div class="dash-sub">${variantOwnedPct.toFixed(1)}% owned</div>
            </div>
            <div style="flex:1">
              <div class="rarity-track"><div class="rarity-fill rare" style="width:${variantOwnedPct.toFixed(1)}%"></div></div>
              <div class="dash-sub" style="margin-top:4px">Value: <strong>$${variantOwnedValueUSD.toFixed(2)}</strong> / RM ${(variantOwnedValueUSD * USD_TO_MYR).toFixed(2)}</div>
            </div>
          </div>
          ${topOwnedVariants.length > 0 ? `
            <div class="dash-sub" style="margin-bottom:4px;font-size:0.75rem;color:var(--text-muted)">Top owned variants:</div>
            <div class="top-cards">
              ${topOwnedVariants.map((c, i) => `<div class="top-card-item missing-inspect" data-cn="${c.collector_number}" style="cursor:pointer">
                <span class="rank">${i + 1}</span>
                <img src="${c.image_small}" alt="${c.name}">
                <span class="tc-name">${c.name}</span>
                <span class="tc-price">$${Math.max(c.price_usd||0,c.price_usd_foil||0).toFixed(2)}</span>
                <span class="inspect-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              </div>`).join('')}
            </div>
          ` : `<div class="dash-sub" style="padding:8px 0">No variants owned yet</div>`}
        </div>
        ` : ''}

        ${binderConfig.scope?.foilBinder ? `
        <div class="dash-card">
          <h3>✦ Foil Collection</h3>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <div>
              <div class="dash-big-num" style="font-size:1.2rem">${foilOwnedPortfolioCount} / ${foilCapableCount}</div>
              <div class="dash-sub">${foilOwnedPct.toFixed(1)}% complete</div>
            </div>
            <div style="flex:1">
              <div class="rarity-track"><div class="rarity-fill" style="width:${foilOwnedPct.toFixed(1)}%;background:#ffd93d"></div></div>
              <div class="dash-sub" style="margin-top:4px">Value: <strong style="color:#ffd93d">$${foilCollectionValueUSD.toFixed(2)}</strong> / RM ${(foilCollectionValueUSD * USD_TO_MYR).toFixed(2)}</div>
            </div>
          </div>
          ${topOwnedFoils.length > 0 ? `
            <div class="dash-sub" style="margin-bottom:4px;font-size:0.75rem;color:var(--text-muted)">Top owned foils:</div>
            <div class="top-cards">
              ${topOwnedFoils.map((c, i) => `<div class="top-card-item missing-inspect" data-cn="${c.collector_number}" style="cursor:pointer">
                <span class="rank">${i + 1}</span>
                <img src="${c.image_small}" alt="${c.name}">
                <span class="tc-name">${c.name}</span>
                <span class="tc-price" style="color:#ffd93d">$${c.price_usd_foil.toFixed(2)}</span>
                <span class="inspect-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              </div>`).join('')}
            </div>
          ` : `<div class="dash-sub" style="padding:8px 0">No foils collected yet</div>`}
        </div>
        ` : ''}

      </div>
    `;
  }
```

- [ ] **Step 9.4: Verify in browser**

Open Portfolio tab. Check:
- "Full Set (USD)" → now reads "Main Set (USD)"  
- "◈ Variant Portfolio" card appears (only if variant cards are loaded)
- "✦ Foil Collection" card appears (only if foil scope is enabled in settings)
- Each shows correct counts, progress bar, value, and top-3 thumbnails
- Clicking a thumbnail opens the card modal

- [ ] **Step 9.5: Commit**

```bash
git add index.html
git commit -m "feat: portfolio tab — rename main set label, add variant portfolio and foil collection cards"
```

---

## Task 10: Tab navigation revamp — CSS

**Files:**
- Modify: `index.html` CSS block (~lines 244–278 and ~1232–1259)

- [ ] **Step 10.1: Add bottom-nav CSS after existing `.tabs` block**

Find the end of the `.tab-btn.active` rule block (around line 272). After the `@keyframes tab-enter` block (after line 278), insert:

```css
  /* ── Bottom Nav (mobile) ── */
  .bottom-nav {
    display: none; /* shown only on mobile via media query */
  }
  .bnav-btn {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: none; border: none; padding: 8px 4px;
    color: var(--text-muted); cursor: pointer;
    transition: color 0.15s, background 0.15s;
    border-radius: 8px; min-height: 44px; min-width: 44px;
  }
  .bnav-btn svg { width: 20px; height: 20px; flex-shrink: 0; }
  .bnav-btn:hover { color: var(--text); }
  .bnav-btn.active { color: var(--accent); }
  .bnav-btn.active svg { filter: drop-shadow(0 0 4px var(--accent)); }
```

- [ ] **Step 10.2: Update mobile media query**

Find the `@media (max-width: 700px)` block (~line 1232). Add inside it:

```css
    /* Tab nav — hide top pills, show bottom nav */
    .tabs { display: none; }
    .bottom-nav {
      display: flex;
      position: fixed; bottom: 0; left: 0; right: 0;
      background: var(--surface);
      border-top: 1px solid var(--surface2);
      padding: max(8px, env(safe-area-inset-bottom, 8px)) 8px 8px;
      z-index: 100;
    }
    /* Increase app bottom padding to clear the fixed nav */
    #app {
      padding-bottom: max(80px, calc(70px + env(safe-area-inset-bottom, 0px)));
    }
```

- [ ] **Step 10.3: Commit CSS only**

```bash
git add index.html
git commit -m "feat: tab nav CSS — bottom-nav for mobile, pill tray for desktop"
```

---

## Task 11: Tab navigation revamp — HTML

**Files:**
- Modify: `index.html` HTML block (~lines 1983–2013)

- [ ] **Step 11.1: Shorten desktop tab labels**

Find the tab bar HTML block. Replace the two long labels:

```html
        Foil Collection
```
→
```html
        Foil ✦
```

```html
        Variant Collection
```
→
```html
        Variants ◈
```

- [ ] **Step 11.2: Add `<nav class="bottom-nav">` after the closing `</div>` of the `.tabs` div**

Find:
```html
    </div>

    <div id="tab-dashboard" class="tab-content active">
```
Insert between them:
```html
    <nav class="bottom-nav" id="bottom-nav">
      <button class="bnav-btn active" data-tab="dashboard">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      </button>
      <button class="bnav-btn" data-tab="portfolio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </button>
      <button class="bnav-btn" data-tab="timeline">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>
      <button class="bnav-btn" data-tab="binder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </button>
      <button class="bnav-btn" data-tab="foil" id="bnav-btn-foil" style="display:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
      <button class="bnav-btn" data-tab="variants" id="bnav-btn-variants" style="display:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
      </button>
      <button class="bnav-btn" data-tab="settings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
    </nav>

```

- [ ] **Step 11.3: Commit**

```bash
git add index.html
git commit -m "feat: tab nav HTML — bottom-nav bar with icon-only buttons, shorten desktop labels"
```

---

## Task 12: Tab navigation revamp — JS wiring

**Files:**
- Modify: `index.html` JS — `applyConfigToTabs()` (~line 2495) and tab switch handler (~line 5047)

- [ ] **Step 12.1: Update `applyConfigToTabs()` to also toggle bottom-nav buttons**

Find `applyConfigToTabs()`:
```js
  function applyConfigToTabs() {
    var foilBtn = document.getElementById('tab-btn-foil');
    if (foilBtn) foilBtn.style.display = binderConfig.scope.foilBinder ? '' : 'none';
    var variantBtn = document.getElementById('tab-btn-variants');
    if (variantBtn) variantBtn.style.display = binderConfig.scope.collectorVariants ? '' : 'none';
```
Replace those first 4 lines with:
```js
  function applyConfigToTabs() {
    var foilBtn = document.getElementById('tab-btn-foil');
    if (foilBtn) foilBtn.style.display = binderConfig.scope.foilBinder ? '' : 'none';
    var foilBnavBtn = document.getElementById('bnav-btn-foil');
    if (foilBnavBtn) foilBnavBtn.style.display = binderConfig.scope.foilBinder ? '' : 'none';
    var variantBtn = document.getElementById('tab-btn-variants');
    if (variantBtn) variantBtn.style.display = binderConfig.scope.collectorVariants ? '' : 'none';
    var variantBnavBtn = document.getElementById('bnav-btn-variants');
    if (variantBnavBtn) variantBnavBtn.style.display = binderConfig.scope.collectorVariants ? '' : 'none';
```

- [ ] **Step 12.2: Add `.bnav-btn` event handler after the existing `.tab-btn` handler**

Find after the `.tab-btn` handler block (after line ~5061):
```js
  });
```
After the closing of the `.tab-btn` forEach, add:
```js
  // ── Bottom Nav (mobile) ──
  function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll(`.tab-btn[data-tab="${tabName}"]`).forEach(b => b.classList.add('active'));
    document.querySelectorAll(`.bnav-btn[data-tab="${tabName}"]`).forEach(b => b.classList.add('active'));
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
    if (tabName === 'binder') renderBinder();
    if (tabName === 'dashboard') renderDashboard();
    if (tabName === 'portfolio') renderPortfolio();
    if (tabName === 'timeline') renderTimeline();
    if (tabName === 'settings') renderSettings();
    if (tabName === 'foil') renderFoilBinder();
    if (tabName === 'variants') renderVariantBinder();
  }

  document.querySelectorAll('.bnav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
```

- [ ] **Step 12.3: Update the existing `.tab-btn` handler to use `switchTab`**

Find the existing `.tab-btn` forEach handler:
```js
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      if (btn.dataset.tab === 'binder') renderBinder();
      if (btn.dataset.tab === 'dashboard') renderDashboard();
      if (btn.dataset.tab === 'portfolio') renderPortfolio();
      if (btn.dataset.tab === 'timeline') renderTimeline();
      if (btn.dataset.tab === 'settings') renderSettings();
      if (btn.dataset.tab === 'foil') renderFoilBinder();
      if (btn.dataset.tab === 'variants') renderVariantBinder();
    });
  });
```
Replace with:
```js
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
```

- [ ] **Step 12.4: Verify in browser**

**Desktop:** Tab pill tray works as before. Labels read "Foil ✦" and "Variants ◈".
**Mobile (resize browser to <700px or use DevTools device mode):** Bottom nav appears, tab pills hidden. Tapping each icon switches tabs and the active icon gets accent color. Foil/Variant buttons show/hide based on scope settings.

- [ ] **Step 12.5: Commit**

```bash
git add index.html
git commit -m "feat: tab nav JS — switchTab() shared handler, bnav-btn wired, applyConfigToTabs updated"
```

---

## Self-Review

**Spec coverage:**
- ✅ Tab nav mobile bottom bar + desktop pills (Tasks 10–12)
- ✅ Foil tab flanking arrows (Task 6)
- ✅ Variant tab flanking arrows (Task 7)
- ✅ Foil owned hover animation fix (Task 8)
- ✅ Surge Foil filter fix (Tasks 1–2)
- ✅ Variant slot click → modal (Task 5)
- ✅ Variant filter category revamp (Task 3)
- ✅ Variant label badge improvement (Task 4)
- ✅ Portfolio "Main Set" label (Task 9)
- ✅ Portfolio Variant Portfolio card (Task 9)
- ✅ Portfolio Foil Collection card (Task 9)

**Placeholder scan:** No TBDs. All steps contain exact code.

**Type consistency:**
- `isSurgeFoil(card)` defined in Task 1, used in Tasks 2–3 ✅
- `lastVariantTotalPages` introduced and used within Task 7 ✅
- `switchTab(tabName)` defined and used within Task 12 ✅
- `foilCollectionValueUSD` already defined in `renderPortfolio()` at line ~4116 — Task 9 references it ✅
- `USD_TO_MYR` is a global, referenced in Task 9 ✅

**Task ordering note:** Task 1 must run before Tasks 2–3 (defines `isSurgeFoil`). Tasks 10–12 are independent and can run in any order relative to Tasks 1–9. All other tasks are independent of each other.
