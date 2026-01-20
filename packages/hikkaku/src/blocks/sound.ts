import { fromPrimitiveSource, fromSoundSource } from '../compiler/block-helper'
import { block, valueBlock } from '../compiler/composer'
import type { PrimitiveSource, SoundSource } from '../compiler/types'

export type SoundEffect = 'pitch' | 'pan'

export const playSound = (sound: SoundSource) => {
  return block('sound_play', {
    inputs: {
      SOUND_MENU: fromSoundSource(sound),
    },
  })
}

export const playSoundUntilDone = (sound: SoundSource) => {
  return block('sound_playuntildone', {
    inputs: {
      SOUND_MENU: fromSoundSource(sound),
    },
  })
}

export const stopAllSounds = () => {
  return block('sound_stopallsounds', {})
}

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

export const clearEffects = () => {
  return block('sound_cleareffects', {})
}

export const setVolumeTo = (value: PrimitiveSource<number>) => {
  return block('sound_setvolumeto', {
    inputs: {
      VOLUME: fromPrimitiveSource(value),
    },
  })
}

export const changeVolumeBy = (value: PrimitiveSource<number>) => {
  return block('sound_changevolumeby', {
    inputs: {
      VOLUME: fromPrimitiveSource(value),
    },
  })
}

export const getVolume = () => {
  return valueBlock('sound_volume', {})
}
