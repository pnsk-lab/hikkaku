import { fromPrimitiveSource, fromSoundSource } from '../core/block-helper'
import { block, valueBlock } from '../core/composer'
import type { PrimitiveSource, SoundSource } from '../core/types'

export type SoundEffect = 'pitch' | 'pan'

/**
 * Plays sound.
 *
 * Input: `sound`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param sound See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { Project } from 'hikkaku'
 * import { SOUNDS } from 'hikkaku/assets'
 * import { playSound } from 'hikkaku/blocks'
 *
 * const project = new Project()
 * const sprite = project.createSprite('Sprite')
 * const sound = sprite.addSound({
 *   ...SOUNDS.COMPUTER_BEEP,
 *   name: 'beep',
 * })
 *
 * playSound(sound)
 * ```
 */
export const playSound = (sound: SoundSource) => {
  return block('sound_play', {
    inputs: {
      SOUND_MENU: fromSoundSource(sound),
    },
  })
}

/**
 * Plays and waits.
 *
 * Input: `sound`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param sound See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { Project } from 'hikkaku'
 * import { SOUNDS } from 'hikkaku/assets'
 * import { playSoundUntilDone } from 'hikkaku/blocks'
 *
 * const project = new Project()
 * const sound = project.addSound({
 *   ...SOUNDS.COMPUTER_BEEP,
 *   name: 'beep',
 * })
 *
 * playSoundUntilDone(sound)
 * ```
 */
export const playSoundUntilDone = (sound: SoundSource) => {
  return block('sound_playuntildone', {
    inputs: {
      SOUND_MENU: fromSoundSource(sound),
    },
  })
}

/**
 * Stops all sounds.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { stopAllSounds } from 'hikkaku/blocks'
 *
 * stopAllSounds()
 * ```
 */
export const stopAllSounds = () => {
  return block('sound_stopallsounds', {})
}

/**
 * Sets sound effect.
 *
 * Input: `effect`, `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param effect See function signature for accepted input values.
 * @param value See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setSoundEffectTo } from 'hikkaku/blocks'
 *
 * setSoundEffectTo('pitch', 10)
 * ```
 */
export const setSoundEffectTo = (
  effect: SoundEffect,
  value: PrimitiveSource<number>,
) => {
  return block('sound_seteffectto', {
    inputs: {
      VALUE: fromPrimitiveSource(value),
    },
    fields: {
      EFFECT: [effect, null],
    },
  })
}

/**
 * Changes sound effect.
 *
 * Input: `effect`, `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param effect See function signature for accepted input values.
 * @param value See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changeSoundEffectBy } from 'hikkaku/blocks'
 *
 * changeSoundEffectBy('pitch', 10)
 * ```
 */
export const changeSoundEffectBy = (
  effect: SoundEffect,
  value: PrimitiveSource<number>,
) => {
  return block('sound_changeeffectby', {
    inputs: {
      VALUE: fromPrimitiveSource(value),
    },
    fields: {
      EFFECT: [effect, null],
    },
  })
}

/**
 * Clears sound effects.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { clearEffects } from 'hikkaku/blocks'
 *
 * clearEffects()
 * ```
 */
export const clearEffects = () => {
  return block('sound_cleareffects', {})
}

/**
 * Sets volume.
 *
 * Input: `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param value See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setVolumeTo } from 'hikkaku/blocks'
 *
 * setVolumeTo(10)
 * ```
 */
export const setVolumeTo = (value: PrimitiveSource<number>) => {
  return block('sound_setvolumeto', {
    inputs: {
      VOLUME: fromPrimitiveSource(value),
    },
  })
}

/**
 * Changes volume.
 *
 * Input: `value`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param value See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changeVolumeBy } from 'hikkaku/blocks'
 *
 * changeVolumeBy(10)
 * ```
 */
export const changeVolumeBy = (value: PrimitiveSource<number>) => {
  return block('sound_changevolumeby', {
    inputs: {
      VOLUME: fromPrimitiveSource(value),
    },
  })
}

/**
 * Returns volume.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getVolume } from 'hikkaku/blocks'
 *
 * getVolume()
 * ```
 */
export const getVolume = () => {
  return valueBlock('sound_volume', {})
}
