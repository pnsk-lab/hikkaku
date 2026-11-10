---
title: Blocks - Pen
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

# Pen

## eraseAll()

Clears all pen marks.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { eraseAll } from 'hikkaku/blocks'

eraseAll()
```

## clear()

Alias for {@link eraseAll}.

Input: none.

Output: Same Scratch statement block definition as {@link eraseAll}.

Example:
```ts
import { clear } from 'hikkaku/blocks'

clear()
```

## stamp()

Stamps sprite costume.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { stamp } from 'hikkaku/blocks'

stamp()
```

## penDown()

Starts drawing.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { penDown } from 'hikkaku/blocks'

penDown()
```

## penUp()

Stops drawing.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { penUp } from 'hikkaku/blocks'

penUp()
```

## setPenColorTo(color)

Sets pen color.

Input: `color`. like: #ffffff, #fff. This does not accept values like "red" or "green" that CSS accepts.

Output: Scratch statement block definition that is appended to the current script stack.

* `color: See function signature for accepted input values`

Example:
```ts
import { setPenColorTo } from 'hikkaku/blocks'

setPenColorTo("#ff0000")
```

## setPenColorToColor()

Alias for {@link setPenColorTo}.

Input: `color`.

Output: Same Scratch statement block definition as {@link setPenColorTo}.

* `color: See function signature for accepted input values`

Example:
```ts
import { setPenColorToColor } from 'hikkaku/blocks'

setPenColorToColor('#ff0000')
```

## changePenColorParamBy(param, value)

Changes pen color parameter by amount.

Input: `param`, `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `param: See function signature for accepted input values`
* `value: See function signature for accepted input values`

Example:
```ts
import { changePenColorParamBy } from 'hikkaku/blocks'

changePenColorParamBy('color', 10)
```

## setPenColorParamTo(param, value)

Sets pen color parameter to value.

Input: `param`, `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `param: See function signature for accepted input values`
* `value: See function signature for accepted input values`

Example:
```ts
import { setPenColorParamTo } from 'hikkaku/blocks'

setPenColorParamTo('color', 10)
```

## changePenSizeBy(size)

Changes pen size by amount.

Input: `size`.

Output: Scratch statement block definition that is appended to the current script stack.

* `size: See function signature for accepted input values`

Example:
```ts
import { changePenSizeBy } from 'hikkaku/blocks'

changePenSizeBy(10)
```

## setPenSizeTo(size)

Sets pen size to value.

Input: `size`.

Output: Scratch statement block definition that is appended to the current script stack.

* `size: See function signature for accepted input values`

Example:
```ts
import { setPenSizeTo } from 'hikkaku/blocks'

setPenSizeTo(10)
```

## setPenShadeToNumber(shade)

Sets pen shade to value.

Input: `shade`.

Output: Scratch statement block definition that is appended to the current script stack.

* `shade: See function signature for accepted input values`

Example:
```ts
import { setPenShadeToNumber } from 'hikkaku/blocks'

setPenShadeToNumber(10)
```

## changePenShadeBy(shade)

Changes pen shade by amount.

Input: `shade`.

Output: Scratch statement block definition that is appended to the current script stack.

* `shade: See function signature for accepted input values`

Example:
```ts
import { changePenShadeBy } from 'hikkaku/blocks'

changePenShadeBy(10)
```

## setPenHueToNumber(hue)

Sets pen hue to value.

Input: `hue`.

Output: Scratch statement block definition that is appended to the current script stack.

* `hue: See function signature for accepted input values`

Example:
```ts
import { setPenHueToNumber } from 'hikkaku/blocks'

setPenHueToNumber(10)
```

## changePenHueBy(hue)

Changes pen hue by amount.

Input: `hue`.

Output: Scratch statement block definition that is appended to the current script stack.

* `hue: See function signature for accepted input values`

Example:
```ts
import { changePenHueBy } from 'hikkaku/blocks'

changePenHueBy(10)
```
