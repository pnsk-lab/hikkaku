---
title: Blocks Overview
impact: HIGH
---

# List of Available Blocks

This document explains the **function names, arguments, and behavior** of all exported helpers in this repository.
Each function corresponds closely to a Scratch 3.0 block and is used to construct SB3-compatible block graphs programmatically.

Example:
```ts
import { gotoXY, add } from 'hikkaku/blocks'
```

---

## Common Concepts

* **PrimitiveSource<T>**
  A polymorphic input type representing:

  * literal values (number / string / boolean)
  * variable reporters
  * operator blocks or other value blocks

* **block(...)**
  Creates a statement block.

* **valueBlock(...)**
  Creates a reporter (value-returning) block.

* **substack(handler)**
  Executes `handler` and returns the ID of the generated substack, used for C-shaped blocks.

---

## Block Categories

* Control: `rules/blocks/control.md`
* Data (Variables & Lists): `rules/blocks/data.md`
* Events: `rules/blocks/events.md`
* Looks: `rules/blocks/looks.md`
* Motion: `rules/blocks/motion.md`
* Operators: `rules/blocks/operator.md`
* Procedures: `rules/blocks/procedures.md`
* Sensing: `rules/blocks/sensing.md`
* Sound: `rules/blocks/sound.md`
