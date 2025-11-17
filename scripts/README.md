# CDN Testing Scripts

This directory contains various scripts for testing CDN functionality across VergeCloud and ArvanCloud providers.

## Available Scripts

### API Testing Scripts

#### `api-test-simple.sh`
**Purpose:** Basic authentication and domain listing tests
**Usage:** `./api-test-simple.sh`
**Tests:** Basic API connectivity for both providers
**Output:** Simple pass/fail results for authentication and domain access

#### `api-test-basic.sh`
**Purpose:** Basic API endpoint testing with detailed response information
**Usage:** `./api-test-basic.sh`
**Tests:** Domain listing endpoints for both providers
**Output:** Detailed HTTP status codes and response body lengths

#### `api-test-quick.sh`
**Purpose:** Fast testing of key API endpoints
**Usage:** `./api-test-quick.sh`
**Tests:**
- Authentication (domain listing)
- Domain management (domain details)
- SSL/TLS (settings and certificates)
- Caching (cache settings)
- Security (firewall settings)
- Analytics (traffic reports)
**Output:** Quick pass/fail status for each endpoint

#### `api-test-comprehensive.sh`
**Purpose:** Expanded API testing with detailed reporting
**Usage:** `./api-test-comprehensive.sh`
**Tests:** All major API endpoints with comprehensive coverage
**Output:** Detailed test results with generated report file

#### `api-test-checklist.sh`
**Purpose:** Comprehensive testing against a feature checklist
**Usage:** `./api-test-checklist.sh`
**Tests:** Complete feature matrix testing with checklist progress tracking
**Output:** Detailed reports with provider comparison and recommendations

### JavaScript Testing Scripts

#### `api-tester.js`
**Purpose:** Node.js-based API testing framework
**Usage:** `node api-tester.js`
**Features:** Advanced API testing with programmatic control

#### `simple-test.js`
**Purpose:** Simple JavaScript API tests
**Usage:** `node simple-test.js`
**Features:** Basic API connectivity testing

## Usage Examples

```bash
# Quick health check
./api-test-simple.sh

# Detailed endpoint testing
./api-test-quick.sh

# Comprehensive testing with reports
./api-test-checklist.sh

# Node.js testing
node api-tester.js
```

## Test Results

All scripts will output test results to the console. Comprehensive scripts generate timestamped report files in the project root.

## Provider Support

- **VergeCloud:** Full API access and comprehensive feature support
- **ArvanCloud:** Limited API access (permission-based), functional for basic operations

## Adding New Tests

When adding new API endpoints to test:

1. Choose the appropriate script based on complexity needs
2. Add the endpoint URL and expected status code
3. Update the test categorization (auth, domain, ssl, etc.)
4. Test against both providers
5. Update this README if adding new scripts
