---
title: Blocks - Procedures
impact: HIGH
---

# Custom Blocks

## procedureLabel(text)

Label fragment for custom block.

## procedureBoolean(name)

Boolean argument fragment.

## procedureStringOrNumber(name)

String/number argument fragment.

## defineProcedure(proclist, stack?, warp?)

Defines a custom procedure.

* `proclist: ProcedureProc[]`
* `stack?: (references) => void`
* `warp?: boolean`

## callProcedure(proccode, argumentIds, inputs, warp?)

Calls a custom procedure.

## argumentReporterStringNumber(reference)

Reporter for string/number argument.

## argumentReporterBoolean(reference)

Reporter for boolean argument.
