#!/bin/bash

# Simple CDN API Test Runner
# Tests basic authentication and domain listing

VERGE_API_KEY="feNYqpsjdbFdjSYNoCMTAoU8t30NQll3"
ARVAN_API_KEY="3c160a94-880d-503e-ac07-6d4e887b391f"

echo "🚀 Starting Simple CDN API Tests"
echo

# Test VergeCloud Authentication
echo "Testing VergeCloud Authentication..."
response=$(curl -s -w "\n%{http_code}" -H "X-API-Key: $VERGE_API_KEY" "https://api.vergecloud.com/v1/domains")
status=$(echo "$response" | tail -n1)

if [ "$status" = "200" ]; then
    echo "✅ VergeCloud Auth: PASS"
else
    echo "❌ VergeCloud Auth: FAIL (Status: $status)"
fi

# Test ArvanCloud Authentication
echo "Testing ArvanCloud Authentication..."
response=$(curl -s -w "\n%{http_code}" -H "Authorization: apikey $ARVAN_API_KEY" "https://napi.arvancloud.ir/cdn/4.0/domains")
status=$(echo "$response" | tail -n1)

if [ "$status" = "200" ]; then
    echo "✅ ArvanCloud Auth: PASS"
else
    echo "❌ ArvanCloud Auth: FAIL (Status: $status)"
fi

# Test VergeCloud Domain Details
echo "Testing VergeCloud Domain Details..."
response=$(curl -s -w "\n%{http_code}" -H "X-API-Key: $VERGE_API_KEY" "https://api.vergecloud.com/v1/domains/test-verge-test.shop")
status=$(echo "$response" | tail -n1)

if [ "$status" = "200" ]; then
    echo "✅ VergeCloud Domain: PASS"
else
    echo "❌ VergeCloud Domain: FAIL (Status: $status)"
fi

# Test ArvanCloud Domain Details
echo "Testing ArvanCloud Domain Details..."
response=$(curl -s -w "\n%{http_code}" -H "Authorization: apikey $ARVAN_API_KEY" "https://napi.arvancloud.ir/cdn/4.0/domains/test20250316.ir")
status=$(echo "$response" | tail -n1)

if [ "$status" = "200" ]; then
    echo "✅ ArvanCloud Domain: PASS"
else
    echo "❌ ArvanCloud Domain: FAIL (Status: $status)"
fi

echo
echo "🎯 API Testing Complete!"
echo "Use this as a foundation to expand to more endpoints from the checklist."
