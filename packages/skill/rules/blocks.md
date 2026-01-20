---
title: List of Blocks
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

## control.ts — Control Blocks

### repeat(times, handler)

Repeats enclosed blocks a fixed number of times.

* `times: PrimitiveSource<number>` – number of iterations
* `handler: () => void` – body of the loop

### repeatUntil(condition, handler)

Repeats until the condition becomes true.

* `condition: PrimitiveSource<boolean>`
* `handler: () => void`

### repeatWhile(condition, handler)

Repeats while the condition remains true.

* `condition: PrimitiveSource<boolean>`
* `handler: () => void`

### forEach(variable, value, handler)

Loops with a loop variable.

* `variable: VariableReference`
* `value: PrimitiveSource<number>` – upper bound
* `handler: () => void`

### forever(handler)

Infinite loop.

* `handler: () => void`

### wait(seconds)

Pauses execution.

* `seconds: PrimitiveSource<number>`

### waitUntil(condition)

Waits until condition becomes true.

* `condition: PrimitiveSource<boolean>`

### ifThen(condition, handler)

Conditional execution.

* `condition: PrimitiveSource<boolean>`
* `handler: () => void`

### ifElse(condition, thenHandler, elseHandler)

If / else branching.

* `condition: PrimitiveSource<boolean>`
* `thenHandler: () => void`
* `elseHandler: () => void`

### stop(option)

Stops scripts.

* `option: 'all' | 'this script' | 'other scripts in sprite' | 'other scripts in stage'`

### createClone(target)

Creates a clone of a target.

* `target: string`

### deleteThisClone()

Deletes the current clone.

### getCounter()

Returns the global counter value.

### incrCounter()

Increments the counter.

### clearCounter()

Resets the counter.

### allAtOnce(handler)

Executes enclosed blocks without screen refresh.

* `handler: () => void`

---

## data.ts — Variables & Lists

### getVariable(variable)

Returns the value of a variable.

* `variable: VariableReference`

### setVariableTo(variable, value)

Sets a variable.

* `variable: VariableReference`
* `value: PrimitiveSource<number | string>`

### changeVariableBy(variable, value)

Changes a variable by an amount.

* `variable: VariableReference`
* `value: PrimitiveSource<number>`

### showVariable(variable)

Shows variable monitor.

### hideVariable(variable)

Hides variable monitor.

### getListContents(list)

Returns list contents as text.

* `list: ListReference`

### addToList(list, item)

Appends an item.

* `list: ListReference`
* `item: PrimitiveSource<string | number>`

### deleteOfList(list, index)

Deletes an item.

* `index: PrimitiveSource<number | string>`

### deleteAllOfList(list)

Clears list.

### insertAtList(list, index, item)

Inserts item at index.

### replaceItemOfList(list, index, item)

Replaces item at index.

### getItemOfList(list, index)

Returns list item.

### getItemNumOfList(list, item)

Returns index of item.

### lengthOfList(list)

Returns list length.

### listContainsItem(list, item)

Checks membership.

### showList(list)

Shows list monitor.

### hideList(list)

Hides list monitor.

---

## events.ts — Events

### whenFlagClicked(stack?)

Runs when green flag is clicked.

* `stack?: () => void`

### whenKeyPressed(key, stack?)

Runs when key is pressed.

* `key: string`

### whenThisSpriteClicked(stack?)

Runs when sprite is clicked.

### whenStageClicked(stack?)

Runs when stage is clicked.

### whenBackdropSwitchesTo(backdrop, stack?)

Runs when backdrop changes.

### whenBroadcastReceived(broadcast, stack?)

Runs when a broadcast is received.

### whenTouchingObject(target, stack?)

Runs when touching object.

### whenGreaterThan(menu, value, stack?)

Triggered by sensor threshold.

* `menu: string` (e.g. loudness, timer)

### broadcast(message)

Sends a broadcast.

### broadcastAndWait(message)

Broadcasts and waits.

---

## looks.ts — Appearance

### say(message)

Displays a speech bubble.

### sayForSecs(message, seconds)

Speaks for duration.

### think(message)

Displays thought bubble.

### thinkForSecs(message, seconds)

Thinks for duration.

### show()

Shows sprite.

### hide()

Hides sprite.

### switchCostumeTo(costume)

Switches costume.

