---
title: Blocks - Procedures
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

# Custom Blocks

## procedureLabel(text)

Creates a label fragment used in `defineProcedure`.

Output: A procedure fragment describing a label segment.

* `text: Static text shown in the custom block signature`

Example:
```ts
import { procedureLabel } from 'hikkaku/blocks'

procedureLabel('Hello')
```

## procedureBoolean(name)

Creates a boolean argument fragment used in `defineProcedure`.

Output: A procedure fragment describing a boolean input.

* `name: Argument name shown in the custom block signature`

Example:
```ts
import { procedureBoolean } from 'hikkaku/blocks'

procedureBoolean(undefined as any)
```

## procedureStringOrNumber(name)

Creates a string/number argument fragment used in `defineProcedure`.

Output: A procedure fragment describing a string/number input.

* `name: Argument name shown in the custom block signature`

Example:
```ts
import { procedureStringOrNumber } from 'hikkaku/blocks'

procedureStringOrNumber(undefined as any)
```

## defineProcedure(proclist)

Defines a custom procedure and returns its definition block.

Output: A procedure definition block with `reference` metadata for safe calls.

* `proclist: List of procedure parts (labels and arguments) that define the procedure's signature`
* `stack: Optional callback that composes the procedure body` - Return `undefined` from this callback (implicit return is fine).
* `warp: If `true`, run the procedure without screen refresh until completion`

Example:
```ts
import { defineProcedure, procedureLabel, procedureStringOrNumber, say } from 'hikkaku/blocks'

const greet = defineProcedure(
[procedureLabel('greet'), procedureStringOrNumber('name')],
({ name }) => {
say(name.getter())
},
)
```

## callProcedure(proccodeOrReference, argumentIdsOrInputs, inputsOrWarp)

Calls a custom procedure.

Output: A `procedures_call` block.

* `proccodeOrReference: Procedure code or the definition/reference returned by `defineProcedure``
* `argumentIdsOrInputs: Argument IDs for low-level calls, or argument inputs for reference-based calls`
* `inputsOrWarp: Optional low-level inputs object or a warp override for reference-based calls`
* `warp: Warp flag used by low-level calls`

Example:
```ts
import { callProcedure, defineProcedure, procedureLabel, procedureStringOrNumber } from 'hikkaku/blocks'

const greet = defineProcedure([
procedureLabel('greet'),
procedureStringOrNumber('name'),
])

callProcedure(greet, [
{ reference: greet.reference.arguments.name, value: 'Ada' },
])
```

## argumentReporterStringNumber(reference)

Creates a reporter block for a string/number procedure argument.

Output: A reporter block that reads the current argument value.

* `reference: String/number argument reference from `defineProcedure``

Example:
```ts
import { argumentReporterStringNumber } from 'hikkaku/blocks'

argumentReporterStringNumber(reference as any)
```

## argumentReporterBoolean(reference)

Creates a reporter block for a boolean procedure argument.

Output: A reporter block that reads the current argument value.

* `reference: Boolean argument reference from `defineProcedure``

Example:
```ts
import { argumentReporterBoolean } from 'hikkaku/blocks'

argumentReporterBoolean(reference as any)
```
