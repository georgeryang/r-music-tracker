const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, exec } = require('child_process');

const ROOT = __dirname;
const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
};

// Parse CLI args
const args = process.argv.slice(2);
function getArg(name, fallback) {
    const i = args.indexOf(name);
    return i !== -1 && args[i + 1] ? Number(args[i + 1]) : fallback;
}
const startPort = Number(process.env.PORT) || getArg('--port', 3000);
let port = startPort;

const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
let refreshInProgress = false;
let autoRefreshTimer = null;

function scheduleAutoRefresh() {
    clearTimeout(autoRefreshTimer);
    autoRefreshTimer = setTimeout(updateCycle, INTERVAL_MS);
}

function updateCycle() {
    return new Promise((resolve) => {
        if (refreshInProgress) return resolve({ ok: false, status: 429, message: 'Refresh already in progress' });
        refreshInProgress = true;

        const output = [];
        const log = (msg) => { console.log(msg); output.push(msg); };

        log(`[${new Date().toLocaleTimeString()}] Fetching Reddit data...`);

        execFile('node', [path.join(ROOT, 'scripts/fetch-reddit.js')], { cwd: ROOT, timeout: 60000 }, (err, stdout, stderr) => {
            if (stdout) output.push(stdout.trim());
            if (stderr) output.push(stderr.trim());

            if (err) {
                log(`[${new Date().toLocaleTimeString()}] Fetch failed: ${err.message}`);
                refreshInProgress = false;
                return resolve({ ok: false, status: 500, message: output.join('\n') });
            }

            log(`[${new Date().toLocaleTimeString()}] Checking for changes...`);

            exec('git diff --quiet data/', { cwd: ROOT }, (diffErr) => {
                if (!diffErr) {
                    log(`[${new Date().toLocaleTimeString()}] No changes to data files`);
                    refreshInProgress = false;
                    scheduleAutoRefresh();
                    return resolve({ ok: true, message: output.join('\n'), pushed: false });
                }

                const timestamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
                const commitMsg = `Update data ${timestamp}`;
                const gitCmd = `git add data/ && git commit -m "${commitMsg}" && git push`;

                log(`[${new Date().toLocaleTimeString()}] Committing and pushing...`);

                exec(gitCmd, { cwd: ROOT, timeout: 30000 }, (gitErr, gitStdout, gitStderr) => {
                    if (gitStdout) output.push(gitStdout.trim());
                    if (gitStderr) output.push(gitStderr.trim());
                    refreshInProgress = false;

                    if (gitErr) {
                        log(`[${new Date().toLocaleTimeString()}] Git push failed: ${gitErr.message}`);
                        return resolve({ ok: false, status: 500, message: output.join('\n') });
                    }

                    log(`[${new Date().toLocaleTimeString()}] Pushed to GitHub`);
                    scheduleAutoRefresh();
                    resolve({ ok: true, message: output.join('\n'), pushed: true });
                });
            });
        });
    });
}

function serveStatic(req, res) {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(ROOT, urlPath);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.readFile(resolved, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end('Not found');
        }
        const ext = path.extname(resolved);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/api/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
    }

    if (req.url === '/api/refresh' && req.method === 'POST') {
        const result = await updateCycle();
        const status = result.status || 200;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    }

    serveStatic(req, res);
});

server.once('listening', () => {
    console.log(`Reddit Music Tracker running at http://localhost:${port}`);
    console.log('Auto-refresh: 6 hours after last refresh (manual or automatic)\n');

    updateCycle();
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const next = port + 1;
        if (next > startPort + 20) {
            console.error('Could not find an available port.');
            process.exit(1);
        }
        console.log(`Port ${port} in use, trying ${next}...`);
        port = next;
        server.listen(port);
    } else {
        console.error(err);
        process.exit(1);
    }
});

server.listen(port);
