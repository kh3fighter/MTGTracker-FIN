# UI/UX Polish & Discoverability Redesign

**Date:** 2026-04-06
**Approach:** Targeted Redesign (Approach B)
**Scope:** Timeline tab, FAB/search, Settings tab, app-wide discoverability & visual polish

## Context

The FIN Binder Tracker is a single-page MTG collection tracker (plain HTML/CSS/JS, no build step). The app already has strong foundations — Dashboard, Portfolio, Binder, and Collector tabs are solid. This redesign targets the three weakest areas (Timeline, FAB, Settings) and adds a polish + discoverability layer across the whole app.

**User profile:** Uses the app equally on mobile and desktop. Shows it to friends/fellow collectors. Primary pain points are visual polish ("looks okay but doesn't feel premium") and discoverability ("features exist but are hard to find").

## Section 1: Timeline → "Activity" (Journey Feed)

**Problem:** The current Timeline tab is a data dump — milestones, heatmap, pace stats, growth chart, and activity feed all crammed into a dashboard grid. Users report it "doesn't feel useful."

**Solution:** Reimagine as a vertical **Journey Feed** — a scrollable timeline that tells the collection story.

### Structure (top to bottom)

1. **Streak Banner** (top, full-width card)
   - Prominent streak counter: "5-Day Streak!" with fire emoji
   - Subtext: "You've added cards every day this week"
   - Cards-per-week pace stat on the right side
   - Background: subtle gradient panel (same `--ff-panel` style)
   - Streak resets if no cards added in a calendar day
   - Show "Start a streak!" CTA if streak is 0

2. **Vertical Journey Timeline**
   - Left border line (2px solid `--ff-border`) with circular dot markers
   - Events grouped by day with date headers
   - Dot colors: `--accent` for today, `--accent2` for milestones, `--surface3` for past days

3. **Day Clusters**
   - Each day shows cards added as compact horizontal chips
   - Chip contents: small thumbnail (28x38px), card name, rarity label colored by rarity
   - If >3 cards in a day, show first 3 + "+N more" collapsed chip that expands on tap
   - Pack openings show as a special chip: "Opened 2 packs · 8 new cards · +$4.20 value"
   - Removed cards show with a muted red dot and strikethrough name

4. **Inline Milestones**
   - When a milestone was reached on a given day, render it inline in the timeline at that date position
   - Gold-bordered card with trophy emoji: "50% Milestone Reached!"
   - Subtext: "155 / 309 cards · April 3, 2026"
   - Background: subtle gold gradient tint (`rgba(212,168,80,0.08)`)

5. **Empty State**
   - If no timeline events: illustrated empty state
   - Message: "Your collection journey starts here"
   - CTA button: "Add Your First Card" → opens FAB

### Data changes

- The existing `timelineEvents` array and `renderTimeline()` function are rewritten
- Streak calculation: walk `timelineEvents` backwards, count consecutive calendar days with at least one `type:'add'` event
- Day grouping: group events by `date.slice(0, 10)`
- No new localStorage keys needed — all data is already in `fin-timeline`

### What's removed

