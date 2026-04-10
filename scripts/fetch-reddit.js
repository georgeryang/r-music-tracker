const fs = require('fs');
const path = require('path');

const FLAIR_MAP = {
  kpop: [
    { query: 'flair:"MV"', category: 'mv' },
    { query: 'flair:"Album Discussion"', category: 'album' },
    { query: 'flair:"Audio"', category: 'song' },
    { query: 'flair:"Teaser"', category: 'teaser' }
  ],
  popheads: [
    { query: 'flair:"fresh video"', category: 'mv' },
    { query: 'flair:"fresh album"', category: 'album' },
    { query: 'flair:"fresh ep"', category: 'album' },
    { query: 'flair:"[FRESH]"', category: 'song' }
  ]
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; r-music-tracker/1.0; +https://github.com/georgeryang/r-music-tracker)'
};

async function fetchFlair(subreddit, flair) {
  const url = 'https://www.reddit.com/r/' + subreddit + '/search.json?q=' +
    encodeURIComponent(flair.query) + '&sort=new&restrict_sr=on&t=day&limit=100&raw_json=1';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timeout);
    if (!r.ok) return null;
    const json = await r.json();
    const children = (json && json.data && json.data.children) || [];
    return children.map(c => ({
      title: c.data.title || '',
      url: 'https://www.reddit.com' + (c.data.permalink || ''),
      created_utc: c.data.created_utc || 0,
      thumbnail: c.data.thumbnail || '',
      category: flair.category
    }));
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function fetchSubreddit(subreddit) {
  const flairs = FLAIR_MAP[subreddit];
  const results = await Promise.all(flairs.map(f => fetchFlair(subreddit, f)));

  const failures = results.filter(r => r === null).length;
  if (failures === flairs.length) {
    console.error('All fetches failed for r/' + subreddit);
  }

  const seen = new Set();
  const posts = [];
  for (const group of results) {
    if (!group) continue;
    for (const post of group) {
      if (!seen.has(post.url)) {
        seen.add(post.url);
        posts.push(post);
      }
    }
  }

  return posts;
}

async function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  for (const subreddit of Object.keys(FLAIR_MAP)) {
    const posts = await fetchSubreddit(subreddit);
    const data = { fetched_at: Date.now(), posts };
    const filePath = path.join(dataDir, subreddit + '.json');
    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log('Wrote ' + filePath + ' (' + posts.length + ' posts)');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
