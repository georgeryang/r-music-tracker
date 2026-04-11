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
npm start
```

Open http://localhost:3000.

## How It Works

A local Node.js server serves the tracker page and auto-refreshes data from Reddit every 6 hours, committing and pushing to GitHub (which triggers a GitHub Pages deploy). Click the **Refresh** button in the UI to fetch + push immediately.

Data is fetched locally because Reddit blocks automated requests from cloud platforms.

### Data refresh triggers

1. **Every 6 hours** — automatic fetch + commit + push
2. **Manual** — click Refresh in the UI

## Stack

- **Frontend:** Single `index.html` with separate `app.js` — no build step, no dependencies
- **Server:** `server.js` — zero-dependency Node.js server (built-in modules only)
- **Data pipeline:** `scripts/fetch-reddit.js` — fetches Reddit data via `curl`
- **Deployment:** GitHub Actions deploys to GitHub Pages on push

## Options

```bash
npm start                       # Default: port 3000, auto-refresh every 6 hours
npm start -- --port 8080        # Custom port
npm start -- --interval 60      # Auto-refresh every 60 minutes
npm start -- --interval 0       # Disable auto-refresh (manual only)
```

## Manual fetch (no server)

```bash
npm run fetch                   # Just fetch data to data/*.json
```

## License

MIT
