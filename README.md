# UNCLASSIFIED // CUI

# Agentic-AI-Brick-Breaker

> Kubernetes-native HTML5 Brick Breaker game with server-side leaderboard, deployed for DoD IL5 environments with automated RMF/eMASS compliance.

## Overview

A fully featured brick breaker game built with modern web technologies, deployed on Kubernetes with full DoD IL5 compliance posture. Features hardware-accelerated WebGL rendering, particle effects, synthesized sound, power-ups, and progressive difficulty levels.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌────────────┐
│   Browser    │────▶│   Ingress (TLS)  │     │            │
│  (pixi.js)  │     │                  │     │ PostgreSQL │
│             │     │  /    → web-ui   │     │            │
│  WebGL Game │     │  /api → API      │────▶│  Scores DB │
└─────────────┘     └──────────────────┘     └────────────┘
```

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend (web-ui) | React 19 + TypeScript + pixi.js v8 | Brick breaker game + leaderboard UI |
| Backend (agent-runtime) | Python 3.12 + FastAPI | Score submission API + leaderboard |
| Database | PostgreSQL 16 | Score persistence |
| Container Runtime | Kubernetes 1.30+ | Orchestration |
| GitOps | Flux CD v2 | Deployment reconciliation |
| Compliance | OSCAL + Kyverno + OPA | Automated RMF artifacts |

## Quick Start

```bash
# Set up local development environment
./scripts/dev/setup-local.sh

# Start backend API
cd apps/agent-runtime
pip install -e ".[dev]"
uvicorn src.main:app --reload

# Start frontend (in another terminal)
cd apps/web-ui
npm install
npm run dev
```

## Game Features

- **WebGL rendering** via pixi.js for hardware-accelerated graphics
- **Particle effects** for brick destruction, power-up collection, ball trails
- **Synthesized sound** via Web Audio API (no audio files)
- **Power-ups**: Multi-ball, Bigger paddle
- **Progressive difficulty**: Procedural levels with increasing complexity
- **Leaderboard**: Server-side score tracking with ranked display

## Project Structure

See [AGENTS.md](AGENTS.md) for the complete architecture, development rules, and compliance requirements.

## Commands

```bash
make test-python        # Run Python test suite
make test-typescript    # Run TypeScript test suite
make lint               # Full lint pass
make validate-oscal     # Validate all OSCAL documents
make build              # Build all containers
make compliance-all     # Full compliance pipeline
```

## Compliance

This project maintains a Continuous Authority to Operate (cATO) posture targeting DoD IL5. Compliance artifacts are generated automatically from code and infrastructure definitions using OSCAL (Open Security Controls Assessment Language).

| Artifact | Location |
|----------|----------|
| Component definitions | `apps/*/component-definition.yaml` |
| System Security Plan | `compliance/system-security-plan/ssp.md` |
| Plan of Action & Milestones | `compliance/poam/poam.json` |
| C2P policy mapping | `compliance/c2p-config.yaml` |
| Kyverno admission policies | `policies/kyverno/` (6 policies deployed via Flux) |
| OPA pipeline policies | `policies/opa/` |
| Sentinel IaC policies | `policies/sentinel/` |

See [AGENTS.md](AGENTS.md) for full compliance-as-code documentation.

## Classification

**UNCLASSIFIED // CUI** — This repository contains no classified material.

---

*Built with compliance-as-code principles. Every commit is an audit artifact.*
