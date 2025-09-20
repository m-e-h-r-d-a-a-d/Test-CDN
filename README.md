# CDN Test Website

A simple, clean website designed to test CDN features and performance with any CDN provider.

## 🎯 Purpose

This website helps you test CDN capabilities including:
- **Caching**: Static and dynamic content caching
- **Compression**: Gzip/Brotli compression of CSS, JS, and content
- **Image Optimization**: WebP conversion, resizing, responsive images
- **Performance**: Minification, HTTP/2, load times
- **Security**: Headers, DDoS protection, WAF rules
- **Geographic Distribution**: Edge server performance

## 🏗️ Structure

```
CDN-Test-Website/
├── public/           # Static website files
│   ├── index.html   # Main website
│   └── assets/      # CSS, JS, and other assets
├── assets/          # Test files (images, videos, documents)
├── server.js        # Simple Node.js server
├── package.json     # Dependencies
├── deploy.sh        # Deployment script
└── README.md        # This file
```

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Visit:** http://localhost:3000

### Production Deployment

1. **Deploy to VPS:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Configure DNS:**
   - Point `test-verge-test.shop` to your VPS IP (`37.152.176.173`)

3. **Setup CDN:**
   - Add domain to your CDN provider
   - Configure caching, compression, and optimization settings

## 🧪 How to Test CDN Features

### 1. **Before CDN Setup**
- Visit your website directly via IP or domain
- Use browser dev tools (F12) to check Network tab
- Note load times and response headers
- Look for `X-Served-By: direct-server` header

### 2. **After CDN Setup**
- Visit the same website through CDN
- Compare load times and file sizes
- Check for CDN-specific headers (varies by provider):
  - `CF-Cache-Status`, `CF-Ray` (Cloudflare)
  - `X-Cache`, `X-Served-By` (various CDNs)
  - `Server` header changes

### 3. **Test Different Sections**

**🖼️ Images Section:**
- Tests image optimization and caching
- Check for WebP conversion
- Monitor responsive image loading

**📁 Files Section:**
- Tests file delivery and compression
- Download different file sizes
- Check compression headers

**🔧 API Section:**
- Tests dynamic content caching
- Compare cached vs uncached responses
- Monitor cache headers

**⚡ Performance Section:**
- Tests CSS/JS minification
- Check compression ratios
- Monitor HTTP/2 multiplexing

## 📊 What to Monitor

### Browser Developer Tools
- **Network Tab**: Load times, file sizes, cache status
- **Performance Tab**: Page load metrics, resource timing
- **Console**: CDN detection logs

### Key Headers to Check
- `Cache-Control`: Caching directives
- `Content-Encoding`: Compression (gzip, brotli)
- `Content-Type`: MIME types
- `ETag`: Cache validation
- `X-Cache`: CDN cache status
- `Server`: Server/CDN identification

### Performance Metrics
- **TTFB**: Time to First Byte
- **FCP**: First Contentful Paint
- **LCP**: Largest Contentful Paint
- **File Size Reduction**: Compression effectiveness
- **Load Time Improvement**: CDN performance gain

## 🌐 CDN Provider Integration

This website works with any CDN provider:

### Popular CDN Providers
- **Cloudflare**: Free tier available, global network
- **AWS CloudFront**: Pay-as-you-go, AWS integration
- **Azure CDN**: Microsoft's global CDN
- **Google Cloud CDN**: Google's edge network
- **KeyCDN**: Performance-focused CDN
- **BunnyCDN**: Cost-effective CDN
- **Fastly**: Developer-friendly edge cloud

### Setup Process (Generic)
1. Sign up with CDN provider
2. Add your domain to CDN dashboard
3. Update DNS records (usually CNAME or nameservers)
4. Configure caching rules and optimization settings
5. Enable features like compression, minification, image optimization
6. Test using this website

## 📁 Adding Test Files

To make the website fully functional, add test files to the `assets/` directory:

```bash
# Create directories
mkdir -p assets/{images,files,videos}

# Add your test files
# - Small/medium/large images (JPG, PNG, WebP)
# - Documents (PDF, DOC, TXT)
# - Archives (ZIP, TAR)
# - Videos (MP4, WebM)
```

See `assets/README.md` for detailed file structure.

## 🔧 Customization

### Adding New Test Endpoints
Edit `server.js` to add new API endpoints:

```javascript
app.get('/api/test/custom', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ message: 'Custom test endpoint' });
});
```

### Modifying Test Content
Edit `public/index.html` to add new test sections or modify existing ones.

### Styling Changes
Edit `public/assets/css/styles.css` for visual customizations.

## 🛠️ Management

### Server Management
```bash
# Check status
ssh ubuntu@37.152.176.173 'pm2 status'

# View logs
ssh ubuntu@37.152.176.173 'pm2 logs cdn-test-website'

# Restart application
ssh ubuntu@37.152.176.173 'pm2 restart cdn-test-website'

# Update deployment
./deploy.sh
```

### Nginx Management
```bash
# Check nginx status
ssh ubuntu@37.152.176.173 'sudo systemctl status nginx'

# Test nginx config
ssh ubuntu@37.152.176.173 'sudo nginx -t'

# Restart nginx
ssh ubuntu@37.152.176.173 'sudo systemctl restart nginx'
```

## 🔍 Troubleshooting

### Common Issues

1. **Site not loading**
   - Check DNS propagation
   - Verify nginx configuration
   - Check firewall settings

2. **CDN not working**
   - Verify DNS records point to CDN
   - Check CDN dashboard for domain status
   - Clear CDN cache if needed

3. **Performance issues**
   - Check server resources
   - Monitor CDN analytics
   - Verify optimization settings

### Debug Commands
```bash
# Check DNS resolution
nslookup test-verge-test.shop

# Test HTTP response
curl -I http://test-verge-test.shop

# Check server logs
ssh ubuntu@37.152.176.173 'pm2 logs cdn-test-website --lines 50'
```

## 📝 License

MIT License - feel free to use and modify for your CDN testing needs.

---

**Ready to test your CDN? Deploy this website and start optimizing! 🚀**