---
title: Blocks Overview
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

# List of Available Blocks

This document explains the function names, arguments, and behavior of exported helpers.
Each function maps closely to a Scratch 3.0 block.

Example:

```ts
import { add, gotoXY } from 'hikkaku/blocks'
```

## Common Concepts

- `PrimitiveSource<T>`: literal values, variable reporters, or value blocks
- `block(...)`: creates a statement block
- `valueBlock(...)`: creates a reporter block
- `substack(handler)`: captures nested block stacks for C-shaped blocks

## Block Categories

- [Control](rules/blocks/control.md)
- [Data](rules/blocks/data.md)
- [Events](rules/blocks/events.md)
- [Looks](rules/blocks/looks.md)
- [Motion](rules/blocks/motion.md)
- [Operator](rules/blocks/operator.md)
- [Procedures](rules/blocks/procedures.md)
- [Sensing](rules/blocks/sensing.md)
- [Sound](rules/blocks/sound.md)
- [Pen](rules/blocks/pen.md)
