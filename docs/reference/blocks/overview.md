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

- [Control](/reference/blocks/control)
- [Data](/reference/blocks/data)
- [Events](/reference/blocks/events)
- [Looks](/reference/blocks/looks)
- [Motion](/reference/blocks/motion)
- [Operator](/reference/blocks/operator)
- [Procedures](/reference/blocks/procedures)
- [Sensing](/reference/blocks/sensing)
- [Sound](/reference/blocks/sound)
- [Pen](/reference/blocks/pen)
