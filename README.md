# Reddit Music Tracker

A simple, single-file web app that displays recent music releases from r/kpop and r/popheads.

## Features

- Switch between r/kpop and r/popheads subreddits
- Tab-based navigation between New Releases and Teasers (r/kpop only)
- View new releases from the last 24 hours (default)
- Browse teasers for upcoming releases (r/kpop only)
- Organized by type: Music Videos (🎬), Albums (💿), and Songs (🎵)
- Sorted by newest first within each category
- Thumbnails on the left side of each post (🔥 placeholder if no image)
- Shows post date and time in your local timezone
- Collapsible sections with independent state per subreddit
- Manual refresh button to update data for both subreddits
- Works on desktop, iPad, and mobile
- No installation required

## Usage

### Online

Visit the live site: [https://georgeryang.github.io/r-music-tracker/](https://georgeryang.github.io/r-music-tracker/)

### Offline

1. Download `index.html`
2. Open it in any modern browser (Safari, Chrome, Edge, Firefox)
3. That's it!

You can also save it to iCloud Drive to access it on your iPhone or iPad.

## How It Works

The tracker fetches public posts from r/kpop and r/popheads using Reddit's JSON API and displays them in an easy-to-browse format. It uses a CORS proxy to work from any browser or device.

On page load, both subreddits are fetched in parallel and cached. Switching between subreddits and tabs uses cached data instantly with no additional network calls. Data is only re-fetched when the user presses the refresh button, which updates both subreddits at once.

### Subreddit-Specific Features

- **r/kpop**: Supports both "New Releases" and "Teasers" modes with categories for Music Videos, Albums, Songs, and Teasers
- **r/popheads**: Shows only new releases with categories for Music Videos (FRESH VIDEO), Albums (FRESH ALBUM), and Songs (FRESH)

## Technical Details

- Single HTML file with embedded CSS and JavaScript
- No build process or dependencies
- Uses Reddit's public JSON API (no authentication needed)
- Fetches 100 posts per subreddit in a single request
- Both subreddits fetched in parallel on load and refresh
- No automatic background fetching — data only updates on manual refresh
- Cached DOM references and DocumentFragment for efficient rendering
- CSS custom properties for theme support (light/dark mode)
- Responsive design for mobile and desktop

## Privacy

This app runs entirely in your browser. No data is collected or stored. It only fetches public posts from Reddit.

## License

MIT
