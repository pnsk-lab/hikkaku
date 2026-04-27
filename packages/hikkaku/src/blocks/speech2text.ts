import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type { HikkakuString, PrimitiveSource } from '../core/types'

/**
 * Listens to the microphone and waits for speech recognition.
 *
 * Input: none.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { listenAndWait } from 'hikkaku/blocks'
 *
 * listenAndWait()
 * ```
 */
export const listenAndWait = () => {
  return block('speech2text_listenAndWait', {})
}

/**
 * Hat block that triggers when the given phrase is heard.
 *
 * Input: `phrase`, `stack`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param phrase See function signature for accepted input values.
 * @param stack See function signature for accepted input values. Optional.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { whenIHearHat } from 'hikkaku/blocks'
 *
 * whenIHearHat("let's go", () => {})
 * ```
 */
export const whenIHearHat = (
  phrase: PrimitiveSource<HikkakuString>,
  stack?: () => void,
) => {
  const res = block('speech2text_whenIHearHat', {
    topLevel: true,
    inputs: {
      PHRASE: fromPrimitiveSource(InputType.String, phrase, "let's go"),
    },
  })
  attachStack(res.id, stack)
  return res
}

/**
 * Returns the speech recognized by the microphone.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getSpeech } from 'hikkaku/blocks'
 *
 * getSpeech()
 * ```
 */
export const getSpeech = () => {
  return valueBlock<HikkakuString>('speech2text_getSpeech', {})
}
