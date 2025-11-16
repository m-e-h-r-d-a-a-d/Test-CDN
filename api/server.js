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
        method: 'POST',
        headers: { 'Authorization': `apikey ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ purge: 'individual', purge_urls: [url] })
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
        headers: { 'X-API-Key': token, 'Content-Type': 'application/json' },
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

// ArvanCloud SSL management endpoints
app.get('/arvan/ssl/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const base = process.env.ARVAN_API_BASE || 'https://napi.arvancloud.ir/cdn/4.0';
    const token = process.env.ARVAN_TOKEN || '';
    if (!token) return res.status(400).json({ error: 'ArvanCloud token missing on server' });

    const resp = await fetch(`${base.replace(/\/$/, '')}/domains/${encodeURIComponent(domain)}/ssl`, {
      method: 'GET',
      headers: { 'Authorization': `apikey ${token}` }
    });
    const data = await safeJson(resp);
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/arvan/ssl/:domain/certificates', async (req, res) => {
  try {
    const { domain } = req.params;
    const base = process.env.ARVAN_API_BASE || 'https://napi.arvancloud.ir/cdn/4.0';
    const token = process.env.ARVAN_TOKEN || '';
    if (!token) return res.status(400).json({ error: 'ArvanCloud token missing on server' });

    const resp = await fetch(`${base.replace(/\/$/, '')}/domains/${encodeURIComponent(domain)}/ssl/certificates`, {
      method: 'GET',
      headers: { 'Authorization': `apikey ${token}` }
    });
    const data = await safeJson(resp);
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/arvan/ssl/:domain/certificates/:certId', async (req, res) => {
  try {
    const { domain, certId } = req.params;
    const base = process.env.ARVAN_API_BASE || 'https://napi.arvancloud.ir/cdn/4.0';
    const token = process.env.ARVAN_TOKEN || '';
    if (!token) return res.status(400).json({ error: 'ArvanCloud token missing on server' });

    const resp = await fetch(`${base.replace(/\/$/, '')}/domains/${encodeURIComponent(domain)}/ssl/certificates/${certId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `apikey ${token}` }
    });
    const data = await safeJson(resp);
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ArvanCloud caching configuration endpoints
app.get('/arvan/caching/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const base = process.env.ARVAN_API_BASE || 'https://napi.arvancloud.ir/cdn/4.0';
    const token = process.env.ARVAN_TOKEN || '';
    if (!token) return res.status(400).json({ error: 'ArvanCloud token missing on server' });

    const resp = await fetch(`${base.replace(/\/$/, '')}/domains/${encodeURIComponent(domain)}/caching`, {
      method: 'GET',
      headers: { 'Authorization': `apikey ${token}` }
    });
    const data = await safeJson(resp);
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.patch('/arvan/caching/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const base = process.env.ARVAN_API_BASE || 'https://napi.arvancloud.ir/cdn/4.0';
    const token = process.env.ARVAN_TOKEN || '';
    if (!token) return res.status(400).json({ error: 'ArvanCloud token missing on server' });

    const resp = await fetch(`${base.replace(/\/$/, '')}/domains/${encodeURIComponent(domain)}/caching`, {
      method: 'PATCH',
      headers: {
        'Apikey': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await safeJson(resp);
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ArvanCloud firewall/WAF configuration endpoints
app.get('/arvan/firewall/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const base = process.env.ARVAN_API_BASE || 'https://napi.arvancloud.ir/cdn/4.0';
    const token = process.env.ARVAN_TOKEN || '';
    if (!token) return res.status(400).json({ error: 'ArvanCloud token missing on server' });

    const resp = await fetch(`${base.replace(/\/$/, '')}/domains/${encodeURIComponent(domain)}/firewall/settings`, {
      method: 'GET',
      headers: { 'Authorization': `apikey ${token}` }
    });
    const data = await safeJson(resp);
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// API Testing Routes - Test actual CDN provider APIs
app.get('/api-test/domains', async (req, res) => {
  try {
    const provider = req.query.provider || 'vergecloud';
    const config = CONFIG[provider];

    if (!config) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const endpoint = provider === 'vergecloud' ? '/v1/domains' : '/domains';
    const url = `${config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: config.headers
    });

    const data = await response.json();

    res.json({
      provider: provider,
      endpoint: endpoint,
      status: response.status,
      success: response.ok,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      provider: req.query.provider || 'vergecloud',
      error: error.message,
      success: false
    });
  }
});

app.get('/api-test/domain-details', async (req, res) => {
  try {
    const provider = req.query.provider || 'vergecloud';
    const config = CONFIG[provider];
    const domain = config.domain;

    if (!config) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const endpoint = provider === 'vergecloud' ? `/v1/domains/${domain}` : `/domains/${domain}`;
    const url = `${config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: config.headers
    });

    const data = await response.json();

    res.json({
      provider: provider,
      endpoint: endpoint,
      domain: domain,
      status: response.status,
      success: response.ok,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      provider: req.query.provider || 'vergecloud',
      error: error.message,
      success: false
    });
  }
});

app.get('/api-test/ssl', async (req, res) => {
  try {
    const provider = req.query.provider || 'vergecloud';
    const config = CONFIG[provider];
    const domain = config.domain;

    if (!config) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const endpoint = `/domains/${domain}/ssl`;
    const url = `${config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: config.headers
    });

    const data = await response.json();

    res.json({
      provider: provider,
      endpoint: endpoint,
      domain: domain,
      status: response.status,
      success: response.ok,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      provider: req.query.provider || 'vergecloud',
      error: error.message,
      success: false
    });
  }
});

app.get('/api-test/dns', async (req, res) => {
  try {
    const provider = req.query.provider || 'vergecloud';
    const config = CONFIG[provider];
    const domain = config.domain;

    if (!config) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const endpoint = `/domains/${domain}/dns-records`;
    const url = `${config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: config.headers
    });

    const data = await response.json();

    res.json({
      provider: provider,
      endpoint: endpoint,
      domain: domain,
      status: response.status,
      success: response.ok,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      provider: req.query.provider || 'vergecloud',
      error: error.message,
      success: false
    });
  }
});

app.get('/api-test/caching', async (req, res) => {
  try {
    const provider = req.query.provider || 'vergecloud';
    const config = CONFIG[provider];
    const domain = config.domain;

    if (!config) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const endpoint = `/domains/${domain}/caching`;
    const url = `${config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: config.headers
    });

    const data = await response.json();

    res.json({
      provider: provider,
      endpoint: endpoint,
      domain: domain,
      status: response.status,
      success: response.ok,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      provider: req.query.provider || 'vergecloud',
      error: error.message,
      success: false
    });
  }
});

app.get('/api-test/firewall', async (req, res) => {
  try {
    const provider = req.query.provider || 'vergecloud';
    const config = CONFIG[provider];
    const domain = config.domain;

    if (!config) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const endpoint = `/domains/${domain}/firewall/settings`;
    const url = `${config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: config.headers
    });

    const data = await response.json();

    res.json({
      provider: provider,
      endpoint: endpoint,
      domain: domain,
      status: response.status,
      success: response.ok,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      provider: req.query.provider || 'vergecloud',
      error: error.message,
      success: false
    });
  }
});

app.get('/api-test/analytics', async (req, res) => {
  try {
    const provider = req.query.provider || 'vergecloud';
    const config = CONFIG[provider];
    const domain = config.domain;

    if (!config) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const endpoint = `/domains/${domain}/reports/traffics`;
    const url = `${config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: config.headers
    });

    const data = await response.json();

    res.json({
      provider: provider,
      endpoint: endpoint,
      domain: domain,
      status: response.status,
      success: response.ok,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      provider: req.query.provider || 'vergecloud',
      error: error.message,
      success: false
    });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`mgmt api listening on ${port}`));


