# CDN Functionality Testing Suite

A comprehensive testing framework for evaluating VergeCloud and ArvanCloud CDN providers. This unified platform tests both frontend performance and backend API functionality to determine which features each provider actually supports.

## 📁 Project Structure

```
Test-CDN/
├── backend/               # Go backend API server
│   ├── cmd/server        # Main entrypoint
│   └── Dockerfile        # Multi-stage build for production
├── frontend/              # React frontend (Vite)
│   ├── src               # UI components and client-side logic
│   └── public            # Static probes/tests served via CDN
├── nginx/                 # Nginx configuration
│   └── conf.d/
│       └── default.conf   # Main nginx config with CDN routing
├── scripts/               # Testing scripts (organized)
│   ├── api-test-*.sh     # Bash API testing scripts (simple, basic, quick, comprehensive, checklist)
│   ├── api-tester.js     # Node.js API testing framework
│   ├── simple-test.js    # Basic Node.js tests
│   └── README.md         # Scripts documentation
├── docs/                  # Documentation
│   └── CDN-API-Testing-Checklist.md  # Comprehensive checklist
├── api/                   # Legacy Node.js API (DEPRECATED - see LEGACY.md)
├── Report/                # Test result reports (.gitignore)
├── LEGACY.md             # Legacy code documentation
└── README.md             # This file
```

## 🚀 Quick Start

### 1. Install Frontend Dependencies
```bash
cd frontend
npm install
npm run build   # outputs to frontend/dist which nginx serves
```

### 2. Deploy the Application
```bash
cd ..
chmod +x deploy.sh
./deploy.sh
```

### 3. Access the Testing Dashboard
Open your browser to: `https://test-verge-test.shop` (or your origin domain)

### 4. Run Complete CDN Test
- Configure test rounds and delay
- Click **"START TESTS"**
- Watch real-time results across all categories
- Export detailed reports

## 🧪 What Gets Tested

The unified testing system evaluates **both providers** across **5 key areas**:

### ⚡ Frontend Performance
- [ ] Root page loading
- [ ] Large file downloads
- [ ] Small file responses
- [ ] HTTP status codes
- [ ] Response times

### 💾 Caching & Headers
- [ ] Cache control headers
- [ ] ETag validation
- [ ] Cache bypass functionality
- [ ] Browser caching behavior

### 🛡️ Security & WAF
- [ ] SQL injection blocking
- [ ] XSS attack prevention
- [ ] Security header presence
- [ ] Threat detection accuracy

### 🔧 Additional Features
- [ ] HTTP redirects
- [ ] Custom error pages
- [ ] Compression support

### 🔌 API Functionality
- [ ] Domain management APIs
- [ ] SSL certificate APIs
- [ ] DNS record APIs
- [ ] Caching configuration APIs
- [ ] Firewall/WAF APIs
- [ ] Analytics/reporting APIs

## 📊 Results Interpretation

### Status Indicators
- ✅ **Green Checkmark**: Working correctly
- 🛡️ **Orange Shield**: Blocked by security (good!)
- ❌ **Red X**: Actually failing
- ⏳ **Loading**: Test in progress

### Provider Comparison
After testing, you'll know:
- Which provider has faster response times
- Which provider has better security features
- Which provider offers more API functionality
- Which provider has better caching performance

## 🛠️ API Testing Details

The system includes backend routes that test actual CDN APIs:

```javascript
GET /api-test/domains       // Test domain listing APIs
GET /api-test/ssl           // Test SSL certificate APIs
GET /api-test/dns           // Test DNS management APIs
GET /api-test/caching       // Test cache configuration APIs
GET /api-test/firewall      // Test firewall/WAF APIs
GET /api-test/analytics     // Test reporting APIs
```

Each API test endpoint checks **both providers simultaneously** and reports which ones are accessible and functional.

### 🔁 Server-Side Test Runner

All automated suites now execute on the Go backend, guaranteeing identical behaviour regardless of which CDN domain you test from.

```json
POST /tests/run
{
  "rounds": 3,
  "delay": 2,
  "providers": ["verge", "arvan"] // optional, defaults to all
}
```

```text
GET /tests/run/stream?rounds=3&delay=2&providers=verge,arvan  // SSE live progress feed
```

The response contains the full result matrix (endpoint status, response time, headers, API payloads). The React dashboard calls this endpoint, but you can also integrate it directly into CI pipelines or ad‑hoc scripts.

## 📋 Using the Checklist

The comprehensive checklist (`docs/CDN-API-Testing-Checklist.md`) covers:

- ✅ **Authentication & API Keys**
- 🌐 **Domain Management**
- 🔒 **SSL/TLS Management**
- 🔍 **DNS Management**
- ⚡ **Caching & Performance**
- 🛡️ **Security & Firewall**
- 📊 **Analytics & Reporting**
- 📝 **Logging & Monitoring**
- 🔧 **Advanced Features**

## 📜 Testing Scripts

For programmatic testing, several scripts are available in the `scripts/` directory:

### Bash Scripts
```bash
# Quick health check
./scripts/api-test-simple.sh

# Detailed endpoint testing
./scripts/api-test-quick.sh

# Comprehensive testing with reports
./scripts/api-test-checklist.sh

# Basic API connectivity
./scripts/api-test-basic.sh

# Full featured testing
./scripts/api-test-comprehensive.sh
```

### Node.js Scripts
```bash
# Advanced API testing
node scripts/api-tester.js

# Simple connectivity tests
node scripts/simple-test.js
```

See `scripts/README.md` for detailed script documentation and usage examples.

## 🔧 Development

### Adding New Tests
1. Add the new endpoint to `frontend/src/data/endpoints.js` (UI) and `backend/internal/tests/endpoints.go` (server runner)
2. Add backend routing logic if the test requires a new API surface (see `backend/internal/server`)
3. Add Nginx proxy rule if needed
4. Update checklist documentation

### Modifying Test Logic
- Frontend logic: `frontend/src/App.jsx` and supporting hooks/utils
- Backend API tests: `backend/cmd/server/main.go`
- Styling: `frontend/src/styles/app.css`

## 📈 Reports & Analytics

### Automatic Report Generation
- Test results exported as timestamped `.txt` files
- Detailed breakdown by provider and category
- Performance metrics and response times
- API functionality comparison

### Manual Testing Scripts
For advanced users, standalone scripts are available:
```bash
# Quick API test
./scripts/simple-api-test.sh

# Comprehensive API test
./scripts/comprehensive-api-test.sh

# Individual provider tests
./scripts/vergecloud-api-test.sh
./scripts/arvancloud-api-test.sh
```

## 🤝 Contributing

1. Test new features on both providers
2. Update the checklist with findings
3. Add appropriate test cases
4. Document API differences

## 📞 Support

- Check the comprehensive checklist for detailed test procedures
- Review exported reports for troubleshooting
- Compare results between providers to identify differences

---

**This unified testing platform provides complete visibility into CDN provider capabilities, helping you choose the right provider for your needs.**