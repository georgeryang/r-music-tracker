# Implementation Plan: Multi-Subreddit Support

## Overview

Add support for r/popheads alongside r/kpop. Minimal changes: add subreddit selector UI, one state variable, and conditional logic in existing functions.

## Tasks

- [x] 1. Add subreddit state and selector UI
  - Add `activeSubreddit` global variable (default: 'kpop')
  - Add subreddit selector buttons in page header
  - Add CSS for button styling and active state
  - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.4_

- [x] 2. Create `switchSubreddit()` handler function
  - Update `activeSubreddit` variable
  - Toggle active class on buttons
  - Call `loadContent()` to reload posts
  - _Requirements: 1.4, 1.5, 8.2, 8.3_

- [x] 3. Update `categorizePost()` with conditional flair logic
  - Add r/kpop patterns: MV, Album, Audio, Teaser
  - Add r/popheads patterns: FRESH VIDEO, FRESH ALBUM, FRESH
  - Use `activeSubreddit` to select patterns
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [x] 4. Modify `fetchRedditPosts()` to use dynamic URL
  - Build URL using `activeSubreddit` variable
  - Keep CORS proxy and error handling
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 5. Add teasers button visibility logic
  - Show when `activeSubreddit === 'kpop'`
  - Hide when `activeSubreddit === 'popheads'`
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6. Handle mode switching for popheads
  - Switch to releases mode if in teasers when switching to popheads
  - Maintain mode when staying on r/kpop
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Convert mode buttons to tab-style UI
  - Replace pill-button styling with underline tab indicators
  - Add `.tab-btn` CSS class with bottom-border active state
  - Update dark mode styles for tabs
  - Update responsive styles for tabs on mobile

- [x] 8. Add per-subreddit collapse state tracking
  - Add `collapsedState` object keyed by subreddit name
  - Save collapse state in `toggleCategory()` under current subreddit
  - Add `restoreCollapseState()` function to restore state on subreddit switch
  - Call `restoreCollapseState()` in `switchSubreddit()`
  - _Requirements: 7.4_

- [x] 9. Performance optimization
  - CSS custom properties to eliminate dark mode duplication
  - Cached DOM references in `dom` object
  - DocumentFragment for batch DOM insertion
  - Reusable `Intl.DateTimeFormat` instances
  - Single `limit=100` request instead of 4 sequential `limit=25` requests
  - Pre-normalized flair at fetch time
  - `loading="lazy"` on thumbnail images
  - `<link rel="preconnect">` for CORS proxy domain
  - Specific CSS transition properties instead of `transition: all`
  - DOM API with `textContent` instead of innerHTML (XSS prevention + performance)
  - Decode `&amp;` in both thumbnail and preview URLs from Reddit API

- [x] 10. Add caching and manual refresh
  - Add `postCache` object keyed by subreddit name
  - Fetch both subreddits in parallel on page load
  - Switching subreddits/tabs uses cache only (no network requests)
  - Add circular refresh icon button in subreddit selector row
  - Refresh button fetches both subreddits in parallel and updates cache
  - No automatic background fetching or timers
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Notes

- All changes are additive to the existing single-file HTML structure
- No new abstractions or architectural changes needed
- No automatic network requests — Reddit API is only called on page load and manual refresh
