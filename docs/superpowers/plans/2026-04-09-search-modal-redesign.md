# Search Modal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the full-screen Command Deck with a centered search modal focused on card lookup with quick-action chips.

**Architecture:** Single-file change in `index.html`. Replace the Command Deck CSS (`.cmd-*` classes), HTML structure, and JS logic with a new search modal (`.search-*` classes). The card search logic and keyboard nav are preserved; the command palette action list and full-screen overlay are removed.

**Tech Stack:** Plain HTML/CSS/JS, no build step.

**Spec:** `docs/superpowers/specs/2026-04-09-search-modal-redesign.md`

---

### Task 1: Replace Command Deck CSS with Search Modal CSS

**Files:**
- Modify: `index.html:211-382` (Command Trigger Pill + Command Palette CSS)
- Modify: `index.html:2194-2209` (mobile overrides for cmd-*)

- [ ] **Step 1: Replace the desktop Command Deck CSS block**

Find the CSS block from `/* ── Command Trigger Pill ── */` (line 211) through the `.cmd-sheet-handle` rule (line 382) and replace it entirely with:

```css
  /* ── Search Trigger Pill ── */
  .search-trigger {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px;
    margin: 12px clamp(12px, 2vw, 16px);
    border-radius: 8px;
    border: 1px solid var(--ff-border);
    background: var(--slot-bg);
    color: var(--text-muted);
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.85rem; font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    position: relative; z-index: 1;
  }
  .search-trigger:hover {
    border-color: var(--accent);
    color: var(--text);
    box-shadow: 0 0 12px rgba(91,127,199,0.15);
  }
  .search-trigger svg { width: 14px; height: 14px; flex-shrink: 0; }
  .search-trigger kbd {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.65rem; font-weight: 600;
    padding: 2px 5px;
    border-radius: 3px;
    background: var(--card-bg);
    border: 1px solid var(--ff-border);
    color: var(--text-muted);
  }

  /* ── Search Modal ── */
  .search-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 200;
    align-items: flex-start;
    justify-content: center;
    padding-top: 12vh;
  }
  .search-overlay.open {
    display: flex;
  }
  .search-modal {
    width: 100%;
    max-width: 520px;
    max-height: 70vh;
    border-radius: 12px;
    background: var(--card-bg);
    border: 1px solid var(--ff-border);
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    display: flex; flex-direction: column;
    overflow: hidden;
    animation: searchModalIn 0.15s ease;
  }
  @keyframes searchModalIn {
    from { opacity: 0; transform: scale(0.97); }
    to { opacity: 1; transform: scale(1); }
  }

  .search-input-row {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--ff-border);
  }
  .search-input-row svg { width: 18px; height: 18px; color: var(--text-muted); flex-shrink: 0; }
  .search-input-row input {
    flex: 1;
    background: none; border: none; outline: none;
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.05rem; color: var(--text);
    letter-spacing: 0.02em;
  }
  .search-input-row input::placeholder { color: var(--text-muted); }
  .search-close {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1px solid var(--ff-border);
    background: var(--slot-bg);
    color: var(--text-muted);
    font-size: 1rem;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .search-close:hover {
    color: var(--text);
    border-color: var(--accent);
  }

  .search-chips {
    display: flex; gap: 8px;
    padding: 10px 18px;
    border-bottom: 1px solid var(--ff-border);
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .search-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px;
    border-radius: 14px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.75rem; font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid;
    background: none;
    letter-spacing: 0.02em;
  }
  .search-chip:hover { filter: brightness(1.2); }
  .search-chip-pack {
    color: var(--gold, #d4a850);
    border-color: rgba(212,168,80,0.3);
    background: rgba(212,168,80,0.08);
  }
  .search-chip-theme {
    color: var(--accent);
    border-color: rgba(91,127,199,0.25);
    background: rgba(91,127,199,0.08);
  }
  .search-chip-sync {
    color: #4aad5e;
    border-color: rgba(74,173,94,0.25);
    background: rgba(74,173,94,0.08);
  }

  .search-results {
    overflow-y: auto;
    flex: 1;
    padding: 4px 0;
  }
  .search-results .ac-card-row {
    padding: 8px 18px;
  }
  .search-empty {
    padding: 40px 18px;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
  }
```

