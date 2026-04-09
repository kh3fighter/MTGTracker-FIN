# Search Modal Redesign

**Date:** 2026-04-09
**Replaces:** Command Deck (cmd-overlay, cmd-palette, cmd-trigger, search-fab "Command" label)

## Problem

The current "Command Deck" is a full-screen command palette pattern (Ctrl+K, action list, keyboard hints) that feels out of place in a card collection tracker. It bundles card search with quick actions in a developer-oriented UI that doesn't match the app's purpose. The mobile FAB labeled "Command" with a search icon is confusing.

## Solution

Replace the Command Deck with a **Search Modal** — a centered, non-fullscreen modal focused on card search with compact quick-action chips.

## Modal Structure

Top to bottom layout:

1. **Search input** — auto-focused on open, placeholder "Search cards..."
2. **Quick-action chips** — horizontal row of compact pill buttons: Open Pack, Theme, Sync
3. **Results area** — scrollable card rows with thumbnails, or empty state when no query

No title bar, no "Command" label, no footer, no keyboard shortcut hints inside the modal.

## Triggers

| Context | Element | Change |
|---------|---------|--------|
| Desktop header | `cmd-trigger` pill | Relabel from "Command..." to search icon + "Search cards..." + `Ctrl K` kbd hint. Same position and styling. |
| Mobile bottom nav | Center FAB | Same search icon circle. Relabel from "Command" to "Search". |
| Keyboard | `Ctrl+K`, `/` | Unchanged — opens search modal. `Esc` closes. |
| Sync chip | Header sync indicator | Directly opens sync modal (no longer opens search modal with pre-filled query, since there's no action list to filter). |

## Search Behavior

- Auto-focused immediately on open
- Searches by card name and collector number
- Results appear live as user types, minimum 1 character
- Searches both `allCards` and `variantCards`
- Up to 10 results shown

## Card Result Rows

Each row displays:
- Thumbnail image (`image_uris.small`)
- Card name
- `#collector_number` / rarity / price in RM
- Badges: Owned checkmark, Foil indicator, Collector tag for variants

**Click behavior:** Closes search modal, opens card detail modal.

**Keyboard nav:** Arrow up/down to highlight rows, Enter to select (existing behavior preserved).

## Quick-Action Chips

Three compact pill buttons in a horizontal row between search input and results:

| Chip | Icon color | Action on click |
|------|-----------|-----------------|
| Open Pack | Gold (`--gold`) | Close modal, open pack modal |
| Theme | Accent blue (`--accent`) | Toggle theme inline (modal stays open so user sees the change) |
| Sync | Green (`#4aad5e`) | Close modal, open sync modal |

Chips are always visible (pinned between search input and scrollable results area). They do not scroll away.

## Empty State

When modal opens with no query typed: chips visible, results area shows "Type to search 309+ cards" in muted text.

## Visual Design

### Modal
- `max-width: 520px`, `max-height: 70vh`
- Centered vertically with slight upward offset
- `border-radius: 12px`
- Subtle border (`--ff-border`), box shadow matching existing card modal
- Backdrop: `rgba` dim overlay (no blur)

### Animation
- Modal: fade + scale in (`scale(0.97)` to `scale(1)`, 150ms ease)
- Backdrop: fade in simultaneously

### Mobile Adaptation
- Modal width: `calc(100% - 32px)` (16px margin each side)
- Chips may wrap to 2 rows on very narrow screens (3 chips fit on most phones)
- `inputmode="search"` on input for mobile keyboard
- Touch targets on card rows: minimum 44px height

## What Gets Removed

- `cmd-overlay` full-screen overlay behavior
- `cmd-palette` container and its `cmd-header` / `cmd-title` / `cmd-footer`
- `CMD_ITEMS` array (actions defined as command palette items with badge functions)
- `cmd-action` list rendering (icon boxes, action names, hint text, badges)
- `.cmd-sheet-handle` mobile sheet handle
- "Command" label on mobile FAB
- "Command" title in overlay header
- `cmd-badge-*` status badges on action items (Connected, Dark/Light, Not Set Up)
- `cmd-footer` with keyboard shortcut hints

## What Gets Kept (Reused)

- `openCommandDeck()` / `closeCommandDeck()` / `isCommandDeckOpen()` — renamed to `openSearchModal()` / `closeSearchModal()` / `isSearchModalOpen()`
- Card search logic from `renderCommandActions()` — the card filtering and result row rendering
- `ac-card-row` styling for card results
- Keyboard shortcuts (`Ctrl+K`, `/`, `Esc`)
- Arrow key navigation and highlight logic
- `window.openSearchPage` alias (used by dashboard)
- Sync chip click handler

## CSS Classes Renamed

| Old | New |
|-----|-----|
| `.cmd-overlay` | `.search-overlay` |
| `.cmd-palette` | `.search-modal` |
| `.cmd-trigger` | `.search-trigger` |
| `.cmd-search` | `.search-input-row` |
| `.cmd-actions` | `.search-results` |
| `.cmd-close` | `.search-close` |

New classes added:
- `.search-chips` — horizontal chip row container
- `.search-chip` — individual action chip pill
- `.search-empty` — empty state message
