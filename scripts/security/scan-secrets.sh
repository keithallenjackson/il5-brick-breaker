#!/usr/bin/env bash
# Scan codebase for accidentally committed secrets
# OSCAL-CONTROL: IA-5 (Authenticator Management)
set -euo pipefail

echo "=== Secret Scanning ==="

if command -v detect-secrets &> /dev/null; then
    echo "Running detect-secrets scan..."
    detect-secrets scan --all-files --exclude-files '\.git/.*' . > .secrets-scan-results.json
    FINDINGS=$(python3 -c "import json; r=json.load(open('.secrets-scan-results.json')); print(sum(len(v) for v in r.get('results', {}).values()))")
    rm -f .secrets-scan-results.json

    if [ "$FINDINGS" -gt 0 ]; then
        echo "WARNING: Found $FINDINGS potential secret(s)!"
        echo "Run 'detect-secrets scan' for details."
        exit 1
    fi
    echo "No secrets detected."
else
    echo "WARNING: detect-secrets not installed."
    echo "Install with: pip install detect-secrets"

    # Fallback: basic grep for common secret patterns
    echo "Running basic pattern scan..."
    PATTERNS="password|secret|api_key|apikey|token|private_key|AWS_SECRET"
    if grep -rniE "$PATTERNS" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.yaml" --include="*.json" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.venv apps/ deploy/ infrastructure/ 2>/dev/null | grep -viE "test|mock|example|placeholder|pattern|schema|environ|getenv|valueFrom|secretKeyRef" | head -20; then
        echo "WARNING: Potential secrets found. Review the above matches."
    else
        echo "No obvious secrets detected."
    fi
fi

echo "=== Secret Scan Complete ==="
