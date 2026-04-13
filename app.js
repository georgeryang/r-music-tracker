// Unregister stale service workers from previous deployments
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
    });
}

// State
let activeSubreddit = 'kpop';
let currentMode = 'releases';
const collapsedState = { kpop: {}, popheads: {} };
const postCache = { kpop: null, popheads: null };
const lastFetchTime = { kpop: null, popheads: null };

// Cached DOM references (set once in initializeApp)
let dom = {};
const CATEGORIES = ['teaser', 'mv', 'album', 'song'];

// Date/time formatters (reuse instead of creating per-post)
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

function showSkeleton() {
    const item = '<div class="skeleton-item"><div class="skeleton-thumb"></div><div class="skeleton-lines"><div class="skeleton-line"></div><div class="skeleton-line"></div></div></div>';
    dom.loading.innerHTML = item.repeat(6);
    dom.loading.style.display = 'block';
}

function switchSubreddit(subreddit, btn) {
    activeSubreddit = subreddit;

    document.querySelectorAll('.subreddit-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (subreddit === 'kpop') {
        dom.controls.style.display = '';
    } else {
        dom.controls.style.display = 'none';
        currentMode = 'releases';
        dom.btnReleases.classList.add('active');
        dom.btnTeasers.classList.remove('active');
    }

    restoreCollapseState();
    loadReleases(currentMode);
}

function toggleCategory(category) {
    const content = dom.categories[category].content;
    const icon = dom.categories[category].icon;
    content.classList.toggle('collapsed');
    icon.classList.toggle('collapsed');
    collapsedState[activeSubreddit][category] = content.classList.contains('collapsed');
}

function restoreCollapseState() {
    const state = collapsedState[activeSubreddit];
    for (const cat of CATEGORIES) {
        const { content, icon } = dom.categories[cat];
        content.classList.toggle('collapsed', !!state[cat]);
        icon.classList.toggle('collapsed', !!state[cat]);
    }
}

async function fetchData(subreddit) {
    const r = await fetch(`data/${subreddit}.json?v=${Date.now()}`);
    if (!r.ok) throw new Error('Data not available.');
    const data = await r.json();
    postCache[subreddit] = data.posts;
    lastFetchTime[subreddit] = data.fetched_at;
    return data.posts;
}

function categorizePosts(posts, mode) {
    const result = { teaser: [], mv: [], album: [], song: [] };
    for (const post of posts) {
        if (!post.category) continue;
        if (mode === 'teasers') {
            if (post.category === 'teaser') result.teaser.push(post);
        } else if (post.category !== 'teaser') {
            result[post.category].push(post);
        }
    }
    return result;
}

function renderResults(categorized) {
    for (const cat of CATEGORIES) {
        const list = dom.categories[cat].list;
        list.innerHTML = '';
        renderCategory(list, categorized[cat]);
        const count = categorized[cat].length;
        dom.categories[cat].count.textContent = count > 0 ? count : '';
    }
    dom.results.style.display = 'block';
}

function createPlaceholder() {
    const div = document.createElement('div');
    div.className = 'release-thumbnail placeholder';
    div.textContent = '\uD83D\uDD25';
    return div;
}

function renderCategory(listElement, posts) {
    if (posts.length === 0) {
        listElement.innerHTML = '<li class="empty-message">Nothing yet — check back later!</li>';
        return;
    }

    const sorted = posts.slice().sort((a, b) => b.created_utc - a.created_utc);
    const frag = document.createDocumentFragment();

    for (const post of sorted) {
        const a = document.createElement('a');
        a.href = post.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'release-item';

        const hasThumb = post.thumbnail?.startsWith('http') &&
            !post.thumbnail.includes('self') && !post.thumbnail.includes('default');

        if (hasThumb) {
            const img = document.createElement('img');
            img.src = post.thumbnail;
            img.alt = '';
            img.className = 'release-thumbnail';
            img.loading = 'lazy';
            img.onerror = function() { this.replaceWith(createPlaceholder()); };
            a.appendChild(img);
        } else {
            a.appendChild(createPlaceholder());
        }

        const content = document.createElement('div');
        content.className = 'release-content';

        const title = document.createElement('div');
        title.className = 'release-title';
        title.textContent = post.title;
        content.appendChild(title);

        const date = new Date(post.created_utc * 1000);
        const dateEl = document.createElement('div');
        dateEl.className = 'release-date';
        dateEl.textContent = `${dateFmt.format(date)} at ${timeFmt.format(date)}`;
        content.appendChild(dateEl);

        a.appendChild(content);

        const li = document.createElement('li');
        li.appendChild(a);
        frag.appendChild(li);
    }

    listElement.appendChild(frag);
}

