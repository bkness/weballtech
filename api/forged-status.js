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

function auth(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  return token === process.env.WEBALLTECH_TOKEN;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = getClient();

  if (req.method === 'GET') {
    const [scanner, shell] = await Promise.all([
      redis.get('forged:scanner'),
      redis.get('forged:shell'),
    ]);
    return res.status(200).json({
      scanner: scanner ? JSON.parse(scanner) : null,
      shell:   shell   ? JSON.parse(shell)   : null,
    });
  }

  if (req.method === 'POST') {
    if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

    const { type, data } = req.body ?? {};

    if (type === 'scanner') {
      // { safe, packages, flagged, checked_at }
      const payload = {
        safe:       data.safe ?? true,
        packages:   data.packages ?? 0,
        flagged:    data.flagged ?? [],
        checked_at: data.checked_at ?? new Date().toISOString(),
      };
      await redis.set('forged:scanner', JSON.stringify(payload));
      return res.status(200).json(payload);
    }

    if (type === 'shell') {
      // { version, plugins, hooks }
      const payload = {
        version: data.version ?? 'unknown',
        plugins: data.plugins ?? 0,
        hooks:   data.hooks   ?? 0,
        booted_at: new Date().toISOString(),
      };
      await redis.set('forged:shell', JSON.stringify(payload));
      return res.status(200).json(payload);
    }

    return res.status(400).json({ error: 'type must be "scanner" or "shell"' });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
