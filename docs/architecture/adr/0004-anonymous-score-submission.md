# ADR-0004: Anonymous Score Submission

## Status

Accepted

## Date

2026-02-28

## Context

The leaderboard requires score submission. We need to decide the authentication model: full OIDC integration (per AGENTS.md IdP guidance), simple session auth, or anonymous.

## Options Considered

1. **OAuth2/OIDC via enterprise IdP** — full IL5 compliance, most complex
2. **Simple session/token auth** — user creates account, scores tied to identity
3. **Anonymous (name + score)** — player enters display name at submission, no account required

## Decision

Use anonymous score submission. Players enter a display name (1-50 alphanumeric characters) when submitting a score.

## Rationale

- **Simplicity**: A game leaderboard does not warrant enterprise authentication
- **No PII collection**: Display names are player-chosen handles, not real identities
- **User experience**: Zero friction to play and submit scores
- **Scope appropriate**: This is a brick breaker game, not a mission system

## Risk Acceptance

- Scores can be spoofed (no server-side anti-cheat validation)
- Accepted: leaderboard integrity is low-stakes for a game application
- Input validation (Pydantic + client-side) prevents injection attacks
- Rate limiting can be added if abuse occurs

## Consequences

- OSCAL profile marks AC-2 (Account Management) and IA-2 (Identification & Authentication) as not applicable
- No user sessions, tokens, or credential storage needed
- Simpler backend with fewer security controls to implement
