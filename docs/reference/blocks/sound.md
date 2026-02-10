---
title: Blocks - Sound
impact: HIGH
---

# Sound

## playSound(sound)

Plays sound.

Input: `sound`.

Output: Scratch statement block definition that is appended to the current script stack.

* `sound: See function signature for accepted input values`

Example:
```ts
import { playSound } from 'hikkaku/blocks'

playSound('pop')
```

## playSoundUntilDone(sound)

Plays and waits.

Input: `sound`.

Output: Scratch statement block definition that is appended to the current script stack.

* `sound: See function signature for accepted input values`

Example:
```ts
import { playSoundUntilDone } from 'hikkaku/blocks'

playSoundUntilDone('pop')
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

setSoundEffectTo('color', 10)
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

changeSoundEffectBy('color', 10)
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
