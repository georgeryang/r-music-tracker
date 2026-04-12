const { exec } = require('child_process');
const fs = require('fs').promises;
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

  return new Promise((resolve) => {
    exec(
      `curl -sS -w "\\nHTTP_STATUS:%{http_code}" --max-time 8 -H "User-Agent: ${UA}" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7" -H "Accept-Language: en-US,en;q=0.5" "${url}"`,
      { encoding: 'utf8', timeout: 10000 },
      (err, stdout, stderr) => {
        if (err) {
          console.error('Failed: ' + subreddit + '/' + flair.category + ' - ' + (stderr || err.message).substring(0, 300));
          return resolve(null);
        }
        const raw = stdout;
        const statusMatch = raw.match(/HTTP_STATUS:(\d+)/);
        const status = statusMatch ? statusMatch[1] : 'unknown';
        const body = raw.replace(/\nHTTP_STATUS:\d+$/, '');
        if (status !== '200') {
          console.error('HTTP ' + status + ' for ' + subreddit + '/' + flair.category + ': ' + body.substring(0, 200));
          return resolve(null);
        }
        try {
          const json = JSON.parse(body);
          const children = (json && json.data && json.data.children) || [];
          console.log('OK: ' + subreddit + '/' + flair.category + ' — ' + children.length + ' posts');
          resolve(children.map(c => ({
            title: c.data.title || '',
            url: 'https://www.reddit.com' + (c.data.permalink || ''),
            created_utc: c.data.created_utc || 0,
            thumbnail: c.data.thumbnail || '',
            category: flair.category
          })));
        } catch (parseErr) {
          console.error('Parse error: ' + subreddit + '/' + flair.category + ' - ' + parseErr.message);
          resolve(null);
        }
      }
    );
  });
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
  await fs.mkdir(dataDir, { recursive: true });

  const subreddits = Object.keys(FLAIR_MAP);
  const allPosts = await Promise.all(subreddits.map(s => fetchSubreddit(s)));

  await Promise.all(subreddits.map(async (subreddit, i) => {
    const posts = allPosts[i];
    const filePath = path.join(dataDir, subreddit + '.json');
    if (posts.length > 0) {
      const data = { fetched_at: Date.now(), posts };
      await fs.writeFile(filePath, JSON.stringify(data));
      console.log('Wrote ' + filePath + ' (' + posts.length + ' posts)');
    } else {
      console.log('Skipped ' + filePath + ' (0 posts, keeping existing)');
    }
  }));
}

main();
