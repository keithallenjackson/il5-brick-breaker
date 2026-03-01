#!/usr/bin/env bash
# Validate all OSCAL documents in the repository
# OSCAL-CONTROL: CM-3 (Configuration Change Control)
set -euo pipefail

echo "=== OSCAL Document Validation ==="

ERRORS=0

# Validate component definitions from each app
for comp_def in apps/*/component-definition.yaml; do
    if [ -f "$comp_def" ]; then
        echo "Validating: $comp_def"
        if command -v trestle &> /dev/null; then
            trestle validate -f "$comp_def" || { echo "FAIL: $comp_def"; ERRORS=$((ERRORS + 1)); }
        else
            echo "  (trestle not installed, checking YAML syntax only)"
            python3 -c "import yaml; yaml.safe_load(open('$comp_def'))" || { echo "FAIL: $comp_def"; ERRORS=$((ERRORS + 1)); }
        fi
    fi
done

# Validate compliance profiles
for profile in compliance/profiles/*.json; do
    if [ -f "$profile" ]; then
        echo "Validating: $profile"
        python3 -c "import json; json.load(open('$profile'))" || { echo "FAIL: $profile"; ERRORS=$((ERRORS + 1)); }
    fi
done

# Validate system-level artifacts
for artifact in compliance/system-security-plan/*.json compliance/component-definitions/*.json; do
    if [ -f "$artifact" ]; then
        echo "Validating: $artifact"
        python3 -c "import json; json.load(open('$artifact'))" || { echo "FAIL: $artifact"; ERRORS=$((ERRORS + 1)); }
    fi
done

if [ $ERRORS -gt 0 ]; then
    echo "=== VALIDATION FAILED: $ERRORS error(s) ==="
    exit 1
fi

echo "=== All OSCAL documents valid ==="
