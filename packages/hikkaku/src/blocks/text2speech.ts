import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { block, valueBlock } from '../core/composer'
import type {
  HikkakuNumber,
  HikkakuString,
  PrimitiveSource,
} from '../core/types'

export type Text2SpeechVoice = 'ALTO' | 'TENOR' | 'SQUEAK' | 'GIANT' | 'KITTEN'

/**
 * Speaks the given words and waits.
 *
 * Input: `words`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param words See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { speakAndWait } from 'hikkaku/blocks'
 *
 * speakAndWait('hello')
 * ```
 */
export const speakAndWait = (words: PrimitiveSource<HikkakuString>) => {
  return block('text2speech_speakAndWait', {
    inputs: {
      WORDS: fromPrimitiveSource(InputType.String, words, 'hello'),
    },
  })
}

/**
 * Sets the voice for text-to-speech.
 *
 * Input: `voice`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param voice See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setVoice } from 'hikkaku/blocks'
 *
 * setVoice('ALTO')
 * ```
 */
export const setVoice = (voice: PrimitiveSource<HikkakuString>) => {
  return block('text2speech_setVoice', {
    inputs: {
      VOICE: menuInput(voice, menuOfVoice),
    },
  })
}

export const menuOfVoice = (voice: Text2SpeechVoice = 'ALTO') => {
  return valueBlock<HikkakuString>('text2speech_menu_voices', {
    fields: {
      voices: [voice, null],
    },
    isShadow: true,
  })
}

/**
 * Sets the language for text-to-speech.
 *
 * Input: `language`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param language See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setLanguage } from 'hikkaku/blocks'
 *
 * setLanguage('en')
 * ```
 */
export const setLanguage = (language: PrimitiveSource<HikkakuString>) => {
  return block('text2speech_setLanguage', {
    inputs: {
      LANGUAGE: menuInput(language, menuOfLanguage),
    },
  })
}

export const menuOfLanguage = (language = 'en') => {
  return valueBlock<HikkakuString>('text2speech_menu_languages', {
    fields: {
      languages: [language, null],
    },
    isShadow: true,
  })
}

/**
 * Returns the current text-to-speech language.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getLanguage } from 'hikkaku/blocks'
 *
 * getLanguage()
 * ```
 */
export const getLanguage = () => {
  return valueBlock<HikkakuNumber>('text2speech_getLanguage', {})
}