### nextCostume()

Next costume.

### switchBackdropTo(backdrop)

Switch backdrop.

### switchBackdropToAndWait(backdrop)

Switch backdrop and wait.

### nextBackdrop()

Next backdrop.

### changeLooksEffectBy(effect, value)

Changes graphic effect.

### setLooksEffectTo(effect, value)

Sets graphic effect.

### clearGraphicEffects()

Clears effects.

### changeSizeBy(value)

Changes size.

### setSizeTo(value)

Sets size.

### goToFrontBack(position)

Moves sprite layer.

### goForwardBackwardLayers(direction, layers)

Moves layers.

### getSize()

Returns size.

### getCostumeNumberName(value)

Returns costume number or name.

### getBackdropNumberName(value)

Returns backdrop number or name.

---

## motion.ts — Motion

### moveSteps(steps)

Moves sprite.

### gotoXY(x, y)

Moves to coordinates.

### changeXBy(dx)

Changes X.

### changeYBy(dy)

Changes Y.

### setX(x)

Sets X.

### setY(y)

Sets Y.

### goTo(target)

Moves to target.

### turnRight(degrees)

Turns right.

### turnLeft(degrees)

Turns left.

### pointInDirection(direction)

Points direction.

### pointTowards(target)

Points toward target.

### glide(seconds, x, y)

Glides to position.

### glideTo(seconds, target)

Glides to target.

### ifOnEdgeBounce()

Bounces on edge.

### setRotationStyle(style)

Sets rotation style.

### getX()

Returns X position.

### getY()

Returns Y position.

### getDirection()

Returns direction.

---

## operator.ts — Operators

### add(a, b)

Addition.

### subtract(a, b)

Subtraction.

### multiply(a, b)

Multiplication.

### divide(a, b)

Division.

### lt(a, b)

Less-than comparison.

### equals(a, b)

Equality comparison.

### gt(a, b)

Greater-than comparison.

### and(a, b)

Logical AND.

### or(a, b)

Logical OR.

### not(operand)

Logical NOT.

### random(from, to)

Random number.

### join(a, b)

String concatenation.

### letterOf(letter, text)

Character extraction.

### length(text)

String length.

### contains(text, substring)

Substring check.

### mod(a, b)

Modulo.

### round(value)

Rounds number.

### mathop(operator, value)

Math operation (sin, cos, log, etc.).

---

## procedures.ts — Custom Blocks

### procedureLabel(text)

Label fragment for custom block.

### procedureBoolean(name)

Boolean argument fragment.

### procedureStringOrNumber(name)

String/number argument fragment.

### defineProcedure(proclist, stack?, warp?)

Defines a custom procedure.

* `proclist: ProcedureProc[]`
* `stack?: (references) => void`
* `warp?: boolean`

### callProcedure(proccode, argumentIds, inputs, warp?)

Calls a custom procedure.

### argumentReporterStringNumber(reference)

Reporter for string/number argument.

### argumentReporterBoolean(reference)

Reporter for boolean argument.

---

## sensing.ts — Sensing

### getMouseX(), getMouseY()

Mouse position.

### touchingObject(target)

Touching target check.

### touchingColor(color)

Touching color check.

### colorTouchingColor(color, targetColor)

Color overlap check.

### distanceTo(target)

Distance to target.

### getTimer()

Timer value.

### resetTimer()

Resets timer.

### setDragMode(mode)

Sets drag behavior.

### getMouseDown()

Mouse button state.

### getKeyPressed(key)

Key state.

### current(menu)

Current date/time value.

### getAttributeOf(property, target)

Reads target attribute.

### daysSince2000()

Days since 2000-01-01.

### getLoudness(), isLoud()

Microphone loudness.

### askAndWait(question)

Asks user input.

### getAnswer()

Returns last answer.

### getUsername()

Returns username.

---

## sound.ts — Sound

### playSound(sound)

Plays sound.

### playSoundUntilDone(sound)

Plays and waits.

### stopAllSounds()

Stops all sounds.

### setSoundEffectTo(effect, value)

Sets sound effect.

### changeSoundEffectBy(effect, value)

Changes sound effect.

### clearEffects()

Clears sound effects.

### setVolumeTo(value)

Sets volume.

### changeVolumeBy(value)

Changes volume.

### getVolume()

Returns volume.
