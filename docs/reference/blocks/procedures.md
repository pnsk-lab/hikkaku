---
title: Blocks - Procedures
impact: HIGH
---

# Custom Blocks

## procedureLabel(text)

Label fragment for custom block.

Input: `text`.

Output: Scratch statement block definition that is appended to the current script stack.

* `text: See function signature for accepted input values`

Example:
```ts
import { procedureLabel } from 'hikkaku/blocks'

procedureLabel('Hello')
```

## procedureBoolean(name)

Boolean argument fragment.

Input: `name`.

Output: Scratch statement block definition that is appended to the current script stack.

* `name: See function signature for accepted input values`

Example:
```ts
import { procedureBoolean } from 'hikkaku/blocks'

procedureBoolean(undefined as any)
```

## procedureStringOrNumber(name)

String/number argument fragment.

Input: `name`.

Output: Scratch statement block definition that is appended to the current script stack.

* `name: See function signature for accepted input values`

Example:
```ts
import { procedureStringOrNumber } from 'hikkaku/blocks'

procedureStringOrNumber(undefined as any)
```

## defineProcedure(proclist, stack)

Defines a custom procedure.

Input: `proclist`, `stack`, `the`, `but`.

Output: Scratch statement block definition that is appended to the current script stack.

* `proclist: T` - ProcedureProc[]
* `stack: (references) => void Optional`
* `the: Input value used by this block`
* `but: Input value used by this block`

Example:
```ts
import { defineProcedure } from 'hikkaku/blocks'

defineProcedure(list as any, () => {}, undefined as any, undefined as any)
```

## callProcedure(proccode, argumentIds, inputs)

Calls a custom procedure.

Input: `proccode`, `argumentIds`, `inputs`, `warp`.

Output: Scratch statement block definition that is appended to the current script stack.

* `proccode: See function signature for accepted input values`
* `argumentIds: See function signature for accepted input values`
* `inputs: See function signature for accepted input values`
* `warp: See function signature for accepted input values`

Example:
```ts
import { callProcedure } from 'hikkaku/blocks'

callProcedure([] as any, undefined as any, undefined as any, undefined as any)
```

## argumentReporterStringNumber(reference)

Reporter for string/number argument.

Input: `reference`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `reference: See function signature for accepted input values`

Example:
```ts
import { argumentReporterStringNumber } from 'hikkaku/blocks'

argumentReporterStringNumber(reference as any)
```

## argumentReporterBoolean(reference)

Reporter for boolean argument.

Input: `reference`.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

* `reference: See function signature for accepted input values`

Example:
```ts
import { argumentReporterBoolean } from 'hikkaku/blocks'

argumentReporterBoolean(reference as any)
```
