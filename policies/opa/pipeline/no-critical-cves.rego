# OSCAL-CONTROL: SI-2 (Flaw Remediation), RA-5 (Vulnerability Monitoring)
package pipeline.no_critical_cves

import rego.v1

default allow := false

# Allow if no critical CVEs exist in scan results
allow if {
    input.vulnerability_scan != null
    input.vulnerability_scan.critical_count == 0
}

deny contains msg if {
    input.vulnerability_scan == null
    msg := "No vulnerability scan results found. Run Grype or Trivy scan before deployment."
}

deny contains msg if {
    input.vulnerability_scan != null
    input.vulnerability_scan.critical_count > 0
    msg := sprintf(
        "Found %v critical CVE(s). All critical vulnerabilities must be remediated before deployment. CVEs: %v",
        [input.vulnerability_scan.critical_count, input.vulnerability_scan.critical_cves],
    )
}