- [ ] **Step 2: Replace the mobile overrides**

Find the mobile override block (inside the `@media (max-width: 600px)` section, around lines 2194-2209):

```css
    .cmd-trigger { display: none; } /* desktop only — mobile uses FAB */
```
and
```css
    /* ── Command Palette — mobile full-screen ── */
    .cmd-palette { max-width: 100%; }
    .cmd-action {
      padding: 14px 16px;
    }
    .cmd-action-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
    }
    .cmd-action-icon svg { width: 17px; height: 17px; }
    .cmd-footer { display: none; }
    .cmd-sheet-handle { display: none; }
```

Replace all of that with:

```css
    .search-trigger { display: none; } /* desktop only — mobile uses FAB */
    .search-modal { max-width: calc(100% - 32px); }
```

- [ ] **Step 3: Verify no remaining `.cmd-` CSS references**

Search the file for any remaining `.cmd-` CSS selectors. There should be none. If the theme tour references `#cmd-trigger`, note it for Task 4.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: replace Command Deck CSS with search modal styles"
```

---

### Task 2: Replace Command Deck HTML with Search Modal HTML

**Files:**
- Modify: `index.html:3732-3752` (cmd-trigger button + cmd-overlay HTML)
- Modify: `index.html:3794` (FAB label)

- [ ] **Step 1: Replace the header trigger button**

Find (line 3732-3736):
```html
      <button class="cmd-trigger" id="cmd-trigger" title="Command Palette (Ctrl+K)" aria-label="Open Command Palette">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Command&hellip;
        <kbd>Ctrl K</kbd>
      </button>
```

Replace with:
```html
      <button class="search-trigger" id="search-trigger" title="Search cards (Ctrl+K)" aria-label="Search cards">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Search cards&hellip;
        <kbd>Ctrl K</kbd>
      </button>
```

- [ ] **Step 2: Replace the Command Deck overlay HTML**

Find (lines 3739-3752):
```html
    <!-- Command Deck overlay -->
    <div class="cmd-overlay" id="cmd-overlay">
      <div class="cmd-palette" id="cmd-palette">
        <div class="cmd-header">
          <span class="cmd-title">Command</span>
          <button class="cmd-close" id="cmd-esc" aria-label="Close">&times;</button>
        </div>
        <div class="cmd-actions" id="cmd-actions"></div>
        <div class="cmd-search">
          <svg ...></svg>
          <input type="search" id="cmd-input" placeholder="Search cards, actions…" ...>
        </div>
      </div>
    </div>
```

Replace with:
```html
    <!-- Search Modal -->
    <div class="search-overlay" id="search-overlay">
      <div class="search-modal" id="search-modal">
        <div class="search-input-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" id="search-input" placeholder="Search cards…" autocomplete="off" inputmode="search" aria-label="Search cards">
          <button class="search-close" id="search-close" aria-label="Close">&times;</button>
        </div>
        <div class="search-chips">
          <button class="search-chip search-chip-pack" id="chip-pack">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" rx="2" width="14" height="20"/><path d="M12 2v20"/><path d="M5 7h14"/><path d="M5 17h14"/><circle cx="12" cy="12" r="2.5"/></svg>
            Open Pack
          </button>
          <button class="search-chip search-chip-theme" id="chip-theme">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            Theme
          </button>
          <button class="search-chip search-chip-sync" id="chip-sync">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
            Sync
          </button>
        </div>
        <div class="search-results" id="search-results">
          <div class="search-empty">Type to search 309+ cards</div>
        </div>
      </div>
    </div>
```

- [ ] **Step 3: Update the mobile FAB label**

Find (line 3794):
```html
        <span class="bnav-label">Command</span>
```

Replace with:
```html
        <span class="bnav-label">Search</span>
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: replace Command Deck HTML with search modal markup"
```

---

### Task 3: Replace Command Deck JS with Search Modal JS

**Files:**
- Modify: `index.html:6085-6308` (Command Deck JS section)

- [ ] **Step 1: Replace the entire Command Deck JS section**

Find the block starting at `// ── Command Deck ──` (line 6085) through the sync chip click handler (line 6308). Replace the entire section with:

