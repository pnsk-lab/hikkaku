---
title: Blocks - Motion
impact: HIGH
---

# Motion

## moveSteps(steps)

Moves sprite.

Input: `steps`.

Output: Scratch statement block definition that is appended to the current script stack.

* `steps: See function signature for accepted input values`

Example:
```ts
import { moveSteps } from 'hikkaku/blocks'

moveSteps(undefined as any)
```

## gotoXY(x, y)

Moves to coordinates.

Input: `x`, `y`.

Output: Scratch statement block definition that is appended to the current script stack.

* `x: See function signature for accepted input values`
* `y: See function signature for accepted input values`

Example:
```ts
import { gotoXY } from 'hikkaku/blocks'

gotoXY(10, 10)
```

## changeXBy(dx)

Changes X.

Input: `dx`.

Output: Scratch statement block definition that is appended to the current script stack.

* `dx: See function signature for accepted input values`

Example:
```ts
import { changeXBy } from 'hikkaku/blocks'

changeXBy(10)
```

## changeYBy(dy)

Changes Y.

Input: `dy`.

Output: Scratch statement block definition that is appended to the current script stack.

* `dy: See function signature for accepted input values`

Example:
```ts
import { changeYBy } from 'hikkaku/blocks'

changeYBy(10)
```

## setX(x)

Sets X.

Input: `x`.

Output: Scratch statement block definition that is appended to the current script stack.

* `x: See function signature for accepted input values`

Example:
```ts
import { setX } from 'hikkaku/blocks'

setX(10)
```

## setY(y)

Sets Y.

Input: `y`.

Output: Scratch statement block definition that is appended to the current script stack.

* `y: See function signature for accepted input values`

Example:
```ts
import { setY } from 'hikkaku/blocks'

setY(10)
```

## goTo(target)

Moves to target.

Input: `target`.

Output: Scratch statement block definition that is appended to the current script stack.

* `target: See function signature for accepted input values`

Example:
```ts
import { goTo } from 'hikkaku/blocks'

goTo('mouse-pointer')
```

## turnRight(degrees)

Turns right.

Input: `degrees`.

Output: Scratch statement block definition that is appended to the current script stack.

* `degrees: See function signature for accepted input values`

Example:
```ts
import { turnRight } from 'hikkaku/blocks'

turnRight(10)
```

## turnLeft(degrees)

Turns left.

Input: `degrees`.

Output: Scratch statement block definition that is appended to the current script stack.

* `degrees: See function signature for accepted input values`

Example:
```ts
import { turnLeft } from 'hikkaku/blocks'

turnLeft(10)
```

## pointInDirection(direction)

Points direction.

Input: `direction`.

Output: Scratch statement block definition that is appended to the current script stack.

* `direction: See function signature for accepted input values`

Example:
```ts
import { pointInDirection } from 'hikkaku/blocks'

pointInDirection('forward')
```

## pointTowards(target)

Points toward target.

Input: `target`.

Output: Scratch statement block definition that is appended to the current script stack.

* `target: See function signature for accepted input values`

Example:
```ts
import { pointTowards } from 'hikkaku/blocks'

pointTowards('mouse-pointer')
```

## glide(seconds, x, y)

Glides to position.

Input: `seconds`, `x`, `y`.

Output: Scratch statement block definition that is appended to the current script stack.

* `seconds: See function signature for accepted input values`
* `x: See function signature for accepted input values`
* `y: See function signature for accepted input values`

Example:
```ts
import { glide } from 'hikkaku/blocks'

glide(10, 10, 10)
```

## glideTo(seconds, target)

Glides to target.

Input: `seconds`, `target`.

Output: Scratch statement block definition that is appended to the current script stack.

* `seconds: See function signature for accepted input values`
* `target: See function signature for accepted input values`

Example:
```ts
import { glideTo } from 'hikkaku/blocks'

glideTo(10, 'mouse-pointer')
```

## ifOnEdgeBounce()

Bounces on edge.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { ifOnEdgeBounce } from 'hikkaku/blocks'

ifOnEdgeBounce()
```

## setRotationStyle(style)

Sets rotation style.

Input: `style`.

Output: Scratch statement block definition that is appended to the current script stack.

* `style: See function signature for accepted input values`

Example:
```ts
import { setRotationStyle } from 'hikkaku/blocks'

setRotationStyle('all around')
```

## getX()

Returns X position.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getX } from 'hikkaku/blocks'

getX()
```

## getY()

Returns Y position.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getY } from 'hikkaku/blocks'

getY()
```

## getDirection()

Returns direction.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getDirection } from 'hikkaku/blocks'

getDirection()
```
