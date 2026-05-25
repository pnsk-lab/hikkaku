---
title: Blocks - Sound
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

# Sound

## playSound(sound)

Plays sound.

Input: `sound`.

Output: Scratch statement block definition that is appended to the current script stack.

* `sound: See function signature for accepted input values`

Example:
```ts
import { Project } from 'hikkaku'
import { SOUNDS } from 'hikkaku/assets'
import { playSound } from 'hikkaku/blocks'

const project = new Project()
const sprite = project.createSprite('Sprite')
const sound = sprite.addSound({
...SOUNDS.COMPUTER_BEEP,
name: 'beep',
})

playSound(sound)
```

## playSoundUntilDone(sound)

Plays and waits.

Input: `sound`.

Output: Scratch statement block definition that is appended to the current script stack.

* `sound: See function signature for accepted input values`

Example:
```ts
import { Project } from 'hikkaku'
import { SOUNDS } from 'hikkaku/assets'
import { playSoundUntilDone } from 'hikkaku/blocks'

const project = new Project()
const sound = project.addSound({
...SOUNDS.COMPUTER_BEEP,
name: 'beep',
})

playSoundUntilDone(sound)
```

## stopAllSounds()

Stops all sounds.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { stopAllSounds } from 'hikkaku/blocks'

stopAllSounds()
```

## setSoundEffectTo(effect, value)

Sets sound effect.

Input: `effect`, `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `effect: See function signature for accepted input values`
* `value: See function signature for accepted input values`

Example:
```ts
import { setSoundEffectTo } from 'hikkaku/blocks'

setSoundEffectTo('pitch', 10)
```

## changeSoundEffectBy(effect, value)

Changes sound effect.

Input: `effect`, `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `effect: See function signature for accepted input values`
* `value: See function signature for accepted input values`

Example:
```ts
import { changeSoundEffectBy } from 'hikkaku/blocks'

changeSoundEffectBy('pitch', 10)
```

## clearEffects()

Clears sound effects.

Input: none.

Output: Scratch statement block definition that is appended to the current script stack.

Example:
```ts
import { clearEffects } from 'hikkaku/blocks'

clearEffects()
```

## setVolumeTo(value)

Sets volume.

Input: `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `value: See function signature for accepted input values`

Example:
```ts
import { setVolumeTo } from 'hikkaku/blocks'

setVolumeTo(10)
```

## changeVolumeBy(value)

Changes volume.

Input: `value`.

Output: Scratch statement block definition that is appended to the current script stack.

* `value: See function signature for accepted input values`

Example:
```ts
import { changeVolumeBy } from 'hikkaku/blocks'

changeVolumeBy(10)
```

## getVolume()

Returns volume.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getVolume } from 'hikkaku/blocks'

getVolume()
```