```js
  // ── Search Modal ──
  const searchOverlay = document.getElementById('search-overlay');
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchCloseBtn = document.getElementById('search-close');
  const searchTrigger = document.getElementById('search-trigger');
  const searchFab = document.getElementById('search-fab');
  let searchHighlight = -1;

  function openSearchModal() {
    searchOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    searchInput.value = '';
    searchHighlight = -1;
    renderSearchResults('');
    setTimeout(function() { searchInput.focus(); }, 50);
  }

  function closeSearchModal() {
    searchOverlay.classList.remove('open');
    document.body.style.overflow = '';
    searchInput.value = '';
  }

  function isSearchModalOpen() {
    return searchOverlay.classList.contains('open');
  }

  // Expose for onclick attributes in dashboard
  window.openSearchPage = openSearchModal;

  function renderSearchResults(query) {
    var q = query.trim().toLowerCase();

    if (q.length < 1) {
      searchResults.textContent = '';
      var emptyDiv = document.createElement('div');
      emptyDiv.className = 'search-empty';
      emptyDiv.textContent = 'Type to search 309+ cards';
      searchResults.appendChild(emptyDiv);
      searchHighlight = -1;
      return;
    }

    var allSearchable = allCards.concat(variantCards);
    var cardMatches = allSearchable.filter(function(c) {
      return c.name.toLowerCase().includes(q) || c.collector_number.toLowerCase() === q;
    }).slice(0, 10);

    if (cardMatches.length === 0) {
      searchResults.textContent = '';
      var noResults = document.createElement('div');
      noResults.className = 'search-empty';
      noResults.textContent = 'No cards found';
      searchResults.appendChild(noResults);
      searchHighlight = -1;
      return;
    }

    var parts = [];
    cardMatches.forEach(function(c) {
      var isOwned = ownedSet.has(c.collector_number);
      var isFoilOwnedCard = hasFoil(c.collector_number);
      var isVar = !mainSetCNs.has(c.collector_number);
      var ownedBadge = isOwned ? '<span class="ac-owned-badge">\u2713 Owned</span>' : '';
      var foilBadge = isFoilOwnedCard ? '<span class="ac-foil-badge">\u2726 Foil</span>' : '';
      var collectorBadge = isVar ? '<span class="ac-collector-badge">Collector</span>' : '';
      var detailParts = ['#' + esc(c.collector_number), esc(c.rarity)];
      if (c.price_usd > 0) detailParts.push('<span class="ac-price-usd">RM ' + (c.price_usd * USD_TO_MYR).toFixed(2) + '</span>');
      parts.push(
        '<div class="ac-card-row' + (isVar ? ' ac-variant-row' : '') + '" data-cn="' + esc(c.collector_number) + '">'
          + '<img src="' + esc(c.image_small) + '" alt="' + displayNameText(c) + '" loading="lazy"' + (isOwned ? ' class="ac-img-owned"' : '') + '>'
          + '<div class="ac-info">'
            + '<div class="ac-name">' + displayName(c) + '</div>'
            + '<div class="ac-detail">' + detailParts.join(' \u00b7 ') + '</div>'
          + '</div>'
          + '<div class="ac-actions">' + collectorBadge + ownedBadge + foilBadge + '<span class="ac-chevron">\u203a</span></div>'
        + '</div>'
      );
    });

    searchResults.textContent = '';
    var temp = document.createElement('div');
    temp.innerHTML = parts.join('');
    while (temp.firstChild) searchResults.appendChild(temp.firstChild);
    searchHighlight = -1;
  }

  // Trigger buttons
  searchTrigger.addEventListener('click', openSearchModal);
  searchFab.addEventListener('click', function() {
    if (isSearchModalOpen()) closeSearchModal();
    else openSearchModal();
  });
  searchCloseBtn.addEventListener('click', closeSearchModal);

  // Click backdrop to close
  searchOverlay.addEventListener('click', function(e) {
    if (e.target === searchOverlay) closeSearchModal();
  });

  // Search input filtering
  searchInput.addEventListener('input', function() {
    renderSearchResults(searchInput.value);
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', function(e) {
    var items = searchResults.querySelectorAll('.ac-card-row');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      searchHighlight = Math.min(searchHighlight + 1, items.length - 1);
      updateSearchHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      searchHighlight = Math.max(searchHighlight - 1, -1);
      updateSearchHighlight(items);
    } else if (e.key === 'Enter' && searchHighlight >= 0) {
      e.preventDefault();
      items[searchHighlight].click();
    }
  });

  function updateSearchHighlight(items) {
    items.forEach(function(el, i) { el.classList.toggle('hl', i === searchHighlight); });
    if (searchHighlight >= 0 && items[searchHighlight]) items[searchHighlight].scrollIntoView({ block: 'nearest' });
  }

  // Card click delegation
  searchResults.addEventListener('click', function(e) {
    var cardRow = e.target.closest('.ac-card-row');
    if (cardRow) {
      var cn = cardRow.dataset.cn;
      var card = getCardByNumber(cn);
      if (card) { closeSearchModal(); openModal(card); }
    }
  });

  // Quick-action chip handlers
  document.getElementById('chip-pack').addEventListener('click', function() {
    closeSearchModal();
    openPackModal();
  });
  document.getElementById('chip-theme').addEventListener('click', function() {
    toggleTheme();
  });
  document.getElementById('chip-sync').addEventListener('click', function() {
    closeSearchModal();
    openSyncModal();
  });

  // Global keyboard shortcut: Ctrl+K or / to open search modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isSearchModalOpen()) {
      closeSearchModal();
      return;
    }
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) ||
        (e.key === '/' && !e.target.closest('input, textarea'))) {
      e.preventDefault();
      if (isSearchModalOpen()) closeSearchModal();
      else openSearchModal();
    }
  });

  // Sync chip click opens sync modal directly
  document.getElementById('sync-chip').addEventListener('click', function() {
    openSyncModal();
  });
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "refactor: replace Command Deck JS with search modal logic"
```