- The growth chart SVG — moves to Portfolio tab as a new "Collection Growth" card in `renderPortfolio()` (it's a value/data visualization, fits better alongside valuation data). Inserted after the "Collection Valuation" card.
- The heatmap — removed entirely (low utility, redundant with the journey feed)
- The "Collecting Pace" and "Stats" cards — pace goes into the streak banner, stats are implicit in the feed
- Milestone track (horizontal dots) — replaced by inline milestone cards

## Section 2: FAB → Smart Panel

**Problem:** The FAB opens a cramped panel with a hidden mode toggle (Quick Add / Booster Pack), tiny autocomplete results with no card preview, and no way to see what you're adding before committing.

**Solution:** A search-first **Smart Panel** with inline card previews and clear action buttons.

### Layout changes

1. **Search bar** (top of panel, larger)
   - Bigger input: `padding: 12px 14px`, `font-size: 0.95rem`
   - Search icon on the left inside the input
   - Hint text: "Search cards or scan #..."
   - On desktop: show a keyboard shortcut badge `⌘K` / `Ctrl+K` at the right edge of the input (visual hint only for now — keyboard shortcut is out of scope for this redesign but the badge primes users for future addition)

2. **Autocomplete results** (redesigned)
   - Each result is a full card row, not just text:
     - **Card thumbnail** (48x67px, 5:7 aspect ratio) on the left
     - **Card name** (bold), collector number, rarity, type line
     - **Price info**: regular price + foil price if available
     - **Action buttons** on the right: primary "Add" button + secondary "Foil ✦" button
     - Owned cards show a green "Owned" badge instead of Add button
   - Result card has a subtle highlight border when focused/hovered (`--accent` border)
   - Max 4 visible results before scrolling (taller result items = fewer visible)
   - Variant cards show their variant badge (SURGE FOIL, SHOWCASE, etc.) next to rarity

3. **Quick Actions Bar** (bottom of panel, replaces mode toggle)
   - Two equal-width buttons side by side:
     - "Open Pack" — gradient background (`--accent` to `--accent2`), pack emoji
     - "Recent" — secondary style, clipboard emoji
   - Tapping "Open Pack" replaces the panel content with the existing pack flow (no change to pack logic)
   - Tapping "Recent" shows the existing recent-adds list
   - The current sliding mode toggle (`fab-mode-toggle`, `fab-mode-slider`) is removed

4. **Panel sizing**
   - Desktop: `width: 400px` (up from 380px), `max-height: 560px`
   - Mobile: `width: calc(100vw - 24px)`, `max-height: 75vh`
   - Panel origin animation stays the same (scale from FAB button)

### Behavioral changes

- Autocomplete triggers after 1 character (currently 2) for faster results
- Results include both `allCards` and `variantCards` in search
- Clicking a card thumbnail in autocomplete opens the card modal (existing `openModal()`)
- Clicking "Add" adds to collection and shows success state inline (green checkmark replaces button for 1s)
- Clicking "Foil ✦" adds foil and triggers `celebrateFoil()` as today

### What's removed

- `fab-mode-toggle`, `fab-mode-slider`, `.fab-mode-btn` — replaced by quick actions bar
- The old autocomplete `.ac-item` layout — replaced by richer card rows

## Section 3: Settings → Preferences Hub

**Problem:** Settings feels like a bare form. Sync config is hidden in a separate modal. No visual preview of binder changes. No way to discover features.

**Solution:** Restructured **Preferences Hub** with visual previews and promoted sync.

### Section layout (top to bottom)

1. **Profile Summary Card** (new)
   - Full-width card at the top of settings
   - Left side: collection summary text: "155 / 309 cards · 12 foils · 9-pocket binder"
   - Right side: sync status indicator
     - Connected: green dot + "Synced 2m ago" + "Sync Now" button
     - Disconnected: grey dot + "Not connected" + "Set Up Sync" button
   - Tapping "Set Up Sync" scrolls to the Cloud Sync section (or opens inline config)
   - Uses `dash-card` styling for consistency

2. **Binder Layout** (enhanced)
   - Keep preset dropdown and custom inputs
   - Add a **live visual preview**: a miniature binder grid (using actual `gridRows × gridCols`) rendered as small grey rectangles in a card
   - Preview updates live as dropdown/inputs change
   - The existing `settings-live-summary` text stays below the preview
   - Preview card is ~120px tall, centered

3. **Collection Scope** (enhanced)
   - Keep toggle switches
   - Add card-count badges inline: "Main Set **(309)**" and "Collector Variants **(+47)**"
   - When Collector toggle is enabled, show a small inline note: "Includes: Extended Art, Showcase, Surge Foil, Chocobo Track"

4. **Cloud Sync** (promoted from modal → inline section)
   - New `settings-section` with cloud icon
   - If not configured: token input field, "Save & Connect" button, link to generate token
   - If configured: connection status, Gist ID (truncated), last sync timestamp, Push/Pull/Disconnect buttons
   - The header sync button (`#sync-btn`) still works but now opens/scrolls to this section instead of a modal
   - The `sync-modal-overlay` is removed

5. **Appearance** (new section)
   - Theme toggle: "Dark Mode" / "Light Mode" with toggle switch
   - This is a secondary location — the header icon stays as a quick toggle
   - Future-proofs for font size or other appearance settings

6. **Data & Cache** (enhanced)
   - Show cache status: "Card data cached [date] (expires in [N] days)" or "Cache expired"
   - "Refresh Card Data" button (triggers `_refreshScryfall`)
   - "Refresh Exchange Rate" button (triggers `_refreshFxRate`)
   - Export/Import buttons (existing)
   - Show data sizes: "Collection: 155 cards · Foils: 12 · Timeline: 89 events"

7. **Danger Zone** (restyled)
   - Keep the expandable toggle
   - Red-tinted border when expanded: `border-color: rgba(192,57,43,0.3)`
   - Each reset button gets a warning icon and clearer description
   - Confirmation still uses the existing bottom sheet (`showSheet()`)

### What's removed

- `sync-modal-overlay`, `sync-modal`, `#sync-modal` — sync moves inline to Settings
- The `sync-btn` click handler changes from opening modal to scrolling to Settings sync section (or if not on Settings tab, switches to Settings and scrolls)

## Section 4: App-Wide Discoverability

### 4A: Contextual Tooltip Pulses

- Small pulsing dot (8x8px, `--accent` color, CSS `pulse` animation) on features the user hasn't interacted with yet
- Tracked via a new localStorage key `fin-discovered-features` — a JSON object of feature IDs with boolean values
- Features to track:
  - `fab` — the floating action button (pulse on the FAB button itself)
  - `sync` — the cloud sync icon (pulse on `#sync-btn`)
  - `collector` — the collector tab (pulse on the tab button, if enabled)
  - `theme` — the theme toggle (pulse on `#theme-toggle`)
  - `binder-search` — the binder search bar (pulse on the input)
- On first interaction with a feature, set its flag to `true` and remove the pulse dot
- Pulse dot is a `::after` pseudo-element or a small `<span>` injected on render
- CSS: `@keyframes discover-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(91,127,199,0.4); } 50% { box-shadow: 0 0 0 6px rgba(91,127,199,0); } }`

### 4B: Actionable Empty States

Replace all "No data yet" messages with guided empty states:

| Location | Current | New |
|----------|---------|-----|
| Timeline (no events) | "No activity yet — start adding cards!" | Illustrated message + "Add Your First Card" button → opens FAB |
| Portfolio (no owned cards) | "No cards yet" (in top cards lists) | "Start collecting to track your portfolio value" + "Open Search" button |
| Dashboard session activity | "No cards added this session" | "Open a pack or search for cards to get started" + "Add Cards" button |
| Binder (missing filter, none missing) | (shows empty grid) | "You own everything on this page!" congratulatory message |
| FAB recent list | "Start adding cards..." | "Search above or open a booster pack to begin" |

- Empty state styling: centered text, `--text-muted` color, 0.85rem font size, icon or emoji above text, CTA button styled as `btn-primary` with small padding
- CTA buttons wire to existing functions: `openFab()`, `switchTab('binder')`, etc.

## Section 5: Visual Polish

### 5A: Smooth Tab Transitions

- Replace the current `tab-enter` animation (fade-up) with directional slides
- Track the previous tab index and current tab index
- If moving right (higher index): outgoing tab slides left, incoming slides from right
- If moving left (lower index): outgoing tab slides right, incoming slides from left
- CSS animations:
  - `tab-slide-in-right`: `from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); }`
  - `tab-slide-in-left`: `from { opacity:0; transform:translateX(-30px); } to { opacity:1; transform:translateX(0); }`
- Duration: 0.3s ease
- On mobile: add touch swipe detection on `.tab-content.active`
  - Swipe left → next tab, swipe right → previous tab
  - Use `touchstart`/`touchmove`/`touchend` with a 50px threshold
  - Respect `prefers-reduced-motion`

### 5B: Card Slot Polish

- **Parallax tilt on hover** (desktop only):
  - On `mousemove` over `.card-slot`, calculate tilt based on cursor position relative to slot center
  - Apply `transform: perspective(600px) rotateX(Xdeg) rotateY(Ydeg) scale(1.03)`
  - Max tilt: 8 degrees
  - Reset on `mouseleave` with a smooth transition
  - Skip on mobile (no hover)

- **Breathing glow on owned cards**:
  - `.card-slot.owned` gets `animation: slot-breathe 3s ease-in-out infinite`
  - `@keyframes slot-breathe { 0%,100% { box-shadow: 0 0 6px var(--ff-glow); } 50% { box-shadow: 0 0 12px var(--ff-glow); } }`
  - Stagger with `animation-delay` based on slot index

- **Card silhouette for missing cards**:
  - Instead of just showing collector number + name text, render a faint card-shaped outline
  - CSS: card-shaped border with rounded corners, very low opacity (0.15), dashed border
  - The collector number and name text overlay the silhouette
  - Makes empty slots feel like "a card belongs here" rather than just a blank square

### 5C: Modal Refinement

- **Frosted glass backdrop**:
  - `.modal-overlay` gets `backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);`
  - Reduce `--modal-bg` opacity slightly since blur adds visual separation
  - Fallback for browsers without backdrop-filter: keep current solid overlay

- **Spring animation upgrade**:
  - Replace `modal-in` with a more organic spring: `cubic-bezier(0.34, 1.56, 0.64, 1)` (already used in some places, make consistent)
  - Add slight rotation on enter: `from { transform: scale(0.85) translateY(20px) rotate(-1deg); }`
  - Modal close gets a faster, snappier exit

- **Swipe-to-dismiss on mobile**:
  - Track `touchstart`/`touchmove` on the modal
  - If swiping down and distance > 100px, trigger close
  - During swipe: translate modal down and reduce opacity proportionally
  - If released before threshold, spring back

- **Backdrop click to close**:
  - Already partially implemented — ensure clicking anywhere on `.modal-overlay` (outside `.modal`) triggers `closeModal()`
  - Add a visual hint: cursor changes to a subtle close icon on the overlay area

### 5D: Skeleton Loading States

- Replace the crystal spinner (`#loading-screen`) with a skeleton layout
- Skeleton shows the header (brand placeholder), tab bar placeholder, and a grid of skeleton cards in the dashboard layout
- Skeleton card: `background: var(--surface); border-radius: 6px;` with a shimmer animation
- `@keyframes skeleton-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`
- `background: linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%); background-size: 200% 100%;`
- When data loads, skeleton fades out and real content fades in (crossfade, 0.3s)

### 5E: Spacing & Typography System

- Establish a spacing scale: `--sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-6: 24px; --sp-8: 32px;`
- Audit all padding/margin/gap values and normalize to this scale
- Typography hierarchy:
  - **Cinzel** (serif): Section titles (`dash-card h3`), brand title, wizard headings — uppercase, letter-spacing 0.1em
  - **Rajdhani** (sans): UI elements, buttons, labels, nav — weight 500-700, uppercase where used
  - **Inter** (sans-serif): Body text, descriptions, price values, detail text — regular weight
- Current inconsistency: some `dash-sub` uses Rajdhani inherited from body, some detail text has no explicit font. Normalize.
- Line heights: tighten to 1.2 for headings, 1.4 for body text, 1.1 for large numbers

### 5F: Mobile Bottom Nav Polish

- Add tiny text labels below each icon in `.bnav-btn`:
  - Dashboard, Portfolio, Timeline, Binder, Collector, Settings
  - Font size: `0.58rem`, uppercase, letter-spacing: `0.04em`
  - Color: `--text-muted`, active: `--text`
- Active tab treatment:
  - Icon gets `fill: currentColor` (filled instead of stroked) or `filter: drop-shadow(0 0 6px var(--accent))`  (already has drop-shadow, make it more prominent)
  - Color changes to `--accent` (or `--text` as currently, with the accent glow)
  - Add a 2px top border accent: `border-top: 2px solid var(--accent)` on `.bnav-btn.active`
- Bottom nav background: add subtle top gradient: `box-shadow: 0 -1px 0 var(--ff-border), 0 -8px 24px rgba(0,0,0,0.15);`
- Slightly increase bottom nav height for better tap targets: min-height 56px (up from current ~52px effective)

## Section 6: Binder Tab Redesign (Modern Clean)

**Problem:** The binder tab works functionally but feels utilitarian — no context about spread progress, missing cards are just blank numbered squares, and the page navigation (slider + dots) is visually heavy.

**Solution:** A **data-driven modern binder** with a stats banner, per-spread completion tracking, cleaner card slots, and a slim page scrubber.

### Layout (top to bottom)

1. **Stats Banner** (new, replaces the current separate search bar + page nav widget)
   - Single-row card combining page info, spread stats, and filters
   - Left: current page numbers in bold gold ("3–4") with "of 34" subtext
   - Center: **per-spread completion ring** — a small SVG donut (36x36px) showing what % of the current spread's cards are owned, with the count next to it ("12 / 18 · this spread")
   - Right: filter pills (ALL / OWN / MISS) — compact, inline
   - Background: `--ff-panel` gradient with `--ff-border` border
   - Updates live when navigating pages

2. **Search Bar** (simplified)
   - Single row below the stats banner
   - Search icon + input + **live match count** on the right ("3 matches")
   - Match count appears only when there's an active query
   - Same styling as current but with the match count addition
   - Current `binder-filter-pills` move into the stats banner, freeing up this row for search only

3. **Binder Spread** (refined)
   - Keep the existing `binder-layout` with flanking nav arrows
   - Keep the 2-page spread on desktop, 1-page on mobile
   - **Page cards**: existing `binder-page` containers but with refined styling:
     - Slightly more rounded corners (8px)
     - Subtle inner shadow for depth
   - **Nav arrows**: smaller (28x28px), more subtle — circle with thin border

4. **Card Slots** (upgraded)
   - **Owned cards**: keep existing behavior (image + owned border). Add:
     - Soft card shadow: `box-shadow: 0 2px 8px rgba(91,127,199,0.12)`
     - Name overlay at bottom: semi-transparent gradient with card name in small white text
     - Name overlay only shows on hover (desktop) or always on mobile for context
   - **Missing cards**: replace the plain number + name placeholder with:
     - Slightly transparent background: `rgba(13,18,32,0.5)`
     - Solid border at reduced opacity: `border: 1.5px solid rgba(46,58,82,0.4)`
     - Collector number centered
     - Card name below (existing, keep)
     - **Quick-add button**: small circular "+" icon below the name (14x14px circle, `--accent` border at 0.3 opacity)
     - Tapping the "+" directly adds the card to collection (same as clicking the slot currently, but the affordance is clearer)
     - Overall opacity: 0.6 to visually differentiate from owned
   - **Foil cards**: keep existing gold border + foil badge + shimmer overlay (no changes)

5. **Page Scrubber** (replaces page slider widget + page dots)
   - Slim horizontal track at the bottom (6px height, rounded)
   - Gradient fill from `--accent2` to `--accent` showing progress
   - Draggable thumb (12x12px circle, `--accent` color, `--bg` border)
   - Page number labels at left ("1") and right ("34") endpoints
   - Replaces the current `page-nav-widget`, `page-slider-track`, `page-slider-fill`, `page-slider-thumb`, and `page-slider-dots`
   - Functionally identical to current slider but visually slimmer and without the dot markers

### Mobile-specific adjustments

- Stats banner stacks vertically on mobile: page info on top row, completion ring + filters on second row
- Search bar unchanged
- Spread shows single page (existing behavior)
- Nav arrows: 36x36px touch targets (up from 28px on desktop) with 44px min-height maintained
- Page scrubber: thumb grows to 16x16px for easier touch dragging
- Quick-add "+" button on missing cards: grows to 20x20px for tap target

### What's removed from current binder

- `page-nav-label` — replaced by stats banner page display
- `page-slider-dots` / `.page-dot` — removed entirely (scrubber is cleaner)
- `page-nav-widget` wrapper — replaced by stats banner + scrubber
- The `binder-search-bar` flex container is simplified (filters move to stats banner, only search input remains)

### What's kept

- Core binder logic: `renderBinder()`, `currentPage`, `totalPages`, page navigation, slot click → modal
- Spread view (2 pages desktop, 1 mobile)
- Search + filter functionality (same logic, different UI placement)
- All foil slot rendering (unchanged)
- Binder page flip animations (slide-left, slide-right)
- `binder-fpill` filter logic (just moved to stats banner)

## Section 7: Dashboard Redesign (Hero Dashboard)

**Problem:** The current Dashboard is a flat 2-column grid where every card (progress, rarity donut, rarity bars, binder stats, foil collection, booster packs, session activity, heatmap) has the same visual weight. No hero moment, no hierarchy — reads like a report.

**Solution:** A **hero-first layout** with a dominant progress ring, supporting stat pills, session card strip, and binder mini-map.

### Layout (top to bottom)

1. **Hero Progress Card** (full-width, prominent)
   - Large card with `--ff-panel` gradient background, `--ff-border` border
   - Left: **large progress ring** (80x80px SVG donut)
     - Ring stroke: gradient from `--accent2` (#d4a850) to `--accent` (#5b7fc7)
     - Center text: percentage in large bold gold, "complete" label below
   - Right: collection count "185 / 309" in large text, "124 cards remaining" subtext
   - Below the count: **rarity stacked bar** — single horizontal bar split into 4 proportional segments (mythic/rare/uncommon/common), each colored by rarity
   - Below the bar: mini rarity labels "M 8/15 · R 32/53 · U 65/80 · C 80/161" colored by rarity
   - Decorative: subtle radial gradient glow in top-right corner
   - This replaces: Collection Progress card, Rarity Breakdown donut card, Rarity Completion bars card (3 cards → 1)

2. **Quick Stats Row** (3 compact pills)
   - 3-column grid: Foils, Packs, Value
   - Each pill: `--surface` background, centered, icon/number on top, label below
   - Foils: "✦ 12" in gold
   - Packs: count in `--accent` color
   - Value: "$94" in `--owned-border` green
   - Replaces: Binder Stats card, Booster Packs card, part of Foil Collection card (3 cards → 1 row)

3. **Session Card Strip** (horizontal scroll)
   - Card with "This Session" header + "5 cards added" count on the right
   - Horizontal scrollable row of card thumbnails (42x59px, 5:7 ratio)
   - Each thumbnail has a rarity-colored border (mythic=orange, rare=gold, etc.)
   - Mythic/rare pulls get a subtle glow shadow matching their rarity color
   - Scrollable with `overflow-x: auto; scrollbar-width: none`
   - Empty state: "Open a pack or search for cards to get started" + CTA button
   - Replaces: Session Activity card with its text-based recent list

4. **Binder Mini-Map** (replaces heatmap)
   - Card with "Binder Map" header + "12 / 34 pages complete" count
   - Grid of small rectangles (14x10px), one per binder page
   - Colors: green (`--owned-border`) for complete pages, `--accent` at 40% opacity for partial, `--chart-empty` for empty
   - Legend below: Complete / Partial / Empty with colored dots
   - Replaces: the full-width Collection Heatmap card (which showed per-card owned/unowned as 309 tiny cells — the binder map is more meaningful at page-level)

### What's removed from current Dashboard

- **Rarity Breakdown donut chart** — replaced by rarity stacked bar inside the hero card
- **Rarity Completion bars** (full-width card with 4 bars) — replaced by rarity mini labels in hero card
- **Binder Stats card** (total pages, complete pages) — condensed into quick stats + binder mini-map
- **Foil Collection card** (owned/capable count, top foils) — foil count moves to quick stats pill; detailed foil info stays in Portfolio/Collector tabs
- **Booster Packs card** (packs opened, total spent, avg per card) — pack count moves to quick stats pill; detailed pack ROI stays in Portfolio
- **Session Activity card** (text list of recent items) — replaced by card strip with thumbnails
- **Collection Heatmap** (309 small cells) — replaced by binder mini-map (34 page-level cells)

### What's kept

- `renderDashboard()` function (rewritten with new layout)
- All data sources: `ownedSet`, `allCards`, `rarityCounts`, `boosterPacks`, `packSession`, `foilOwned`
- Click handlers on session card thumbnails → `openModal(card)`

## Section 8: Portfolio Redesign (Wealth Showcase)

**Problem:** The Portfolio tab is the most text-heavy tab. The valuation card has verbose price source badges with timestamps, 4 value boxes in a grid, and everything is the same visual weight. Top 5 owned/missing are text lists that don't showcase the cards visually.

**Solution:** A **premium wealth showcase** with a hero valuation card, card carousels, and condensed price source info.

### Layout (top to bottom)

1. **Hero Valuation Card** (full-width, prominent)
   - Large card with gradient background
   - Top: "Collection Value" label (uppercase, muted)
   - Main line: **USD value** in large bold green + **MYR value** in medium `--accent` color, side by side
   - Subtext: "185 cards · via Scryfall/TCGPlayer · 1 USD = 4.40 MYR" — **one line** replacing the current 2 separate price source badge cards
   - Below: **rarity value breakdown bar** — proportional horizontal segments showing value contribution by rarity
     - Each segment is a colored bar (same rarity colors), width proportional to that rarity's $ value
     - Labels below each segment: "Mythic $42", "Rare $31", etc.
   - Replaces: Collection Valuation card (with its 2 price source badges + 4 value boxes + foil value line)
   - Price refresh buttons: small refresh icon at the end of the subtext line (triggers existing `_refreshScryfall` and `_refreshFxRate`)

2. **ROI + Still Need Row** (2-column)
   - Left card: **Pack ROI**
     - "+RM 12.48" in green (or red if negative)
     - "Spent: RM 402 · 113% return"
   - Right card: **Still Need**
     - "$62.30" in `--accent`
     - "124 cards remaining"
   - Replaces: Pack ROI card (now more compact) + the "Still Need" value box

3. **Most Valuable Owned — Card Carousel**
   - Card with header "Most Valuable Owned" + "See all →" link
   - Horizontal scrollable row of card thumbnails:
     - Each item: card image (72x100px, 5:7), rarity-colored border, name below, price below name
     - Rarity glow on mythic/rare cards
     - Tapping a card → `openModal(card)`
   - Shows top 5 (scrollable to see all 5)
   - Replaces: "Most Valuable (Owned)" text list with rank numbers

4. **Most Wanted (Missing) — Card Carousel**
   - Same carousel layout as above but for missing cards
   - Card images rendered at reduced opacity with dashed borders (same "unowned" treatment as binder)
   - Prices shown in `--accent` color (blue, representing "cost to acquire")
   - Replaces: "Most Valuable (Missing)" text list

5. **Foil + Variant Summary Row** (2-column)
   - Left card: **Foil Value**
     - "✦ Foil Value" label in gold
     - Dollar amount in gold
     - "12 foils owned" subtext
   - Right card: **Variants**
     - "◈ Variants" label in blue
     - Dollar amount
     - "8 / 47 owned" subtext
   - Replaces: Variant Portfolio card + Foil Stats card (2 large cards → 2 compact cards)

6. **Growth Chart** (moved from Timeline)
   - Card with "Value Over Time" header
   - SVG line chart showing cumulative collection value by date
   - Same chart logic as current `renderTimeline()` growth chart but plotting value instead of card count
   - Area fill with gradient under the line
   - Date labels at start and end
   - Only shown if there are 2+ data points
   - This is the growth chart that was removed from Timeline in Section 1

### Price source handling

- The current 2 large price source badge cards (Scryfall/TCGPlayer + ExchangeRate-API) with timestamps, "fetched X ago", "cached 7d" etc. are condensed into:
  - One line in the hero card: "185 cards · via Scryfall/TCGPlayer · 1 USD = 4.40 MYR"
  - A small refresh icon (↻) at the end that refreshes both data sources
  - Detailed cache info (fetched timestamp, TTL) moves to Settings → Data & Cache section (Section 3)

### What's removed from current Portfolio

- **Price source badge cards** (2 large badges with timestamps) — condensed to one line
- **4-box value grid** (Owned USD, Owned MYR, Main Set USD, Still Need) — hero card shows owned in both currencies; Still Need gets its own card; Full Set Value is removed (low utility)
- **Value by Rarity bars card** — replaced by rarity value breakdown bar in hero card
- **Top 5 text lists** (Most Valuable Owned/Missing) — replaced by card carousels
- **Variant Portfolio card** (big card with progress bar + top variants) — condensed to compact summary card
- **Foil Stats card** (progress bar + top foils) — condensed to compact summary card

### What's kept

- `renderPortfolio()` function (rewritten with new layout)
- All financial calculations: `collectionValueUSD`, `collectionValueMYR`, `fullSetValueUSD`, etc.
- `getEffectivePrice()` logic for foil vs regular price comparison
- Foil and variant value calculations
- Click handlers on card carousel items → `openModal(card)`
- `_refreshScryfall()` and `_refreshFxRate()` exposed on `window`

## Section 9: Collector Tab Redesign (Gallery View)

**Problem:** The Collector tab has too many controls fighting for attention — 7 type filter buttons + 4 rarity buttons + search input + 3 stats cards, all above the card grid. It feels like a control panel, not a showcase for premium cards.

**Solution:** A **showcase gallery** with compact stats, scrollable chip filters, colored rarity circles, and card overlays.

### Layout (top to bottom)

1. **Compact Stats Row** (replaces 3 separate dash-cards)
   - Single horizontal row with 3 compact stat blocks
   - Left block (largest): completion donut (32x32px SVG) + "47 / 89" count + "collected" label
   - Center block: foil count "✦ 23" in gold
   - Right block: total value "$142" in green
   - All blocks use `--surface` background with `--ff-border`, consistent with app styling
   - Replaces the current `dash-grid` with 3 full `dash-card` elements — much less vertical space

2. **Type Filter Chips** (replaces boxy button row)
   - Horizontal scrollable row of pill-shaped chips
   - Chip styling: `border-radius: 20px`, `padding: 6px 14px`, `font-size: 0.72rem`, `font-weight: 700`
   - Active chip: `background: var(--accent); color: #fff`
   - Inactive chip: `background: transparent; border: 1px solid var(--ff-border); color: var(--text-muted)`
   - Chips: All Cards, ✦ Foils, Extended Art, Showcase, Surge Foil, Chocobo Track
   - Horizontal scroll with `overflow-x: auto; scrollbar-width: none` — swipeable on mobile
   - The "Owned" filter becomes a toggle icon/button next to the search bar instead of a chip (see below)

3. **Search + Rarity Row** (combined into one row)
   - Left: search input (same as current but more compact, with search icon inside)
   - Right: **rarity circles** replacing the C/U/R/M letter buttons
     - 4 circles (24x24px), each colored by rarity: common (#888), uncommon (#72b5b5), rare (#c9a14e), mythic (#e8702a)
     - Active: filled circle with letter. Inactive: outlined circle with letter
     - Tap to toggle — same behavior as current rarity filter buttons
   - Between search and rarity: optional "Owned" toggle icon (eye icon or filled/outline toggle) — filters to show only owned cards

4. **Card Grid** (upgraded from binder-style to gallery)
   - **4-column grid on desktop**, 3-column on mobile (current uses `binderConfig.gridCols` which is typically 3)
   - `grid-template-columns: repeat(4, 1fr)` desktop, `repeat(3, 1fr)` on `max-width: 700px`
   - Gap: 6px (same as current)
   - Card slots use 5:7 aspect ratio (same as current)

5. **Card Slot Design** (new overlay treatment)
   - **Owned cards**:
     - Card image with owned border (`--accent` or `--gold` for foils)
     - **Name + variant label overlay** at the bottom of every card:
       - Semi-transparent gradient: `background: linear-gradient(transparent, rgba(0,0,0,0.8))`
       - Card name: white, 0.5rem, font-weight 600
       - Variant label below name: colored by variant type (same colors as existing `ac-variant-badge` classes), 0.42rem, uppercase
     - Foil badge (✦) in top-right corner (existing behavior, kept)
     - Foil shimmer overlay (existing behavior, kept)
   - **Unowned cards**:
     - Card image with `filter: grayscale(0.75) brightness(0.45)` (existing behavior)
     - Overall opacity: 0.5 (down from current 0.55)
     - Same name + variant label overlay but in `--text-muted` color
     - Border: `1.5px solid rgba(46,58,82,0.4)`
   - **Hover (desktop)**: scale(1.05) with elevated shadow, overlay text becomes fully opaque
   - **Tap → opens modal** (existing behavior, unchanged)

6. **Pagination** (simplified)
   - Centered row: `‹` button, "Page **1** of 10" text, `›` button
   - Replaces the current flanking binder-style nav arrows (which feel out of place in a gallery)
   - Buttons: 28x28px circles with thin border (same as binder redesign nav style)
   - On mobile: buttons grow to 36px for tap targets

### Lazy loading

- Keep existing `IntersectionObserver` pattern for `data-src` lazy loading (already implemented in current `renderCollectorTab`)

### What's removed

- The 3 full-width `dash-card` stat cards (collection donut, foils owned, total value) — condensed into compact stats row
- The boxy `btn-primary` / `btn-secondary` type filter buttons — replaced by pill chips
- The `btn-primary` / `btn-secondary` rarity filter buttons — replaced by colored circles
- The flanking `binder-nav` arrows on the collector grid — replaced by centered pagination
- The `binder-layout` wrapper around the collector grid — not needed for gallery layout

### What's kept

- All filter logic (type filtering, rarity filtering, search) — same behavior, different UI
- `renderCollectorTab()` function structure (filter state closure, `buildGrid()`, event delegation)
- Foil shimmer overlays and variant-specific CSS classes
- Lazy loading via IntersectionObserver
- Slot click → `openModal(card)` behavior
- Pagination state (`collPage`, `persist()`, `resetPage()`)

## New localStorage Keys

| Key | Purpose |
|-----|---------|
| `fin-discovered-features` | Object tracking which features the user has interacted with (for tooltip pulses). Example: `{ fab: true, sync: false, collector: false }` |

## Files Modified

Only `index.html` — this is a single-file app with no build step.

## Out of Scope

- Keyboard shortcuts (⌘K, number keys for tabs) — deferred to future enhancement
- Tab activity badges — deferred
- Gamification (achievements, collection score) — Approach C territory
- Tablet-optimized breakpoint — not requested
- Custom illustrations for empty states — use emoji/text for now, could add SVG illustrations later
