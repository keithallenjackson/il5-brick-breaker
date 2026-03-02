#!/usr/bin/env bash
# Post-deployment smoke test for the Brick Breaker API
# Verifies critical endpoints are functional after deployment.
#
# Usage: ./tests/smoke/smoke-test.sh <base-url>
# Example: ./tests/smoke/smoke-test.sh https://dev.brickbreak.keithjackson.dev
set -euo pipefail

BASE_URL="${1:?Usage: smoke-test.sh <base-url>}"
# Strip trailing slash
BASE_URL="${BASE_URL%/}"
FAILURES=0
TIMEOUT=10

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; FAILURES=$((FAILURES + 1)); }

echo "=== Smoke Tests: ${BASE_URL} ==="

# --- Test 1: Liveness probe ---
echo ""
echo "--- Liveness probe (GET /healthz) ---"
HTTP_CODE=$(curl -s -o /tmp/smoke_healthz.json -w "%{http_code}" --max-time "$TIMEOUT" "${BASE_URL}/healthz" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    pass "GET /healthz returned 200"
else
    fail "GET /healthz returned $HTTP_CODE (expected 200)"
fi

if [ "$HTTP_CODE" = "200" ]; then
    if grep -q '"status":"healthy"' /tmp/smoke_healthz.json 2>/dev/null; then
        pass "healthz status is 'healthy'"
    else
        fail "healthz response missing 'healthy' status"
    fi
fi

# --- Test 2: Readiness probe ---
echo ""
echo "--- Readiness probe (GET /readyz) ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "${BASE_URL}/readyz" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    pass "GET /readyz returned 200"
else
    fail "GET /readyz returned $HTTP_CODE (expected 200)"
fi

# --- Test 3: Score submission ---
echo ""
echo "--- Score submission (POST /api/v1/scores) ---"
SMOKE_NAME="SmokeTest-$(date +%s)"
HTTP_CODE=$(curl -s -o /tmp/smoke_score.json -w "%{http_code}" --max-time "$TIMEOUT" \
    -X POST "${BASE_URL}/api/v1/scores" \
    -H "Content-Type: application/json" \
    -d "{\"player_name\": \"${SMOKE_NAME}\", \"score\": 42, \"level_reached\": 1}" || echo "000")
if [ "$HTTP_CODE" = "201" ]; then
    pass "POST /api/v1/scores returned 201"
else
    fail "POST /api/v1/scores returned $HTTP_CODE (expected 201)"
fi

# --- Test 4: Leaderboard retrieval ---
echo ""
echo "--- Leaderboard (GET /api/v1/leaderboard) ---"
HTTP_CODE=$(curl -s -o /tmp/smoke_leaderboard.json -w "%{http_code}" --max-time "$TIMEOUT" \
    "${BASE_URL}/api/v1/leaderboard" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    pass "GET /api/v1/leaderboard returned 200"
else
    fail "GET /api/v1/leaderboard returned $HTTP_CODE (expected 200)"
fi

if [ "$HTTP_CODE" = "200" ] && grep -q "${SMOKE_NAME}" /tmp/smoke_leaderboard.json 2>/dev/null; then
    pass "Smoke test score appears in leaderboard"
else
    fail "Smoke test score '${SMOKE_NAME}' not found in leaderboard"
fi

# --- Test 5: Input validation ---
echo ""
echo "--- Input validation (POST /api/v1/scores with invalid data) ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" \
    -X POST "${BASE_URL}/api/v1/scores" \
    -H "Content-Type: application/json" \
    -d '{"player_name": "<script>alert(1)</script>", "score": 100, "level_reached": 1}' || echo "000")
if [ "$HTTP_CODE" = "422" ]; then
    pass "XSS payload rejected with 422"
else
    fail "XSS payload returned $HTTP_CODE (expected 422)"
fi

# --- Test 6: Security headers ---
echo ""
echo "--- Security headers ---"
HEADERS=$(curl -sI --max-time "$TIMEOUT" "${BASE_URL}/healthz" 2>/dev/null || echo "")
for HEADER in "X-Content-Type-Options" "X-Frame-Options" "Strict-Transport-Security"; do
    if echo "$HEADERS" | grep -qi "$HEADER"; then
        pass "Header present: $HEADER"
    else
        fail "Header missing: $HEADER"
    fi
done

# --- Test 7: Response time ---
echo ""
echo "--- Response time ---"
TOTAL_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" "${BASE_URL}/healthz" 2>/dev/null || echo "99")
if awk "BEGIN {exit !($TOTAL_TIME < 2.0)}"; then
    pass "Response time ${TOTAL_TIME}s < 2.0s threshold"
else
    fail "Response time ${TOTAL_TIME}s exceeds 2.0s threshold"
fi

# --- Cleanup ---
rm -f /tmp/smoke_healthz.json /tmp/smoke_score.json /tmp/smoke_leaderboard.json

# --- Summary ---
echo ""
if [ "$FAILURES" -gt 0 ]; then
    echo "=== SMOKE TESTS FAILED: $FAILURES failure(s) ==="
    exit 1
fi

echo "=== ALL SMOKE TESTS PASSED ==="
