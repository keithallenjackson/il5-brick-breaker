# OSCAL-CONTROL: SA-12 (Supply Chain Protection), SI-7 (Software Integrity)
package pipeline.require_signed_images

import rego.v1

default allow := false

# Allow if all container images have valid Cosign signatures
allow if {
    input.signatures != null
    count(input.signatures) > 0
    every sig in input.signatures {
        sig.verified == true
    }
}

deny contains msg if {
    input.signatures == null
    msg := "No container image signatures found. All images must be signed with Cosign."
}

deny contains msg if {
    some sig in input.signatures
    sig.verified != true
    msg := sprintf("Image signature verification failed for %v", [sig.image])
}
