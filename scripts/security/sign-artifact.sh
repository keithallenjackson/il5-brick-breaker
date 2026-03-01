#!/usr/bin/env bash
# Sign container images with Cosign
# OSCAL-CONTROL: SI-7 (Software Integrity), SA-12 (Supply Chain Protection)
set -euo pipefail

echo "=== Artifact Signing ==="

if ! command -v cosign &> /dev/null; then
    echo "ERROR: cosign not installed."
    echo "Install from: https://github.com/sigstore/cosign"
    exit 1
fi

IMAGE="${1:?Usage: sign-artifact.sh <image-reference>}"

echo "Signing image: $IMAGE"
cosign sign --yes "$IMAGE"

echo "Verifying signature..."
cosign verify "$IMAGE" || { echo "ERROR: Signature verification failed!"; exit 1; }

echo "=== Artifact Signing Complete ==="
