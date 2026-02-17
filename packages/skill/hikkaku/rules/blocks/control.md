---
title: Blocks - Control
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

# Control Blocks

## repeat(times, handler)

Repeats enclosed blocks a fixed number of times.

Input: `times`, `handler`.

Output: Scratch statement block definition that is appended to the current script stack.

* `times: PrimitiveSource<number>` - number of iterations
* `handler: () => void` - body of the loop

Example:
```ts
import { repeat } from 'hikkaku/blocks'

repeat(10, () => {})
```

## repeatUntil(condition, handler)

Repeats until the condition becomes true.

Input: `condition`, `handler`.

Output: Scratch statement block definition that is appended to the current script stack.

* `condition: PrimitiveSource<boolean>`
* `handler: () => void`

Example:
```ts
import { repeatUntil } from 'hikkaku/blocks'

repeatUntil(true, () => {})
```

## repeatWhile(condition, handler)

Repeats while the condition remains true.

Input: `condition`, `handler`.

Output: Scratch statement block definition that is appended to the current script stack.

* `condition: PrimitiveSource<boolean>`
* `handler: () => void`

Example:
```ts
import { repeatWhile } from 'hikkaku/blocks'

repeatWhile(true, () => {})
```

## forEach(variable, value, handler)

Loops with a loop variable.

Input: `variable`, `value`, `handler`.

Output: Scratch statement block definition that is appended to the current script stack.

* `variable: VariableReference`
* `value: PrimitiveSource<number>` - upper bound
* `handler: () => void`

Example:
```ts
import { forEach } from 'hikkaku/blocks'

forEach(variable, 10, () => {})
```

## forever(handler)

Infinite loop.

Input: `handler`.

Output: Scratch statement block definition that is appended to the current script stack.

* `handler: () => void`

Example:
```ts
import { forever } from 'hikkaku/blocks'

forever(() => {})
```

## wait(seconds)

Pauses execution.

Input: `seconds`.

Output: Scratch statement block definition that is appended to the current script stack.

* `seconds: PrimitiveSource<number>`

Example:
```ts
import { wait } from 'hikkaku/blocks'

wait(10)
```

## waitUntil(condition)

Waits until condition becomes true.

Input: `condition`.

Output: Scratch statement block definition that is appended to the current script stack.

* `condition: PrimitiveSource<boolean>`

Example:
```ts
import { waitUntil } from 'hikkaku/blocks'

waitUntil(true)
```

## ifThen(condition, handler)

Conditional execution.

Input: `condition`, `handler`.

Output: Scratch statement block definition that is appended to the current script stack.

* `condition: PrimitiveSource<boolean>`
* `handler: () => void`

Example:
```ts
import { ifThen } from 'hikkaku/blocks'

ifThen(true, () => {})
```

## ifElse(condition, thenHandler, elseHandler)

If / else branching.

Input: `condition`, `thenHandler`, `elseHandler`.

Output: Scratch statement block definition that is appended to the current script stack.

* `condition: PrimitiveSource<boolean>`
* `thenHandler: () => void`
* `elseHandler: () => void`

Example:
```ts
import { ifElse } from 'hikkaku/blocks'

ifElse(true, () => {}, () => {})
```

## match(branches)

Builds chained if / else-if / else branching from condition-handler pairs.

Input: `branches`.

Output: Scratch statement block definition that is appended to the current script stack.

* `branches: Input value used by this block`

Example:
```ts
import { match } from 'hikkaku/blocks'

match(...[[true, () => {}]] as any)
```

## stop(option)

Stops scripts.

Input: `option`.

Output: Scratch statement block definition that is appended to the current script stack.

* `option: StopOption` - 'all' | 'this script' | 'other scripts in sprite' | 'other scripts in stage'

Example:
```ts
import { stop } from 'hikkaku/blocks'

stop('all')
```

## CREATE_CLONE_MYSELF()

Special menu value for cloning the current sprite.

Input: none.

Output: String constant used as the `target` argument of {@link createClone}.

Example:
```ts
import { CREATE_CLONE_MYSELF, createClone } from 'hikkaku/blocks'

createClone(CREATE_CLONE_MYSELF)
```

## createClone(target)

Creates a clone of a target.

Input: `target`.

Output: Scratch statement block definition that is appended to the current script stack.

* `target: PrimitiveSource<string>` - string

Example:
```ts
import { createClone } from 'hikkaku/blocks'

createClone('Sprite1')
```

## deleteThisClone()

Deletes the current clone.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { deleteThisClone } from 'hikkaku/blocks'

deleteThisClone()
```

## getCounter()

Returns the global counter value.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getCounter } from 'hikkaku/blocks'

getCounter()
```

## incrCounter()

Increments the counter.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { incrCounter } from 'hikkaku/blocks'

incrCounter()
```

## clearCounter()

Resets the counter.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { clearCounter } from 'hikkaku/blocks'

clearCounter()
```

## controlStartAsClone(stack)

Starts the script when the clone is created. You should use this to control clone behavior.

Input: `stack`.

Output: Scratch statement block definition that is appended to the current script stack.

* `stack: Input value used by this block` - Optional.

Example:
```ts
import { controlStartAsClone } from 'hikkaku/blocks'

controlStartAsClone(() => {})
```

## allAtOnce(handler)

Executes enclosed blocks without screen refresh.

Input: `handler`.

Output: Scratch statement block definition that is appended to the current script stack.

* `handler: () => void`

Example:
```ts
import { allAtOnce } from 'hikkaku/blocks'

allAtOnce(() => {})
```
