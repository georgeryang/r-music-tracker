# Design Document: Multi-Subreddit Support

## Overview

This design extends the Reddit Music Tracker to support r/popheads in addition to r/kpop. The implementation adds a simple subreddit selector and adjusts the existing flair categorization logic to handle both subreddits' flair patterns.

The application remains a single-file HTML with embedded CSS and JavaScript. It is optimized for performance: both subreddits are fetched in parallel on load and cached, with no automatic background requests. Data only refreshes when the user explicitly presses the refresh button.

### Key Design Goals

1. **Minimal code changes**: Add features to existing code without restructuring
2. **No new abstractions**: Use simple conditionals instead of configuration systems
3. **Performance-optimized**: Cached DOM references, DocumentFragment rendering, parallel fetching, CSS custom properties
4. **No automatic network requests**: Only fetch on page load and manual refresh to avoid Reddit rate limits
5. **Keep it simple**: Straightforward if/else logic over flexible patterns

## Architecture

No architectural changes. The existing single-file structure remains unchanged.

### Changes Required

1. Add global variables: `activeSubreddit`, `currentMode`, `collapsedState` (per-subreddit collapse tracking), and `postCache` (per-subreddit post cache)
2. Add subreddit selector buttons and a refresh button in the HTML
3. Use tab-style UI (underline indicator) for New Releases / Teasers mode switching
4. Modify `categorizePost()` to accept subreddit as a parameter for explicit categorization
5. Fetch both subreddits in parallel on page load with `limit=100` (single request each)
6. Cache posts per subreddit; switching subreddits/tabs uses cache only (no network calls)
7. Refresh button fetches both subreddits in parallel and updates the cache
8. Hide the entire tab bar (`.controls` container) when `activeSubreddit === 'popheads'`
9. Track and restore collapse state independently per subreddit via `collapsedState` object

No automatic background fetching. No new systems, no configuration objects, no abstractions.



## Components and Interfaces

### 1. Application State

```javascript
let activeSubreddit = 'kpop';  // 'kpop' or 'popheads'
let currentMode = 'releases';  // 'releases' or 'teasers'
const collapsedState = { kpop: {}, popheads: {} };  // Per-subreddit collapse state
const postCache = { kpop: null, popheads: null };   // Per-subreddit post cache
```

All DOM references are cached in a `dom` object at initialization to avoid repeated `getElementById` calls.

### 2. Subreddit Selector and Refresh Button

```html
<div class="subreddit-selector">
  <button class="subreddit-btn active" onclick="switchSubreddit('kpop')">r/kpop</button>
  <button class="subreddit-btn" onclick="switchSubreddit('popheads')">r/popheads</button>
  <button id="btn-refresh" class="refresh-btn" aria-label="Refresh">↻</button>
</div>
```

The refresh button is a circular icon-only button. Clicking it fetches both subreddits in parallel and updates the cache.

### 3. Modified Flair Categorization

Flair text is pre-normalized to lowercase during fetch (stored as `post.flair`). The `categorizePost()` function takes the subreddit as an explicit parameter to avoid reading global state:

```javascript
function categorizePost(flair, subreddit) {
  if (!flair) return null;
  if (subreddit === 'kpop') {
    if (flair.includes('mv') || flair.includes('m/v') || flair.includes('music video')) return 'mv';
    if (flair.includes('album') || flair.includes('ep') || flair.includes('mini')) return 'album';
    if (flair.includes('audio')) return 'song';
    if (flair.includes('teaser')) return 'teaser';
  } else {
    if (flair.includes('fresh video')) return 'mv';
    if (flair.includes('fresh album')) return 'album';
    if (flair === 'fresh' || flair === '[fresh]') return 'song';
  }
  return null;
}
```

### 4. Data Fetching and Caching

`fetchFromReddit(subreddit)` fetches 100 posts in a single request and caches the result. Both thumbnail and preview URLs are decoded (`&amp;` → `&`). Flair text is pre-normalized to lowercase at fetch time.

On page load, both subreddits are fetched in parallel:
```javascript
Promise.all([fetchFromReddit('kpop'), fetchFromReddit('popheads')])
```

The refresh button calls `refreshData()` which does the same parallel fetch, updating both caches.

### 5. Subreddit Switch Handler

Add new function:

```javascript
function switchSubreddit(subreddit) {
  activeSubreddit = subreddit;

  // Update button styles
  document.querySelectorAll('.subreddit-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Hide mode tabs for popheads (no teasers support)
  const teasersBtn = document.getElementById('btn-teasers');
  const releasesBtn = document.getElementById('btn-releases');
  if (subreddit === 'kpop') {
    teasersBtn.style.display = 'inline-block';
    releasesBtn.style.display = 'inline-block';
  } else {
    teasersBtn.style.display = 'none';
    releasesBtn.style.display = 'none';
    if (currentMode === 'teasers') {
      currentMode = 'releases';
    }
  }

  // Restore per-subreddit collapse state
  restoreCollapseState();

  // Reload content
  loadContent();
}
```

### 6. Per-Subreddit Collapse State

Collapse/expand state is tracked independently per subreddit:

