const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'public')));

// API endpoints for testing
app.get('/api/test/json-small', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({
    message: 'Small JSON response for CDN testing',
    timestamp: new Date().toISOString(),
    size: 'small',
    data: Array(10).fill(null).map((_, i) => ({ id: i, name: `Item ${i}` }))
  });
});

app.get('/api/test/json-large', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({
    message: 'Large JSON response for CDN testing',
    timestamp: new Date().toISOString(),
    size: 'large',
    data: Array(1000).fill(null).map((_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `This is a detailed description for item ${i} with lots of text to make the response larger for CDN testing purposes.`,
      category: `Category ${i % 10}`,
      price: Math.random() * 100,
      tags: [`tag-${i}`, `category-${i % 5}`]
    }))
  });
});

app.get('/api/test/dynamic', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    message: 'Dynamic content - should not be cached',
    timestamp: new Date().toISOString(),
    random: Math.random(),
    requestId: Math.random().toString(36).substring(7)
  });
});

app.get('/api/test/cached', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
  res.json({
    message: 'Cacheable content for 24 hours',
    timestamp: new Date().toISOString(),
    cacheTime: '24 hours'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'CDN Test Website'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CDN Test Website running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
});
