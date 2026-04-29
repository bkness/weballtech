const Redis = require('ioredis');

let client;
function getClient() {
  if (!client) {
    client = new Redis(process.env.GITHUB_TOKEN_REDIS_URL, {
      tls: process.env.GITHUB_TOKEN_REDIS_URL?.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return client;
}

function timeAgo(isoString) {
  if (!isoString) return 'never';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)    return 'active now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function buildSVG({ online, last_seen }, forged) {
  const color    = online ? '#00ff41' : '#4a7a55';
  const dotColor = online ? '#00ff41' : '#cc3333';
  const border   = online ? '#1a3a22' : '#0d1a0f';
  const statusText = online ? '&#9679; ONLINE' : '&#9675; OFFLINE';
  const timeText   = online ? 'active now' : `last seen ${timeAgo(last_seen)}`;
  const pulse = online ? `
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
    .dot { animation: pulse 2s ease-in-out infinite; }` : '';

  const scanner = forged?.scanner;
  const shell   = forged?.shell;

  const scanColor  = !scanner ? '#4a7a55' : scanner.safe ? '#00ff41' : '#cc3333';
  const scanText   = !scanner ? '— —' : scanner.safe
    ? `SAFE &#183; ${scanner.packages} pkgs`
    : `${scanner.flagged.length} FLAGGED &#183; ${scanner.packages} pkgs`;
  const scanAge    = scanner ? timeAgo(scanner.checked_at) : null;

  const shellText  = shell ? `v${shell.version} &#183; ${shell.plugins} plugins &#183; ${shell.hooks} hooks` : '— —';

  return `<svg width="380" height="120" viewBox="0 0 380 120" xmlns="http://www.w3.org/2000/svg">
  <defs><style>${pulse}</style></defs>
  <rect width="380" height="120" rx="4" fill="#030a06"/>
  <rect width="379" height="119" x="0.5" y="0.5" rx="4" fill="none" stroke="${border}" stroke-width="1"/>
  <rect width="3" height="120" rx="1" fill="${color}"/>

  <line x1="3" y1="42" x2="379" y2="42" stroke="#0d1f12" stroke-width="1"/>
  <line x1="3" y1="82" x2="379" y2="82" stroke="#0d1f12" stroke-width="1"/>

  <circle cx="28" cy="21" r="5" fill="${dotColor}" class="dot"/>
  <text x="44" y="18" font-family="'Courier New',monospace" font-size="10" fill="#4a7a55" letter-spacing="3">FORGED DEV ENV</text>
  <text x="44" y="33" font-family="'Courier New',monospace" font-size="16" font-weight="bold" fill="${color}" letter-spacing="1">BKNESS</text>
  <text x="372" y="20" font-family="'Courier New',monospace" font-size="10" fill="${dotColor}" text-anchor="end" letter-spacing="2">${statusText}</text>
  <text x="372" y="34" font-family="'Courier New',monospace" font-size="9" fill="#4a7a55" text-anchor="end">${timeText}</text>

  <text x="16" y="58" font-family="'Courier New',monospace" font-size="9" fill="#4a7a55" letter-spacing="2">&#9670; SCANNER</text>
  <text x="372" y="58" font-family="'Courier New',monospace" font-size="9" fill="${scanColor}" text-anchor="end">${scanText}${scanAge ? ` &#183; ${scanAge}` : ''}</text>

  <text x="16" y="98" font-family="'Courier New',monospace" font-size="9" fill="#4a7a55" letter-spacing="2">&#9650; SHELL</text>
  <text x="372" y="98" font-family="'Courier New',monospace" font-size="9" fill="#4a7a55" text-anchor="end">${shellText}</text>
  <text x="16" y="112" font-family="'Courier New',monospace" font-size="8" fill="#1a3a22" letter-spacing="1">weballtech.com</text>
  <text x="372" y="112" font-family="'Courier New',monospace" font-size="8" fill="#1a3a22" text-anchor="end">forged-cli</text>
</svg>`;
}

module.exports = async function handler(req, res) {
  let status = { online: false, last_seen: null };
  let forged = null;
  try {
    const redis = getClient();
    const [rawStatus, rawScanner, rawShell] = await Promise.all([
      redis.get('forged:status'),
      redis.get('forged:scanner'),
      redis.get('forged:shell'),
    ]);
    if (rawStatus)  status = JSON.parse(rawStatus);
    if (rawScanner || rawShell) {
      forged = {
        scanner: rawScanner ? JSON.parse(rawScanner) : null,
        shell:   rawShell   ? JSON.parse(rawShell)   : null,
      };
    }
  } catch (_) {}

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(buildSVG(status, forged));
};
