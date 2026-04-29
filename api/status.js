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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = getClient();

  if (req.method === 'GET') {
    const raw = await redis.get('forged:status');
    const status = raw ? JSON.parse(raw) : { online: false, last_seen: null, updated_at: null };
    return res.status(200).json(status);
  }

  if (req.method === 'POST') {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token || token !== process.env.WEBALLTECH_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { online } = req.body ?? {};
    if (typeof online !== 'boolean') {
      return res.status(400).json({ error: 'Body must contain { online: true|false }' });
    }
    const now = new Date().toISOString();
    const status = { online, last_seen: now, updated_at: now };
    await redis.set('forged:status', JSON.stringify(status));
    return res.status(200).json(status);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
