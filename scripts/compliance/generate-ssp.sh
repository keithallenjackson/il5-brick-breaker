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
from collections import defaultdict
from datetime import datetime, timezone

with open('$COMP_DEF_DIR/system-component-def.json') as f:
    data = json.load(f)

md = []
md.append('# System Security Plan')
md.append('')
md.append(f'**Generated:** {datetime.now(timezone.utc).isoformat()}')
md.append('**Classification:** UNCLASSIFIED // CUI')
md.append('**System:** Brick Breaker — Agentic AI Platform for DoD IL5 Environments')
md.append('**OSCAL Version:** 1.1.2')
md.append('')

# Collect all control implementations across all components
# Key: control-id, Value: list of (component_title, description, status)
controls = defaultdict(list)

md.append('## System Components')
md.append('')

for comp_def in data.get('system-component-definition', {}).get('components', []):
    if not isinstance(comp_def, dict):
        continue
    comp_title = comp_def.get('metadata', {}).get('title', 'Unknown')
    md.append(f'### {comp_title}')
    md.append('')

    for component in comp_def.get('components', []):
        if not isinstance(component, dict):
            continue
        title = component.get('title', 'Unknown')
        desc = component.get('description', '')
        ctype = component.get('type', 'software')
        md.append(f'**{title}** ({ctype})')
        md.append('')
        if desc:
            md.append(f'{desc}')
            md.append('')

        for ctrl_impl in component.get('control-implementations', []):
            source = ctrl_impl.get('source', '')
            for req in ctrl_impl.get('implemented-requirements', []):
                cid = req.get('control-id', '').upper()
                rdesc = req.get('description', '')
                status = 'implemented'
                for p in req.get('props', []):
                    if p.get('name') == 'implementation-status':
                        status = p.get('value', 'implemented')
                controls[cid].append((title, rdesc, status))

md.append('---')
md.append('')
md.append('## Control Implementation Summary')
md.append('')
md.append('| Control | Status | Implementing Components |')
md.append('|---------|--------|------------------------|')

for cid in sorted(controls.keys()):
    entries = controls[cid]
    components_list = ', '.join(sorted(set(e[0] for e in entries)))
    status = entries[0][2]
    md.append(f'| {cid} | {status} | {components_list} |')

md.append('')
md.append(f'**Total controls addressed:** {len(controls)}')
md.append('')

md.append('---')
md.append('')
md.append('## Control Implementation Details')
md.append('')

for cid in sorted(controls.keys()):
    entries = controls[cid]
    md.append(f'### {cid}')
    md.append('')
    for comp_name, rdesc, status in entries:
        md.append(f'**Component:** {comp_name}  ')
        md.append(f'**Status:** {status}')
        md.append('')
        md.append(f'{rdesc}')
        md.append('')

md.append('---')
md.append('*Auto-generated from OSCAL component definitions.*')

with open('$SSP_DIR/ssp.md', 'w') as f:
    f.write('\n'.join(md))
print(f'  Written: $SSP_DIR/ssp.md')
"

echo "=== SSP Generation Complete ==="
