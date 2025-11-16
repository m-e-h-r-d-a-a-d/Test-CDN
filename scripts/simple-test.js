#!/usr/bin/env node

const fetch = require('node-fetch');

async function testAPI() {
  console.log('Testing API...');

  try {
    const response = await fetch('https://api.vergecloud.com/v1/domains', {
      headers: {
        'X-API-Key': 'feNYqpsjdbFdjSYNoCMTAoU8t30NQll3'
      }
    });

    console.log('Status:', response.status);
    console.log('OK:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('Success! Data length:', data.data ? data.data.length : 'N/A');
    } else {
      const text = await response.text();
      console.log('Error response:', text);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testAPI();
