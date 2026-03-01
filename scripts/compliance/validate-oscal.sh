#!/usr/bin/env bash
# Validate all OSCAL documents in the repository
# OSCAL-CONTROL: CM-3 (Configuration Change Control)
set -euo pipefail

echo "=== OSCAL Document Validation ==="

ERRORS=0

# Validate component definitions from each app
# Note: trestle validate -f requires files in the trestle workspace directory
# structure (e.g. component-definitions/). App-level component definitions are
# validated via YAML syntax and OSCAL schema field checks instead.
for comp_def in apps/*/component-definition.yaml; do
    if [ -f "$comp_def" ]; then
        echo "Validating: $comp_def"
        python3 -c "
import yaml, sys
with open('$comp_def') as f:
    doc = yaml.safe_load(f)
if not doc:
    print('  ERROR: empty document')
    sys.exit(1)
cd = doc.get('component-definition', {})
if not cd:
    print('  ERROR: missing component-definition key')
    sys.exit(1)
if 'metadata' not in cd:
    print('  ERROR: missing metadata')
    sys.exit(1)
print('  OK')
" || { echo "FAIL: $comp_def"; ERRORS=$((ERRORS + 1)); }
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
