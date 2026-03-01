# ADR-0002: pixi.js v8 for WebGL Rendering

## Status

Accepted

## Date

2026-02-28

## Context

The brick breaker game requires hardware-accelerated rendering with particle effects, smooth animations, and 60fps gameplay. We need a rendering approach that provides GPU acceleration while integrating with React 19.

## Options Considered

1. **Canvas 2D API** — simplest, browser-composited hardware acceleration, limited particle performance
2. **Canvas 2D + WebGL particles** — hybrid approach, more complexity
3. **pixi.js v8 (full WebGL)** — professional 2D WebGL renderer, `ParticleContainer` for high-performance particles

## Decision

Use pixi.js v8 for all game rendering. React manages only the UI chrome (menus, HUD, leaderboard). The game canvas is managed imperatively via pixi.js for maximum performance.

## Rationale

- pixi.js `ParticleContainer` can render 100K+ particles at 60fps
- Unified rendering pipeline (no hybrid Canvas2D/WebGL complexity)
- Mature, well-documented library with TypeScript support
- v8 uses modern `await app.init()` API pattern
- Good separation: React for UI, pixi.js for game rendering

## Consequences

- Added dependency: `pixi.js ^8.6.0`
- Tests must mock pixi.js objects (no real WebGL in jsdom)
- Container images slightly larger due to pixi.js bundle
