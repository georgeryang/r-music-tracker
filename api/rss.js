const HEADERS = {
  "User-Agent": "web:r-music-tracker:v1.0",
  "Accept": "application/atom+xml"
};

const ALLOWED_ORIGINS = [
  "https://georgeryang.github.io",
  "http://localhost:3000"
];

const ALLOWED_SUBS = ["kpop", "popheads"];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  const subreddit = req.query.sub || "kpop";
  if (!ALLOWED_SUBS.includes(subreddit)) {
    return res.status(400).json({ error: "Unknown subreddit" });
  }

  var flairMap = {
    kpop: [
      { query: 'flair:"MV"', category: "mv" },
      { query: 'flair:"Album Discussion"', category: "album" },
      { query: 'flair:"Audio"', category: "song" },
      { query: 'flair:"Teaser"', category: "teaser" }
    ],
    popheads: [
      { query: 'flair:"fresh video"', category: "mv" },
      { query: 'flair:"fresh album"', category: "album" },
      { query: 'flair:"[FRESH]"', category: "song" }
    ]
  };

  var flairs = flairMap[subreddit];

  var results = await Promise.all(flairs.map(function(f) {
    var searchUrl = "https://old.reddit.com/r/" + subreddit + "/search.rss?q=" + encodeURIComponent(f.query) + "&sort=new&restrict_sr=on&t=day&limit=100";
    return fetch(searchUrl, { headers: HEADERS }).then(function(r) {
      if (!r.ok) return [];
      return r.text().then(function(xml) {
        var parsed = parseEntries(xml);
        for (var i = 0; i < parsed.length; i++) parsed[i].category = f.category;
        return parsed;
      });
    });
  }));

  var seen = {};
  var allPosts = [];
  for (var i = 0; i < results.length; i++) {
    for (var j = 0; j < results[i].length; j++) {
      var post = results[i][j];
      if (!seen[post.url]) {
        seen[post.url] = true;
        allPosts.push(post);
      }
    }
  }

  return res.status(200).json({ posts: allPosts });
}

function parseEntries(xml) {
  var posts = [];
  var entries = xml.split("<entry>");
  for (var i = 1; i < entries.length; i++) {
    var entry = entries[i];

    var title = "";
    var titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    if (titleMatch) title = titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/<[^>]*>/g, "");

    var link = "";
    var linkMatch = entry.match(/<link href="([^"]+)"/);
    if (linkMatch) link = linkMatch[1].replace(/&amp;/g, "&").replace("old.reddit.com", "www.reddit.com");

    var published = "";
    var pubMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
    if (pubMatch) published = pubMatch[1];
    var createdUtc = Math.floor(new Date(published).getTime() / 1000);

    var thumbnail = "";
    var thumbMatch = entry.match(/<media:thumbnail url="([^"]+)"/);
    if (thumbMatch) thumbnail = thumbMatch[1].replace(/&amp;/g, "&");

    posts.push({
      title: title,
      url: link,
      created_utc: createdUtc,
      thumbnail: thumbnail
    });
  }
  return posts;
}
