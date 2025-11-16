#!/bin/bash

echo "Testing basic API call..."

# Test VergeCloud API
echo "Testing VergeCloud..."
response=$(curl -s -w "\n%{http_code}" -H "X-API-Key: feNYqpsjdbFdjSYNoCMTAoU8t30NQll3" "https://api.vergecloud.com/v1/domains")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

echo "Status: $status"
echo "Body length: ${#body}"

if [ "$status" = "200" ]; then
    echo "SUCCESS: VergeCloud API works"
else
    echo "FAILED: VergeCloud API returned $status"
    echo "Response: $body"
fi

echo
echo "Testing ArvanCloud..."

# Test ArvanCloud API
response2=$(curl -s -w "\n%{http_code}" -H "Authorization: apikey 3c160a94-880d-503e-ac07-6d4e887b391f" "https://napi.arvancloud.ir/cdn/4.0/domains")
status2=$(echo "$response2" | tail -n1)
body2=$(echo "$response2" | head -n -1)

echo "Status: $status2"
echo "Body length: ${#body2}"

if [ "$status2" = "200" ]; then
    echo "SUCCESS: ArvanCloud API works"
else
    echo "FAILED: ArvanCloud API returned $status2"
    echo "Response: $body2"
fi
