---
title: Blocks - Events
impact: HIGH
---

# Events

## whenFlagClicked(stack)

Runs when green flag is clicked.

Input: `stack`.

Output: Scratch statement block definition that is appended to the current script stack.

* `stack: () => void Optional`

Example:
```ts
import { whenFlagClicked } from 'hikkaku/blocks'

whenFlagClicked(() => {})
```

## whenKeyPressed(key, stack)

Runs when key is pressed.

Input: `key`, `stack`.

Output: Scratch statement block definition that is appended to the current script stack.

* `key: string`
* `stack: Input value used by this block` - Optional.

Example:
```ts
import { whenKeyPressed } from 'hikkaku/blocks'

whenKeyPressed('space', () => {})
```

## whenThisSpriteClicked(stack)

Runs when sprite is clicked.

Input: `stack`.

Output: Scratch statement block definition that is appended to the current script stack.

* `stack: See function signature for accepted input values` - Optional.

Example:
```ts
import { whenThisSpriteClicked } from 'hikkaku/blocks'

whenThisSpriteClicked(() => {})
```

## whenStageClicked(stack)

Runs when stage is clicked.

Input: `stack`.

Output: Scratch statement block definition that is appended to the current script stack.

* `stack: See function signature for accepted input values` - Optional.

Example:
```ts
import { whenStageClicked } from 'hikkaku/blocks'

whenStageClicked(() => {})
```

## whenBackdropSwitchesTo(backdrop, stack)

Runs when backdrop changes.

Input: `backdrop`, `stack`.

Output: Scratch statement block definition that is appended to the current script stack.

* `backdrop: See function signature for accepted input values`
* `stack: See function signature for accepted input values` - Optional.

Example:
```ts
import { whenBackdropSwitchesTo } from 'hikkaku/blocks'

whenBackdropSwitchesTo('backdrop1', () => {})
```

## whenBroadcastReceived(broadcast, stack)

Runs when a broadcast is received.

Input: `broadcast`, `stack`.

Output: Scratch statement block definition that is appended to the current script stack.

* `broadcast: See function signature for accepted input values`
* `stack: See function signature for accepted input values` - Optional.

Example:
```ts
import { whenBroadcastReceived } from 'hikkaku/blocks'

whenBroadcastReceived('message1', () => {})
```

## whenTouchingObject(target, stack)

Runs when touching object.

Input: `target`, `stack`.

Output: Scratch statement block definition that is appended to the current script stack.

* `target: See function signature for accepted input values`
* `stack: See function signature for accepted input values` - Optional.

Example:
```ts
import { whenTouchingObject } from 'hikkaku/blocks'

whenTouchingObject('mouse-pointer', () => {})
```

## whenGreaterThan(menu, value, stack)

Triggered by sensor threshold.

Input: `menu`, `value`, `stack`.

Output: Scratch statement block definition that is appended to the current script stack.

* `menu: See function signature for accepted input values`
* `value: See function signature for accepted input values`
* `stack: See function signature for accepted input values` - Optional.

Example:
```ts
import { whenGreaterThan } from 'hikkaku/blocks'

whenGreaterThan('loudness', 10, () => {})
```

## broadcast(message)

Sends a broadcast.

Input: `message`.

Output: Scratch statement block definition that is appended to the current script stack.

* `message: See function signature for accepted input values`

Example:
```ts
import { broadcast } from 'hikkaku/blocks'

broadcast('Hello')
```

## broadcastAndWait(message)

Broadcasts and waits.

Input: `message`.

Output: Scratch statement block definition that is appended to the current script stack.

* `message: See function signature for accepted input values`

Example:
```ts
import { broadcastAndWait } from 'hikkaku/blocks'

broadcastAndWait('Hello')
```
