#!/usr/bin/env bash
# Generate System Security Plan from component definitions
# OSCAL-CONTROL: CM-8 (Information System Component Inventory)
set -euo pipefail

echo "=== Generating System Security Plan ==="

SSP_DIR="compliance/system-security-plan"
COMP_DEF_DIR="compliance/component-definitions"

mkdir -p "$SSP_DIR" "$COMP_DEF_DIR"

# Aggregate component definitions from all apps
echo "Aggregating component definitions..."
python3 -c "
import yaml
import json
import glob
import os

components = []
for comp_file in sorted(glob.glob('apps/*/component-definition.yaml')):
    with open(comp_file) as f:
        data = yaml.safe_load(f)
    if data and 'component-definition' in data:
        components.append({
            'source': comp_file,
            'definition': data['component-definition']
        })
    print(f'  Loaded: {comp_file}')

system_def = {
    'system-component-definition': {
        'metadata': {
            'title': 'Brick Breaker System Component Definition',
            'version': '0.1.0',
            'oscal-version': '1.1.2'
        },
        'components': [c['definition'] for c in components]
    }
}

with open('$COMP_DEF_DIR/system-component-def.json', 'w') as f:
    json.dump(system_def, f, indent=2)
print(f'  Written: $COMP_DEF_DIR/system-component-def.json')
"

# Generate SSP markdown for human review
echo "Generating SSP markdown..."
python3 -c "
import json
import os
from datetime import datetime, timezone

with open('$COMP_DEF_DIR/system-component-def.json') as f:
    data = json.load(f)

md = []
md.append('# System Security Plan')
md.append(f'')
md.append(f'**Generated:** {datetime.now(timezone.utc).isoformat()}')
md.append(f'**Classification:** UNCLASSIFIED // CUI')
md.append(f'')
md.append('## System Components')
md.append('')

for comp in data.get('system-component-definition', {}).get('components', []):
    if isinstance(comp, dict):
        title = comp.get('metadata', {}).get('title', 'Unknown')
        md.append(f'### {title}')
        md.append('')

md.append('')
md.append('---')
md.append('*Auto-generated from OSCAL component definitions.*')

with open('$SSP_DIR/ssp.md', 'w') as f:
    f.write('\n'.join(md))
print(f'  Written: $SSP_DIR/ssp.md')
"

echo "=== SSP Generation Complete ==="
