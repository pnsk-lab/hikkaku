# Moonscratch Time Separation Notes

This document summarizes the investigation around `examples/3d-cube` rendering behavior
and the design choice to separate VM time updates from stepping.

## Problem observed

- In `scratch-gui` / `scratch-vm`, the cube appears to render as a single visual update
  (or in a gap users do not perceive).
- In the old `moonscratch` viewer loop, users could see pen drawing progress line-by-line.
- This was not primarily a raw performance issue. It was caused by scheduling boundaries
  becoming visible.

## Key findings

- Both runtimes are incremental internally.
- The visible difference came from how stepping and rendering were orchestrated:
  - `scratch-vm`:
    - one `Runtime._step()` per interval,
    - `Sequencer.stepThreads()` runs until work budget / redraw constraints,
    - renderer draws once at end of `_step`.
  - old `moonscratch` viewer:
    - stepped in small chunks tied to RAF pacing,
    - intermediate VM progress was rendered more directly.

## Design change

- `stepFrame` now executes scheduler work only.
- `setTime(nowMs)` is the only API that moves VM clock time.
- This makes time ownership explicit and lets callers control:
  - when timer/wait predicates advance,
  - how much execution is done before rendering.

## Viewer policy

Recommended loop:

1. `setTime(now)` once per display tick.
2. Run `stepFrame(1)` repeatedly within a bounded work window.
3. Render exactly once after stepping.

This preserves responsiveness while reducing visible intermediate pen progress.

## Compatibility and migration notes

- Breaking API changes:
  - removed: `stepFrame(frameCount, frameMs)`
  - added/renamed: `setTime(nowMs)` (formerly `setNowMs`)
  - removed from `FrameReport`: `nowMs` and frame-duration-derived fields
- Time-dependent scripts (`wait`, `timer`) require caller-driven `setTime` updates.
