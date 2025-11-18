const fetch = require('node-fetch');

const CONFIG = {
  vergecloud: {
    baseUrl: 'https://api.vergecloud.com',
    domain: 'test-verge-test.shop',
    headers: {
      'X-API-Key': 'feNYqpsjdbFdjSYNoCMTAoU8t30NQll3',
      'Content-Type': 'application/json'
    }
  }
};

async function getDomainInfo() {
  try {
    const response = await fetch(`${CONFIG.vergecloud.baseUrl}/v1/domains`, {
      headers: CONFIG.vergecloud.headers
    });
    const data = await response.json();
    console.log('Domain info:', JSON.stringify(data, null, 2));

    // Find our domain
    const domain = data.data.find(d => d.name === CONFIG.vergecloud.domain);
    if (domain) {
      console.log('Found domain:', domain.id);
      return domain.id;
    }
  } catch (error) {
    console.error('Error getting domain info:', error.message);
  }
  return null;
}

async function getPageRules(domainName) {
  try {
    const response = await fetch(`${CONFIG.vergecloud.baseUrl}/v1/page-rules/${domainName}`, {
      headers: CONFIG.vergecloud.headers
    });
    const data = await response.json();
    console.log('Current page rules:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error getting page rules:', error.message);
  }
}

async function updatePageRule(domainName) {
  try {
    // First, find our existing page rule
    const rulesResponse = await fetch(`${CONFIG.vergecloud.baseUrl}/v1/page-rules/${domainName}`, {
      headers: CONFIG.vergecloud.headers
    });
    const rulesData = await rulesResponse.json();

    const apiRule = rulesData.data.find(rule => rule.url.includes('api-test'));
    if (!apiRule) {
      console.log('API rule not found');
      return;
    }

    console.log('Updating page rule:', apiRule.id);

    const pageRule = {
      url: "/api-test/*",
      cache_level: "off",
      origin_cache_control: true,
      status: true,
      seq: 1
    };

    const response = await fetch(`${CONFIG.vergecloud.baseUrl}/v1/page-rules/${domainName}/${apiRule.id}`, {
      method: 'PUT',
      headers: CONFIG.vergecloud.headers,
      body: JSON.stringify(pageRule)
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('Updated page rule:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.error('Failed to update page rule:', response.status, responseText);
    }
  } catch (error) {
    console.error('Error updating page rule:', error.message);
  }
}

async function main() {
  console.log('Getting domain info...');
  const domainId = await getDomainInfo();

  if (!domainId) {
    console.error('Could not find domain');
    return;
  }

  console.log('Getting current page rules...');
  await getPageRules(CONFIG.vergecloud.domain);

  console.log('Updating API forwarding page rule...');
  await updatePageRule(CONFIG.vergecloud.domain);
}

main().catch(console.error);
