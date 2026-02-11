---
title: Blocks - Procedures
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

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

Input: `proclist`, `stack?`, `warp?`.

Output: Scratch statement block definition that is appended to the current script stack.

* `proclist: List of procedure parts (labels and arguments) that define the procedure's signature`
* `stack: Optional callback that receives references to the procedure arguments and composes the body of the procedure`
* `warp: Optional flag (default `false`)` - If true, the procedure will run without screen refresh until it completes.

Example:
```ts
import { defineProcedure } from 'hikkaku/blocks'

defineProcedure(list as any, () => {}, true)
```

## callProcedure(proccodeOrReference, argumentIdsOrInputs, inputsOrWarp)

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
