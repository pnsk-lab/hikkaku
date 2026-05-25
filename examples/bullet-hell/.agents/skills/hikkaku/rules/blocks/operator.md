---
title: Blocks - Operators
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

# Operators

## add(a, b)

Addition.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { add } from 'hikkaku/blocks'

add(1, 2)
```

## subtract(a, b)

Subtraction.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { subtract } from 'hikkaku/blocks'

subtract(5, 3)
```

## multiply(a, b)

Multiplication.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { multiply } from 'hikkaku/blocks'

multiply(3, 4)
```

## divide(a, b)

Division.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { divide } from 'hikkaku/blocks'

divide(10, 2)
```

## lt(a, b)

Less-than comparison.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { lt } from 'hikkaku/blocks'

lt(1, 2)
```

## equals(a, b)

Equality comparison.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { equals } from 'hikkaku/blocks'

equals(5, 5)
```

## gt(a, b)

Greater-than comparison.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { gt } from 'hikkaku/blocks'

gt(10, 5)
```

## and(a, b)

Logical AND.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { and } from 'hikkaku/blocks'

and(true, false)
```

## or(a, b)

Logical OR.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { or } from 'hikkaku/blocks'

or(true, false)
```

## not(operand)

Logical NOT.

Input: `operand`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `operand: See function signature for accepted input values`

Example:
```ts
import { not } from 'hikkaku/blocks'

not(false)
```

## random(from, to)

Random number.

Input: `from`, `to`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `from: See function signature for accepted input values`
* `to: See function signature for accepted input values`

Example:
```ts
import { random } from 'hikkaku/blocks'

random(10, 10)
```

## join(a, b)

String concatenation.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { join } from 'hikkaku/blocks'

join('Hello', 'World')
```

## letterOf(letter, text)

Character extraction.

Input: `letter`, `text`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `letter: See function signature for accepted input values`
* `text: See function signature for accepted input values`

Example:
```ts
import { letterOf } from 'hikkaku/blocks'

letterOf(10, 'Hello')
```

## length(text)

String length.

Input: `text`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `text: See function signature for accepted input values`

Example:
```ts
import { length } from 'hikkaku/blocks'

length('Hello')
```

## contains(text, substring)

Substring check.

Input: `text`, `substring`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `text: See function signature for accepted input values`
* `substring: See function signature for accepted input values`

Example:
```ts
import { contains } from 'hikkaku/blocks'

contains('Hello', 'Hello')
```

## mod(a, b)

Modulo.

Input: `a`, `b`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `a: See function signature for accepted input values`
* `b: See function signature for accepted input values`

Example:
```ts
import { mod } from 'hikkaku/blocks'

mod(10, 3)
```

## round(value)

Rounds number.

Input: `value`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `value: See function signature for accepted input values`

Example:
```ts
import { round } from 'hikkaku/blocks'

round(10)
```

## mathop(operator, value)

Math operation (sin, cos, log, etc.).

Input: `operator`, `value`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `operator: See function signature for accepted input values`
* `value: See function signature for accepted input values`

Example:
```ts
import { mathop } from 'hikkaku/blocks'

mathop('abs', 10)
```
