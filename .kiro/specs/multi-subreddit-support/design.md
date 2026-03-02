# Design Document: Multi-Subreddit Support

## Overview

This design extends the Reddit Music Tracker to support r/popheads in addition to r/kpop. The implementation adds a simple subreddit selector and adjusts the existing flair categorization logic to handle both subreddits' flair patterns.

The application remains a single-file HTML with embedded CSS and JavaScript. Changes are minimal: add two buttons, one state variable, and extend the existing categorization function with conditional logic.

### Key Design Goals

1. **Minimal code changes**: Add features to existing code without restructuring
2. **No new abstractions**: Use simple conditionals instead of configuration systems
3. **Zero performance overhead**: No additional data structures or processing
4. **Keep it simple**: Straightforward if/else logic over flexible patterns

## Architecture

No architectural changes. The existing single-file structure remains unchanged.

### Changes Required

1. Add one global variable: `let activeSubreddit = 'kpop'`
2. Add two buttons in the HTML for subreddit selection
3. Modify `categorizePost()` to check `activeSubreddit` and use different flair patterns
4. Modify `fetchRedditPosts()` to use `activeSubreddit` in the URL
5. Hide teasers button when `activeSubreddit === 'popheads'`

That's it. No new systems, no configuration objects, no abstractions.



## Components and Interfaces

### 1. Active Subreddit State

Add one global variable:

```javascript
let activeSubreddit = 'kpop';  // 'kpop' or 'popheads'
```

### 2. Subreddit Selector Buttons

Add to HTML header:

```html
<div class="subreddit-selector">
  <button class="subreddit-btn active" onclick="switchSubreddit('kpop')">r/kpop</button>
  <button class="subreddit-btn" onclick="switchSubreddit('popheads')">r/popheads</button>
</div>
```

### 3. Modified Flair Categorization

Update existing `categorizePost()` function with simple conditionals:

```javascript
function categorizePost(post) {
  const flair = post.link_flair_text.toLowerCase().trim();
  
  if (activeSubreddit === 'kpop') {
    // r/kpop flair patterns
    if (flair.includes('mv') || flair.includes('m/v') || flair.includes('music video')) return 'mv';
    if (flair.includes('album') || flair.includes('ep') || flair.includes('mini album')) return 'album';
    if (flair.includes('audio')) return 'song';
    if (flair.includes('teaser')) return 'teaser';
  } else {
    // r/popheads flair patterns
    if (flair.includes('fresh video')) return 'mv';
    if (flair.includes('fresh album')) return 'album';
    if (flair === 'fresh') return 'song';  // Exact match only
  }
  
  return null;
}
```

### 4. Modified API Fetch

Update existing `fetchRedditPosts()` to use dynamic URL:

```javascript
async function fetchRedditPosts() {
  const subreddit = activeSubreddit === 'kpop' ? 'kpop' : 'popheads';
  const baseUrl = `https://www.reddit.com/r/${subreddit}.json`;
  // Rest stays the same
}
```

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
  
  // Hide teasers button for popheads
  const teasersBtn = document.getElementById('btn-teasers');
  teasersBtn.style.display = subreddit === 'kpop' ? 'inline-block' : 'none';
  
  // Switch to releases mode if in teasers mode and switching to popheads
  if (subreddit === 'popheads' && currentMode === 'teasers') {
    switchToReleasesMode();
  }
  
  // Reload content
  loadContent();
}
```



## Data Models

No changes to existing data models. Posts remain the same structure, and we add one simple state variable (`activeSubreddit`).



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

### Property 4: Subreddit Selection Updates State

*For any* subreddit button click, `activeSubreddit` should update to the clicked subreddit value and content should reload.

**Validates: Requirements 1.4, 1.5**

### Property 5: Teasers Button Visibility

*For any* value of `activeSubreddit`, the teasers button should be visible only when `activeSubreddit === 'kpop'`.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 6: Consistent Category Display

*For any* subreddit in releases mode, Music Videos, Albums, and Songs accordion sections should be present in the DOM.

**Validates: Requirements 7.1, 7.2**

### Property 7: Active Subreddit Visual Indication

*For any* value of `activeSubreddit`, exactly one subreddit button should have the "active" class, and it should match the current `activeSubreddit` value.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 8: Consistent Date Range Filtering

*For any* subreddit, posts should be filtered to only include those from the last 24 hours calculated from the current time.

**Validates: Requirements 9.1, 9.2, 9.3**



## Error Handling

Keep existing error handling. Add one check:

- If user is in teasers mode and switches to popheads, automatically switch to releases mode (no error message needed)



## Testing Strategy

Manual testing only. No additional test infrastructure or dependencies.

### Manual Testing Checklist

- [ ] Page loads with r/kpop selected
- [ ] Clicking r/popheads button switches subreddit and loads content
- [ ] Clicking r/kpop button switches back
- [ ] Teasers button visible for r/kpop, hidden for r/popheads
- [ ] Switching from teasers mode to r/popheads switches to releases mode
- [ ] r/kpop flairs categorize correctly (MV, Album, Audio, Teaser)
- [ ] r/popheads flairs categorize correctly (FRESH VIDEO, FRESH ALBUM, FRESH)
- [ ] Active button has visual styling
- [ ] Content displays correctly for both subreddits

