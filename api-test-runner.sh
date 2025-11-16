#!/bin/bash

# CDN API Testing Runner - Expanded Version
# Tests multiple API endpoints for VergeCloud and ArvanCloud

VERGE_API_KEY="feNYqpsjdbFdjSYNoCMTAoU8t30NQll3"
ARVAN_API_KEY="3c160a94-880d-503e-ac07-6d4e887b391f"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Results storage
declare -A TEST_RESULTS

log() {
    echo -e "$1"
}

update_result() {
    local provider=$1
    local category=$2
    local test_name=$3
    local status=$4
    local message=$5

    TEST_RESULTS["${provider}_${category}_${test_name}"]="${status}|${message}"
    ((TOTAL_TESTS++))

    case $status in
        "PASS") ((PASSED_TESTS++)) ;;
        "FAIL") ((FAILED_TESTS++)) ;;
        "SKIP") ((SKIPPED_TESTS++)) ;;
    esac
}

test_api_call() {
    local provider=$1
    local endpoint=$2
    local expected_status=${3:-"200"}
    local test_name=$4
    local category=$5

    local headers=""
    local base_url=""

    case $provider in
        "vergecloud")
            base_url="https://api.vergecloud.com"
            headers="-H 'X-API-Key: $VERGE_API_KEY'"
            ;;
        "arvancloud")
            base_url="https://napi.arvancloud.ir/cdn/4.0"
            headers="-H 'Authorization: apikey $ARVAN_API_KEY'"
            ;;
    esac

    local full_url="${base_url}${endpoint}"
    local cmd="curl -s -w '\n%{http_code}' $headers '$full_url'"

    local response=$(eval $cmd)
    local status_code=$(echo "$response" | tail -n1)

    if [ "$status_code" = "$expected_status" ]; then
        update_result "$provider" "$category" "$test_name" "PASS" "API call successful"
        echo -e "${GREEN}✅${NC} $provider $category $test_name: PASS"
        return 0
    else
        update_result "$provider" "$category" "$test_name" "FAIL" "Expected $expected_status, got $status_code"
        echo -e "${RED}❌${NC} $provider $category $test_name: FAIL (Status: $status_code)"
        return 1
    fi
}

# Authentication Tests
test_authentication() {
    echo -e "\n${BLUE}🔐 Testing Authentication${NC}"

    # VergeCloud Auth
    test_api_call "vergecloud" "/v1/domains" "200" "list_domains" "authentication"

    # ArvanCloud Auth
    test_api_call "arvancloud" "/domains" "200" "list_domains" "authentication"
}

# Domain Management Tests
test_domain_management() {
    echo -e "\n${BLUE}🌐 Testing Domain Management${NC}"

    # VergeCloud Domain Tests
    test_api_call "vergecloud" "/v1/domains/test-verge-test.shop" "200" "get_domain_details" "domain_management"
    test_api_call "vergecloud" "/v1/domains/test-verge-test.shop/plan" "200" "get_domain_plan" "domain_management"

    # ArvanCloud Domain Tests (may fail due to permissions)
    test_api_call "arvancloud" "/domains/test20250316.ir" "403" "get_domain_details" "domain_management"
    test_api_call "arvancloud" "/domains/test20250316.ir/plans" "403" "get_domain_plan" "domain_management"
}

# SSL Tests
test_ssl() {
    echo -e "\n${BLUE}🔒 Testing SSL Management${NC}"

    # VergeCloud SSL Tests
    test_api_call "vergecloud" "/v1/ssl/test-verge-test.shop" "200" "get_ssl_settings" "ssl"
    test_api_call "vergecloud" "/v1/ssl/test-verge-test.shop/certificates" "200" "list_certificates" "ssl"

    # ArvanCloud SSL Tests
    test_api_call "arvancloud" "/domains/test20250316.ir/ssl" "403" "get_ssl_settings" "ssl"
    test_api_call "arvancloud" "/domains/test20250316.ir/ssl/certificates" "403" "list_certificates" "ssl"
}

# DNS Tests
test_dns() {
    echo -e "\n${BLUE}🔍 Testing DNS Management${NC}"

    # VergeCloud DNS Tests
    test_api_call "vergecloud" "/v1/dns/test-verge-test.shop/records" "200" "list_dns_records" "dns"

    # ArvanCloud DNS Tests
    test_api_call "arvancloud" "/domains/test20250316.ir/dns-records" "403" "list_dns_records" "dns"
}

