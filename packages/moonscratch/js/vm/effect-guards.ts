import {
  type MusicPlayDrumEffect,
  type MusicPlayNoteEffect,
  type TextToSpeechEffect,
  type TranslateRequestEffect,
  type VMEffect,
} from './types.ts'
import { hasNumberField, hasStringField } from './value-guards.ts'

export const isTranslateRequestEffect = (effect: VMEffect): effect is TranslateRequestEffect =>
  effect.type === 'translate_request' &&
  hasStringField(effect, 'words') &&
  hasStringField(effect, 'language')

export const isTextToSpeechEffect = (effect: VMEffect): effect is TextToSpeechEffect =>
  effect.type === 'text_to_speech' &&
  hasStringField(effect, 'target') &&
  hasStringField(effect, 'words') &&
  hasStringField(effect, 'voice') &&
  hasStringField(effect, 'language') &&
  hasStringField(effect, 'waitKey')

export const isMusicPlayNoteEffect = (effect: VMEffect): effect is MusicPlayNoteEffect =>
  effect.type === 'music_play_note' &&
  hasStringField(effect, 'target') &&
  hasNumberField(effect, 'note') &&
  hasNumberField(effect, 'beats') &&
  hasNumberField(effect, 'instrument') &&
  hasNumberField(effect, 'tempo')

export const isMusicPlayDrumEffect = (effect: VMEffect): effect is MusicPlayDrumEffect =>
  effect.type === 'music_play_drum' &&
  hasStringField(effect, 'target') &&
  hasNumberField(effect, 'drum') &&
  hasNumberField(effect, 'beats') &&
  hasNumberField(effect, 'tempo')
