const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Simple health
app.get('/health', (req, res) => res.status(200).send('ok'));

// CORS for local runner usage
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// safe JSON parse helper
async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

// Purge proxy
app.post('/purge', async (req, res) => {
  try {
    const { type: provider, provider: pRaw, url } = req.body || {};
    if (!pRaw && !provider) return res.status(400).send({ error: 'provider required' });
    if (!url) return res.status(400).send({ error: 'url required' });
    const p = String(pRaw || provider).toLowerCase();

    let out = {};
    if (p === 'cloudflare') {
      const zone = process.env.CF_ZONE_ID || process.env.CF_ZONE || '';
      const token = process.env.CF_API_TOKEN || process.env.CF_TOKEN || '';
      if (!zone || !token) return res.status(400).json({ error: 'Cloud provider token/zone missing on server' });
      const resp = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [url] })
      });
      out = { status: resp.status, data: await safeJson(resp) };
    } else if (p === 'arvan' || p === 'anon') {
      // ArvanCloud CDN purge API
      const base = process.env.ARVAN_API_BASE || 'https://napi.arvancloud.ir/cdn/4.0';
      const domain = process.env.ARVAN_DOMAIN || '';
      const token = process.env.ARVAN_TOKEN || '';
      if (!domain || !token) return res.status(400).json({ error: 'ArvanCloud token/domain missing on server' });
      const endpoint = `${base.replace(/\/$/, '')}/domains/${encodeURIComponent(domain)}/caching/purge`;
      const resp = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Apikey ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [url] })
      });
      out = { status: resp.status, data: await safeJson(resp) };
    } else if (p === 'verge') {
      const domain = process.env.VERGE_DOMAIN || '';
      const token = process.env.VERGE_TOKEN || '';
      const api = (process.env.VERGE_API_BASE || '').replace(/\/$/, '');
      if (!token || !domain) return res.status(400).json({ error: 'Provider token/domain missing on server' });
      if (!api) return res.status(400).json({ error: 'VERGE_API_BASE must be set on server' });
      const resp = await fetch(`${api}/purge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, files: [url] })
      });
      out = { status: resp.status, data: await safeJson(resp) };
    } else {
      return res.status(400).json({ error: 'unknown provider' });
    }

    return res.status(200).json({ ok: true, provider: p, result: out });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`mgmt api listening on ${port}`));


