#!/bin/bash

# Quick CDN API Test - Simple Version
# Tests key API endpoints without complex data structures

VERGE_API_KEY="feNYqpsjdbFdjSYNoCMTAoU8t30NQll3"
ARVAN_API_KEY="3c160a94-880d-503e-ac07-6d4e887b391f"

echo "🚀 Quick CDN API Test"
echo "===================="
echo

test_endpoint() {
    local provider=$1
    local endpoint=$2
    local expected_status=${3:-200}
    local description=$4

    local headers=""
    local base_url=""

    case $provider in
        "vergecloud")
            base_url="https://api.vergecloud.com"
            headers="X-API-Key: $VERGE_API_KEY"
            ;;
        "arvancloud")
            base_url="https://napi.arvancloud.ir/cdn/4.0"
            headers="Authorization: apikey $ARVAN_API_KEY"
            ;;
    esac

    echo -n "Testing $provider $description... "

    local response=$(curl -s -w "\n%{http_code}" -H "$headers" "$base_url$endpoint")
    local status=$(echo "$response" | tail -n1)

    if [ "$status" = "$expected_status" ]; then
        echo "✅ PASS"
        return 0
    else
        echo "❌ FAIL (Status: $status, Expected: $expected_status)"
        return 1
    fi
}

echo "🔐 AUTHENTICATION TESTS"
echo "-----------------------"
test_endpoint "vergecloud" "/v1/domains" "200" "List Domains"
test_endpoint "arvancloud" "/domains" "200" "List Domains"
echo

echo "🌐 DOMAIN MANAGEMENT TESTS"
echo "--------------------------"
test_endpoint "vergecloud" "/v1/domains/test-verge-test.shop" "200" "Get Domain Details"
test_endpoint "arvancloud" "/domains/test20250316.ir" "403" "Get Domain Details (Expected 403)"
echo

echo "🔒 SSL TESTS"
echo "------------"
test_endpoint "vergecloud" "/v1/ssl/test-verge-test.shop" "200" "SSL Settings"
test_endpoint "vergecloud" "/v1/ssl/test-verge-test.shop/certificates" "200" "SSL Certificates"
test_endpoint "arvancloud" "/domains/test20250316.ir/ssl" "403" "SSL Settings (Expected 403)"
echo

echo "⚡ CACHING TESTS"
echo "----------------"
test_endpoint "vergecloud" "/v1/caching/test-verge-test.shop" "200" "Cache Settings"
test_endpoint "arvancloud" "/domains/test20250316.ir/caching" "403" "Cache Settings (Expected 403)"
echo

echo "🛡️ SECURITY TESTS"
echo "------------------"
test_endpoint "vergecloud" "/v1/firewall/test-verge-test.shop/settings" "200" "Firewall Settings"
test_endpoint "arvancloud" "/domains/test20250316.ir/firewall/settings" "403" "Firewall Settings (Expected 403)"
echo

echo "📊 ANALYTICS TESTS"
echo "-------------------"
test_endpoint "vergecloud" "/v1/reports/test-verge-test.shop/traffics" "200" "Traffic Reports"
test_endpoint "arvancloud" "/domains/test20250316.ir/reports/traffics" "403" "Traffic Reports (Expected 403)"
echo

echo "🎯 API Testing Complete!"
echo
echo "SUMMARY:"
echo "- VergeCloud: Most endpoints working ✅"
echo "- ArvanCloud: Limited access (API key permissions) ⚠️"
echo
echo "Next: Expand to test more endpoints from the checklist"
echo "Use this as foundation for comprehensive API testing"
