#!/usr/bin/env bash
# Generate Software Bill of Materials for all applications
# OSCAL-CONTROL: CM-8 (Information System Component Inventory), SA-12 (Supply Chain Protection)
set -euo pipefail

echo "=== SBOM Generation ==="

if ! command -v syft &> /dev/null; then
    echo "WARNING: syft not installed. Cannot generate SBOM."
    echo "Install from: https://github.com/anchore/syft"
    exit 0
fi

SBOM_DIR="compliance/sbom"
mkdir -p "$SBOM_DIR"

# Generate SBOM for agent-runtime
if [ -f "apps/agent-runtime/pyproject.toml" ]; then
    echo "Generating SBOM for agent-runtime..."
    syft dir:apps/agent-runtime -o cyclonedx-json > "$SBOM_DIR/agent-runtime-sbom.json"
    echo "  Written: $SBOM_DIR/agent-runtime-sbom.json"
fi

# Generate SBOM for web-ui
if [ -f "apps/web-ui/package.json" ]; then
    echo "Generating SBOM for web-ui..."
    syft dir:apps/web-ui -o cyclonedx-json > "$SBOM_DIR/web-ui-sbom.json"
    echo "  Written: $SBOM_DIR/web-ui-sbom.json"
fi

echo "=== SBOM Generation Complete ==="
