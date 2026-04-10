const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

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

function fetchFlair(subreddit, flair) {
  const url = 'https://www.reddit.com/r/' + subreddit + '/search.json?q=' +
    encodeURIComponent(flair.query) + '&sort=new&restrict_sr=on&t=day&limit=100&raw_json=1';
  try {
    const raw = execSync(
      `curl -sS -w "\\nHTTP_STATUS:%{http_code}" --max-time 8 -H "User-Agent: ${UA}" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7" -H "Accept-Language: en-US,en;q=0.5" "${url}"`,
      { encoding: 'utf8', timeout: 10000 }
    );
    const statusMatch = raw.match(/HTTP_STATUS:(\d+)/);
    const status = statusMatch ? statusMatch[1] : 'unknown';
    const body = raw.replace(/\nHTTP_STATUS:\d+$/, '');
    if (status !== '200') {
      console.error('HTTP ' + status + ' for ' + subreddit + '/' + flair.category + ': ' + body.substring(0, 200));
      return null;
    }
    const json = JSON.parse(body);
    const children = (json && json.data && json.data.children) || [];
    console.log('OK: ' + subreddit + '/' + flair.category + ' — ' + children.length + ' posts');
    return children.map(c => ({
      title: c.data.title || '',
      url: 'https://www.reddit.com' + (c.data.permalink || ''),
      created_utc: c.data.created_utc || 0,
      thumbnail: c.data.thumbnail || '',
      category: flair.category
    }));
  } catch (err) {
    console.error('Failed: ' + subreddit + '/' + flair.category + ' - ' + (err.stderr || err.message).substring(0, 300));
    return null;
  }
}

function fetchSubreddit(subreddit) {
  const flairs = FLAIR_MAP[subreddit];
  const results = flairs.map(f => fetchFlair(subreddit, f));

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

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

for (const subreddit of Object.keys(FLAIR_MAP)) {
  const posts = fetchSubreddit(subreddit);
  const filePath = path.join(dataDir, subreddit + '.json');
  if (posts.length > 0) {
    const data = { fetched_at: Date.now(), posts };
    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log('Wrote ' + filePath + ' (' + posts.length + ' posts)');
  } else {
    console.log('Skipped ' + filePath + ' (0 posts, keeping existing)');
  }
}
