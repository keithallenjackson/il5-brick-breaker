# ADR-0001: Brick Breaker Application Architecture

## Status

Accepted

## Date

2026-02-28

## Context

The AGENTS.md file defines an architecture for an "Agentic AI Platform for DoD IL5 Environments." The actual application being built is an HTML5 brick breaker game with a server-side leaderboard. We need to map the game's components to the prescribed architecture while maintaining full IL5 compliance posture.

## Decision

We adapt the AGENTS.md architecture as follows:

| AGENTS.md Component | Brick Breaker Mapping | Purpose |
|---------------------|----------------------|---------|
| `apps/agent-runtime/` | Game Backend API (FastAPI) | Score submission, leaderboard retrieval, audit logging, health checks |
| `apps/web-ui/` | Game Frontend (React 19 + pixi.js) | HTML5 brick breaker game with WebGL rendering, leaderboard UI |
| `apps/mcp-gateway/` | Not used (stub) | No MCP integration needed for a game |
| `apps/compliance-engine/` | Not used (stub) | Compliance handled via existing pipeline tooling |

All IL5 requirements (Iron Bank images, non-root containers, FIPS crypto, audit logging, network policies, OSCAL compliance artifacts) are maintained regardless of the application being a game.

## Consequences

- The `agent-runtime` name is retained for the backend API to maintain consistency with the AGENTS.md architecture, even though it does not run AI agents.
- `mcp-gateway` and `compliance-engine` directories exist as stubs to maintain structural consistency.
- All Kyverno policies, OPA policies, OSCAL component definitions, and CI/CD pipelines apply to the brick breaker components.
- The project-specific OSCAL profile (`project-sentinel.json`) tailors the IL5 baseline to mark AI/ML and MCP-specific controls as not applicable.
