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

## Notes

- All changes are additive to the existing single-file HTML structure
- No new abstractions or architectural changes needed
