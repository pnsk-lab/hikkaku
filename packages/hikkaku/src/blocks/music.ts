import { InputType } from 'sb3-types/enum'
import { fromPrimitiveSource } from '../core/block-helper'
import { block, valueBlock } from '../core/composer'
import type { PrimitiveSource } from '../core/types'

/**
 * Plays drum for beats.
 *
 * Input: `drum`, `beats`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param drum See function signature for accepted input values.
 * @param beats See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { playDrumForBeats } from 'hikkaku/blocks'
 *
 * playDrumForBeats(1, 0.25)
 * ```
 */
export const playDrumForBeats = (
  drum: PrimitiveSource<number>,
  beats: PrimitiveSource<number>,
) => {
  return block('music_playDrumForBeats', {
    inputs: {
      DRUM: fromPrimitiveSource(InputType.Number, drum, 1),
      BEATS: fromPrimitiveSource(InputType.Number, beats, 0.25),
    },
  })
}

/**
 * Plays drum for beats with MIDI drum mapping.
 *
 * Input: `drum`, `beats`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param drum See function signature for accepted input values.
 * @param beats See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { midiPlayDrumForBeats } from 'hikkaku/blocks'
 *
 * midiPlayDrumForBeats(36, 0.25)
 * ```
 */
export const midiPlayDrumForBeats = (
  drum: PrimitiveSource<number>,
  beats: PrimitiveSource<number>,
) => {
  return block('music_midiPlayDrumForBeats', {
    inputs: {
      DRUM: fromPrimitiveSource(InputType.Number, drum, 1),
      BEATS: fromPrimitiveSource(InputType.Number, beats, 0.25),
    },
  })
}

/**
 * Rests for beats.
 *
 * Input: `beats`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param beats See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { restForBeats } from 'hikkaku/blocks'
 *
 * restForBeats(0.25)
 * ```
 */
export const restForBeats = (beats: PrimitiveSource<number>) => {
  return block('music_restForBeats', {
    inputs: {
      BEATS: fromPrimitiveSource(InputType.Number, beats, 0.25),
    },
  })
}

/**
 * Plays note for beats.
 *
 * Input: `note`, `beats`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param note See function signature for accepted input values.
 * @param beats See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { playNoteForBeats } from 'hikkaku/blocks'
 *
 * playNoteForBeats(60, 0.25)
 * ```
 */
export const playNoteForBeats = (
  note: PrimitiveSource<number>,
  beats: PrimitiveSource<number>,
) => {
  return block('music_playNoteForBeats', {
    inputs: {
      NOTE: fromPrimitiveSource(InputType.Number, note, 60),
      BEATS: fromPrimitiveSource(InputType.Number, beats, 0.25),
    },
  })
}

/**
 * Sets instrument.
 *
 * Input: `instrument`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param instrument See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setInstrument } from 'hikkaku/blocks'
 *
 * setInstrument(1)
 * ```
 */
export const setInstrument = (instrument: PrimitiveSource<number>) => {
  return block('music_setInstrument', {
    inputs: {
      INSTRUMENT: fromPrimitiveSource(InputType.Number, instrument, 1),
    },
  })
}

/**
 * Sets instrument with MIDI instrument mapping.
 *
 * Input: `instrument`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param instrument See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { midiSetInstrument } from 'hikkaku/blocks'
 *
 * midiSetInstrument(1)
 * ```
 */
export const midiSetInstrument = (instrument: PrimitiveSource<number>) => {
  return block('music_midiSetInstrument', {
    inputs: {
      INSTRUMENT: fromPrimitiveSource(InputType.Number, instrument, 1),
    },
  })
}

/**
 * Sets tempo.
 *
 * Input: `tempo`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param tempo See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { setTempo } from 'hikkaku/blocks'
 *
 * setTempo(60)
 * ```
 */
export const setTempo = (tempo: PrimitiveSource<number>) => {
  return block('music_setTempo', {
    inputs: {
      TEMPO: fromPrimitiveSource(InputType.Number, tempo, 20),
    },
  })
}

/**
 * Changes tempo.
 *
 * Input: `tempo`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param tempo See function signature for accepted input values.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { changeTempo } from 'hikkaku/blocks'
 *
 * changeTempo(20)
 * ```
 */
export const changeTempo = (tempo: PrimitiveSource<number>) => {
  return block('music_changeTempo', {
    inputs: {
      TEMPO: fromPrimitiveSource(InputType.Number, tempo, 20),
    },
  })
}

/**
 * Returns tempo.
 *
 * Input: none.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { getTempo } from 'hikkaku/blocks'
 *
 * getTempo()
 * ```
 */
export const getTempo = () => {
  return valueBlock('music_getTempo', {})
}
