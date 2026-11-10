---
title: Blocks - Looks
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

# Appearance

## say(message)

Displays a speech bubble.

Input: `message`.

Output: Scratch statement block definition that is appended to the current script stack.

* `message: See function signature for accepted input values`

Example:
```ts
import { say } from 'hikkaku/blocks'

say('Hello')
```

## sayForSecs(message, seconds)

Speaks for duration.

Input: `message`, `seconds`.

Output: Scratch statement block definition that is appended to the current script stack.

* `message: See function signature for accepted input values`
* `seconds: See function signature for accepted input values`

Example:
```ts
import { sayForSecs } from 'hikkaku/blocks'

sayForSecs('Hello', 10)
```

## think(message)

Displays thought bubble.

Input: `message`.

Output: Scratch statement block definition that is appended to the current script stack.

* `message: See function signature for accepted input values`

Example:
```ts
import { think } from 'hikkaku/blocks'

think('Hello')
```

## thinkForSecs(message, seconds)

Thinks for duration.

Input: `message`, `seconds`.

Output: Scratch statement block definition that is appended to the current script stack.

* `message: See function signature for accepted input values`
* `seconds: See function signature for accepted input values`

Example:
```ts
import { thinkForSecs } from 'hikkaku/blocks'

thinkForSecs('Hello', 10)
```

## show()

Shows sprite.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { show } from 'hikkaku/blocks'

show()
```

## hide()

Hides sprite.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { hide } from 'hikkaku/blocks'

hide()
```

## switchCostumeTo(costume)

Switches costume.

Input: `costume`.

Output: Scratch statement block definition that is appended to the current script stack.

* `costume: See function signature for accepted input values`

Example:
```ts
import { switchCostumeTo } from 'hikkaku/blocks'

switchCostumeTo('costume1')
```

## nextCostume()

Next costume.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { nextCostume } from 'hikkaku/blocks'

nextCostume()
```

## switchBackdropTo(backdrop)

Switch backdrop.

Input: `backdrop`.

Output: Scratch statement block definition that is appended to the current script stack.

* `backdrop: See function signature for accepted input values`

Example:
```ts
import { switchBackdropTo } from 'hikkaku/blocks'

switchBackdropTo('backdrop1')
```

## switchBackdropToAndWait(backdrop)

Switch backdrop and wait.

Input: `backdrop`.

Output: Scratch statement block definition that is appended to the current script stack.

* `backdrop: See function signature for accepted input values`

Example:
```ts
import { switchBackdropToAndWait } from 'hikkaku/blocks'

switchBackdropToAndWait('backdrop1')
```

## nextBackdrop()

Next backdrop.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { nextBackdrop } from 'hikkaku/blocks'

nextBackdrop()
```

## changeLooksEffectBy(effect, value)

Changes graphic effect.

Input: `effect`, `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `effect: See function signature for accepted input values`
* `value: See function signature for accepted input values`

Example:
```ts
import { changeLooksEffectBy } from 'hikkaku/blocks'

changeLooksEffectBy('color', 10)
```

## setLooksEffectTo(effect, value)

Sets graphic effect.

Input: `effect`, `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `effect: See function signature for accepted input values`
* `value: See function signature for accepted input values`

Example:
```ts
import { setLooksEffectTo } from 'hikkaku/blocks'

setLooksEffectTo('color', 10)
```

## clearGraphicEffects()

Clears effects.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { clearGraphicEffects } from 'hikkaku/blocks'

clearGraphicEffects()
```

## changeSizeBy(value)

Changes size.

Input: `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `value: See function signature for accepted input values`

Example:
```ts
import { changeSizeBy } from 'hikkaku/blocks'

changeSizeBy(10)
```

## setSizeTo(value)

Sets size.

Input: `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `value: See function signature for accepted input values`

Example:
```ts
import { setSizeTo } from 'hikkaku/blocks'

setSizeTo(10)
```

## goToFrontBack(position)

Moves sprite layer.

Input: `position`.

Output: Scratch statement block definition that is appended to the current script stack.

* `position: See function signature for accepted input values`

Example:
```ts
import { goToFrontBack } from 'hikkaku/blocks'

goToFrontBack('front')
```

## goForwardBackwardLayers(direction, layers)

Moves layers.

Input: `direction`, `layers`.

Output: Scratch statement block definition that is appended to the current script stack.

* `direction: See function signature for accepted input values`
* `layers: See function signature for accepted input values`

Example:
```ts
import { goForwardBackwardLayers } from 'hikkaku/blocks'

goForwardBackwardLayers('forward', 10)
```

## getSize()

Returns size.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getSize } from 'hikkaku/blocks'

getSize()
```

## getCostumeNumberName(value)

Returns costume number or name.

Input: `value`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `value: See function signature for accepted input values`

Example:
```ts
import { getCostumeNumberName } from 'hikkaku/blocks'

getCostumeNumberName(10)
```

## getBackdropNumberName(value)

Returns backdrop number or name.

Input: `value`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `value: See function signature for accepted input values`

Example:
```ts
import { getBackdropNumberName } from 'hikkaku/blocks'

getBackdropNumberName(10)
```
