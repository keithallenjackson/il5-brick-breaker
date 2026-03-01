# OSCAL-CONTROL: CM-6 (Configuration Settings)
package pipeline.stig_pass_threshold

import rego.v1

default allow := false

# Minimum STIG compliance threshold (90%)
min_threshold := 90

allow if {
    input.stig_results != null
    input.stig_results.pass_percentage >= min_threshold
}

deny contains msg if {
    input.stig_results == null
    msg := "No STIG compliance results found. Run OpenSCAP STIG check before deployment."
}

deny contains msg if {
    input.stig_results != null
    input.stig_results.pass_percentage < min_threshold
    msg := sprintf(
        "STIG compliance score %v%% is below the required threshold of %v%%",
        [input.stig_results.pass_percentage, min_threshold],
    )
}
