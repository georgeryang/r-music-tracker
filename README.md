# Reddit Music Tracker

Track new music releases from r/kpop and r/popheads in the past 24 hours.

**Live site:** [georgeryang.github.io/r-music-tracker](https://georgeryang.github.io/r-music-tracker/)

## How It Works

A single HTML page fetches posts from Reddit via a [Vercel proxy](api/rss.js) that searches by subreddit flair (MV, Album, Audio, Teaser, FRESH, etc.) using RSS feeds. Results are categorized, cached, and displayed instantly when switching tabs.

## Stack

- **Frontend:** Single `index.html` hosted on GitHub Pages — no build step or dependencies
- **Proxy:** Vercel serverless function (`api/rss.js`) — parses Reddit RSS, deduplicates, and returns JSON with 5-minute edge caching

## License

MIT
