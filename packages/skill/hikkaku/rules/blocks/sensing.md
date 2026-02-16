---
title: Blocks - Sensing
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

# Sensing

## getMouseX()

Mouse position.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getMouseX } from 'hikkaku/blocks'

getMouseX()
```

## getMouseY()

getMouseY block helper.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getMouseY } from 'hikkaku/blocks'

getMouseY()
```

## touchingObject(target)

Touching target check.

Input: `target`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `target: See function signature for accepted input values`

Example:
```ts
import { touchingObject } from 'hikkaku/blocks'

touchingObject('mouse-pointer')
```

## touchingColor(color)

Touching color check.

Input: `color`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `color: See function signature for accepted input values`

Example:
```ts
import { touchingColor } from 'hikkaku/blocks'

touchingColor("#ff0000")
```

## colorTouchingColor(color, targetColor)

Color overlap check.

Input: `color`, `targetColor`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `color: See function signature for accepted input values`
* `targetColor: See function signature for accepted input values`

Example:
```ts
import { colorTouchingColor } from 'hikkaku/blocks'

colorTouchingColor("#ff0000", "#00ff00")
```

## distanceTo(target)

Distance to target.

Input: `target`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `target: See function signature for accepted input values`

Example:
```ts
import { distanceTo } from 'hikkaku/blocks'

distanceTo('mouse-pointer')
```

## getTimer()

Timer value.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getTimer } from 'hikkaku/blocks'

getTimer()
```

## resetTimer()

Resets timer.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { resetTimer } from 'hikkaku/blocks'

resetTimer()
```

## setDragMode(mode)

Sets drag behavior.

Input: `mode`.

Output: Scratch statement block definition that is appended to the current script stack.

* `mode: See function signature for accepted input values`

Example:
```ts
import { setDragMode } from 'hikkaku/blocks'

setDragMode('draggable')
```

## getMouseDown()

Mouse button state.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getMouseDown } from 'hikkaku/blocks'

getMouseDown()
```

## getKeyPressed(key)

Key state.

Input: `key`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `key: See function signature for accepted input values`

Example:
```ts
import { getKeyPressed } from 'hikkaku/blocks'

getKeyPressed('space')
```

## current(menu)

Current date/time value.

Input: `menu`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `menu: See function signature for accepted input values`

Example:
```ts
import { current } from 'hikkaku/blocks'

current('loudness')
```

## getAttributeOf(property, target)

Reads target attribute.

Input: `property`, `target`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `property: See function signature for accepted input values`
* `target: See function signature for accepted input values`

Example:
```ts
import { getAttributeOf } from 'hikkaku/blocks'

getAttributeOf('x position', 'cat')
```

## daysSince2000()

Days since 2000-01-01.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { daysSince2000 } from 'hikkaku/blocks'

daysSince2000()
```

## getLoudness()

Microphone loudness.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getLoudness } from 'hikkaku/blocks'

getLoudness()
```

## isLoud()

isLoud block helper.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { isLoud } from 'hikkaku/blocks'

isLoud()
```

## askAndWait(question)

Asks user input.

Input: `question`.

Output: Scratch statement block definition that is appended to the current script stack.

* `question: See function signature for accepted input values`

Example:
```ts
import { askAndWait } from 'hikkaku/blocks'

askAndWait('Hello')
```

## getAnswer()

Returns last answer.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getAnswer } from 'hikkaku/blocks'

getAnswer()
```

## getUsername()

Returns username.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getUsername } from 'hikkaku/blocks'

getUsername()
```
