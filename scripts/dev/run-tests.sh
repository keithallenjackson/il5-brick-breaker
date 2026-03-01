#!/usr/bin/env bash
# Run all tests across all applications
set -euo pipefail

echo "=== Running All Tests ==="

FAILURES=0

# Python tests
echo ""
echo "--- Python Tests (apps/agent-runtime) ---"
cd apps/agent-runtime
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
python -m pytest tests/ -v --cov=src --cov-report=term-missing --cov-fail-under=80 || FAILURES=$((FAILURES + 1))
cd ../..

# TypeScript tests
echo ""
echo "--- TypeScript Tests (apps/web-ui) ---"
cd apps/web-ui
npx vitest run --coverage || FAILURES=$((FAILURES + 1))
cd ../..

echo ""
if [ $FAILURES -gt 0 ]; then
    echo "=== TESTS FAILED: $FAILURES suite(s) had failures ==="
    exit 1
fi

echo "=== All Tests Passed ==="
