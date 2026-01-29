#!/bin/bash
# E2E API Test Script for Kahade Escrow Platform

BASE_URL="http://localhost:3000/api/v1"
PASS_COUNT=0
FAIL_COUNT=0

echo "=========================================="
echo "E2E API Testing - Kahade Escrow Platform"
echo "=========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="$5"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ PASS: $name (Status: $status_code)"
        ((PASS_COUNT++))
    else
        echo "❌ FAIL: $name (Expected: $expected_status, Got: $status_code)"
        echo "   Response: $(echo "$body" | head -c 200)"
        ((FAIL_COUNT++))
    fi
}

echo "=== Health Check Endpoints ==="
test_endpoint "Activity Health" "GET" "/activity/health" "200"
test_endpoint "Referral Health" "GET" "/referral/health" "200"
test_endpoint "Promo Health" "GET" "/promo/health" "200"
test_endpoint "Rating Health" "GET" "/rating/health" "200"

echo ""
echo "=== Authentication Endpoints ==="
test_endpoint "Register - Invalid Email" "POST" "/auth/register" "400" '{"email":"invalid","password":"Test123!@#","username":"testuser"}'
test_endpoint "Register - Missing Fields" "POST" "/auth/register" "400" '{"email":"test@test.com"}'
test_endpoint "Login - Invalid Credentials" "POST" "/auth/login" "401" '{"email":"nonexistent@test.com","password":"wrongpass"}'

echo ""
echo "=== Protected Endpoints (Should Return 401) ==="
test_endpoint "Get Profile (No Auth)" "GET" "/user/profile" "401"
test_endpoint "Get Orders (No Auth)" "GET" "/orders" "401"
test_endpoint "Get Disputes (No Auth)" "GET" "/disputes" "401"
test_endpoint "Create Order (No Auth)" "POST" "/orders" "401" '{"title":"Test","amountMinor":100000}'
test_endpoint "Get Withdrawals Limits (No Auth)" "GET" "/withdrawals/limits" "401"

echo ""
echo "=== User Registration Flow ==="
# Test valid registration
REG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" \
  -d '{"email":"e2etest@kahade.com","password":"SecurePass123!@#","username":"e2etestuser"}' \
  "$BASE_URL/auth/register")
REG_STATUS=$(echo "$REG_RESPONSE" | tail -1)
REG_BODY=$(echo "$REG_RESPONSE" | head -n -1)

if [ "$REG_STATUS" = "201" ] || [ "$REG_STATUS" = "409" ]; then
    echo "✅ PASS: User Registration (Status: $REG_STATUS)"
    ((PASS_COUNT++))
else
    echo "❌ FAIL: User Registration (Expected: 201 or 409, Got: $REG_STATUS)"
    echo "   Response: $(echo "$REG_BODY" | head -c 200)"
    ((FAIL_COUNT++))
fi

echo ""
echo "=== Validation Tests ==="
test_endpoint "Register - Weak Password" "POST" "/auth/register" "400" '{"email":"weak@test.com","password":"123","username":"weakuser"}'
test_endpoint "Register - Invalid Username" "POST" "/auth/register" "400" '{"email":"invalid@test.com","password":"SecurePass123!@#","username":"a"}'

echo ""
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo "Total:  $((PASS_COUNT + FAIL_COUNT))"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Review the results above."
    exit 1
fi
