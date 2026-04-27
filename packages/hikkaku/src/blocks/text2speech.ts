import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource } from '../core/block-helper'
import { block } from '../core/composer'
import type { HikkakuString, PrimitiveSource } from '../core/types'

export type TextToSpeechVoice =
  | 'ALTO'
  | 'TENOR'
  | 'SQUEAK'
  | 'GIANT'
  | 'KITTEN'
  | 'GOOGLE'

export const speakAndWait = (words: PrimitiveSource<HikkakuString>) => {
  return block('text2speech_speakAndWait', {
    inputs: {
      WORDS: fromPrimitiveSource(InputType.String, words, 'hello'),
    },
  })
}

export const setVoice = (voice: PrimitiveSource<HikkakuString>) => {
  return block('text2speech_setVoice', {
    inputs: {
      VOICE: fromPrimitiveSource(InputType.String, voice, 'ALTO'),
    },
  })
}

export const setLanguage = (language: PrimitiveSource<HikkakuString>) => {
  return block('text2speech_setLanguage', {
    inputs: {
      LANGUAGE: fromPrimitiveSource(InputType.String, language, 'en'),
    },
  })
}
