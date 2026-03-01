# OSCAL-CONTROL: CM-8 (Information System Component Inventory), SA-12 (Supply Chain Protection)
package pipeline.require_sbom

import rego.v1

default allow := false

# Allow if SBOM exists for all built artifacts
allow if {
    input.sbom != null
    input.sbom.format == "CycloneDX"
    count(input.sbom.components) > 0
}

deny contains msg if {
    input.sbom == null
    msg := "No SBOM (Software Bill of Materials) found. Generate SBOM using Syft in CycloneDX format."
}

deny contains msg if {
    input.sbom != null
    input.sbom.format != "CycloneDX"
    msg := sprintf("SBOM format must be CycloneDX, got %v", [input.sbom.format])
}
