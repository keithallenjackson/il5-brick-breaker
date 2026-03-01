# ADR-0003: Synthesized Audio via Web Audio API

## Status

Accepted

## Date

2026-02-28

## Context

The brick breaker game needs sound effects for paddle hits, brick breaks, power-up collection, and game events. We need to decide between pre-recorded audio files and programmatic audio synthesis.

## Options Considered

1. **Pre-recorded audio files** (.wav/.mp3) — traditional approach, exact control over sound quality
2. **Web Audio API synthesis** — sounds generated from OscillatorNode and GainNode, no files needed

## Decision

Use Web Audio API synthesis for all game sound effects. No audio files are stored or served.

## Rationale

- **Smaller container image**: No audio assets to store or serve
- **No LFS management**: Avoids git-lfs complexity for binary audio files
- **Faster builds**: No asset pipeline for audio processing
- **Parameterizable**: Sound properties (pitch, duration) can vary based on game state (e.g., paddle hit position affects pitch)
- **Sufficient quality**: Brick breaker sound effects are simple (clicks, tones, sweeps) — synthesis handles these well

## Consequences

- Sound quality is "retro/arcade" rather than realistic — appropriate for a brick breaker
- More code in SoundSystem.ts to define sound synthesis parameters
- Must handle browser autoplay policy (AudioContext resume on first user interaction)
