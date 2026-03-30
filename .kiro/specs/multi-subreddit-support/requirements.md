# Requirements Document

## Introduction

This feature extends the Reddit Music Tracker to support multiple subreddits. Currently, the application only tracks releases from r/kpop. This enhancement will allow users to switch between r/kpop and r/popheads, with each subreddit using its own flair categorization system while maintaining the same user interface structure.

## Glossary

- **Application**: The Reddit Music Tracker web application
- **Subreddit_Selector**: UI component that allows users to switch between subreddits
- **Reddit_API**: Reddit's JSON API accessed through a CORS proxy
- **Flair_Mapper**: Component that maps subreddit-specific flairs to content categories
- **Content_Category**: One of Music Videos, Albums, Songs, or Teasers
- **Active_Subreddit**: The currently selected subreddit (r/kpop or r/popheads)
- **Mode**: Either "New Releases" or "Teasers" view

## Requirements

### Requirement 1: Subreddit Selection

**User Story:** As a user, I want to switch between r/kpop and r/popheads, so that I can track releases from both communities.

#### Acceptance Criteria

1. THE Application SHALL display a Subreddit_Selector at the top of the page
2. THE Subreddit_Selector SHALL provide options for "r/kpop" and "r/popheads"
3. WHEN the page loads, THE Application SHALL set r/kpop as the Active_Subreddit
4. WHEN a user selects a subreddit, THE Application SHALL update the Active_Subreddit
5. WHEN the Active_Subreddit changes, THE Application SHALL reload content from the selected subreddit

### Requirement 2: Subreddit-Specific Data Fetching

**User Story:** As a user, I want the application to fetch posts from both subreddits, so that I can switch between them instantly.

#### Acceptance Criteria

1. WHEN the page loads, THE Application SHALL fetch 100 posts from both r/kpop and r/popheads in parallel
2. THE Application SHALL cache fetched posts per subreddit in memory
3. WHEN the Active_Subreddit changes, THE Application SHALL display cached posts without making additional network requests
4. THE Application SHALL NOT make any automatic or background network requests after the initial load
5. THE Application SHALL continue using the CORS proxy for all Reddit_API requests
6. THE Application SHALL fetch posts using a single request with `limit=100` per subreddit

### Requirement 3: Flair Mapping for r/kpop

**User Story:** As a user viewing r/kpop, I want posts categorized using existing flair patterns, so that the current functionality remains unchanged.

#### Acceptance Criteria

1. WHEN the Active_Subreddit is r/kpop, THE Flair_Mapper SHALL categorize posts with "MV", "M/V", or "Music Video" flairs as Music Videos
2. WHEN the Active_Subreddit is r/kpop, THE Flair_Mapper SHALL categorize posts with "Album", "EP", or "Mini Album" flairs as Albums
3. WHEN the Active_Subreddit is r/kpop, THE Flair_Mapper SHALL categorize posts with "Audio" flair as Songs
4. WHEN the Active_Subreddit is r/kpop, THE Flair_Mapper SHALL categorize posts with "Teaser" flair as Teasers

### Requirement 4: Flair Mapping for r/popheads

**User Story:** As a user viewing r/popheads, I want posts categorized using r/popheads-specific flairs, so that I see properly organized content.

#### Acceptance Criteria

1. WHEN the Active_Subreddit is r/popheads, THE Flair_Mapper SHALL categorize posts with "FRESH VIDEO" flair as Music Videos
2. WHEN the Active_Subreddit is r/popheads, THE Flair_Mapper SHALL categorize posts with "FRESH ALBUM" flair as Albums
3. WHEN the Active_Subreddit is r/popheads, THE Flair_Mapper SHALL categorize posts with "FRESH" flair (exact match) as Songs

### Requirement 5: Mode Persistence Across Subreddits

**User Story:** As a user, I want the selected mode to persist when switching subreddits where applicable, so that I maintain my viewing preference.

#### Acceptance Criteria

1. WHEN a user switches the Active_Subreddit from r/kpop to r/kpop, THE Application SHALL maintain the current Mode
2. WHEN Mode is "New Releases" AND Active_Subreddit changes, THE Application SHALL display Music Videos, Albums, and Songs categories
3. WHEN Mode is "Teasers" AND Active_Subreddit changes to r/popheads, THE Application SHALL switch to "New Releases" mode
4. WHEN Active_Subreddit changes from r/popheads to r/kpop, THE Application SHALL maintain "New Releases" mode

### Requirement 6: Conditional Teasers Tab Display

**User Story:** As a user, I want to see only the mode tabs that are relevant to the active subreddit, so that I don't encounter non-functional features.

#### Acceptance Criteria

1. WHEN the Active_Subreddit is r/kpop, THE Application SHALL display the tab bar with both "New Releases" and "Teasers" mode tabs
2. WHEN the Active_Subreddit is r/popheads, THE Application SHALL hide the entire tab bar
3. WHEN the Active_Subreddit is r/popheads, THE Application SHALL NOT display the Teasers accordion section

### Requirement 7: User Interface Consistency

**User Story:** As a user, I want a consistent interface layout when viewing content, so that I have a familiar experience.

#### Acceptance Criteria

1. THE Application SHALL maintain the same accordion structure for content categories across all subreddits
2. THE Application SHALL display Music Videos, Albums, and Songs categories for all subreddits
3. THE Application SHALL maintain the same styling and layout when switching between subreddits
4. THE Application SHALL preserve the collapse/expand state of categories independently per subreddit, so that collapsing a category in one subreddit does not affect the same category in another subreddit

### Requirement 8: Visual Feedback for Active Subreddit

**User Story:** As a user, I want to clearly see which subreddit is currently active, so that I know what content I'm viewing.

#### Acceptance Criteria

1. THE Subreddit_Selector SHALL visually indicate the Active_Subreddit
2. WHEN a subreddit option is selected, THE Application SHALL apply an "active" visual state to that option
3. THE Application SHALL display only one subreddit as active at any time
4. WHEN the page loads, THE Subreddit_Selector SHALL show r/kpop as active

### Requirement 9: Manual Refresh

**User Story:** As a user, I want to manually refresh data when I choose, so that I control when network requests are made and avoid being rate-limited by Reddit.

#### Acceptance Criteria

1. THE Application SHALL display a refresh button in the subreddit selector row
2. WHEN the refresh button is clicked, THE Application SHALL fetch fresh data for both r/kpop and r/popheads in parallel
3. WHEN the refresh completes, THE Application SHALL update the cache and re-render the active subreddit's content
4. THE Application SHALL NOT make any automatic or scheduled network requests
5. THE Application SHALL show a loading indicator while the refresh is in progress

### Requirement 10: Date Range Filtering

**User Story:** As a user, I want date range filtering to work consistently across all subreddits, so that I see recent content regardless of my selection.

#### Acceptance Criteria

1. THE Application SHALL apply the same 24-hour date range filter to all subreddits
2. WHEN the Active_Subreddit changes, THE Application SHALL filter posts from the new subreddit using the current date range
3. THE Application SHALL calculate the date range based on the current time when content is loaded
