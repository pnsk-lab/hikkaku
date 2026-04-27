import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource, menuInput } from '../core/block-helper'
import { block, valueBlock } from '../core/composer'
import type { HikkakuString, PrimitiveSource } from '../core/types'

export type TextToSpeechVoice =
  | 'ALTO'
  | 'TENOR'
  | 'SQUEAK'
  | 'GIANT'
  | 'KITTEN'
  | 'GOOGLE'

/**
 * Speaks text and waits until completion.
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
 * Sets the text-to-speech voice.
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
 * setVoice('TENOR')
 * ```
 */
export function setVoice(voice: TextToSpeechVoice): ReturnType<typeof block>
export function setVoice(
  voice: PrimitiveSource<HikkakuString>,
): ReturnType<typeof block>
export function setVoice(voice: PrimitiveSource<HikkakuString>) {
  return block('text2speech_setVoice', {
    inputs: {
      VOICE: menuInput(voice, menuOfTextToSpeechVoice),
    },
  })
}

export const menuOfTextToSpeechVoice = (voice: TextToSpeechVoice = 'ALTO') => {
  return valueBlock<HikkakuString>('text2speech_menu_voices', {
    fields: {
      voices: [voice, null],
    },
    isShadow: true,
  })
}

/**
 * Sets the text-to-speech language.
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
 * setLanguage('ja')
 * ```
 */
export const setLanguage = (language: PrimitiveSource<HikkakuString>) => {
  return block('text2speech_setLanguage', {
    inputs: {
      LANGUAGE: menuInput(language, menuOfTextToSpeechLanguage),
    },
  })
}

export const menuOfTextToSpeechLanguage = (language: string = 'en') => {
  return valueBlock<HikkakuString>('text2speech_menu_languages', {
    fields: {
      languages: [language, null],
    },
    isShadow: true,
  })
}