---

### Task 4: Fix remaining references to old Command Deck IDs

**Files:**
- Modify: `index.html` — theme tour selector and any other references

- [ ] **Step 1: Find and update the theme tour selector**

Search for `#cmd-trigger` in the JS. There is a theme tour entry (around line 4970):

```js
      { id: 'theme', selector: '#cmd-trigger' },
```

Replace with:
```js
      { id: 'theme', selector: '#search-trigger' },
```

- [ ] **Step 2: Search for any other remaining `cmd-` references in JS or HTML**

Search the entire file for `cmd-` (excluding CSS comments that were already replaced). Fix any remaining references:
- `cmdOverlay`, `cmdPalette`, `cmdInput`, `cmdActions`, `cmdEsc`, `cmdTrigger`, `cmdHighlight` — all should be gone (replaced in Task 3)
- `openCommandDeck`, `closeCommandDeck`, `isCommandDeckOpen` — all should be gone (replaced in Task 3)
- `CMD_ITEMS` — should be gone (replaced in Task 3)
- `renderCommandActions` — should be gone (replaced in Task 3)

If any are found, they are leftover references that need updating.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix: update remaining references from Command Deck to search modal"
```

---

### Task 5: Manual smoke test

**Files:** None (testing only)

- [ ] **Step 1: Open `index.html` in a browser and test desktop**

1. Verify the header shows "Search cards..." pill with `Ctrl K` hint
2. Click the pill — search modal appears centered, not fullscreen, with dim backdrop
3. Modal shows: search input (focused), 3 chips (Open Pack, Theme, Sync), empty state text
4. Type a card name — results appear with thumbnails, badges, prices
5. Click a card result — modal closes, card detail modal opens
6. Arrow keys navigate results, Enter selects
7. Press `Esc` or click backdrop — modal closes
8. Press `Ctrl+K` — modal toggles open/closed
9. Press `/` (not in an input) — modal opens
10. Click "Open Pack" chip — modal closes, pack modal opens
11. Click "Theme" chip — theme toggles, modal stays open
12. Click "Sync" chip — modal closes, sync modal opens
13. Click the header sync chip — sync modal opens directly (no search modal)

- [ ] **Step 2: Test mobile (use browser devtools responsive mode, ~375px width)**

1. Header pill is hidden, bottom nav shows center FAB labeled "Search"
2. Tap FAB — search modal appears with side margins
3. All chip and search behavior works same as desktop
4. Card result rows have adequate touch target height

- [ ] **Step 3: Commit final state if any fixes were needed**

```bash
git add index.html
git commit -m "fix: search modal smoke test fixes"
```

Only commit if fixes were made. If everything passed, skip this step.
