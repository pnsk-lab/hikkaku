---
title: Blocks - Procedures
impact: HIGH
---

# Custom Blocks

## procedureLabel(text)

Create a static label fragment for a custom block signature.

Input: `text`.

Output: Procedure signature fragment.

* `text: See function signature for accepted input values`

Example:
```ts
import { procedureLabel } from 'hikkaku/blocks'

procedureLabel('Hello')
```

## procedureBoolean(name)

Create a boolean argument fragment for a custom block signature.

Input: `name`.

Output: Procedure signature fragment.

* `name: See function signature for accepted input values`

Example:
```ts
import { procedureBoolean } from 'hikkaku/blocks'

procedureBoolean(undefined as any)
```

## procedureStringOrNumber(name)

Create a string/number argument fragment for a custom block signature.

Input: `name`.

Output: Procedure signature fragment.

* `name: See function signature for accepted input values`

Example:
```ts
import { procedureStringOrNumber } from 'hikkaku/blocks'

procedureStringOrNumber(undefined as any)
```

## defineProcedure(proclist, stack?, warp?)

Define a custom procedure from signature fragments.

Input: `proclist`, optional `stack`, optional `warp`.

Output: Scratch statement block definition that is appended to the current script stack.

* `proclist: T` - ProcedureProc[]
* `stack: (references) => undefined Optional`
* `warp: boolean Optional. If true, run without screen refresh until completion.`
* `references.*.getter(): HikkakuBlock` is available inside `stack` to read arguments.

Example:
```ts
import {
  defineProcedure,
  procedureLabel,
  procedureStringOrNumber,
  say,
} from 'hikkaku/blocks'

defineProcedure(
  [procedureLabel('greet'), procedureStringOrNumber('name')],
  ({ name }) => {
    say(name.getter())
  },
)
```

## callProcedure(...)

Calls a custom procedure.

Input: either (`proccode`, `argumentIds`, `inputs`, `warp`) or (`definitionOrReference`, `inputsByReference`, `warp`).

Output: Scratch statement block definition that is appended to the current script stack.

* Low-level style:
  `callProcedure(proccode, argumentIds, inputs?, warp?)`
* Reference style (recommended):
  `callProcedure(definitionOrReference, [{ reference, value }], warp?)`
* Reference style with object:
  `callProcedure(definitionOrReference, { [argumentId]: value }, warp?)`

Example:
```ts
import {
  callProcedure,
  defineProcedure,
  procedureLabel,
  procedureStringOrNumber,
} from 'hikkaku/blocks'

const greet = defineProcedure([
  procedureLabel('greet'),
  procedureStringOrNumber('name'),
])

callProcedure(greet, [
  { reference: greet.reference.arguments.name, value: 'Ada' },
])
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
