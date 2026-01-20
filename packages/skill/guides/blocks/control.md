---
title: Blocks - Control
impact: HIGH
---

# Control Blocks

## repeat(times, handler)

Repeats enclosed blocks a fixed number of times.

* `times: PrimitiveSource<number>` – number of iterations
* `handler: () => void` – body of the loop

## repeatUntil(condition, handler)

Repeats until the condition becomes true.

* `condition: PrimitiveSource<boolean>`
* `handler: () => void`

## repeatWhile(condition, handler)

Repeats while the condition remains true.

* `condition: PrimitiveSource<boolean>`
* `handler: () => void`

## forEach(variable, value, handler)

Loops with a loop variable.

* `variable: VariableReference`
* `value: PrimitiveSource<number>` – upper bound
* `handler: () => void`

## forever(handler)

Infinite loop.

* `handler: () => void`

## wait(seconds)

Pauses execution.

* `seconds: PrimitiveSource<number>`

## waitUntil(condition)

Waits until condition becomes true.

* `condition: PrimitiveSource<boolean>`

## ifThen(condition, handler)

Conditional execution.

* `condition: PrimitiveSource<boolean>`
* `handler: () => void`

## ifElse(condition, thenHandler, elseHandler)

If / else branching.

* `condition: PrimitiveSource<boolean>`
* `thenHandler: () => void`
* `elseHandler: () => void`

## stop(option)

Stops scripts.

* `option: 'all' | 'this script' | 'other scripts in sprite' | 'other scripts in stage'`

## createClone(target)

Creates a clone of a target.

* `target: string`

## deleteThisClone()

Deletes the current clone.

## getCounter()

Returns the global counter value.

## incrCounter()

Increments the counter.

## clearCounter()

Resets the counter.

## controlStartAsClone()

Starts the script when the clone is created. You should use this to control clone behavior.

* `handler: () => void`

## allAtOnce(handler)

Executes enclosed blocks without screen refresh.

* `handler: () => void`
