---
title: Positioning and coordinate system
impact: HIGH
---

The stage size is 480x360.

* left-top: (x: -240, y: 180)
* right-top: (x: 240, y: 180)
* center: (x: 0, y: 0)
* right-bottom: (x: 240, y: -180)
* left-bottom: (x: -240, y: -180)

## Positioning with sprites

The stage size is 480x360, but the sprite size is usually smaller.

Sprites often can't be positioned exactly at the edge of the stage because their center point is used for positioning.
To Coordinate determination, use smaller values than the stage edge, such as (x: -230, y: 170) for the left-top corner.

## Judging by positioning

```ts
import {
    getX,
    getY,
    lt,
    ifThen
} from 'hikkaku/blocks'

ifThen(
    lt(getY(), -180),
    () => {

    }
) // This sometimes does not work as expected. This is because the sprite's position sometimes can't reach -180 due to its size.

ifThen(
    lt(getX(), -240),
    () => {

    }
) // This does not work

ifThen(
    lt(getX(), -220),
    () => {

    }
) // This works as expected.

ifThen(
    lt(getY(), -170),
    () => {

    }
) // This works as expected.
```
