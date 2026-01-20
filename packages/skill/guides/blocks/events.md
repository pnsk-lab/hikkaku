---
title: Blocks - Events
impact: HIGH
---

# Events

## whenFlagClicked(stack?)

Runs when green flag is clicked.

* `stack?: () => void`

## whenKeyPressed(key, stack?)

Runs when key is pressed.

* `key: string`

## whenThisSpriteClicked(stack?)

Runs when sprite is clicked.

## whenStageClicked(stack?)

Runs when stage is clicked.

## whenBackdropSwitchesTo(backdrop, stack?)

Runs when backdrop changes.

## whenBroadcastReceived(broadcast, stack?)

Runs when a broadcast is received.

## whenTouchingObject(target, stack?)

Runs when touching object.

## whenGreaterThan(menu, value, stack?)

Triggered by sensor threshold.

* `menu: string` (e.g. loudness, timer)

## broadcast(message)

Sends a broadcast.

## broadcastAndWait(message)

Broadcasts and waits.