function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 10) return 'Fresh off Reddit';
    if (seconds < 60) return `Updated ${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Updated ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `Updated ${hours}h ago`;
}

function updateLastUpdated() {
    dom.lastUpdated.textContent = formatRelativeTime(lastFetchTime[activeSubreddit]);
}

function displayPosts(posts, mode) {
    const categorized = categorizePosts(posts, mode);
    updateSectionHeaders(mode);
    renderResults(categorized);
    dom.loading.style.display = 'none';
    updateLastUpdated();
}

async function loadReleases(mode = 'releases') {
    dom.error.style.display = 'none';
    const subreddit = activeSubreddit;
    const cached = postCache[subreddit];

    if (cached) {
        displayPosts(cached, mode);
    } else {
        showSkeleton();
        dom.results.style.display = 'none';
        try {
            const posts = await fetchData(subreddit);
            displayPosts(posts, mode);
        } catch (err) {
            dom.error.textContent = err.message || 'Failed to load releases';
            dom.error.style.display = 'block';
            dom.loading.style.display = 'none';
        }
    }
}

function updateSectionHeaders(mode) {
    const isTeasers = mode === 'teasers';
    dom.categories.teaser.section.style.display = isTeasers ? 'block' : 'none';
    dom.categories.mv.section.style.display = isTeasers ? 'none' : 'block';
    dom.categories.album.section.style.display = isTeasers ? 'none' : 'block';
    dom.categories.song.section.style.display = isTeasers ? 'none' : 'block';
}

function initializeApp() {
    dom = {
        controls: document.getElementById('controls'),
        btnReleases: document.getElementById('btn-releases'),
        btnTeasers: document.getElementById('btn-teasers'),
        lastUpdated: document.getElementById('last-updated'),
        refreshBtn: document.getElementById('refresh-btn'),
        publishBtn: document.getElementById('publish-btn'),
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        results: document.getElementById('results'),
        categories: {}
    };
    for (const cat of CATEGORIES) {
        dom.categories[cat] = {
            section: document.getElementById(`${cat}-section`),
            content: document.getElementById(`${cat}-content`),
            icon: document.getElementById(`${cat}-icon`),
            list: document.getElementById(`${cat}-list`),
            count: document.getElementById(`${cat}-count`)
        };
    }

    document.querySelectorAll('.subreddit-btn').forEach(btn => {
        btn.addEventListener('click', () => switchSubreddit(btn.dataset.sub, btn));
    });

    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => toggleCategory(header.dataset.cat));
    });

    dom.btnReleases.addEventListener('click', () => {
        currentMode = 'releases';
        dom.btnReleases.classList.add('active');
        dom.btnTeasers.classList.remove('active');
        loadReleases('releases');
    });

    dom.btnTeasers.addEventListener('click', () => {
        currentMode = 'teasers';
        dom.btnTeasers.classList.add('active');
        dom.btnReleases.classList.remove('active');
        loadReleases('teasers');
    });

    // Initial load — fetch active subreddit immediately, prefetch the other
    showSkeleton();
    dom.error.style.display = 'none';
    fetchData(activeSubreddit).then(posts => {
        displayPosts(posts, currentMode);
    }).catch(err => {
        dom.error.textContent = err.message || 'Failed to load releases';
        dom.error.style.display = 'block';
        dom.loading.style.display = 'none';
    });
    const other = activeSubreddit === 'kpop' ? 'popheads' : 'kpop';
    fetchData(other).catch(() => {});

    detectLocalServer();
    setInterval(updateLastUpdated, 30000);
}

function setPublishEnabled(enabled) {
    dom.publishBtn.disabled = !enabled;
}

async function detectLocalServer() {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 2000);
        const r = await fetch('/api/health', { signal: controller.signal });
        const data = await r.json();
        if (data.ok) {
            dom.refreshBtn.style.display = '';
            dom.publishBtn.style.display = '';
            dom.refreshBtn.addEventListener('click', handleRefresh);
            dom.publishBtn.addEventListener('click', handlePublish);
            setPublishEnabled(data.hasChanges);

            // If server is refreshing on startup, wait then reload data
            if (data.refreshing) {
                dom.refreshBtn.disabled = true;
                dom.refreshBtn.classList.add('refreshing');
                dom.refreshBtn.textContent = 'Checking Reddit...';
                await waitForRefresh();
            }
        }
    } catch {}
}

async function reloadData() {
    postCache.kpop = null;
    postCache.popheads = null;
    const posts = await fetchData(activeSubreddit);
    displayPosts(posts, currentMode);
    const other = activeSubreddit === 'kpop' ? 'popheads' : 'kpop';
    fetchData(other).catch(() => {});
}

async function waitForRefresh() {
    for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
            const r = await fetch('/api/health');
            const data = await r.json();
            if (!data.refreshing) {
                await reloadData();
                setPublishEnabled(data.hasChanges);
                dom.refreshBtn.disabled = false;
                dom.refreshBtn.classList.remove('refreshing');
                dom.refreshBtn.textContent = 'Refresh';
                return;
            }
        } catch { break; }
    }
    dom.refreshBtn.disabled = false;
    dom.refreshBtn.classList.remove('refreshing');
    dom.refreshBtn.textContent = 'Refresh';
}

async function handleRefresh() {
    dom.refreshBtn.disabled = true;
    dom.refreshBtn.classList.add('refreshing');
    dom.refreshBtn.textContent = 'Checking Reddit...';
    dom.error.style.display = 'none';

    try {
        const r = await fetch('/api/refresh', { method: 'POST' });
        const data = await r.json();

        if (r.status === 429) {
            dom.error.textContent = 'Hold on — already refreshing!';
            dom.error.style.display = 'block';
            setTimeout(() => { dom.error.style.display = 'none'; }, 3000);
        } else if (!data.ok) {
            dom.error.textContent = 'Something went wrong — try again?';
            dom.error.style.display = 'block';
            setTimeout(() => { dom.error.style.display = 'none'; }, 3000);
        } else {
            postCache.kpop = null;
            postCache.popheads = null;
            const posts = await fetchData(activeSubreddit);
            displayPosts(posts, currentMode);
            const other = activeSubreddit === 'kpop' ? 'popheads' : 'kpop';
            fetchData(other).catch(() => {});

            setPublishEnabled(data.hasChanges);
            dom.refreshBtn.disabled = false;
            dom.refreshBtn.classList.remove('refreshing');
            dom.refreshBtn.textContent = data.hasChanges ? 'Got new drops!' : 'All caught up';
            setTimeout(() => { dom.refreshBtn.textContent = 'Refresh'; }, 2000);
            return;
        }
    } catch {
        dom.error.textContent = 'Can\'t reach the server — is it running?';
        dom.error.style.display = 'block';
        setTimeout(() => { dom.error.style.display = 'none'; }, 3000);
    }

    dom.refreshBtn.disabled = false;
    dom.refreshBtn.classList.remove('refreshing');
    dom.refreshBtn.textContent = 'Refresh';
}

async function handlePublish() {
    dom.publishBtn.disabled = true;
    dom.publishBtn.classList.add('refreshing');
    dom.publishBtn.textContent = 'Pushing...';
    dom.error.style.display = 'none';

    try {
        const r = await fetch('/api/publish', { method: 'POST' });
        const data = await r.json();

        if (!data.ok) {
            dom.error.textContent = 'Publish failed — try again?';
            dom.error.style.display = 'block';
            setTimeout(() => { dom.error.style.display = 'none'; }, 3000);
            dom.publishBtn.disabled = false;
        } else if (data.pushed) {
            dom.publishBtn.classList.remove('refreshing');
            dom.publishBtn.textContent = 'Live!';
            setTimeout(() => { dom.publishBtn.textContent = 'Publish to Web'; }, 2000);
        } else {
            dom.publishBtn.textContent = 'Already up to date';
            setTimeout(() => { dom.publishBtn.textContent = 'Publish to Web'; }, 2000);
        }
    } catch {
        dom.error.textContent = 'Can\'t reach the server — is it running?';
        dom.error.style.display = 'block';
        setTimeout(() => { dom.error.style.display = 'none'; }, 3000);
        dom.publishBtn.disabled = false;
    }

    dom.publishBtn.classList.remove('refreshing');
}

initializeApp();
