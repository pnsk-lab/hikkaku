import { describe, expect, test } from 'vite-plus/test'

import {
  isMusicPlayDrumEffect,
  isMusicPlayNoteEffect,
  isTextToSpeechEffect,
  isTranslateRequestEffect,
} from './effect-guards.ts'

describe('moonscratch/js/vm/effect-guards.ts', () => {
  test('identifies translate_request effect', () => {
    expect(
      isTranslateRequestEffect({ type: 'translate_request', words: 'hello', language: 'ja' }),
    ).toBe(true)
    expect(isTranslateRequestEffect({ type: 'translate_request', words: 'hello' })).toBe(false)
  })

  test('identifies text_to_speech effect', () => {
    expect(
      isTextToSpeechEffect({
        type: 'text_to_speech',
        target: 'Sprite1',
        words: 'hello',
        voice: 'TENOR',
        language: 'ja',
        waitKey: 'text2speech_done_1',
      }),
    ).toBe(true)
    expect(isTextToSpeechEffect({ type: 'text_to_speech', words: 'hello' })).toBe(false)
  })

  test('identifies music effects', () => {
    expect(
      isMusicPlayNoteEffect({
        type: 'music_play_note',
        target: 'Sprite1',
        note: 60,
        beats: 1,
        instrument: 1,
        tempo: 120,
      }),
    ).toBe(true)
    expect(
      isMusicPlayDrumEffect({
        type: 'music_play_drum',
        target: 'Sprite1',
        drum: 1,
        beats: 0.5,
        tempo: 120,
      }),
    ).toBe(true)
    expect(isMusicPlayDrumEffect({ type: 'music_play_drum', target: 'Sprite1', drum: 1 })).toBe(
      false,
    )
  })
})