```javascript
function toggleCategory(category) {
  const content = document.getElementById(`${category}-content`);
  const icon = document.getElementById(`${category}-icon`);
  content.classList.toggle('collapsed');
  icon.classList.toggle('collapsed');
  collapsedState[activeSubreddit][category] = content.classList.contains('collapsed');
}

function restoreCollapseState() {
  const state = collapsedState[activeSubreddit];
  ['teaser', 'mv', 'album', 'song'].forEach(category => {
    const content = document.getElementById(`${category}-content`);
    const icon = document.getElementById(`${category}-icon`);
    if (state[category]) {
      content.classList.add('collapsed');
      icon.classList.add('collapsed');
    } else {
      content.classList.remove('collapsed');
      icon.classList.remove('collapsed');
    }
  });
}
```



## Data Models

Posts are stored with pre-normalized flair and decoded thumbnail URLs:

```javascript
{ title, url, created_utc, flair, thumbnail }
```

State variables: `activeSubreddit`, `currentMode`, `collapsedState` (per-subreddit), `postCache` (per-subreddit). All DOM references are cached in a `dom` object.



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Subreddit-Specific Flair Categorization

*For any* post with a flair, when `activeSubreddit` is 'kpop', posts with flairs containing "mv", "m/v", "music video", "album", "ep", "mini album", "audio", or "teaser" should be categorized correctly; when `activeSubreddit` is 'popheads', posts with flairs "fresh video", "fresh album", or exactly "fresh" should be categorized correctly.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3**

### Property 2: API Endpoint Uses Active Subreddit

*For any* value of `activeSubreddit`, the API fetch URL should contain `/r/${activeSubreddit}.json`.

**Validates: Requirements 2.1**

### Property 3: CORS Proxy Wrapping

*For any* Reddit API request, the URL should be wrapped with the CORS proxy prefix.

**Validates: Requirements 2.5**

### Property 4: Subreddit Selection Uses Cache

*For any* subreddit button click, `activeSubreddit` should update to the clicked subreddit value and content should render from cache without making network requests.

**Validates: Requirements 1.4, 2.3, 2.4**

### Property 5: Teasers Tab Visibility

*For any* value of `activeSubreddit`, the entire tab bar (`.controls` container) should be visible only when `activeSubreddit === 'kpop'`.

**Validates: Requirements 6.1, 6.2**

### Property 6: Consistent Category Display

*For any* subreddit in releases mode, Music Videos, Albums, and Songs accordion sections should be present in the DOM.

**Validates: Requirements 7.1, 7.2**

### Property 7: Active Subreddit Visual Indication

*For any* value of `activeSubreddit`, exactly one subreddit button should have the "active" class, and it should match the current `activeSubreddit` value.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 8: Independent Per-Subreddit Collapse State

*For any* category collapse/expand action, the state should be saved under `collapsedState[activeSubreddit]` and restored when switching back to that subreddit. Collapsing a category in one subreddit should not affect the same category in another subreddit.

**Validates: Requirements 7.4**

### Property 9: No Automatic Network Requests

*After* the initial page load, *no* network requests should be made unless the user explicitly presses the refresh button. Switching subreddits, switching tabs, and collapsing/expanding categories must all operate on cached data only.

**Validates: Requirements 2.4, 9.4**

### Property 10: Parallel Fetch on Load and Refresh

*On* page load and *on* refresh button click, both r/kpop and r/popheads should be fetched in parallel (not sequentially), and both caches should be updated.

**Validates: Requirements 2.1, 9.2, 9.3**

### Property 11: Consistent Date Range Filtering

*For any* subreddit, posts should be filtered to only include those from the last 24 hours calculated from the current time.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 12: Tab-Style Mode Selector

*For any* mode (releases or teasers), the active mode should be indicated with an underline tab style, not a filled button style.

**Validates: UI consistency**



## Error Handling

Keep existing error handling. Add one check:

- If user is in teasers mode and switches to popheads, automatically switch to releases mode (no error message needed)



## Testing Strategy

Manual testing only. No additional test infrastructure or dependencies.

### Manual Testing Checklist

- [ ] Page loads with r/kpop selected and both subreddits fetched in parallel
- [ ] Clicking r/popheads switches instantly from cache (no loading spinner)
- [ ] Clicking r/kpop switches back instantly from cache
- [ ] Mode tabs (New Releases / Teasers) display as underline tabs, not pill buttons
- [ ] Entire tab bar visible for r/kpop, hidden for r/popheads
- [ ] Switching from teasers mode to r/popheads switches to releases mode
- [ ] r/kpop flairs categorize correctly (MV, Album, Audio, Teaser)
- [ ] r/popheads flairs categorize correctly (FRESH VIDEO, FRESH ALBUM, FRESH)
- [ ] Active tab has underline indicator styling
- [ ] Collapsing Music Videos in r/kpop does not collapse Music Videos in r/popheads
- [ ] Collapse state is restored when switching back to a subreddit
- [ ] Refresh button fetches both subreddits and updates displayed content
- [ ] No network requests occur when switching subreddits/tabs (verify in Network tab)
- [ ] Thumbnails display correctly (with referrerpolicy="no-referrer")
- [ ] Content displays correctly for both subreddits

