# Reddit Music Tracker

Track new music releases from r/kpop and r/popheads in the past 24 hours.

**Live site:** [georgeryang.github.io/r-music-tracker](https://georgeryang.github.io/r-music-tracker/)

## Quick Start

**Option A — Double-click** (easiest):
- macOS: double-click `start.command`
- Windows: double-click `start.bat`

The browser opens automatically. Requires [Node.js](https://nodejs.org) and curl.

**Option B — Terminal:**
```bash
git clone https://github.com/georgeryang/r-music-tracker.git
cd r-music-tracker
npm start -- --open
```

## How It Works

A local Node.js server fetches data from Reddit every 6 hours using `curl` (Reddit blocks automated requests from cloud platforms). When new data is found, it commits and pushes to GitHub, which triggers a GitHub Pages deploy.

The UI has two server-only buttons (hidden on the live site):
- **Refresh** — fetch new data from Reddit
- **Publish to Web** — commit and push data to GitHub

## Stack

- **Frontend:** Single `index.html` + `app.js` — no build step, no dependencies
- **Server:** `server.js` — zero-dependency Node.js server (built-in modules only)
- **Data pipeline:** `scripts/fetch-reddit.js` — fetches Reddit data via `curl`
- **Deployment:** GitHub Actions deploys to GitHub Pages on push

## Options

```bash
npm start                       # Default: port 3000
npm start -- --port 8080        # Custom port
npm start -- --open             # Open browser automatically
```

## Manual fetch (no server)

```bash
npm run fetch                   # Just fetch data to data/*.json
```

## License

MIT
