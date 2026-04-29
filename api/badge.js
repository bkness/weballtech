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

function buildSVG({ online, last_seen }) {
  const color      = online ? '#00ff41' : '#4a7a55';
  const dotColor   = online ? '#00ff41' : '#cc3333';
  const border     = online ? '#1a3a22' : '#0d1a0f';
  const statusText = online ? '&#9679; ONLINE' : '&#9675; OFFLINE';
  const timeText   = online ? 'active now' : `last seen ${timeAgo(last_seen)}`;
  const pulse      = online ? `
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
    .dot { animation: pulse 2s ease-in-out infinite; }` : '';

  return `<svg width="380" height="80" viewBox="0 0 380 80" xmlns="http://www.w3.org/2000/svg">
  <defs><style>${pulse}</style></defs>
  <rect width="380" height="80" rx="4" fill="#030a06"/>
  <rect width="379" height="79" x="0.5" y="0.5" rx="4" fill="none" stroke="${border}" stroke-width="1"/>
  <rect width="3" height="80" rx="1" fill="${color}"/>
  <circle cx="28" cy="40" r="6" fill="${dotColor}" class="dot"/>
  <text x="46" y="30" font-family="'Courier New',monospace" font-size="10" fill="#4a7a55" letter-spacing="4">FORGED DEV ENV</text>
  <text x="46" y="55" font-family="'Courier New',monospace" font-size="22" font-weight="bold" fill="${color}" letter-spacing="1">BKNESS</text>
  <text x="372" y="34" font-family="'Courier New',monospace" font-size="11" fill="${dotColor}" text-anchor="end" letter-spacing="2">${statusText}</text>
  <text x="372" y="52" font-family="'Courier New',monospace" font-size="10" fill="#4a7a55" text-anchor="end">${timeText}</text>
</svg>`;
}

module.exports = async function handler(req, res) {
  let status = { online: false, last_seen: null };
  try {
    const redis = getClient();
    const raw = await redis.get('forged:status');
    if (raw) status = JSON.parse(raw);
  } catch (_) {}

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(buildSVG(status));
};
