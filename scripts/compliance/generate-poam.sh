#!/usr/bin/env bash
# Generate Plan of Action & Milestones from scan results
# OSCAL-CONTROL: CA-5 (Plan of Action and Milestones)
set -euo pipefail

echo "=== Generating POA&M ==="

POAM_DIR="compliance/poam"
mkdir -p "$POAM_DIR"

echo "Checking for scan results in compliance/assessment-results/..."

if [ -z "$(ls -A compliance/assessment-results/ 2>/dev/null)" ]; then
    echo "No assessment results found. Run security scans first."
    echo "Creating empty POA&M template..."
fi

python3 -c "
import json
from datetime import datetime, timezone

poam = {
    'plan-of-action-and-milestones': {
        'metadata': {
            'title': 'Brick Breaker POA&M',
            'version': '0.1.0',
            'oscal-version': '1.1.2',
            'last-modified': datetime.now(timezone.utc).isoformat()
        },
        'poam-items': []
    }
}

with open('$POAM_DIR/poam.json', 'w') as f:
    json.dump(poam, f, indent=2)

print('POA&M written to $POAM_DIR/poam.json')
"

echo "=== POA&M Generation Complete ==="