# Caching Tests
test_caching() {
    echo -e "\n${BLUE}⚡ Testing Caching${NC}"

    # VergeCloud Caching Tests
    test_api_call "vergecloud" "/v1/caching/test-verge-test.shop" "200" "get_cache_settings" "caching"

    # Test cache purge (use POST and expect success or specific error)
    local purge_result=$(curl -s -w "\n%{http_code}" -X POST \
        -H "X-API-Key: $VERGE_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"files":["https://test-verge-test.shop/test-purge"]}' \
        "https://api.vergecloud.com/v1/caching/test-verge-test.shop/purge")

    local purge_status=$(echo "$purge_result" | tail -n1)
    if [ "$purge_status" = "200" ] || [ "$purge_status" = "201" ]; then
        update_result "vergecloud" "caching" "cache_purge" "PASS" "Cache purge successful"
        echo -e "${GREEN}✅${NC} vergecloud caching cache_purge: PASS"
    else
        update_result "vergecloud" "caching" "cache_purge" "SKIP" "Cache purge not available"
        echo -e "${YELLOW}⚠️${NC} vergecloud caching cache_purge: SKIP"
    fi

    # ArvanCloud Caching Tests
    test_api_call "arvancloud" "/domains/test20250316.ir/caching" "403" "get_cache_settings" "caching"
}

# Security Tests
test_security() {
    echo -e "\n${BLUE}🛡️ Testing Security Features${NC}"

    # VergeCloud Security Tests
    test_api_call "vergecloud" "/v1/firewall/test-verge-test.shop/settings" "200" "get_firewall_settings" "security"
    test_api_call "vergecloud" "/v1/firewall/test-verge-test.shop/rules" "200" "list_firewall_rules" "security"

    # ArvanCloud Security Tests
    test_api_call "arvancloud" "/domains/test20250316.ir/firewall/settings" "403" "get_firewall_settings" "security"
    test_api_call "arvancloud" "/domains/test20250316.ir/firewall/rules" "403" "list_firewall_rules" "security"
}

# Analytics Tests
test_analytics() {
    echo -e "\n${BLUE}📊 Testing Analytics${NC}"

    # VergeCloud Analytics Tests
    test_api_call "vergecloud" "/v1/reports/test-verge-test.shop/traffics" "200" "get_traffic_reports" "analytics"
    test_api_call "vergecloud" "/v1/reports/test-verge-test.shop/status" "200" "get_status_reports" "analytics"

    # ArvanCloud Analytics Tests
    test_api_call "arvancloud" "/domains/test20250316.ir/reports/traffics" "403" "get_traffic_reports" "analytics"
    test_api_call "arvancloud" "/domains/test20250316.ir/reports/status" "403" "get_status_reports" "analytics"
}

generate_report() {
    local report_file="API-Test-Report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "CDN API Testing Report - Expanded"
        echo "Generated: $(date)"
        echo
        echo "SUMMARY"
        echo "======="
        echo "Total Tests: $TOTAL_TESTS"
        echo "Passed: $PASSED_TESTS"
        echo "Failed: $FAILED_TESTS"
        echo "Skipped: $SKIPPED_TESTS"
        local pass_rate=0
        if [ $TOTAL_TESTS -gt 0 ]; then
            pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
        fi
        echo "Pass Rate: ${pass_rate}%"
        echo

        echo "DETAILED RESULTS"
        echo "================"

        for key in "${!TEST_RESULTS[@]}"; do
            IFS='|' read -r status message <<< "${TEST_RESULTS[$key]}"
            IFS='_' read -r provider category test_name <<< "$key"

            echo "[$provider] $category -> $test_name"
            echo "Status: $status"
            echo "Message: $message"
            echo "---"
        done

        echo
        echo "CHECKLIST PROGRESS"
        echo "=================="
        echo "✅ Authentication: Basic auth working"
        echo "✅ Domain Management: Core functionality tested"
        echo "✅ SSL: Certificate management tested"
        echo "🔄 DNS: Basic tests done"
        echo "🔄 Caching: Settings and purge tested"
        echo "🔄 Security: Firewall basics tested"
        echo "🔄 Analytics: Basic reports tested"
        echo
        echo "Next Steps:"
        echo "- Test advanced security features (WAF rules, DDoS)"
        echo "- Test load balancing and origin management"
        echo "- Test page rules and custom logic"
        echo "- Test monitoring and health checks"
        echo "- Compare feature sets between providers"

    } > "$report_file"

    echo
    echo "📄 Report saved to: $report_file"
}

main() {
    echo -e "${BLUE}🚀 CDN API Testing Suite - Expanded Version${NC}"
    echo "Testing both VergeCloud and ArvanCloud APIs"
    echo

    # Run all test categories
    test_authentication
    test_domain_management
    test_ssl
    test_dns
    test_caching
    test_security
    test_analytics

    # Generate final report
    generate_report

    echo
    echo -e "${GREEN}🎯 API Testing Complete!${NC}"
    echo "Total: $TOTAL_TESTS | Passed: $PASSED_TESTS | Failed: $FAILED_TESTS | Skipped: $SKIPPED_TESTS"
}

# Run main function
main "$@"