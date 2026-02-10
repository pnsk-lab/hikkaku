---
title: Blocks - Operators
impact: HIGH
---

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

add([[true, () => {}]] as any, undefined as any)
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

subtract([[true, () => {}]] as any, undefined as any)
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

multiply([[true, () => {}]] as any, undefined as any)
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

divide([[true, () => {}]] as any, undefined as any)
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

lt([[true, () => {}]] as any, undefined as any)
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

equals([[true, () => {}]] as any, undefined as any)
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

gt([[true, () => {}]] as any, undefined as any)
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

and([[true, () => {}]] as any, undefined as any)
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

or([[true, () => {}]] as any, undefined as any)
```

## not(operand)

Logical NOT.

Input: `operand`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `operand: See function signature for accepted input values`

Example:
```ts
import { not } from 'hikkaku/blocks'

not(undefined as any)
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

join([[true, () => {}]] as any, undefined as any)
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

mod([[true, () => {}]] as any, undefined as any)
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
