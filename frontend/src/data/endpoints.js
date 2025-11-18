const frontendEndpoints = [
  { id: 'root', name: 'Root Page', path: '/', category: 'performance' },
  { id: 'large', name: 'Large File', path: '/large-probe.txt', category: 'performance' },
  { id: 'small', name: 'Small File', path: '/probe.txt', category: 'performance' },
  { id: 'cache-time', name: 'Cache Headers', path: '/api/time', category: 'caching' },
  { id: 'cache-bypass', name: 'Cache Bypass', path: '/cache/bypass/nocache', category: 'caching' },
  { id: 'sql', name: 'Security - SQL', path: '/security/sql/union', category: 'security' },
  { id: 'xss', name: 'Security - XSS', path: '/security/xss/script', category: 'security' },
  { id: 'redirect', name: 'Redirect 301', path: '/redirect/301', category: 'features' }
];

const apiEndpoints = [
  { id: 'api-domains', name: 'API: List Domains', path: '/api-test/domains', category: 'api' },
  { id: 'api-domain-details', name: 'API: Domain Details', path: '/api-test/domain-details', category: 'api' },
  { id: 'api-ssl', name: 'API: SSL Settings', path: '/api-test/ssl', category: 'api' },
  { id: 'api-dns', name: 'API: DNS Records', path: '/api-test/dns', category: 'api' },
  { id: 'api-caching', name: 'API: Cache Settings', path: '/api-test/caching', category: 'api' },
  { id: 'api-firewall', name: 'API: Firewall Rules', path: '/api-test/firewall', category: 'api' },
  { id: 'api-analytics', name: 'API: Traffic Reports', path: '/api-test/analytics', category: 'api' }
];

export function getAllEndpoints() {
  return [...frontendEndpoints, ...apiEndpoints];
}

export function getCategoryDisplayName(category) {
  const names = {
    performance: '⚡ Frontend Performance',
    caching: '💾 Caching & Headers',
    security: '🛡️ Security & WAF',
    features: '🔧 Additional Features',
    api: '🔌 API Functionality'
  };
  return names[category] || category;
}

