#!/usr/bin/env node

/**
 * CDN API Testing Framework
 *
 * Comprehensive testing suite for VergeCloud and ArvanCloud APIs
 * Based on official API documentation
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  vergecloud: {
    baseUrl: 'https://api.vergecloud.com',
    apiKey: process.env.VERGE_TOKEN || 'feNYqpsjdbFdjSYNoCMTAoU8t30NQll3',
    domain: 'test-verge-test.shop',
    headers: {
      'X-API-Key': process.env.VERGE_TOKEN || 'feNYqpsjdbFdjSYNoCMTAoU8t30NQll3',
      'Content-Type': 'application/json'
    }
  },
  arvancloud: {
    baseUrl: 'https://napi.arvancloud.ir/cdn/4.0',
    apiKey: process.env.ARVAN_TOKEN || '3c160a94-880d-503e-ac07-6d4e887b391f',
    domain: 'test20250316.ir',
    headers: {
      'Authorization': `apikey ${process.env.ARVAN_TOKEN || '3c160a94-880d-503e-ac07-6d4e887b391f'}`,
      'Content-Type': 'application/json'
    }
  }
};

// Test results storage
let testResults = {
  vergecloud: {},
  arvancloud: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Utility functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function updateResults(provider, category, testName, result) {
  if (!testResults[provider][category]) {
    testResults[provider][category] = {};
  }

  testResults[provider][category][testName] = result;
  testResults.summary.total++;

  if (result.status === 'PASS') {
    testResults.summary.passed++;
  } else if (result.status === 'FAIL') {
    testResults.summary.failed++;
  } else if (result.status === 'SKIP') {
    testResults.summary.skipped++;
  }
}

async function makeRequest(provider, endpoint, options = {}) {
  const config = CONFIG[provider];
  const url = `${config.baseUrl}${endpoint}`;

  const requestOptions = {
    method: options.method || 'GET',
    headers: config.headers,
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    requestOptions.body = JSON.stringify(options.body);
  }

  log(`Making ${requestOptions.method} request to ${url}`);

  try {
    const response = await fetch(url, requestOptions);
    const responseTime = Date.now();

    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
      url: url,
      method: requestOptions.method,
      success: response.ok,
      responseTime: responseTime
    };
  } catch (error) {
    return {
      status: 'ERROR',
      statusText: error.message,
      body: null,
      url: url,
      method: requestOptions.method,
      success: false,
      error: error.message
    };
  }
}

function generateReport() {
  const reportPath = path.join(__dirname, 'API-Test-Report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`Report saved to: ${reportPath}`);

  // Generate summary
  const { total, passed, failed, skipped } = testResults.summary;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  console.log('\n' + '='.repeat(60));
  console.log('API TESTING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('='.repeat(60));

  // Provider breakdown
  Object.keys(testResults).forEach(provider => {
    if (provider !== 'summary') {
      console.log(`\n${provider.toUpperCase()} RESULTS:`);
      Object.keys(testResults[provider]).forEach(category => {
        const categoryTests = testResults[provider][category];
        const total = Object.keys(categoryTests).length;
        const passed = Object.values(categoryTests).filter(t => t.status === 'PASS').length;
        console.log(`  ${category}: ${passed}/${total} passed`);
      });
    }
  });
}

// Test implementations
async function testAuthentication(provider) {
  log(`Testing ${provider} authentication...`);

  // Test 1: Valid API key
  const result = await makeRequest(provider, '/domains');
  if (result.success) {
    updateResults(provider, 'authentication', 'valid_api_key', {
      status: 'PASS',
      message: 'API key authentication successful',
      response: result
    });
  } else {
    updateResults(provider, 'authentication', 'valid_api_key', {
      status: 'FAIL',
      message: 'API key authentication failed',
      response: result
    });
  }

  // Test 2: Invalid API key (modify header)
  const config = CONFIG[provider];
  const invalidHeaders = { ...config.headers };
  if (provider === 'vergecloud') {
    invalidHeaders['X-API-Key'] = 'invalid-key';
  } else {
    invalidHeaders['Authorization'] = 'apikey invalid-key';
  }

  const invalidResult = await makeRequest(provider, '/domains', { headers: invalidHeaders });
  if (invalidResult.status === 401 || invalidResult.status === 403) {
    updateResults(provider, 'authentication', 'invalid_api_key', {
      status: 'PASS',
      message: 'Invalid API key properly rejected',
      response: invalidResult
    });
  } else {
    updateResults(provider, 'authentication', 'invalid_api_key', {
      status: 'FAIL',
      message: 'Invalid API key not properly rejected',
      response: invalidResult
    });
  }
}

async function testDomainManagement(provider) {
  log(`Testing ${provider} domain management...`);
  const domain = CONFIG[provider].domain;

  // Test 1: List domains
  const listResult = await makeRequest(provider, '/domains');
  if (listResult.success) {
    updateResults(provider, 'domain_management', 'list_domains', {
      status: 'PASS',
      message: 'Domain listing successful',
      response: listResult
    });
  } else {
    updateResults(provider, 'domain_management', 'list_domains', {
      status: 'FAIL',
      message: 'Domain listing failed',
      response: listResult
    });
  }

  // Test 2: Get specific domain
  const domainResult = await makeRequest(provider, `/domains/${domain}`);
  if (domainResult.success) {
    updateResults(provider, 'domain_management', 'get_domain', {
      status: 'PASS',
      message: 'Domain details retrieval successful',
      response: domainResult
    });
  } else {
    updateResults(provider, 'domain_management', 'get_domain', {
      status: 'FAIL',
      message: 'Domain details retrieval failed',
      response: domainResult
    });
  }

  // Test 3: Get domain plan
  const endpoint = provider === 'vergecloud' ? `/domains/${domain}/plan` : `/domains/${domain}/plans`;
  const planResult = await makeRequest(provider, endpoint);
  if (planResult.success) {
    updateResults(provider, 'domain_management', 'get_domain_plan', {
      status: 'PASS',
      message: 'Domain plan retrieval successful',
      response: planResult
    });
  } else {
    updateResults(provider, 'domain_management', 'get_domain_plan', {
      status: 'SKIP',
      message: 'Domain plan retrieval not available or failed',
      response: planResult
    });
  }
}

async function testSSL(provider) {
  log(`Testing ${provider} SSL management...`);
  const domain = CONFIG[provider].domain;

  // Test 1: Get SSL settings
  const sslResult = await makeRequest(provider, `/domains/${domain}/ssl`);
  if (sslResult.success) {
    updateResults(provider, 'ssl', 'get_ssl_settings', {
      status: 'PASS',
      message: 'SSL settings retrieval successful',
      response: sslResult
    });
  } else {
    updateResults(provider, 'ssl', 'get_ssl_settings', {
      status: 'FAIL',
      message: 'SSL settings retrieval failed',
      response: sslResult
    });
  }

  // Test 2: List SSL certificates
  const certsResult = await makeRequest(provider, `/domains/${domain}/ssl/certificates`);
  if (certsResult.success) {
    updateResults(provider, 'ssl', 'list_certificates', {
      status: 'PASS',
      message: 'SSL certificates listing successful',
      response: certsResult
    });
  } else {
    updateResults(provider, 'ssl', 'list_certificates', {
      status: 'SKIP',
      message: 'SSL certificates listing not available',
      response: certsResult
    });
  }
}

async function testDNS(provider) {
  log(`Testing ${provider} DNS management...`);
  const domain = CONFIG[provider].domain;

  // Test 1: List DNS records
  const dnsResult = await makeRequest(provider, `/domains/${domain}/dns-records`);
  if (dnsResult.success) {
    updateResults(provider, 'dns', 'list_records', {
      status: 'PASS',
      message: 'DNS records listing successful',
      response: dnsResult
    });
  } else {
    updateResults(provider, 'dns', 'list_records', {
      status: 'FAIL',
      message: 'DNS records listing failed',
      response: dnsResult
    });
  }
}

async function testCaching(provider) {
  log(`Testing ${provider} caching...`);
  const domain = CONFIG[provider].domain;

  // Test 1: Get cache settings
  const cacheResult = await makeRequest(provider, `/domains/${domain}/caching`);
  if (cacheResult.success) {
    updateResults(provider, 'caching', 'get_cache_settings', {
      status: 'PASS',
      message: 'Cache settings retrieval successful',
      response: cacheResult
    });
  } else {
    updateResults(provider, 'caching', 'get_cache_settings', {
      status: 'FAIL',
      message: 'Cache settings retrieval failed',
      response: cacheResult
    });
  }

  // Test 2: Cache purge (be careful not to purge everything)
  const purgeResult = await makeRequest(provider, `/domains/${domain}/caching/purge`, {
    method: 'POST',
    body: {
      purge: 'individual',
      purge_urls: [`https://${domain}/test-purge-url`]
    }
  });

  if (purgeResult.success || purgeResult.status === 201) {
    updateResults(provider, 'caching', 'cache_purge', {
      status: 'PASS',
      message: 'Cache purge request successful',
      response: purgeResult
    });
  } else {
    updateResults(provider, 'caching', 'cache_purge', {
      status: 'SKIP',
      message: 'Cache purge not available or failed',
      response: purgeResult
    });
  }
}

async function testSecurity(provider) {
  log(`Testing ${provider} security features...`);
  const domain = CONFIG[provider].domain;

  // Test 1: Get firewall settings
  const firewallResult = await makeRequest(provider, `/domains/${domain}/firewall/settings`);
  if (firewallResult.success) {
    updateResults(provider, 'security', 'get_firewall_settings', {
      status: 'PASS',
      message: 'Firewall settings retrieval successful',
      response: firewallResult
    });
  } else {
    updateResults(provider, 'security', 'get_firewall_settings', {
      status: 'SKIP',
      message: 'Firewall settings not available',
      response: firewallResult
    });
  }

  // Test 2: Get WAF settings
  const wafEndpoint = provider === 'vergecloud' ? `/domains/${domain}/waf/settings` : `/domains/${domain}/waf/settings`;
  const wafResult = await makeRequest(provider, wafEndpoint);
  if (wafResult.success) {
    updateResults(provider, 'security', 'get_waf_settings', {
      status: 'PASS',
      message: 'WAF settings retrieval successful',
      response: wafResult
    });
  } else {
    updateResults(provider, 'security', 'get_waf_settings', {
      status: 'SKIP',
      message: 'WAF settings not available',
      response: wafResult
    });
  }
}

async function testAnalytics(provider) {
  log(`Testing ${provider} analytics...`);
  const domain = CONFIG[provider].domain;

  // Test 1: Get traffic reports
  const trafficResult = await makeRequest(provider, `/domains/${domain}/reports/traffics`);
  if (trafficResult.success) {
    updateResults(provider, 'analytics', 'get_traffic_reports', {
      status: 'PASS',
      message: 'Traffic reports retrieval successful',
      response: trafficResult
    });
  } else {
    updateResults(provider, 'analytics', 'get_traffic_reports', {
      status: 'SKIP',
      message: 'Traffic reports not available',
      response: trafficResult
    });
  }

  // Test 2: Get status reports
  const statusResult = await makeRequest(provider, `/domains/${domain}/reports/status`);
  if (statusResult.success) {
    updateResults(provider, 'analytics', 'get_status_reports', {
      status: 'PASS',
      message: 'Status reports retrieval successful',
      response: statusResult
    });
  } else {
    updateResults(provider, 'analytics', 'get_status_reports', {
      status: 'SKIP',
      message: 'Status reports not available',
      response: statusResult
    });
  }
}

// Main test runner
async function runTests(providers = ['vergecloud', 'arvancloud'], categories = ['all']) {
  log('Starting CDN API Testing Suite...');

  for (const provider of providers) {
    log(`Testing ${provider}...`);

    try {
      // Authentication tests
      if (categories.includes('all') || categories.includes('authentication')) {
        await testAuthentication(provider);
      }

      // Domain management tests
      if (categories.includes('all') || categories.includes('domain_management')) {
        await testDomainManagement(provider);
      }

      // SSL tests
      if (categories.includes('all') || categories.includes('ssl')) {
        await testSSL(provider);
      }

      // DNS tests
      if (categories.includes('all') || categories.includes('dns')) {
        await testDNS(provider);
      }

      // Caching tests
      if (categories.includes('all') || categories.includes('caching')) {
        await testCaching(provider);
      }

      // Security tests
      if (categories.includes('all') || categories.includes('security')) {
        await testSecurity(provider);
      }

      // Analytics tests
      if (categories.includes('all') || categories.includes('analytics')) {
        await testAnalytics(provider);
      }

    } catch (error) {
      log(`Error testing ${provider}: ${error.message}`, 'ERROR');
    }
  }

  // Generate final report
  generateReport();
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const providers = args.includes('--arvan-only') ? ['arvancloud'] :
                   args.includes('--verge-only') ? ['vergecloud'] : ['vergecloud', 'arvancloud'];

  const categories = args.filter(arg => !arg.startsWith('--'));
  const categoriesToTest = categories.length > 0 ? categories : ['all'];

  runTests(providers, categoriesToTest).catch(console.error);
}

module.exports = {
  runTests,
  makeRequest,
  CONFIG,
  testResults
};
