# Reddit Music Tracker

Track new music releases from r/kpop and r/popheads in the past 24 hours.

**Live site:** [georgeryang.github.io/r-music-tracker](https://georgeryang.github.io/r-music-tracker/)

## How It Works

A GitHub Actions cron job runs every 30 minutes, fetching posts from Reddit's JSON API filtered by subreddit flair (MV, Album, Audio, Teaser, FRESH, etc.). Results are saved as static JSON files and deployed to GitHub Pages. The frontend loads these pre-built data files — no API calls at page-load time.

## Stack

- **Frontend:** Single `index.html` with separate `app.js` — hosted on GitHub Pages, no build step or dependencies
- **Data pipeline:** `scripts/fetch-reddit.js` — Node.js script (zero deps) that fetches Reddit data via `curl` and writes `data/kpop.json` + `data/popheads.json`
- **Deployment:** GitHub Actions (`.github/workflows/static.yml`) — runs on push, on schedule, and on manual trigger

## Updating Data

Data refreshes automatically via the GitHub Actions cron. To update manually:

```
node scripts/fetch-reddit.js
git add data/ && git commit -m "Update data" && git push
```

## License

MIT
