const HEADERS = {
  "User-Agent": "web:r-music-tracker:v1.0",
  "Accept": "application/atom+xml"
};

export default async function handler(req, res) {
  const subreddit = req.query.sub || "kpop";

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  if (subreddit === "popheads") {
    var flairs = [
      { query: 'flair:"fresh video"', category: "mv" },
      { query: 'flair:"fresh album"', category: "album" },
      { query: 'flair:"fresh"', category: "song" }
    ];

    var results = await Promise.all(flairs.map(function(f) {
      var searchUrl = "https://old.reddit.com/r/popheads/search.rss?q=" + encodeURIComponent(f.query) + "&sort=new&restrict_sr=on&t=day&limit=100";
      return fetch(searchUrl, { headers: HEADERS }).then(function(r) {
        if (!r.ok) return [];
        return r.text().then(function(xml) {
          var parsed = parseEntries(xml);
          for (var i = 0; i < parsed.length; i++) parsed[i].category = f.category;
          return parsed;
        });
      });
    }));

    var allPosts = [];
    for (var i = 0; i < results.length; i++) {
      for (var j = 0; j < results[i].length; j++) {
        allPosts.push(results[i][j]);
      }
    }

    return res.status(200).json({ posts: allPosts });
  }

  var rssUrl = "https://old.reddit.com/r/" + subreddit + "/new.rss?limit=100";
  var response = await fetch(rssUrl, { headers: HEADERS });

  if (!response.ok) {
    return res.status(response.status).json({ error: "Reddit returned " + response.status });
  }

  var xml = await response.text();
  if (xml.trimStart().startsWith("<html") || xml.trimStart().startsWith("<!DOCTYPE")) {
    return res.status(502).json({ error: "Reddit returned HTML instead of RSS" });
  }

  return res.status(200).json({ posts: parseEntries(xml) });
}

function parseEntries(xml) {
  var posts = [];
  var entries = xml.split("<entry>");
  for (var i = 1; i < entries.length; i++) {
    var entry = entries[i];

    var title = "";
    var titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    if (titleMatch) title = titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");

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
