# Scratch VM Event Loop Spec

This document records how `scratch-vm` controls frame stepping, thread ticks, and time,
and how `moonscratch` mirrors that behavior.

## Terminology

- `frame`
  - One call to `Runtime._step()`.
  - In browser mode, called by `setInterval` from `Runtime.start()`.
- `tick`
  - One inner pass of `Sequencer.stepThreads()` while-loop.
  - A tick attempts to run each runnable thread once.
- `ms`
  - Millisecond time base used by timer/wait behavior.
- `redrawRequested`
  - Runtime flag set by visible operations, used to decide if the current frame
    should continue ticking.
- `yield`
  - Pause current thread until the next scheduler turn.
- `yieldTick`
  - Pause current thread until the next sequencer tick.

## Observed Scratch VM Behavior

## Frame loop

- `Runtime.start()` sets `currentStepTime` then schedules `_step()`:
  - `THREAD_STEP_INTERVAL = 1000 / 60`
  - `THREAD_STEP_INTERVAL_COMPATIBILITY = 1000 / 30`
- Compatibility mode changes the interval; turbo mode does not.

## What happens in one frame (`Runtime._step`)

1. Clean killed threads.
2. Start edge-activated hats.
3. Reset `redrawRequested = false`.
4. Call `sequencer.stepThreads()`.
5. Update glows/monitor state.
6. Draw renderer frame once.

## Tick loop (`Sequencer.stepThreads`)

- `WORK_TIME = 0.75 * runtime.currentStepTime`.
- Continue ticking while:
  1. there are threads,
  2. at least one active thread exists,
  3. elapsed work time is below `WORK_TIME`,
  4. `runtime.turboMode || !runtime.redrawRequested`.
- Each tick:
  - Iterate through thread list.
  - Skip done threads.
  - Run runnable threads (`stepThread`).
  - Clean up done threads.

## `yieldTick` semantics

- `util.yieldTick()` sets `thread.status = STATUS_YIELD_TICK`.
- At the first tick of the next `stepThreads` call, this status is cleared and thread resumes.
- This is "next tick", not "after 1 ms".

## Relationship: 1 tick, 1 frame, 1 ms

- `1 frame` is a scheduler/render boundary (`_step`).
- `1 frame` contains `N` ticks, where `N` is dynamic.
- `1 ms` is timer/wait time axis and does not map 1:1 to ticks.
- Therefore:
  - frame count controls pacing,
  - tick count controls execution throughput,
  - ms controls timer predicates.

## Turbo Mode (important)

- Turbo mode does not change frame interval directly.
- Turbo mode changes the tick continuation condition:
  - without turbo: redraw request can stop additional ticks in the same frame,
  - with turbo: redraw request does not stop same-frame ticking.
- Practical effect: same FPS, more work per frame.

## Moonscratch Design Rules

## Time model

- Runtime clock is virtual: `nowMs`.
- Time is updated only via explicit `setTime(nowMs)`.
- `stepFrame` does not advance clock time.

## Frame API policy

- Canonical API:
  - `setTime(nowMs)`
  - `stepFrame(frameCount = 1)`
  - `runFrames(...)`
  - `runUntilIdle(...)`
- Recommended viewer loop:
  1. call `setTime(...)` once per RAF/tick,
  2. run one or more `stepFrame(...)` calls within a work budget,
  3. render once after stepping.

## Compatibility note

- `scratch-vm` uses one draw per `Runtime._step()` and uses `redrawRequested` to decide whether to continue stepping in the same frame.
- `moonscratch` should preserve this shape: avoid exposing intermediate script progress by rendering between partial step chunks.
