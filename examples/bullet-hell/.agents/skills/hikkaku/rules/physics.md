---
title: "Physics for Scratch Platformers (Hikkaku)"
description: "Collision, pseudo-physics, scrolling, and tiles for Scratch-style platformers."
impact: LOW
---

# Physics for Scratch Platformers (Hikkaku)

This version is written in Hikkaku-friendly TypeScript. All runtime logic uses Hikkaku blocks (no JS operators inside `run()` handlers).

## 0) Scratch assumptions that shape design

- Scratch projects typically update at about 30 fps. Treat `vx`/`vy` as **pixels per frame**.
- If a 60 fps add-on is used, the same code runs **twice as fast** unless you scale speeds/accelerations.

## 1) Minimal pseudo-physics (velocity, gravity, jump)

Key variables:

- `vx`: horizontal speed
- `vy`: vertical speed
- `onGround`: `1` if touching ground, else `0`
- `gravity`: e.g. `-1`
- `jumpPower`: e.g. `10`
- `maxFall`: e.g. `-12`

Hikkaku-style setup and main loop:

```ts
import { Project } from 'hikkaku'
import {
  changeVariableBy,
  whenFlagClicked,
  forever,
  ifThen,
  repeat,
  getKeyPressed,
  getVariable,
  setVariableTo,
  touchingColor,
  changeXBy,
  changeYBy,
} from 'hikkaku/blocks'
import {
  add,
  and,
  equals,
  lt,
  mathop,
  multiply,
  subtract,
} from 'hikkaku/blocks'

const project = new Project()
const player = project.createSprite('Player')

const vx = player.createVariable('vx', 0)
const vy = player.createVariable('vy', 0)
const onGround = player.createVariable('onGround', 0)
const dir = player.createVariable('dir', 1)
const hit = player.createVariable('hit', 0)
const gravity = -1
const jumpPower = 10
const maxFall = -12
const speed = 3

const wallColor = '#000000' // replace with your collision color

const moveX = (dx) => {
  setVariableTo(hit, 0)
  setVariableTo(dir, 1)
  ifThen(lt(dx, 0), () => {
    setVariableTo(dir, -1)
  })
  repeat(mathop('abs', dx), () => {
    ifThen(equals(getVariable(hit), 0), () => {
      changeXBy(getVariable(dir))
      ifThen(touchingColor(wallColor), () => {
        changeXBy(multiply(getVariable(dir), -1))
        setVariableTo(vx, 0)
        setVariableTo(hit, 1)
      })
    })
  })
}

const moveY = (dy) => {
  setVariableTo(hit, 0)
  setVariableTo(dir, 1)
  ifThen(lt(dy, 0), () => {
    setVariableTo(dir, -1)
  })
  repeat(mathop('abs', dy), () => {
    ifThen(equals(getVariable(hit), 0), () => {
      changeYBy(getVariable(dir))
      ifThen(touchingColor(wallColor), () => {
        changeYBy(multiply(getVariable(dir), -1))
        ifThen(lt(dy, 0), () => {
          setVariableTo(onGround, 1)
        })
        setVariableTo(vy, 0)
        setVariableTo(hit, 1)
      })
    })
  })
}

player.run(() => {
  whenFlagClicked(() => {
    setVariableTo(vx, 0)
    setVariableTo(vy, 0)
    setVariableTo(onGround, 0)

    forever(() => {
      setVariableTo(vx, 0)
      ifThen(getKeyPressed('left arrow'), () => {
        changeVariableBy(vx, -speed)
      })
      ifThen(getKeyPressed('right arrow'), () => {
        changeVariableBy(vx, speed)
      })
      ifThen(and(equals(getVariable(onGround), 1), getKeyPressed('space')), () => {
        setVariableTo(vy, jumpPower)
        setVariableTo(onGround, 0)
      })

      changeVariableBy(vy, gravity)
      ifThen(lt(getVariable(vy), maxFall), () => {
        setVariableTo(vy, maxFall)
      })

      // move & collide
      moveX(getVariable(vx))
      moveY(getVariable(vy))
    })
  })
})
```

## 2) Collision approaches (Hikkaku blocks)

### A) Color collision

- Use `touchingColor('#rrggbb')`.
- Keep collision art flat and solid (no gradients).
- Separate visual costume from hitbox costume.

### B) Sprite collision

- Use `touchingObject('WallSprite')`.
- Great for moving platforms and clean hitboxes.

### C) Tile/grid collision

- Store map data in lists/strings.
- Use grid math to convert `worldX/worldY` to tile indexes.

## 3) The core of “no clipping”: axis separation + sub-steps

The `moveX`/`moveY` helpers above implement:

- X/Y separation
- 1px sub-steps
- backstep + velocity zero on collision

This pattern avoids tunneling at higher speeds.

## 4) “Feels good” controls (Scratch-friendly)

- **Coyote time:** allow jump for a few frames after leaving ground.
- **Jump buffer:** if jump pressed before landing, trigger on landing.
- **Variable jump:** reduce `vy` when jump released early.
- **Max fall speed:** clamp `vy` to `maxFall`.
- **Friction/accel:** use `changeVariableBy` and `multiply` for damping.

Example friction snippet:

```ts
// vx = vx * 0.8
setVariableTo(vx, multiply(getVariable(vx), 0.8))
```

## 5) Slopes, steps, and ceilings

### Small steps (1–3 px)

If X movement hits a wall, try stepping up a few pixels first.

```ts
// inside moveX, after detecting a wall:
repeat(3, () => {
  changeYBy(1)
  ifThen(touchingColor(wallColor), () => {
    changeYBy(-1)
  })
})
```

### Slopes

- Tile slopes: special tiles with custom height logic.
- Color slopes: sample multiple points under the feet and snap `y`.

### Ceilings

- If `vy > 0` and hit ceiling, set `vy = 0`.

## 6) Moving platforms

Pattern:

1. Platform stores `(dx, dy)` each frame.
2. If `onGround` and standing on the platform, add `(dx, dy)` to player.
3. Run normal collision resolution afterward.

## 7) Scrolling (camera) and collision

World coordinates + camera offset (stable):

```ts
const worldX = player.createVariable('worldX', 0)
const worldY = player.createVariable('worldY', 0)
const cameraX = player.createVariable('cameraX', 0)
const cameraY = player.createVariable('cameraY', 0)

// world update
setVariableTo(worldX, add(getVariable(worldX), getVariable(vx)))
setVariableTo(worldY, add(getVariable(worldY), getVariable(vy)))

// draw (screen = world - camera)
// gotoXY(
//   subtract(getVariable(worldX), getVariable(cameraX)),
//   subtract(getVariable(worldY), getVariable(cameraY)),
// )
```

Avoid moving collision objects with the camera unless you also adjust collision logic.

## 8) Debugging tips

- Toggle hitbox visibility.
- Show `vx`, `vy`, `onGround` as monitors.
- Watch `abs(vx)`, `abs(vy)` to find tunneling cases.
- Re-pick collision colors if color checks fail.
