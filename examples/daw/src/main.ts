import { type PrimitiveSource, Project } from 'hikkaku'
import {
  add,
  addToList,
  and,
  askAndWait,
  CREATE_CLONE_MYSELF,
  callProcedure,
  changeVariableBy,
  contains,
  controlStartAsClone,
  createClone,
  defineProcedure,
  deleteAllOfList,
  deleteThisClone,
  divide,
  equals,
  eraseAll,
  forEach,
  forever,
  getAnswer,
  getItemOfList,
  getKeyPressed,
  getMouseDown,
  getMouseX,
  getMouseY,
  getTimer,
  gt,
  hide,
  ifElse,
  ifThen,
  join,
  length,
  lengthOfList,
  letterOf,
  listContainsItem,
  lt,
  mathop,
  midiPlayDrumForBeats,
  midiSetInstrument,
  mod,
  multiply,
  or,
  penDown,
  penUp,
  playNoteForBeats,
  procedureLabel,
  repeat,
  repeatUntil,
  replaceItemOfList,
  resetTimer,
  round,
  setDragMode,
  setPenColorTo,
  setPenSizeTo,
  setTempo,
  setVariableTo,
  setVolumeTo,
  setX,
  setY,
  subtract,
  whenFlagClicked,
} from 'hikkaku/blocks'

const TRACK_INIT_COUNT = 4
const TRACK_VIEW_ROWS = 4
const BEATS_PER_BAR = 4
const CLIP_BEATS = BEATS_PER_BAR
const TIMELINE_STEPS = BEATS_PER_BAR * 4
const SONG_BARS = 64
const SONG_BEATS = SONG_BARS * BEATS_PER_BAR
const EVENTS_PER_TRACK = SONG_BEATS / CLIP_BEATS
const ROLL_PITCHES = 36
const ROLL_VISIBLE_PITCHES = 12
const PREVIEW_ROWS = 6
const STEPS_PER_BEAT = 60
const ROLL_STEPS = STEPS_PER_BEAT * CLIP_BEATS
const NOTE_TICKS_PER_BEAT = 60
const NOTE_STEP_TICKS = NOTE_TICKS_PER_BEAT / STEPS_PER_BEAT
const NOTE_LEN_2ND = NOTE_TICKS_PER_BEAT * 2
const NOTE_LEN_4TH = NOTE_TICKS_PER_BEAT
const NOTE_LEN_4TH_TRIPLET = 40
const NOTE_LEN_4TH_QUINTUPLET = 24
const NOTE_LEN_8TH = NOTE_TICKS_PER_BEAT / 2
const NOTE_LEN_16TH = NOTE_TICKS_PER_BEAT / 4
const NOTE_LEN_8TH_TRIPLET = NOTE_TICKS_PER_BEAT / 3
const NOTE_LEN_8TH_QUINTUPLET = NOTE_TICKS_PER_BEAT / 5
const NOTE_LEN_16TH_TRIPLET = 10
const NOTE_LEN_16TH_QUINTUPLET = 6
const NOTE_LEN_32ND_TRIPLET = 5
const NOTE_LEN_32ND_QUINTUPLET = 3
const NOTE_LEN_MAX = NOTE_LEN_2ND
const QUANTIZE_OPTIONS = 12
const DEFAULT_QUANTIZE_INDEX = 7
const MULTIPLIER_MIN = 1
const MULTIPLIER_MAX = 8
const TIMELINE_SCROLL_MAX = SONG_BEATS - TIMELINE_STEPS + 1
const TRANSPORT_STEPS = SONG_BEATS * STEPS_PER_BEAT

const BPM_MIN = 40
const BPM_MAX = 260
const DRUM_MIDI_MIN = 35

// Layout bounds shared between timeline, roll, and BPM panel drawing + hit detection.
// Modifying these affects the UI scale and click areas for each major region.
const TIMELINE_LEFT = -200
const TIMELINE_RIGHT = 184
const TIMELINE_TOP = 164
const TRACK_HEIGHT = 34
const TIMELINE_BOTTOM = TIMELINE_TOP - TRACK_VIEW_ROWS * TRACK_HEIGHT
const TIMELINE_BAR_LABEL_Y = TIMELINE_TOP + 6
const TIMELINE_STEP_W = (TIMELINE_RIGHT - TIMELINE_LEFT) / TIMELINE_STEPS
const TIMELINE_SCROLLBAR_LEFT = TIMELINE_LEFT
const TIMELINE_SCROLLBAR_RIGHT = TIMELINE_RIGHT
const TIMELINE_SCROLLBAR_TOP = 24
const TIMELINE_SCROLLBAR_BOTTOM = 14
const TIMELINE_SCROLLBAR_KNOB_W = 28

const ROLL_LEFT = -200
const ROLL_RIGHT = 184
const ROLL_TOP = 8
const ROLL_CELL_H = 14
const ROLL_CELL_H_MIN = 8
const ROLL_CELL_H_MAX = 22
const ROLL_BOTTOM = ROLL_TOP - ROLL_VISIBLE_PITCHES * ROLL_CELL_H
const ROLL_KEYBOARD_W = 24
const ROLL_SCROLL_W = 10
const ROLL_GRID_LEFT = ROLL_LEFT + ROLL_KEYBOARD_W
const ROLL_GRID_RIGHT = ROLL_RIGHT - ROLL_SCROLL_W
const ROLL_CELL_W = (ROLL_GRID_RIGHT - ROLL_GRID_LEFT) / ROLL_STEPS
const ROLL_SCROLL_LEFT = ROLL_GRID_RIGHT + 1
const ROLL_SCROLL_RIGHT = ROLL_RIGHT
const ROLL_SCROLL_MAX = ROLL_PITCHES - ROLL_VISIBLE_PITCHES + 1
const LENGTH_PANEL_LEFT = 188
const LENGTH_PANEL_RIGHT = 238
const LENGTH_PANEL_TOP = 58
const LENGTH_PANEL_BOTTOM = 6
const LENGTH_QUANT_BTN_LEFT = 191
const LENGTH_QUANT_BTN_RIGHT = 199
const LENGTH_QUANT_BTN2_LEFT = 227
const LENGTH_QUANT_BTN2_RIGHT = 235
const LENGTH_QUANT_BTN_TOP = 52
const LENGTH_QUANT_BTN_BOTTOM = 40
const LENGTH_MULT_BTN_TOP = 26
const LENGTH_MULT_BTN_BOTTOM = 14
const LENGTH_DIGIT_X1 = 208
const LENGTH_DIGIT_X2 = 220
const LENGTH_QUANT_DIGIT_Y = 46
const LENGTH_MULT_DIGIT_Y = 20

const BPM_PANEL_LEFT = 188
const BPM_PANEL_RIGHT = 238
const BPM_PANEL_TOP = 176
const BPM_PANEL_BOTTOM = 64

const BPM_DIGIT_Y = 146
const BPM_DIGIT_X1 = 198
const BPM_DIGIT_X2 = 213
const BPM_DIGIT_X3 = 228

const BPM_SLIDER_LEFT = 194
const BPM_SLIDER_RIGHT = 232
const BPM_SLIDER_Y = 104

const BPM_DEC_BTN_LEFT = 194
const BPM_DEC_BTN_RIGHT = 211
const BPM_INC_BTN_LEFT = 215
const BPM_INC_BTN_RIGHT = 232
const BPM_STEP_BTN_TOP = 130
const BPM_STEP_BTN_BOTTOM = 118

const PLAY_BTN_LEFT = 194
const PLAY_BTN_RIGHT = 232
const PLAY_BTN_TOP = 84
const PLAY_BTN_BOTTOM = 70

const TRACK_PANEL_LEFT = 188
const TRACK_PANEL_RIGHT = 238
const TRACK_PANEL_TOP = 2
const TRACK_PANEL_BOTTOM = -54
const TRACK_CFG_BTN_LEFT = 191
const TRACK_CFG_BTN_RIGHT = 199
const TRACK_CFG_BTN2_LEFT = 227
const TRACK_CFG_BTN2_RIGHT = 235
const TRACK_INST_BTN_TOP = -4
const TRACK_INST_BTN_BOTTOM = -16
const TRACK_VEL_BTN_TOP = -30
const TRACK_VEL_BTN_BOTTOM = -42
const TRACK_DIGIT_X1 = 198
const TRACK_DIGIT_X2 = 213
const TRACK_DIGIT_X3 = 228
const TRACK_INST_DIGIT_Y = -10
const TRACK_VEL_DIGIT_Y = -36
const TRACK_INSTRUMENT_MIN = 1
const TRACK_DRUM_INSTRUMENT = 129
const TRACK_INSTRUMENT_MAX = TRACK_DRUM_INSTRUMENT
const TRACK_VELOCITY_MIN = 0
const TRACK_VELOCITY_MAX = 127
const TRACK_INST_VALUE_LEFT = 201
const TRACK_INST_VALUE_RIGHT = 225
const ZOOM_PANEL_LEFT = 188
const ZOOM_PANEL_RIGHT = 238
const ZOOM_PANEL_TOP = -60
const ZOOM_PANEL_BOTTOM = -108
const ZOOM_DEC_BTN_LEFT = 194
const ZOOM_DEC_BTN_RIGHT = 211
const ZOOM_INC_BTN_LEFT = 215
const ZOOM_INC_BTN_RIGHT = 232
const ZOOM_BTN_TOP = -68
const ZOOM_BTN_BOTTOM = -80
const TRACK_NAV_BTN_TOP = -92
const TRACK_NAV_BTN_BOTTOM = -104

const INST_MODAL_LEFT = -172
const INST_MODAL_RIGHT = 172
const INST_MODAL_TOP = 116
const INST_MODAL_BOTTOM = -112
const INST_MODAL_PREV_LEFT = -156
const INST_MODAL_PREV_RIGHT = -90
const INST_MODAL_NEXT_LEFT = 90
const INST_MODAL_NEXT_RIGHT = 156
const INST_MODAL_NAV_TOP = 28
const INST_MODAL_NAV_BOTTOM = 4
const INST_MODAL_FIND_LEFT = -156
const INST_MODAL_FIND_RIGHT = -52
const INST_MODAL_CANCEL_LEFT = -46
const INST_MODAL_CANCEL_RIGHT = 46
const INST_MODAL_OK_LEFT = 52
const INST_MODAL_OK_RIGHT = 156
const INST_MODAL_ACTION_TOP = -56
const INST_MODAL_ACTION_BOTTOM = -84
const PIXEL_FONT_W = 3
const PIXEL_FONT_H = 5
const PIXEL_FONT_PIXELS = PIXEL_FONT_W * PIXEL_FONT_H

const TOTAL_CLIPS = TRACK_INIT_COUNT * EVENTS_PER_TRACK
const NOTES_PER_CLIP = ROLL_STEPS * ROLL_PITCHES

const CLIP_STARTS = Array.from(
  { length: TOTAL_CLIPS },
  (_, i) => 1 + (i % EVENTS_PER_TRACK) * CLIP_BEATS,
)
const CLIP_LENGTHS = Array.from({ length: TOTAL_CLIPS }, () => CLIP_BEATS)
const TRACK_COLOR_PALETTE = ['#d7263d', '#0f6abf', '#2b9348', '#f77f00']
const TRACK_INSTRUMENTS = [1, 33, 81, TRACK_DRUM_INSTRUMENT]
const TRACK_VELOCITIES = Array.from({ length: TRACK_INIT_COUNT }, () => 100)
const GM_INSTRUMENT_NAMES = [
  'ACOUSTIC GRAND PIANO',
  'BRIGHT ACOUSTIC PIANO',
  'ELECTRIC GRAND PIANO',
  'HONKY TONK PIANO',
  'ELECTRIC PIANO 1',
  'ELECTRIC PIANO 2',
  'HARPSICHORD',
  'CLAVINET',
  'CELESTA',
  'GLOCKENSPIEL',
  'MUSIC BOX',
  'VIBRAPHONE',
  'MARIMBA',
  'XYLOPHONE',
  'TUBULAR BELLS',
  'DULCIMER',
  'DRAWBAR ORGAN',
  'PERCUSSIVE ORGAN',
  'ROCK ORGAN',
  'CHURCH ORGAN',
  'REED ORGAN',
  'ACCORDION',
  'HARMONICA',
  'TANGO ACCORDION',
  'ACOUSTIC GUITAR NYLON',
  'ACOUSTIC GUITAR STEEL',
  'ELECTRIC GUITAR JAZZ',
  'ELECTRIC GUITAR CLEAN',
  'ELECTRIC GUITAR MUTED',
  'OVERDRIVEN GUITAR',
  'DISTORTION GUITAR',
  'GUITAR HARMONICS',
  'ACOUSTIC BASS',
  'ELECTRIC BASS FINGER',
  'ELECTRIC BASS PICK',
  'FRETLESS BASS',
  'SLAP BASS 1',
  'SLAP BASS 2',
  'SYNTH BASS 1',
  'SYNTH BASS 2',
  'VIOLIN',
  'VIOLA',
  'CELLO',
  'CONTRABASS',
  'TREMOLO STRINGS',
  'PIZZICATO STRINGS',
  'ORCHESTRAL HARP',
  'TIMPANI',
  'STRING ENSEMBLE 1',
  'STRING ENSEMBLE 2',
  'SYNTH STRINGS 1',
  'SYNTH STRINGS 2',
  'CHOIR AAHS',
  'VOICE OOHS',
  'SYNTH VOICE',
  'ORCHESTRA HIT',
  'TRUMPET',
  'TROMBONE',
  'TUBA',
  'MUTED TRUMPET',
  'FRENCH HORN',
  'BRASS SECTION',
  'SYNTH BRASS 1',
  'SYNTH BRASS 2',
  'SOPRANO SAX',
  'ALTO SAX',
  'TENOR SAX',
  'BARITONE SAX',
  'OBOE',
  'ENGLISH HORN',
  'BASSOON',
  'CLARINET',
  'PICCOLO',
  'FLUTE',
  'RECORDER',
  'PAN FLUTE',
  'BLOWN BOTTLE',
  'SHAKUHACHI',
  'WHISTLE',
  'OCARINA',
  'LEAD 1 SQUARE',
  'LEAD 2 SAWTOOTH',
  'LEAD 3 CALLIOPE',
  'LEAD 4 CHIFF',
  'LEAD 5 CHARANG',
  'LEAD 6 VOICE',
  'LEAD 7 FIFTHS',
  'LEAD 8 BASS LEAD',
  'PAD 1 NEW AGE',
  'PAD 2 WARM',
  'PAD 3 POLYSYNTH',
  'PAD 4 CHOIR',
  'PAD 5 BOWED',
  'PAD 6 METALLIC',
  'PAD 7 HALO',
  'PAD 8 SWEEP',
  'FX 1 RAIN',
  'FX 2 SOUNDTRACK',
  'FX 3 CRYSTAL',
  'FX 4 ATMOSPHERE',
  'FX 5 BRIGHTNESS',
  'FX 6 GOBLINS',
  'FX 7 ECHOES',
  'FX 8 SCI FI',
  'SITAR',
  'BANJO',
  'SHAMISEN',
  'KOTO',
  'KALIMBA',
  'BAG PIPE',
  'FIDDLE',
  'SHANAI',
  'TINKLE BELL',
  'AGOGO',
  'STEEL DRUMS',
  'WOODBLOCK',
  'TAIKO DRUM',
  'MELODIC TOM',
  'SYNTH DRUM',
  'REVERSE CYMBAL',
  'GUITAR FRET NOISE',
  'BREATH NOISE',
  'SEASHORE',
  'BIRD TWEET',
  'TELEPHONE RING',
  'HELICOPTER',
  'APPLAUSE',
  'GUNSHOT',
  'DRUM KIT',
]
const PIXEL_FONT_CHARS = [
  ' ',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '-',
]
const PIXEL_FONT_GLYPHS = [
  '000000000000000',
  '111101111101101',
  '110101110101110',
  '111100100100111',
  '110101101101110',
  '111100110100111',
  '111100110100100',
  '111100101101111',
  '101101111101101',
  '111010010010111',
  '001001001101111',
  '101101110101101',
  '100100100100111',
  '101111111101101',
  '101111111111101',
  '111101101101111',
  '111101111100100',
  '111101101111001',
  '111101111110101',
  '111100111001111',
  '111010010010010',
  '101101101101111',
  '101101101101010',
  '101101111111101',
  '101101010101101',
  '101101010010010',
  '111001010100111',
  '111101101101111',
  '010110010010111',
  '111001111100111',
  '111001111001111',
  '101101111001001',
  '111100111001111',
  '111100111101111',
  '111001001001001',
  '111101111101111',
  '111101111001111',
  '000000111000000',
]

// Helpers that convert the timeline/roll coordinates into flat list indexes shared across the renderer and audio code.
const clipIndex = (
  track: PrimitiveSource<number>,
  event: PrimitiveSource<number>,
) => {
  return add(multiply(subtract(track, 1), EVENTS_PER_TRACK), event)
}

const noteIndex = (
  clip: PrimitiveSource<number>,
  step: PrimitiveSource<number>,
  pitch: PrimitiveSource<number>,
) => {
  return add(
    add(
      multiply(subtract(clip, 1), NOTES_PER_CLIP),
      multiply(subtract(pitch, 1), ROLL_STEPS),
    ),
    step,
  )
}

const melodicMidiNote = (
  pitch: PrimitiveSource<number>,
  track: PrimitiveSource<number>,
) => {
  return add(
    add(48, subtract(ROLL_PITCHES, pitch)),
    multiply(subtract(track, 1), 5),
  )
}

const drumMidiNote = (pitch: PrimitiveSource<number>) => {
  return add(DRUM_MIDI_MIN, subtract(ROLL_PITCHES, pitch))
}

const trackCenterY = (track: PrimitiveSource<number>) => {
  return subtract(
    subtract(TIMELINE_TOP, multiply(subtract(track, 1), TRACK_HEIGHT)),
    TRACK_HEIGHT / 2,
  )
}

const cellTopLeftX = (step: PrimitiveSource<number>) => {
  return add(ROLL_GRID_LEFT, multiply(subtract(step, 1), ROLL_CELL_W))
}

const cellCenterY = (pitch: PrimitiveSource<number>) => {
  return subtract(
    subtract(ROLL_TOP, divide(rollCellH.get(), 2)),
    multiply(subtract(pitch, 1), rollCellH.get()),
  )
}

const drawHorizontal = (
  x1: PrimitiveSource<number>,
  x2: PrimitiveSource<number>,
  y: PrimitiveSource<number>,
  size: PrimitiveSource<number>,
  color: PrimitiveSource<string>,
) => {
  setVariableTo(rectHalfLow, mathop('floor', divide(subtract(size, 1), 2)))
  setVariableTo(rectHalfHigh, mathop('floor', divide(size, 2)))
  drawRect(
    x1,
    subtract(y, rectHalfLow.get()),
    x2,
    add(y, rectHalfHigh.get()),
    color,
  )
}

const drawVertical = (
  x: PrimitiveSource<number>,
  y1: PrimitiveSource<number>,
  y2: PrimitiveSource<number>,
  size: PrimitiveSource<number>,
  color: PrimitiveSource<string>,
) => {
  setVariableTo(rectHalfLow, mathop('floor', divide(subtract(size, 1), 2)))
  setVariableTo(rectHalfHigh, mathop('floor', divide(size, 2)))
  drawRect(
    subtract(x, rectHalfLow.get()),
    y1,
    add(x, rectHalfHigh.get()),
    y2,
    color,
  )
}

// Normalizes the rectangle bounds, sets pen parameters, and sweeps a line to render horizontal bars.
const drawRect = (
  x1: PrimitiveSource<number>,
  y1: PrimitiveSource<number>,
  x2: PrimitiveSource<number>,
  y2: PrimitiveSource<number>,
  color: PrimitiveSource<string>,
) => {
  setVariableTo(rectLeft, x1)
  setVariableTo(rectRight, x2)
  setVariableTo(rectBottom, y1)
  setVariableTo(rectTop, y2)

  ifThen(gt(rectLeft.get(), rectRight.get()), () => {
    setVariableTo(rectTmp, rectLeft.get())
    setVariableTo(rectLeft, rectRight.get())
    setVariableTo(rectRight, rectTmp.get())
  })
  ifThen(gt(rectBottom.get(), rectTop.get()), () => {
    setVariableTo(rectTmp, rectBottom.get())
    setVariableTo(rectBottom, rectTop.get())
    setVariableTo(rectTop, rectTmp.get())
  })

  setPenColorTo(color)
  setPenSizeTo(1)

  setVariableTo(rectScanY, rectBottom.get())
  setVariableTo(rectRows, add(subtract(rectTop.get(), rectBottom.get()), 1))

  repeat(rectRows.get(), () => {
    penUp()
    setX(rectLeft.get())
    setY(rectScanY.get())
    penDown()
    setX(rectRight.get())
    penUp()
    changeVariableBy(rectScanY, 1)
  })
}

const project = new Project()
const renderer = project.createSprite('renderer')

const trackColors = renderer.createList('trackColors', TRACK_COLOR_PALETTE)
const trackColorPalette = renderer.createList(
  'trackColorPalette',
  TRACK_COLOR_PALETTE,
)

const clipStarts = renderer.createList('clipStarts', CLIP_STARTS)
const clipLengths = renderer.createList('clipLengths', CLIP_LENGTHS)
const midiNotes = renderer.createList('midiNotes', [])
const trackInstruments = renderer.createList(
  'trackInstruments',
  TRACK_INSTRUMENTS,
)
const trackVelocities = renderer.createList('trackVelocities', TRACK_VELOCITIES)
const instrumentNames = renderer.createList(
  'instrumentNames',
  GM_INSTRUMENT_NAMES,
)
const pixelFontChars = renderer.createList('pixelFontChars', PIXEL_FONT_CHARS)
const pixelFontGlyphs = renderer.createList(
  'pixelFontGlyphs',
  PIXEL_FONT_GLYPHS,
)

const bpmSegAOn = renderer.createList('bpmSegAOn', [0, 2, 3, 5, 6, 7, 8, 9])
const bpmSegBOn = renderer.createList('bpmSegBOn', [0, 1, 2, 3, 4, 7, 8, 9])
const bpmSegCOn = renderer.createList('bpmSegCOn', [0, 1, 3, 4, 5, 6, 7, 8, 9])
const bpmSegDOn = renderer.createList('bpmSegDOn', [0, 2, 3, 5, 6, 8, 9])
const bpmSegEOn = renderer.createList('bpmSegEOn', [0, 2, 6, 8])
const bpmSegFOn = renderer.createList('bpmSegFOn', [0, 4, 5, 6, 8, 9])
const bpmSegGOn = renderer.createList('bpmSegGOn', [2, 3, 4, 5, 6, 8, 9])
const blackKeySemitones = renderer.createList(
  'blackKeySemitones',
  [1, 3, 6, 8, 10],
)
const quantizeTicksOptions = renderer.createList('quantizeTicksOptions', [
  NOTE_LEN_2ND,
  NOTE_LEN_4TH,
  NOTE_LEN_4TH_TRIPLET,
  NOTE_LEN_8TH,
  NOTE_LEN_4TH_QUINTUPLET,
  NOTE_LEN_8TH_TRIPLET,
  NOTE_LEN_16TH,
  NOTE_LEN_8TH_QUINTUPLET,
  NOTE_LEN_16TH_TRIPLET,
  NOTE_LEN_16TH_QUINTUPLET,
  NOTE_LEN_32ND_TRIPLET,
  NOTE_LEN_32ND_QUINTUPLET,
])
const quantizeDisplayOptions = renderer.createList(
  'quantizeDisplayOptions',
  [2, 4, 6, 8, 10, 12, 16, 20, 24, 40, 48, 80],
)
const quantizeLabelOptions = renderer.createList('quantizeLabelOptions', [
  '1-2',
  '1-4',
  '1-6 T3',
  '1-8',
  '1-10 Q5',
  '1-12 T3',
  '1-16',
  '1-20 Q5',
  '1-24 T3',
  '1-40 Q5',
  '1-48 T3',
  '1-80 Q5',
])

const selectedTrack = renderer.createVariable('selectedTrack', 1)
const selectedEvent = renderer.createVariable('selectedEvent', 1)
const trackTotal = renderer.createVariable('trackTotal', TRACK_INIT_COUNT)
const trackViewOffset = renderer.createVariable('trackViewOffset', 1)
const trackEnsureTarget = renderer.createVariable(
  'trackEnsureTarget',
  TRACK_INIT_COUNT,
)
const trackEnsureAdd = renderer.createVariable('trackEnsureAdd', 0)
const trackWindowMaxOffset = renderer.createVariable('trackWindowMaxOffset', 1)
const playheadStep = renderer.createVariable('playheadStep', 1)
const mouseLatch = renderer.createVariable('mouseLatch', 0)
const isPlaying = renderer.createVariable('isPlaying', 0)

const playbackTempo = renderer.createVariable('playbackTempo', 188)
const appliedTempo = renderer.createVariable('appliedTempo', 188)
const stepIntervalSec = renderer.createVariable('stepIntervalSec', 0.08)
const nextStepAtSec = renderer.createVariable('nextStepAtSec', 0)

const bpmSliderDragging = renderer.createVariable('bpmSliderDragging', 0)
const bpmMouseValue = renderer.createVariable('bpmMouseValue', 188)
const bpmSliderKnobX = renderer.createVariable(
  'bpmSliderKnobX',
  BPM_SLIDER_LEFT,
)
const bpmDigitValue = renderer.createVariable('bpmDigitValue', 0)
const bpmDigitCenterX = renderer.createVariable('bpmDigitCenterX', BPM_DIGIT_X1)
const bpmRemainder = renderer.createVariable('bpmRemainder', 0)
const bpmHundreds = renderer.createVariable('bpmHundreds', -1)
const bpmTens = renderer.createVariable('bpmTens', 8)
const bpmOnes = renderer.createVariable('bpmOnes', 8)
const trackCfgValue = renderer.createVariable('trackCfgValue', 100)
const instrumentModalOpen = renderer.createVariable('instrumentModalOpen', 0)
const instrumentModalProgram = renderer.createVariable(
  'instrumentModalProgram',
  1,
)
const instrumentSearchFound = renderer.createVariable(
  'instrumentSearchFound',
  0,
)
const instrumentSearchQuery = renderer.createVariable(
  'instrumentSearchQuery',
  '',
)
const textUpperValue = renderer.createVariable('textUpperValue', '')
const textRenderValue = renderer.createVariable('textRenderValue', '')
const textRenderX = renderer.createVariable('textRenderX', 0)
const textRenderY = renderer.createVariable('textRenderY', 0)
const textRenderScale = renderer.createVariable('textRenderScale', 2)
const textRenderColor = renderer.createVariable('textRenderColor', '#f8fafc')
const textCursorX = renderer.createVariable('textCursorX', 0)
const textCharIndex = renderer.createVariable('textCharIndex', 1)
const textCharValue = renderer.createVariable('textCharValue', '')
const textGlyphIndex = renderer.createVariable('textGlyphIndex', 1)
const textGlyphBits = renderer.createVariable(
  'textGlyphBits',
  '000000000000000',
)
const textPixelIndex = renderer.createVariable('textPixelIndex', 1)
const textPixelX = renderer.createVariable('textPixelX', 0)
const textPixelY = renderer.createVariable('textPixelY', 0)
const textLength = renderer.createVariable('textLength', 0)
const rollCellH = renderer.createVariable('rollCellH', ROLL_CELL_H)
const rollVisibleCount = renderer.createVariable(
  'rollVisibleCount',
  ROLL_VISIBLE_PITCHES,
)
const rollScrollMax = renderer.createVariable('rollScrollMax', ROLL_SCROLL_MAX)
const rollPitchOffset = renderer.createVariable('rollPitchOffset', 1)
const rollScrollDragging = renderer.createVariable('rollScrollDragging', 0)
const rollScrollMouseValue = renderer.createVariable('rollScrollMouseValue', 1)
const rollScrollKnobY = renderer.createVariable('rollScrollKnobY', ROLL_TOP - 6)
const rollVisiblePitch = renderer.createVariable('rollVisiblePitch', 1)
const rollSemitone = renderer.createVariable('rollSemitone', 0)
const rollScrollNextAtSec = renderer.createVariable('rollScrollNextAtSec', 0)
const timelineScrollBeat = renderer.createVariable('timelineScrollBeat', 1)
const timelineScrollDragging = renderer.createVariable(
  'timelineScrollDragging',
  0,
)
const timelineScrollKnobX = renderer.createVariable(
  'timelineScrollKnobX',
  TIMELINE_SCROLLBAR_LEFT,
)
const timelineScrollGrabOffsetX = renderer.createVariable(
  'timelineScrollGrabOffsetX',
  0,
)
const quantizeOptionIndex = renderer.createVariable(
  'quantizeOptionIndex',
  DEFAULT_QUANTIZE_INDEX,
)
const quantizeTicks = renderer.createVariable('quantizeTicks', NOTE_LEN_16TH)
const quantizeDisplayValue = renderer.createVariable('quantizeDisplayValue', 16)
const quantizeLabelText = renderer.createVariable('quantizeLabelText', '1-16')
const quantizeTens = renderer.createVariable('quantizeTens', 1)
const quantizeOnes = renderer.createVariable('quantizeOnes', 6)
const multiplierTens = renderer.createVariable('multiplierTens', -1)
const multiplierOnes = renderer.createVariable('multiplierOnes', 1)
const noteLengthMultiplier = renderer.createVariable('noteLengthMultiplier', 1)
const digitCenterY = renderer.createVariable('digitCenterY', BPM_DIGIT_Y)
const noteLengthPreviewW = renderer.createVariable('noteLengthPreviewW', 1)
const noteLengthCellValue = renderer.createVariable('noteLengthCellValue', 0)
const noteLengthApplied = renderer.createVariable(
  'noteLengthApplied',
  NOTE_LEN_16TH,
)
const noteLengthMaxAtStep = renderer.createVariable(
  'noteLengthMaxAtStep',
  NOTE_LEN_MAX,
)
const placedNoteLengthTicks = renderer.createVariable(
  'placedNoteLengthTicks',
  0,
)

const loopTrack = renderer.createVariable('loopTrack', 1)
const visibleTrack = renderer.createVariable('visibleTrack', 1)
const loopEvent = renderer.createVariable('loopEvent', 1)
const visibleEventStart = renderer.createVariable('visibleEventStart', 1)
const visibleEventEnd = renderer.createVariable('visibleEventEnd', 1)
const visibleEventCount = renderer.createVariable('visibleEventCount', 1)
const loopStep = renderer.createVariable('loopStep', 1)
const loopPitch = renderer.createVariable('loopPitch', 1)

const clickTrack = renderer.createVariable('clickTrack', 1)
const clickEvent = renderer.createVariable('clickEvent', 0)
const clickStep = renderer.createVariable('clickStep', 1)
const clickRawStep = renderer.createVariable('clickRawStep', 1)
const clickPitch = renderer.createVariable('clickPitch', 1)
const noteHitFound = renderer.createVariable('noteHitFound', 0)
const noteHitStep = renderer.createVariable('noteHitStep', 1)
const noteHitEndStep = renderer.createVariable('noteHitEndStep', 1)

const workClip = renderer.createVariable('workClip', 1)
const workIndex = renderer.createVariable('workIndex', 1)
const workStart = renderer.createVariable('workStart', 1)
const workLen = renderer.createVariable('workLen', 1)
const listPadCount = renderer.createVariable('listPadCount', 0)
const workX1 = renderer.createVariable('workX1', 0)
const workX2 = renderer.createVariable('workX2', 0)
const workY = renderer.createVariable('workY', 0)

const rectLeft = renderer.createVariable('rectLeft', 0)
const rectRight = renderer.createVariable('rectRight', 0)
const rectTop = renderer.createVariable('rectTop', 0)
const rectBottom = renderer.createVariable('rectBottom', 0)
const rectScanY = renderer.createVariable('rectScanY', 0)
const rectRows = renderer.createVariable('rectRows', 1)
const rectHalfLow = renderer.createVariable('rectHalfLow', 0)
const rectHalfHigh = renderer.createVariable('rectHalfHigh', 0)
const rectTmp = renderer.createVariable('rectTmp', 0)

const clipBodySize = renderer.createVariable('clipBodySize', TRACK_HEIGHT - 12)
const clipFillColor = renderer.createVariable('clipFillColor', '#ffffff')
const clipPreviewColor = renderer.createVariable('clipPreviewColor', '#0f1721')
const clipTopY = renderer.createVariable('clipTopY', 0)
const clipBottomY = renderer.createVariable('clipBottomY', 0)

const previewStepWidth = renderer.createVariable('previewStepWidth', 1)
const previewLaneHeight = renderer.createVariable('previewLaneHeight', 1)
const previewStep = renderer.createVariable('previewStep', 1)
const previewPitchRow = renderer.createVariable('previewPitchRow', 1)
const previewPitchA = renderer.createVariable('previewPitchA', 1)
const previewPitchB = renderer.createVariable('previewPitchB', 2)
const previewXLeft = renderer.createVariable('previewXLeft', 0)
const previewXRight = renderer.createVariable('previewXRight', 0)
const previewYTop = renderer.createVariable('previewYTop', 0)
const previewYBottom = renderer.createVariable('previewYBottom', 0)
const previewNoteIndexA = renderer.createVariable('previewNoteIndexA', 1)
const previewNoteIndexB = renderer.createVariable('previewNoteIndexB', 1)

const audioPitch = renderer.createVariable('audioPitch', 1)
const audioNoteIndex = renderer.createVariable('audioNoteIndex', 1)
const audioNoteLengthTicks = renderer.createVariable('audioNoteLengthTicks', 0)
const audioNoteToPlay = renderer.createVariable('audioNoteToPlay', 0)
const audioClip = renderer.createVariable('audioClip', 1)
const audioStepInClip = renderer.createVariable('audioStepInClip', 1)
const audioInstrument = renderer.createVariable('audioInstrument', 1)
const audioVelocity = renderer.createVariable('audioVelocity', 100)
const audioNoteBeats = renderer.createVariable(
  'audioNoteBeats',
  NOTE_LEN_16TH / NOTE_TICKS_PER_BEAT,
)
const audioTrack = renderer.createVariable('audioTrack', 1)
const audioEvent = renderer.createVariable('audioEvent', 1)
const audioPitchLoop = renderer.createVariable('audioPitchLoop', 1)
const audioTimelineStep = renderer.createVariable('audioTimelineStep', 1)
const audioStepInBeat = renderer.createVariable('audioStepInBeat', 1)
const audioBeatInClip = renderer.createVariable('audioBeatInClip', 1)

const playheadDisplayStep = renderer.createVariable('playheadDisplayStep', 1)
const playheadTimelineStep = renderer.createVariable('playheadTimelineStep', 1)
const playheadStepInBeat = renderer.createVariable('playheadStepInBeat', 1)
const selectedClipStart = renderer.createVariable('selectedClipStart', 1)
const selectedClipLen = renderer.createVariable('selectedClipLen', CLIP_BEATS)
const selectedClipBeat = renderer.createVariable('selectedClipBeat', 1)
const rollPlayheadStep = renderer.createVariable('rollPlayheadStep', 1)
const catchupSteps = renderer.createVariable('catchupSteps', 0)

renderer.run(() => {
  whenFlagClicked(() => {
    hide()
    setDragMode('not draggable')

    deleteAllOfList(trackColors)
    forEach(loopTrack, lengthOfList(trackColorPalette), () => {
      addToList(trackColors, getItemOfList(trackColorPalette, loopTrack.get()))
    })

    deleteAllOfList(trackInstruments)
    addToList(trackInstruments, 1)
    addToList(trackInstruments, 33)
    addToList(trackInstruments, 81)
    addToList(trackInstruments, TRACK_DRUM_INSTRUMENT)

    deleteAllOfList(trackVelocities)
    repeat(TRACK_INIT_COUNT, () => {
      addToList(trackVelocities, 100)
    })

    deleteAllOfList(clipStarts)
    deleteAllOfList(clipLengths)
    forEach(loopTrack, TRACK_INIT_COUNT, () => {
      forEach(loopEvent, EVENTS_PER_TRACK, () => {
        addToList(
          clipStarts,
          add(multiply(subtract(loopEvent.get(), 1), CLIP_BEATS), 1),
        )
        addToList(clipLengths, CLIP_BEATS)
      })
    })

    setVariableTo(selectedTrack, 1)
    setVariableTo(selectedEvent, 1)
    setVariableTo(trackTotal, TRACK_INIT_COUNT)
    setVariableTo(trackViewOffset, 1)
    setVariableTo(trackEnsureTarget, TRACK_INIT_COUNT)
    setVariableTo(trackEnsureAdd, 0)
    setVariableTo(trackWindowMaxOffset, 1)
    setVariableTo(playheadStep, 1)
    setVariableTo(playheadDisplayStep, 1)
    setVariableTo(mouseLatch, 0)
    setVariableTo(isPlaying, 0)

    setVariableTo(playbackTempo, 188)
    setVariableTo(appliedTempo, 188)
    setVariableTo(
      stepIntervalSec,
      divide(divide(60, playbackTempo.get()), STEPS_PER_BEAT),
    )
    setVariableTo(nextStepAtSec, 0)

    setVariableTo(audioNoteBeats, NOTE_LEN_16TH / NOTE_TICKS_PER_BEAT)
    setVariableTo(audioVelocity, 100)
    setVariableTo(instrumentModalOpen, 0)
    setVariableTo(
      instrumentModalProgram,
      getItemOfList(trackInstruments, selectedTrack.get()),
    )
    setVariableTo(instrumentSearchQuery, '')
    setVariableTo(textUpperValue, '')
    setVariableTo(bpmSliderDragging, 0)
    setVariableTo(rollCellH, ROLL_CELL_H)
    setVariableTo(rollVisibleCount, ROLL_VISIBLE_PITCHES)
    setVariableTo(rollScrollMax, ROLL_SCROLL_MAX)
    setVariableTo(rollPitchOffset, 1)
    setVariableTo(rollScrollDragging, 0)
    setVariableTo(rollScrollNextAtSec, 0)
    setVariableTo(timelineScrollBeat, 1)
    setVariableTo(timelineScrollDragging, 0)
    setVariableTo(timelineScrollKnobX, TIMELINE_SCROLLBAR_LEFT)
    setVariableTo(timelineScrollGrabOffsetX, 0)
    setVariableTo(quantizeOptionIndex, DEFAULT_QUANTIZE_INDEX)
    setVariableTo(quantizeTicks, NOTE_LEN_16TH)
    setVariableTo(quantizeDisplayValue, 16)
    setVariableTo(quantizeLabelText, '1-16')
    setVariableTo(noteLengthMultiplier, 1)
    deleteAllOfList(midiNotes)

    setTempo(playbackTempo.get())
    resetTimer()

    const handleBpmInput = defineProcedure(
      [procedureLabel('handle bpm input')],
      () => {
        ifElse(
          getMouseDown(),
          () => {
            ifThen(
              or(
                equals(bpmSliderDragging.get(), 1),
                and(
                  and(
                    gt(getMouseX(), subtract(BPM_SLIDER_LEFT, 8)),
                    lt(getMouseX(), add(BPM_SLIDER_RIGHT, 8)),
                  ),
                  and(
                    gt(getMouseY(), subtract(BPM_SLIDER_Y, 12)),
                    lt(getMouseY(), add(BPM_SLIDER_Y, 12)),
                  ),
                ),
              ),
              () => {
                setVariableTo(bpmSliderDragging, 1)
                setVariableTo(
                  bpmMouseValue,
                  add(
                    BPM_MIN,
                    round(
                      multiply(
                        divide(
                          subtract(getMouseX(), BPM_SLIDER_LEFT),
                          subtract(BPM_SLIDER_RIGHT, BPM_SLIDER_LEFT),
                        ),
                        subtract(BPM_MAX, BPM_MIN),
                      ),
                    ),
                  ),
                )
                ifThen(lt(bpmMouseValue.get(), BPM_MIN), () => {
                  setVariableTo(bpmMouseValue, BPM_MIN)
                })
                ifThen(gt(bpmMouseValue.get(), BPM_MAX), () => {
                  setVariableTo(bpmMouseValue, BPM_MAX)
                })
                setVariableTo(playbackTempo, bpmMouseValue.get())
              },
            )
          },
          () => {
            setVariableTo(bpmSliderDragging, 0)
          },
        )
      },
      true,
    )

    const handleRollScrollInput = defineProcedure(
      [procedureLabel('handle roll scroll input')],
      () => {
        ifElse(
          getMouseDown(),
          () => {
            ifThen(
              or(
                equals(rollScrollDragging.get(), 1),
                and(
                  and(
                    gt(getMouseX(), ROLL_SCROLL_LEFT),
                    lt(getMouseX(), ROLL_SCROLL_RIGHT),
                  ),
                  and(gt(getMouseY(), ROLL_BOTTOM), lt(getMouseY(), ROLL_TOP)),
                ),
              ),
              () => {
                setVariableTo(rollScrollDragging, 1)
                ifElse(
                  gt(rollScrollMax.get(), 1),
                  () => {
                    setVariableTo(
                      rollScrollMouseValue,
                      add(
                        1,
                        round(
                          multiply(
                            divide(
                              subtract(ROLL_TOP, getMouseY()),
                              subtract(ROLL_TOP, ROLL_BOTTOM),
                            ),
                            subtract(rollScrollMax.get(), 1),
                          ),
                        ),
                      ),
                    )
                  },
                  () => {
                    setVariableTo(rollScrollMouseValue, 1)
                  },
                )
                ifThen(lt(rollScrollMouseValue.get(), 1), () => {
                  setVariableTo(rollScrollMouseValue, 1)
                })
                ifThen(
                  gt(rollScrollMouseValue.get(), rollScrollMax.get()),
                  () => {
                    setVariableTo(rollScrollMouseValue, rollScrollMax.get())
                  },
                )
                setVariableTo(rollPitchOffset, rollScrollMouseValue.get())
              },
            )
          },
          () => {
            setVariableTo(rollScrollDragging, 0)
          },
        )

        ifThen(
          and(
            getKeyPressed('up arrow'),
            gt(getTimer(), rollScrollNextAtSec.get()),
          ),
          () => {
            changeVariableBy(rollPitchOffset, -1)
            ifThen(lt(rollPitchOffset.get(), 1), () => {
              setVariableTo(rollPitchOffset, 1)
            })
            setVariableTo(rollScrollNextAtSec, add(getTimer(), 0.06))
          },
        )
        ifThen(
          and(
            getKeyPressed('down arrow'),
            gt(getTimer(), rollScrollNextAtSec.get()),
          ),
          () => {
            changeVariableBy(rollPitchOffset, 1)
            ifThen(gt(rollPitchOffset.get(), rollScrollMax.get()), () => {
              setVariableTo(rollPitchOffset, rollScrollMax.get())
            })
            setVariableTo(rollScrollNextAtSec, add(getTimer(), 0.06))
          },
        )
      },
      true,
    )

    const handleTimelineScrollInput = defineProcedure(
      [procedureLabel('handle timeline scroll input')],
      () => {
        setVariableTo(
          timelineScrollKnobX,
          add(
            TIMELINE_SCROLLBAR_LEFT,
            multiply(
              divide(
                subtract(timelineScrollBeat.get(), 1),
                subtract(TIMELINE_SCROLL_MAX, 1),
              ),
              subtract(
                subtract(TIMELINE_SCROLLBAR_RIGHT, TIMELINE_SCROLLBAR_LEFT),
                TIMELINE_SCROLLBAR_KNOB_W,
              ),
            ),
          ),
        )

        ifElse(
          getMouseDown(),
          () => {
            ifElse(
              equals(timelineScrollDragging.get(), 1),
              () => {
                setVariableTo(
                  workX1,
                  subtract(getMouseX(), timelineScrollGrabOffsetX.get()),
                )
                ifThen(lt(workX1.get(), TIMELINE_SCROLLBAR_LEFT), () => {
                  setVariableTo(workX1, TIMELINE_SCROLLBAR_LEFT)
                })
                ifThen(
                  gt(
                    workX1.get(),
                    subtract(
                      TIMELINE_SCROLLBAR_RIGHT,
                      TIMELINE_SCROLLBAR_KNOB_W,
                    ),
                  ),
                  () => {
                    setVariableTo(
                      workX1,
                      subtract(
                        TIMELINE_SCROLLBAR_RIGHT,
                        TIMELINE_SCROLLBAR_KNOB_W,
                      ),
                    )
                  },
                )
                setVariableTo(timelineScrollKnobX, workX1.get())
                setVariableTo(
                  timelineScrollBeat,
                  add(
                    1,
                    round(
                      multiply(
                        divide(
                          subtract(
                            timelineScrollKnobX.get(),
                            TIMELINE_SCROLLBAR_LEFT,
                          ),
                          subtract(
                            subtract(
                              TIMELINE_SCROLLBAR_RIGHT,
                              TIMELINE_SCROLLBAR_LEFT,
                            ),
                            TIMELINE_SCROLLBAR_KNOB_W,
                          ),
                        ),
                        subtract(TIMELINE_SCROLL_MAX, 1),
                      ),
                    ),
                  ),
                )
              },
              () => {
                ifThen(
                  and(
                    and(
                      gt(getMouseX(), TIMELINE_SCROLLBAR_LEFT),
                      lt(getMouseX(), TIMELINE_SCROLLBAR_RIGHT),
                    ),
                    and(
                      gt(getMouseY(), TIMELINE_SCROLLBAR_BOTTOM),
                      lt(getMouseY(), TIMELINE_SCROLLBAR_TOP),
                    ),
                  ),
                  () => {
                    ifElse(
                      and(
                        gt(getMouseX(), subtract(timelineScrollKnobX.get(), 1)),
                        lt(
                          getMouseX(),
                          add(
                            timelineScrollKnobX.get(),
                            add(TIMELINE_SCROLLBAR_KNOB_W, 1),
                          ),
                        ),
                      ),
                      () => {
                        setVariableTo(timelineScrollDragging, 1)
                        setVariableTo(
                          timelineScrollGrabOffsetX,
                          subtract(getMouseX(), timelineScrollKnobX.get()),
                        )
                      },
                      () => {
                        setVariableTo(timelineScrollDragging, 1)
                        setVariableTo(
                          timelineScrollGrabOffsetX,
                          TIMELINE_SCROLLBAR_KNOB_W / 2,
                        )
                        setVariableTo(
                          workX1,
                          subtract(
                            getMouseX(),
                            timelineScrollGrabOffsetX.get(),
                          ),
                        )
                        ifThen(
                          lt(workX1.get(), TIMELINE_SCROLLBAR_LEFT),
                          () => {
                            setVariableTo(workX1, TIMELINE_SCROLLBAR_LEFT)
                          },
                        )
                        ifThen(
                          gt(
                            workX1.get(),
                            subtract(
                              TIMELINE_SCROLLBAR_RIGHT,
                              TIMELINE_SCROLLBAR_KNOB_W,
                            ),
                          ),
                          () => {
                            setVariableTo(
                              workX1,
                              subtract(
                                TIMELINE_SCROLLBAR_RIGHT,
                                TIMELINE_SCROLLBAR_KNOB_W,
                              ),
                            )
                          },
                        )
                        setVariableTo(timelineScrollKnobX, workX1.get())
                        setVariableTo(
                          timelineScrollBeat,
                          add(
                            1,
                            round(
                              multiply(
                                divide(
                                  subtract(
                                    timelineScrollKnobX.get(),
                                    TIMELINE_SCROLLBAR_LEFT,
                                  ),
                                  subtract(
                                    subtract(
                                      TIMELINE_SCROLLBAR_RIGHT,
                                      TIMELINE_SCROLLBAR_LEFT,
                                    ),
                                    TIMELINE_SCROLLBAR_KNOB_W,
                                  ),
                                ),
                                subtract(TIMELINE_SCROLL_MAX, 1),
                              ),
                            ),
                          ),
                        )
                      },
                    )
                  },
                )
              },
            )
          },
          () => {
            setVariableTo(timelineScrollDragging, 0)
          },
        )

        ifThen(lt(timelineScrollBeat.get(), 1), () => {
          setVariableTo(timelineScrollBeat, 1)
        })
        ifThen(gt(timelineScrollBeat.get(), TIMELINE_SCROLL_MAX), () => {
          setVariableTo(timelineScrollBeat, TIMELINE_SCROLL_MAX)
        })
      },
      true,
    )

    const syncQuantizeSettings = defineProcedure(
      [procedureLabel('sync quantize settings')],
      () => {
        ifThen(lt(quantizeOptionIndex.get(), 1), () => {
          setVariableTo(quantizeOptionIndex, 1)
        })
        ifThen(gt(quantizeOptionIndex.get(), QUANTIZE_OPTIONS), () => {
          setVariableTo(quantizeOptionIndex, QUANTIZE_OPTIONS)
        })
        ifThen(lt(noteLengthMultiplier.get(), MULTIPLIER_MIN), () => {
          setVariableTo(noteLengthMultiplier, MULTIPLIER_MIN)
        })
        ifThen(gt(noteLengthMultiplier.get(), MULTIPLIER_MAX), () => {
          setVariableTo(noteLengthMultiplier, MULTIPLIER_MAX)
        })

        setVariableTo(
          quantizeTicks,
          getItemOfList(quantizeTicksOptions, quantizeOptionIndex.get()),
        )
        setVariableTo(
          quantizeDisplayValue,
          getItemOfList(quantizeDisplayOptions, quantizeOptionIndex.get()),
        )
        setVariableTo(
          quantizeLabelText,
          getItemOfList(quantizeLabelOptions, quantizeOptionIndex.get()),
        )
      },
      true,
    )

    const syncRollView = defineProcedure(
      [procedureLabel('sync roll view')],
      () => {
        ifThen(lt(rollCellH.get(), ROLL_CELL_H_MIN), () => {
          setVariableTo(rollCellH, ROLL_CELL_H_MIN)
        })
        ifThen(gt(rollCellH.get(), ROLL_CELL_H_MAX), () => {
          setVariableTo(rollCellH, ROLL_CELL_H_MAX)
        })

        setVariableTo(
          rollVisibleCount,
          mathop(
            'floor',
            divide(subtract(ROLL_TOP, ROLL_BOTTOM), rollCellH.get()),
          ),
        )
        ifThen(lt(rollVisibleCount.get(), 4), () => {
          setVariableTo(rollVisibleCount, 4)
        })
        ifThen(gt(rollVisibleCount.get(), ROLL_PITCHES), () => {
          setVariableTo(rollVisibleCount, ROLL_PITCHES)
        })

        setVariableTo(
          rollScrollMax,
          add(subtract(ROLL_PITCHES, rollVisibleCount.get()), 1),
        )
        ifThen(lt(rollScrollMax.get(), 1), () => {
          setVariableTo(rollScrollMax, 1)
        })

        ifThen(lt(rollPitchOffset.get(), 1), () => {
          setVariableTo(rollPitchOffset, 1)
        })
        ifThen(gt(rollPitchOffset.get(), rollScrollMax.get()), () => {
          setVariableTo(rollPitchOffset, rollScrollMax.get())
        })
      },
      true,
    )

    const ensureTrackData = defineProcedure(
      [procedureLabel('ensure track data')],
      () => {
        ifThen(gt(trackEnsureTarget.get(), trackTotal.get()), () => {
          setVariableTo(
            trackEnsureAdd,
            subtract(trackEnsureTarget.get(), trackTotal.get()),
          )
          repeat(trackEnsureAdd.get(), () => {
            setVariableTo(
              trackCfgValue,
              add(mod(trackTotal.get(), lengthOfList(trackColorPalette)), 1),
            )
            addToList(
              trackColors,
              getItemOfList(trackColorPalette, trackCfgValue.get()),
            )
            addToList(trackInstruments, 1)
            addToList(trackVelocities, 100)
            forEach(loopEvent, EVENTS_PER_TRACK, () => {
              addToList(
                clipStarts,
                add(multiply(subtract(loopEvent.get(), 1), CLIP_BEATS), 1),
              )
              addToList(clipLengths, CLIP_BEATS)
            })
            changeVariableBy(trackTotal, 1)
          })
        })
      },
      true,
    )

    const syncTrackWindow = defineProcedure(
      [procedureLabel('sync track window')],
      () => {
        ifThen(lt(selectedTrack.get(), 1), () => {
          setVariableTo(selectedTrack, 1)
        })

        setVariableTo(trackEnsureTarget, selectedTrack.get())
        callProcedure(ensureTrackData, {})

        setVariableTo(
          trackWindowMaxOffset,
          add(subtract(trackTotal.get(), TRACK_VIEW_ROWS), 1),
        )
        ifThen(lt(trackWindowMaxOffset.get(), 1), () => {
          setVariableTo(trackWindowMaxOffset, 1)
        })

        ifThen(lt(trackViewOffset.get(), 1), () => {
          setVariableTo(trackViewOffset, 1)
        })
        ifThen(gt(trackViewOffset.get(), trackWindowMaxOffset.get()), () => {
          setVariableTo(trackViewOffset, trackWindowMaxOffset.get())
        })
        ifThen(lt(selectedTrack.get(), trackViewOffset.get()), () => {
          setVariableTo(trackViewOffset, selectedTrack.get())
        })
        ifThen(
          gt(
            selectedTrack.get(),
            add(trackViewOffset.get(), subtract(TRACK_VIEW_ROWS, 1)),
          ),
          () => {
            setVariableTo(
              trackViewOffset,
              add(subtract(selectedTrack.get(), TRACK_VIEW_ROWS), 1),
            )
          },
        )
        ifThen(gt(trackViewOffset.get(), trackWindowMaxOffset.get()), () => {
          setVariableTo(trackViewOffset, trackWindowMaxOffset.get())
        })
      },
      true,
    )

    const normalizeSearchText = defineProcedure(
      [procedureLabel('normalize search text')],
      () => {
        setVariableTo(textUpperValue, '')
        setVariableTo(textLength, length(instrumentSearchQuery.get()))
        setVariableTo(textCharIndex, 1)
        repeat(textLength.get(), () => {
          setVariableTo(
            textCharValue,
            letterOf(textCharIndex.get(), instrumentSearchQuery.get()),
          )
          setVariableTo(textGlyphIndex, 1)
          repeatUntil(
            or(
              gt(textGlyphIndex.get(), 26),
              equals(
                textCharValue.get(),
                letterOf(textGlyphIndex.get(), 'abcdefghijklmnopqrstuvwxyz'),
              ),
            ),
            () => {
              changeVariableBy(textGlyphIndex, 1)
            },
          )
          ifElse(
            gt(textGlyphIndex.get(), 26),
            () => {
              setVariableTo(
                textUpperValue,
                join(textUpperValue.get(), textCharValue.get()),
              )
            },
            () => {
              setVariableTo(
                textUpperValue,
                join(
                  textUpperValue.get(),
                  letterOf(textGlyphIndex.get(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                ),
              )
            },
          )
          changeVariableBy(textCharIndex, 1)
        })
      },
      true,
    )

    const previewInstrumentModal = defineProcedure(
      [procedureLabel('preview instrument modal')],
      () => {
        setVariableTo(audioInstrument, instrumentModalProgram.get())
        setVariableTo(
          audioVelocity,
          getItemOfList(trackVelocities, selectedTrack.get()),
        )
        setVariableTo(audioNoteBeats, 0.2)
        ifElse(
          equals(instrumentModalProgram.get(), TRACK_DRUM_INSTRUMENT),
          () => {
            setVariableTo(audioNoteToPlay, 36)
          },
          () => {
            setVariableTo(
              audioNoteToPlay,
              add(60, multiply(subtract(selectedTrack.get(), 1), 2)),
            )
          },
        )
        createClone(CREATE_CLONE_MYSELF)
      },
      true,
    )

    const searchInstrumentModal = defineProcedure(
      [procedureLabel('search instrument modal')],
      () => {
        askAndWait('INSTRUMENT NAME OR PROGRAM')
        setVariableTo(instrumentSearchQuery, getAnswer())
        callProcedure(normalizeSearchText, {})
        setVariableTo(instrumentSearchFound, 0)
        setVariableTo(trackCfgValue, round(textUpperValue.get()))

        ifThen(
          and(
            gt(trackCfgValue.get(), 0),
            lt(trackCfgValue.get(), add(TRACK_INSTRUMENT_MAX, 1)),
          ),
          () => {
            setVariableTo(instrumentModalProgram, trackCfgValue.get())
            setVariableTo(instrumentSearchFound, 1)
          },
        )

        ifThen(
          and(
            equals(instrumentSearchFound.get(), 0),
            gt(length(textUpperValue.get()), 0),
          ),
          () => {
            forEach(loopStep, TRACK_INSTRUMENT_MAX, () => {
              ifThen(
                and(
                  equals(instrumentSearchFound.get(), 0),
                  contains(
                    getItemOfList(instrumentNames, loopStep.get()),
                    textUpperValue.get(),
                  ),
                ),
                () => {
                  setVariableTo(instrumentModalProgram, loopStep.get())
                  setVariableTo(instrumentSearchFound, 1)
                },
              )
            })
          },
        )

        ifThen(equals(instrumentSearchFound.get(), 1), () => {
          callProcedure(previewInstrumentModal, {})
        })
      },
      true,
    )

    const handleInstrumentModalClick = defineProcedure(
      [procedureLabel('handle instrument modal click')],
      () => {
        ifThen(
          and(
            and(
              gt(getMouseX(), INST_MODAL_PREV_LEFT),
              lt(getMouseX(), INST_MODAL_PREV_RIGHT),
            ),
            and(
              gt(getMouseY(), INST_MODAL_NAV_BOTTOM),
              lt(getMouseY(), INST_MODAL_NAV_TOP),
            ),
          ),
          () => {
            changeVariableBy(instrumentModalProgram, -1)
            ifThen(
              lt(instrumentModalProgram.get(), TRACK_INSTRUMENT_MIN),
              () => {
                setVariableTo(instrumentModalProgram, TRACK_INSTRUMENT_MIN)
              },
            )
            callProcedure(previewInstrumentModal, {})
          },
        )
        ifThen(
          and(
            and(
              gt(getMouseX(), INST_MODAL_NEXT_LEFT),
              lt(getMouseX(), INST_MODAL_NEXT_RIGHT),
            ),
            and(
              gt(getMouseY(), INST_MODAL_NAV_BOTTOM),
              lt(getMouseY(), INST_MODAL_NAV_TOP),
            ),
          ),
          () => {
            changeVariableBy(instrumentModalProgram, 1)
            ifThen(
              gt(instrumentModalProgram.get(), TRACK_INSTRUMENT_MAX),
              () => {
                setVariableTo(instrumentModalProgram, TRACK_INSTRUMENT_MAX)
              },
            )
            callProcedure(previewInstrumentModal, {})
          },
        )
        ifThen(
          and(
            and(
              gt(getMouseX(), INST_MODAL_FIND_LEFT),
              lt(getMouseX(), INST_MODAL_FIND_RIGHT),
            ),
            and(
              gt(getMouseY(), INST_MODAL_ACTION_BOTTOM),
              lt(getMouseY(), INST_MODAL_ACTION_TOP),
            ),
          ),
          () => {
            callProcedure(searchInstrumentModal, {})
          },
        )
        ifThen(
          and(
            and(
              gt(getMouseX(), INST_MODAL_CANCEL_LEFT),
              lt(getMouseX(), INST_MODAL_CANCEL_RIGHT),
            ),
            and(
              gt(getMouseY(), INST_MODAL_ACTION_BOTTOM),
              lt(getMouseY(), INST_MODAL_ACTION_TOP),
            ),
          ),
          () => {
            setVariableTo(instrumentModalOpen, 0)
          },
        )
        ifThen(
          and(
            and(
              gt(getMouseX(), INST_MODAL_OK_LEFT),
              lt(getMouseX(), INST_MODAL_OK_RIGHT),
            ),
            and(
              gt(getMouseY(), INST_MODAL_ACTION_BOTTOM),
              lt(getMouseY(), INST_MODAL_ACTION_TOP),
            ),
          ),
          () => {
            replaceItemOfList(
              trackInstruments,
              selectedTrack.get(),
              instrumentModalProgram.get(),
            )
            setVariableTo(instrumentModalOpen, 0)
            callProcedure(previewInstrumentModal, {})
          },
        )
      },
      true,
    )

    // Detects mouse clicks for play/stop, clip selection, and roll editing; ensures clicks only trigger once per press.
    const handleInput = defineProcedure(
      [procedureLabel('handle input')],
      () => {
        ifElse(
          getMouseDown(),
          () => {
            ifThen(equals(mouseLatch.get(), 0), () => {
              setVariableTo(mouseLatch, 1)
              ifElse(
                equals(instrumentModalOpen.get(), 1),
                () => {
                  callProcedure(handleInstrumentModalClick, {})
                },
                () => {
                  ifThen(
                    and(
                      and(
                        gt(getMouseX(), PLAY_BTN_LEFT),
                        lt(getMouseX(), PLAY_BTN_RIGHT),
                      ),
                      and(
                        gt(getMouseY(), PLAY_BTN_BOTTOM),
                        lt(getMouseY(), PLAY_BTN_TOP),
                      ),
                    ),
                    () => {
                      ifElse(
                        equals(isPlaying.get(), 0),
                        () => {
                          setVariableTo(isPlaying, 1)
                          setVariableTo(playheadDisplayStep, playheadStep.get())
                          setVariableTo(nextStepAtSec, getTimer())
                        },
                        () => {
                          setVariableTo(isPlaying, 0)
                          setVariableTo(playheadStep, playheadDisplayStep.get())
                        },
                      )
                    },
                  )

                  ifThen(
                    and(
                      and(
                        gt(getMouseX(), BPM_DEC_BTN_LEFT),
                        lt(getMouseX(), BPM_DEC_BTN_RIGHT),
                      ),
                      and(
                        gt(getMouseY(), BPM_STEP_BTN_BOTTOM),
                        lt(getMouseY(), BPM_STEP_BTN_TOP),
                      ),
                    ),
                    () => {
                      changeVariableBy(playbackTempo, -1)
                    },
                  )
                  ifThen(
                    and(
                      and(
                        gt(getMouseX(), BPM_INC_BTN_LEFT),
                        lt(getMouseX(), BPM_INC_BTN_RIGHT),
                      ),
                      and(
                        gt(getMouseY(), BPM_STEP_BTN_BOTTOM),
                        lt(getMouseY(), BPM_STEP_BTN_TOP),
                      ),
                    ),
                    () => {
                      changeVariableBy(playbackTempo, 1)
                    },
                  )

                  ifThen(
                    and(
                      and(
                        gt(getMouseX(), TIMELINE_LEFT),
                        lt(getMouseX(), TIMELINE_RIGHT),
                      ),
                      and(
                        gt(getMouseY(), TIMELINE_BOTTOM),
                        lt(getMouseY(), TIMELINE_TOP),
                      ),
                    ),
                    () => {
                      setVariableTo(
                        clickStep,
                        add(
                          mathop(
                            'floor',
                            divide(
                              subtract(getMouseX(), TIMELINE_LEFT),
                              TIMELINE_STEP_W,
                            ),
                          ),
                          1,
                        ),
                      )
                      setVariableTo(
                        workIndex,
                        add(
                          timelineScrollBeat.get(),
                          subtract(clickStep.get(), 1),
                        ),
                      )
                      ifThen(lt(workIndex.get(), 1), () => {
                        setVariableTo(workIndex, 1)
                      })
                      ifThen(gt(workIndex.get(), SONG_BEATS), () => {
                        setVariableTo(workIndex, SONG_BEATS)
                      })
                      setVariableTo(
                        playheadStep,
                        add(
                          multiply(
                            subtract(workIndex.get(), 1),
                            STEPS_PER_BEAT,
                          ),
                          1,
                        ),
                      )
                      setVariableTo(playheadDisplayStep, playheadStep.get())
                      ifThen(equals(isPlaying.get(), 1), () => {
                        setVariableTo(nextStepAtSec, getTimer())
                      })

                      setVariableTo(
                        clickTrack,
                        add(
                          mathop(
                            'floor',
                            divide(
                              subtract(TIMELINE_TOP, getMouseY()),
                              TRACK_HEIGHT,
                            ),
                          ),
                          1,
                        ),
                      )
                      setVariableTo(
                        clickTrack,
                        add(
                          trackViewOffset.get(),
                          subtract(clickTrack.get(), 1),
                        ),
                      )
                      ifThen(lt(clickTrack.get(), 1), () => {
                        setVariableTo(clickTrack, 1)
                      })
                      setVariableTo(trackEnsureTarget, clickTrack.get())
                      callProcedure(ensureTrackData, {})
                      setVariableTo(clickStep, workIndex.get())
                      setVariableTo(
                        clickEvent,
                        add(
                          mathop(
                            'floor',
                            divide(subtract(clickStep.get(), 1), CLIP_BEATS),
                          ),
                          1,
                        ),
                      )
                      ifThen(lt(clickEvent.get(), 1), () => {
                        setVariableTo(clickEvent, 1)
                      })
                      ifThen(gt(clickEvent.get(), EVENTS_PER_TRACK), () => {
                        setVariableTo(clickEvent, EVENTS_PER_TRACK)
                      })

                      ifThen(gt(clickEvent.get(), 0), () => {
                        setVariableTo(selectedTrack, clickTrack.get())
                        setVariableTo(selectedEvent, clickEvent.get())
                      })
                    },
                  )

                  ifThen(
                    and(
                      and(
                        gt(getMouseX(), LENGTH_PANEL_LEFT),
                        lt(getMouseX(), LENGTH_PANEL_RIGHT),
                      ),
                      and(
                        gt(getMouseY(), LENGTH_PANEL_BOTTOM),
                        lt(getMouseY(), LENGTH_PANEL_TOP),
                      ),
                    ),
                    () => {
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), LENGTH_QUANT_BTN_LEFT),
                            lt(getMouseX(), LENGTH_QUANT_BTN_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), LENGTH_QUANT_BTN_BOTTOM),
                            lt(getMouseY(), LENGTH_QUANT_BTN_TOP),
                          ),
                        ),
                        () => {
                          changeVariableBy(quantizeOptionIndex, -1)
                        },
                      )
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), LENGTH_QUANT_BTN2_LEFT),
                            lt(getMouseX(), LENGTH_QUANT_BTN2_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), LENGTH_QUANT_BTN_BOTTOM),
                            lt(getMouseY(), LENGTH_QUANT_BTN_TOP),
                          ),
                        ),
                        () => {
                          changeVariableBy(quantizeOptionIndex, 1)
                        },
                      )
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), LENGTH_QUANT_BTN_LEFT),
                            lt(getMouseX(), LENGTH_QUANT_BTN_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), LENGTH_MULT_BTN_BOTTOM),
                            lt(getMouseY(), LENGTH_MULT_BTN_TOP),
                          ),
                        ),
                        () => {
                          changeVariableBy(noteLengthMultiplier, -1)
                        },
                      )
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), LENGTH_QUANT_BTN2_LEFT),
                            lt(getMouseX(), LENGTH_QUANT_BTN2_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), LENGTH_MULT_BTN_BOTTOM),
                            lt(getMouseY(), LENGTH_MULT_BTN_TOP),
                          ),
                        ),
                        () => {
                          changeVariableBy(noteLengthMultiplier, 1)
                        },
                      )
                    },
                  )

                  ifThen(
                    and(
                      and(
                        gt(getMouseX(), ZOOM_PANEL_LEFT),
                        lt(getMouseX(), ZOOM_PANEL_RIGHT),
                      ),
                      and(
                        gt(getMouseY(), ZOOM_PANEL_BOTTOM),
                        lt(getMouseY(), ZOOM_PANEL_TOP),
                      ),
                    ),
                    () => {
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), ZOOM_DEC_BTN_LEFT),
                            lt(getMouseX(), ZOOM_DEC_BTN_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), ZOOM_BTN_BOTTOM),
                            lt(getMouseY(), ZOOM_BTN_TOP),
                          ),
                        ),
                        () => {
                          changeVariableBy(rollCellH, -1)
                        },
                      )
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), ZOOM_INC_BTN_LEFT),
                            lt(getMouseX(), ZOOM_INC_BTN_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), ZOOM_BTN_BOTTOM),
                            lt(getMouseY(), ZOOM_BTN_TOP),
                          ),
                        ),
                        () => {
                          changeVariableBy(rollCellH, 1)
                        },
                      )
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), ZOOM_DEC_BTN_LEFT),
                            lt(getMouseX(), ZOOM_DEC_BTN_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), TRACK_NAV_BTN_BOTTOM),
                            lt(getMouseY(), TRACK_NAV_BTN_TOP),
                          ),
                        ),
                        () => {
                          changeVariableBy(selectedTrack, -1)
                        },
                      )
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), ZOOM_INC_BTN_LEFT),
                            lt(getMouseX(), ZOOM_INC_BTN_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), TRACK_NAV_BTN_BOTTOM),
                            lt(getMouseY(), TRACK_NAV_BTN_TOP),
                          ),
                        ),
                        () => {
                          changeVariableBy(selectedTrack, 1)
                          setVariableTo(trackEnsureTarget, selectedTrack.get())
                          callProcedure(ensureTrackData, {})
                        },
                      )
                    },
                  )

                  ifThen(
                    and(
                      and(
                        gt(getMouseX(), TRACK_PANEL_LEFT),
                        lt(getMouseX(), TRACK_PANEL_RIGHT),
                      ),
                      and(
                        gt(getMouseY(), TRACK_PANEL_BOTTOM),
                        lt(getMouseY(), TRACK_PANEL_TOP),
                      ),
                    ),
                    () => {
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), TRACK_CFG_BTN_LEFT),
                            lt(getMouseX(), TRACK_CFG_BTN_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), TRACK_INST_BTN_BOTTOM),
                            lt(getMouseY(), TRACK_INST_BTN_TOP),
                          ),
                        ),
                        () => {
                          setVariableTo(
                            trackCfgValue,
                            getItemOfList(
                              trackInstruments,
                              selectedTrack.get(),
                            ),
                          )
                          changeVariableBy(trackCfgValue, -1)
                          ifThen(
                            lt(trackCfgValue.get(), TRACK_INSTRUMENT_MIN),
                            () => {
                              setVariableTo(trackCfgValue, TRACK_INSTRUMENT_MIN)
                            },
                          )
                          replaceItemOfList(
                            trackInstruments,
                            selectedTrack.get(),
                            trackCfgValue.get(),
                          )
                        },
                      )
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), TRACK_CFG_BTN2_LEFT),
                            lt(getMouseX(), TRACK_CFG_BTN2_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), TRACK_INST_BTN_BOTTOM),
                            lt(getMouseY(), TRACK_INST_BTN_TOP),
                          ),
                        ),
                        () => {
                          setVariableTo(
                            trackCfgValue,
                            getItemOfList(
                              trackInstruments,
                              selectedTrack.get(),
                            ),
                          )
                          changeVariableBy(trackCfgValue, 1)
                          ifThen(
                            gt(trackCfgValue.get(), TRACK_INSTRUMENT_MAX),
                            () => {
                              setVariableTo(trackCfgValue, TRACK_INSTRUMENT_MAX)
                            },
                          )
                          replaceItemOfList(
                            trackInstruments,
                            selectedTrack.get(),
                            trackCfgValue.get(),
                          )
                        },
                      )
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), TRACK_INST_VALUE_LEFT),
                            lt(getMouseX(), TRACK_INST_VALUE_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), TRACK_INST_BTN_BOTTOM),
                            lt(getMouseY(), TRACK_INST_BTN_TOP),
                          ),
                        ),
                        () => {
                          setVariableTo(
                            instrumentModalProgram,
                            getItemOfList(
                              trackInstruments,
                              selectedTrack.get(),
                            ),
                          )
                          setVariableTo(instrumentModalOpen, 1)
                        },
                      )
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), TRACK_CFG_BTN_LEFT),
                            lt(getMouseX(), TRACK_CFG_BTN_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), TRACK_VEL_BTN_BOTTOM),
                            lt(getMouseY(), TRACK_VEL_BTN_TOP),
                          ),
                        ),
                        () => {
                          setVariableTo(
                            trackCfgValue,
                            getItemOfList(trackVelocities, selectedTrack.get()),
                          )
                          changeVariableBy(trackCfgValue, -5)
                          ifThen(
                            lt(trackCfgValue.get(), TRACK_VELOCITY_MIN),
                            () => {
                              setVariableTo(trackCfgValue, TRACK_VELOCITY_MIN)
                            },
                          )
                          replaceItemOfList(
                            trackVelocities,
                            selectedTrack.get(),
                            trackCfgValue.get(),
                          )
                        },
                      )
                      ifThen(
                        and(
                          and(
                            gt(getMouseX(), TRACK_CFG_BTN2_LEFT),
                            lt(getMouseX(), TRACK_CFG_BTN2_RIGHT),
                          ),
                          and(
                            gt(getMouseY(), TRACK_VEL_BTN_BOTTOM),
                            lt(getMouseY(), TRACK_VEL_BTN_TOP),
                          ),
                        ),
                        () => {
                          setVariableTo(
                            trackCfgValue,
                            getItemOfList(trackVelocities, selectedTrack.get()),
                          )
                          changeVariableBy(trackCfgValue, 5)
                          ifThen(
                            gt(trackCfgValue.get(), TRACK_VELOCITY_MAX),
                            () => {
                              setVariableTo(trackCfgValue, TRACK_VELOCITY_MAX)
                            },
                          )
                          replaceItemOfList(
                            trackVelocities,
                            selectedTrack.get(),
                            trackCfgValue.get(),
                          )
                        },
                      )
                    },
                  )

                  ifThen(
                    and(
                      and(
                        gt(getMouseX(), ROLL_GRID_LEFT),
                        lt(getMouseX(), ROLL_GRID_RIGHT),
                      ),
                      and(
                        gt(getMouseY(), ROLL_BOTTOM),
                        lt(getMouseY(), ROLL_TOP),
                      ),
                    ),
                    () => {
                      setVariableTo(
                        clickRawStep,
                        add(
                          mathop(
                            'floor',
                            divide(
                              subtract(getMouseX(), ROLL_GRID_LEFT),
                              ROLL_CELL_W,
                            ),
                          ),
                          1,
                        ),
                      )
                      setVariableTo(
                        clickPitch,
                        add(
                          add(
                            mathop(
                              'floor',
                              divide(
                                subtract(ROLL_TOP, getMouseY()),
                                rollCellH.get(),
                              ),
                            ),
                            1,
                          ),
                          subtract(rollPitchOffset.get(), 1),
                        ),
                      )
                      ifThen(lt(clickPitch.get(), 1), () => {
                        setVariableTo(clickPitch, 1)
                      })
                      ifThen(gt(clickPitch.get(), ROLL_PITCHES), () => {
                        setVariableTo(clickPitch, ROLL_PITCHES)
                      })
                      setVariableTo(
                        workClip,
                        clipIndex(selectedTrack.get(), selectedEvent.get()),
                      )
                      setVariableTo(noteHitFound, 0)
                      setVariableTo(noteHitStep, clickRawStep.get())
                      forEach(loopStep, ROLL_STEPS, () => {
                        setVariableTo(
                          workIndex,
                          noteIndex(
                            workClip.get(),
                            loopStep.get(),
                            clickPitch.get(),
                          ),
                        )
                        setVariableTo(
                          noteLengthCellValue,
                          getItemOfList(midiNotes, workIndex.get()),
                        )
                        setVariableTo(
                          noteHitEndStep,
                          subtract(
                            add(
                              loopStep.get(),
                              divide(
                                noteLengthCellValue.get(),
                                NOTE_STEP_TICKS,
                              ),
                            ),
                            1,
                          ),
                        )
                        ifThen(
                          and(
                            and(
                              gt(noteLengthCellValue.get(), 0),
                              gt(
                                clickRawStep.get(),
                                subtract(loopStep.get(), 1),
                              ),
                            ),
                            gt(
                              add(noteHitEndStep.get(), 1),
                              clickRawStep.get(),
                            ),
                          ),
                          () => {
                            setVariableTo(noteHitFound, 1)
                            setVariableTo(noteHitStep, loopStep.get())
                          },
                        )
                      })
                      ifElse(
                        equals(noteHitFound.get(), 1),
                        () => {
                          setVariableTo(clickStep, noteHitStep.get())
                        },
                        () => {
                          setVariableTo(
                            clickStep,
                            add(
                              multiply(
                                mathop(
                                  'floor',
                                  divide(
                                    subtract(clickRawStep.get(), 1),
                                    quantizeTicks.get(),
                                  ),
                                ),
                                quantizeTicks.get(),
                              ),
                              1,
                            ),
                          )
                        },
                      )
                      ifThen(lt(clickStep.get(), 1), () => {
                        setVariableTo(clickStep, 1)
                      })
                      ifThen(gt(clickStep.get(), ROLL_STEPS), () => {
                        setVariableTo(clickStep, ROLL_STEPS)
                      })
                      setVariableTo(
                        workIndex,
                        noteIndex(
                          workClip.get(),
                          clickStep.get(),
                          clickPitch.get(),
                        ),
                      )
                      ifThen(
                        lt(lengthOfList(midiNotes), workIndex.get()),
                        () => {
                          setVariableTo(
                            listPadCount,
                            subtract(workIndex.get(), lengthOfList(midiNotes)),
                          )
                          repeat(listPadCount.get(), () => {
                            addToList(midiNotes, 0)
                          })
                        },
                      )
                      setVariableTo(
                        noteLengthCellValue,
                        getItemOfList(midiNotes, workIndex.get()),
                      )
                      setVariableTo(
                        noteLengthMaxAtStep,
                        multiply(
                          add(subtract(ROLL_STEPS, clickStep.get()), 1),
                          NOTE_STEP_TICKS,
                        ),
                      )
                      setVariableTo(
                        noteLengthApplied,
                        multiply(
                          quantizeTicks.get(),
                          noteLengthMultiplier.get(),
                        ),
                      )
                      ifThen(
                        gt(noteLengthApplied.get(), noteLengthMaxAtStep.get()),
                        () => {
                          setVariableTo(
                            noteLengthApplied,
                            noteLengthMaxAtStep.get(),
                          )
                        },
                      )

                      setVariableTo(placedNoteLengthTicks, 0)
                      ifElse(
                        equals(noteLengthCellValue.get(), 0),
                        () => {
                          replaceItemOfList(
                            midiNotes,
                            workIndex.get(),
                            noteLengthApplied.get(),
                          )
                          setVariableTo(
                            placedNoteLengthTicks,
                            noteLengthApplied.get(),
                          )
                        },
                        () => {
                          ifElse(
                            equals(
                              noteLengthCellValue.get(),
                              noteLengthApplied.get(),
                            ),
                            () => {
                              replaceItemOfList(midiNotes, workIndex.get(), 0)
                            },
                            () => {
                              replaceItemOfList(
                                midiNotes,
                                workIndex.get(),
                                noteLengthApplied.get(),
                              )
                              setVariableTo(
                                placedNoteLengthTicks,
                                noteLengthApplied.get(),
                              )
                            },
                          )
                        },
                      )
                      ifThen(gt(placedNoteLengthTicks.get(), 0), () => {
                        setVariableTo(
                          audioInstrument,
                          getItemOfList(trackInstruments, selectedTrack.get()),
                        )
                        setVariableTo(
                          audioVelocity,
                          getItemOfList(trackVelocities, selectedTrack.get()),
                        )
                        setVariableTo(
                          audioNoteBeats,
                          divide(
                            placedNoteLengthTicks.get(),
                            NOTE_TICKS_PER_BEAT,
                          ),
                        )
                        ifElse(
                          equals(audioInstrument.get(), TRACK_DRUM_INSTRUMENT),
                          () => {
                            setVariableTo(
                              audioNoteToPlay,
                              drumMidiNote(clickPitch.get()),
                            )
                          },
                          () => {
                            setVariableTo(
                              audioNoteToPlay,
                              melodicMidiNote(
                                clickPitch.get(),
                                selectedTrack.get(),
                              ),
                            )
                          },
                        )
                        createClone(CREATE_CLONE_MYSELF)
                      })
                    },
                  )
                },
              )
            })
          },
          () => {
            setVariableTo(mouseLatch, 0)
          },
        )
      },
      true,
    )

    // Keeps playback tempo and timer interval aligned with user input and drag actions.
    const syncTempo = defineProcedure(
      [procedureLabel('sync tempo')],
      () => {
        ifThen(lt(playbackTempo.get(), BPM_MIN), () => {
          setVariableTo(playbackTempo, BPM_MIN)
        })
        ifThen(gt(playbackTempo.get(), BPM_MAX), () => {
          setVariableTo(playbackTempo, BPM_MAX)
        })

        ifElse(
          equals(playbackTempo.get(), appliedTempo.get()),
          () => {},
          () => {
            setVariableTo(appliedTempo, playbackTempo.get())
            setTempo(appliedTempo.get())
            setVariableTo(
              stepIntervalSec,
              divide(divide(60, appliedTempo.get()), STEPS_PER_BEAT),
            )
            ifThen(equals(isPlaying.get(), 1), () => {
              setVariableTo(
                nextStepAtSec,
                add(getTimer(), stepIntervalSec.get()),
              )
            })
          },
        )
      },
      true,
    )

    // Finds the active clip for the current beat and only scans that clip's note column per track.
    const playStepAudio = defineProcedure(
      [procedureLabel('play step audio')],
      () => {
        setVariableTo(
          audioTimelineStep,
          add(
            mathop(
              'floor',
              divide(subtract(playheadStep.get(), 1), STEPS_PER_BEAT),
            ),
            1,
          ),
        )
        setVariableTo(
          audioStepInBeat,
          add(mod(subtract(playheadStep.get(), 1), STEPS_PER_BEAT), 1),
        )

        setVariableTo(
          audioEvent,
          add(
            mathop(
              'floor',
              divide(subtract(audioTimelineStep.get(), 1), CLIP_BEATS),
            ),
            1,
          ),
        )
        setVariableTo(
          audioBeatInClip,
          add(mod(subtract(audioTimelineStep.get(), 1), CLIP_BEATS), 1),
        )
        setVariableTo(
          audioStepInClip,
          add(
            multiply(subtract(audioBeatInClip.get(), 1), STEPS_PER_BEAT),
            audioStepInBeat.get(),
          ),
        )

        ifThen(
          and(
            and(
              gt(audioEvent.get(), 0),
              lt(audioEvent.get(), add(EVENTS_PER_TRACK, 1)),
            ),
            and(
              gt(audioStepInClip.get(), 0),
              lt(audioStepInClip.get(), add(ROLL_STEPS, 1)),
            ),
          ),
          () => {
            forEach(audioTrack, trackTotal.get(), () => {
              setVariableTo(
                audioClip,
                clipIndex(audioTrack.get(), audioEvent.get()),
              )
              setVariableTo(
                audioInstrument,
                getItemOfList(trackInstruments, audioTrack.get()),
              )
              setVariableTo(
                audioVelocity,
                getItemOfList(trackVelocities, audioTrack.get()),
              )

              forEach(audioPitchLoop, ROLL_PITCHES, () => {
                setVariableTo(
                  audioNoteIndex,
                  noteIndex(
                    audioClip.get(),
                    audioStepInClip.get(),
                    audioPitchLoop.get(),
                  ),
                )
                setVariableTo(
                  audioNoteLengthTicks,
                  getItemOfList(midiNotes, audioNoteIndex.get()),
                )

                ifThen(gt(audioNoteLengthTicks.get(), 0), () => {
                  setVariableTo(audioPitch, audioPitchLoop.get())
                  setVariableTo(
                    audioNoteBeats,
                    divide(audioNoteLengthTicks.get(), NOTE_TICKS_PER_BEAT),
                  )
                  ifElse(
                    equals(audioInstrument.get(), TRACK_DRUM_INSTRUMENT),
                    () => {
                      setVariableTo(
                        audioNoteToPlay,
                        drumMidiNote(audioPitch.get()),
                      )
                    },
                    () => {
                      setVariableTo(
                        audioNoteToPlay,
                        melodicMidiNote(audioPitch.get(), audioTrack.get()),
                      )
                    },
                  )
                  createClone(CREATE_CLONE_MYSELF)
                })
              })
            })
          },
        )
      },
      true,
    )

    const advancePlayhead = defineProcedure(
      [procedureLabel('advance playhead')],
      () => {
        ifThen(equals(isPlaying.get(), 1), () => {
          setVariableTo(catchupSteps, 0)

          // Catch up multiple steps if rendering falls behind, so playback does not drop notes.
          repeatUntil(
            or(
              lt(getTimer(), nextStepAtSec.get()),
              gt(catchupSteps.get(), STEPS_PER_BEAT * 2),
            ),
            () => {
              callProcedure(playStepAudio, {})
              setVariableTo(playheadDisplayStep, playheadStep.get())
              changeVariableBy(playheadStep, 1)
              ifThen(gt(playheadStep.get(), TRANSPORT_STEPS), () => {
                setVariableTo(playheadStep, 1)
              })
              setVariableTo(
                workIndex,
                add(
                  mathop(
                    'floor',
                    divide(subtract(playheadStep.get(), 1), STEPS_PER_BEAT),
                  ),
                  1,
                ),
              )
              ifThen(
                gt(
                  workIndex.get(),
                  add(timelineScrollBeat.get(), subtract(TIMELINE_STEPS, 1)),
                ),
                () => {
                  setVariableTo(
                    timelineScrollBeat,
                    add(workIndex.get(), subtract(1, TIMELINE_STEPS)),
                  )
                },
              )
              ifThen(lt(workIndex.get(), timelineScrollBeat.get()), () => {
                setVariableTo(timelineScrollBeat, workIndex.get())
              })
              ifThen(lt(timelineScrollBeat.get(), 1), () => {
                setVariableTo(timelineScrollBeat, 1)
              })
              ifThen(gt(timelineScrollBeat.get(), TIMELINE_SCROLL_MAX), () => {
                setVariableTo(timelineScrollBeat, TIMELINE_SCROLL_MAX)
              })
              setVariableTo(
                nextStepAtSec,
                add(nextStepAtSec.get(), stepIntervalSec.get()),
              )
              changeVariableBy(catchupSteps, 1)
            },
          )
        })
      },
      true,
    )

    const drawBpmDigit = defineProcedure(
      [procedureLabel('draw bpm digit')],
      () => {
        ifElse(
          listContainsItem(bpmSegAOn, bpmDigitValue.get()),
          () => {
            drawHorizontal(
              subtract(bpmDigitCenterX.get(), 4),
              add(bpmDigitCenterX.get(), 4),
              add(digitCenterY.get(), 10),
              2,
              '#f77f00',
            )
          },
          () => {
            drawHorizontal(
              subtract(bpmDigitCenterX.get(), 4),
              add(bpmDigitCenterX.get(), 4),
              add(digitCenterY.get(), 10),
              2,
              '#1b2736',
            )
          },
        )

        ifElse(
          listContainsItem(bpmSegBOn, bpmDigitValue.get()),
          () => {
            drawVertical(
              add(bpmDigitCenterX.get(), 5),
              add(digitCenterY.get(), 1),
              add(digitCenterY.get(), 9),
              2,
              '#f77f00',
            )
          },
          () => {
            drawVertical(
              add(bpmDigitCenterX.get(), 5),
              add(digitCenterY.get(), 1),
              add(digitCenterY.get(), 9),
              2,
              '#1b2736',
            )
          },
        )

        ifElse(
          listContainsItem(bpmSegCOn, bpmDigitValue.get()),
          () => {
            drawVertical(
              add(bpmDigitCenterX.get(), 5),
              subtract(digitCenterY.get(), 9),
              subtract(digitCenterY.get(), 1),
              2,
              '#f77f00',
            )
          },
          () => {
            drawVertical(
              add(bpmDigitCenterX.get(), 5),
              subtract(digitCenterY.get(), 9),
              subtract(digitCenterY.get(), 1),
              2,
              '#1b2736',
            )
          },
        )

        ifElse(
          listContainsItem(bpmSegDOn, bpmDigitValue.get()),
          () => {
            drawHorizontal(
              subtract(bpmDigitCenterX.get(), 4),
              add(bpmDigitCenterX.get(), 4),
              subtract(digitCenterY.get(), 10),
              2,
              '#f77f00',
            )
          },
          () => {
            drawHorizontal(
              subtract(bpmDigitCenterX.get(), 4),
              add(bpmDigitCenterX.get(), 4),
              subtract(digitCenterY.get(), 10),
              2,
              '#1b2736',
            )
          },
        )

        ifElse(
          listContainsItem(bpmSegEOn, bpmDigitValue.get()),
          () => {
            drawVertical(
              subtract(bpmDigitCenterX.get(), 5),
              subtract(digitCenterY.get(), 9),
              subtract(digitCenterY.get(), 1),
              2,
              '#f77f00',
            )
          },
          () => {
            drawVertical(
              subtract(bpmDigitCenterX.get(), 5),
              subtract(digitCenterY.get(), 9),
              subtract(digitCenterY.get(), 1),
              2,
              '#1b2736',
            )
          },
        )

        ifElse(
          listContainsItem(bpmSegFOn, bpmDigitValue.get()),
          () => {
            drawVertical(
              subtract(bpmDigitCenterX.get(), 5),
              add(digitCenterY.get(), 1),
              add(digitCenterY.get(), 9),
              2,
              '#f77f00',
            )
          },
          () => {
            drawVertical(
              subtract(bpmDigitCenterX.get(), 5),
              add(digitCenterY.get(), 1),
              add(digitCenterY.get(), 9),
              2,
              '#1b2736',
            )
          },
        )

        ifElse(
          listContainsItem(bpmSegGOn, bpmDigitValue.get()),
          () => {
            drawHorizontal(
              subtract(bpmDigitCenterX.get(), 4),
              add(bpmDigitCenterX.get(), 4),
              digitCenterY.get(),
              2,
              '#f77f00',
            )
          },
          () => {
            drawHorizontal(
              subtract(bpmDigitCenterX.get(), 4),
              add(bpmDigitCenterX.get(), 4),
              digitCenterY.get(),
              2,
              '#1b2736',
            )
          },
        )
      },
      true,
    )

    const drawTimelineDigit = defineProcedure(
      [procedureLabel('draw timeline digit')],
      () => {
        ifThen(listContainsItem(bpmSegAOn, bpmDigitValue.get()), () => {
          drawHorizontal(
            subtract(bpmDigitCenterX.get(), 3),
            add(bpmDigitCenterX.get(), 3),
            add(digitCenterY.get(), 6),
            1,
            '#e2e8f0',
          )
        })
        ifThen(listContainsItem(bpmSegBOn, bpmDigitValue.get()), () => {
          drawVertical(
            add(bpmDigitCenterX.get(), 4),
            add(digitCenterY.get(), 1),
            add(digitCenterY.get(), 5),
            1,
            '#e2e8f0',
          )
        })
        ifThen(listContainsItem(bpmSegCOn, bpmDigitValue.get()), () => {
          drawVertical(
            add(bpmDigitCenterX.get(), 4),
            subtract(digitCenterY.get(), 5),
            subtract(digitCenterY.get(), 1),
            1,
            '#e2e8f0',
          )
        })
        ifThen(listContainsItem(bpmSegDOn, bpmDigitValue.get()), () => {
          drawHorizontal(
            subtract(bpmDigitCenterX.get(), 3),
            add(bpmDigitCenterX.get(), 3),
            subtract(digitCenterY.get(), 6),
            1,
            '#e2e8f0',
          )
        })
        ifThen(listContainsItem(bpmSegEOn, bpmDigitValue.get()), () => {
          drawVertical(
            subtract(bpmDigitCenterX.get(), 4),
            subtract(digitCenterY.get(), 5),
            subtract(digitCenterY.get(), 1),
            1,
            '#e2e8f0',
          )
        })
        ifThen(listContainsItem(bpmSegFOn, bpmDigitValue.get()), () => {
          drawVertical(
            subtract(bpmDigitCenterX.get(), 4),
            add(digitCenterY.get(), 1),
            add(digitCenterY.get(), 5),
            1,
            '#e2e8f0',
          )
        })
        ifThen(listContainsItem(bpmSegGOn, bpmDigitValue.get()), () => {
          drawHorizontal(
            subtract(bpmDigitCenterX.get(), 3),
            add(bpmDigitCenterX.get(), 3),
            digitCenterY.get(),
            1,
            '#e2e8f0',
          )
        })
      },
      true,
    )

    const drawPixelText = defineProcedure(
      [procedureLabel('draw pixel text')],
      () => {
        setVariableTo(textLength, length(textRenderValue.get()))
        setVariableTo(textCursorX, textRenderX.get())
        setVariableTo(textCharIndex, 1)

        repeat(textLength.get(), () => {
          setVariableTo(
            textCharValue,
            letterOf(textCharIndex.get(), textRenderValue.get()),
          )
          setVariableTo(textGlyphIndex, 1)
          repeatUntil(
            or(
              gt(textGlyphIndex.get(), lengthOfList(pixelFontChars)),
              equals(
                getItemOfList(pixelFontChars, textGlyphIndex.get()),
                textCharValue.get(),
              ),
            ),
            () => {
              changeVariableBy(textGlyphIndex, 1)
            },
          )
          ifThen(gt(textGlyphIndex.get(), lengthOfList(pixelFontChars)), () => {
            setVariableTo(textGlyphIndex, 1)
          })
          setVariableTo(
            textGlyphBits,
            getItemOfList(pixelFontGlyphs, textGlyphIndex.get()),
          )
          setVariableTo(textPixelIndex, 1)
          repeat(PIXEL_FONT_PIXELS, () => {
            ifThen(
              equals(letterOf(textPixelIndex.get(), textGlyphBits.get()), '1'),
              () => {
                setVariableTo(
                  textPixelX,
                  add(
                    textCursorX.get(),
                    multiply(
                      mod(subtract(textPixelIndex.get(), 1), PIXEL_FONT_W),
                      textRenderScale.get(),
                    ),
                  ),
                )
                setVariableTo(
                  textPixelY,
                  subtract(
                    textRenderY.get(),
                    multiply(
                      mathop(
                        'floor',
                        divide(subtract(textPixelIndex.get(), 1), PIXEL_FONT_W),
                      ),
                      textRenderScale.get(),
                    ),
                  ),
                )
                drawRect(
                  textPixelX.get(),
                  subtract(
                    textPixelY.get(),
                    subtract(textRenderScale.get(), 1),
                  ),
                  add(textPixelX.get(), subtract(textRenderScale.get(), 1)),
                  textPixelY.get(),
                  textRenderColor.get(),
                )
              },
            )
            changeVariableBy(textPixelIndex, 1)
          })
          changeVariableBy(
            textCursorX,
            add(multiply(4, textRenderScale.get()), 1),
          )
          changeVariableBy(textCharIndex, 1)
        })
      },
      true,
    )

    const drawBpmPanel = defineProcedure(
      [procedureLabel('draw bpm panel')],
      () => {
        drawRect(
          BPM_PANEL_LEFT,
          BPM_PANEL_BOTTOM,
          BPM_PANEL_RIGHT,
          BPM_PANEL_TOP,
          '#101823',
        )
        drawHorizontal(
          BPM_PANEL_LEFT,
          BPM_PANEL_RIGHT,
          BPM_PANEL_TOP,
          2,
          '#3b4556',
        )
        drawHorizontal(
          BPM_PANEL_LEFT,
          BPM_PANEL_RIGHT,
          BPM_PANEL_BOTTOM,
          2,
          '#3b4556',
        )
        drawVertical(
          BPM_PANEL_LEFT,
          BPM_PANEL_TOP,
          BPM_PANEL_BOTTOM,
          2,
          '#3b4556',
        )
        drawVertical(
          BPM_PANEL_RIGHT,
          BPM_PANEL_TOP,
          BPM_PANEL_BOTTOM,
          2,
          '#3b4556',
        )

        setVariableTo(bpmRemainder, mod(playbackTempo.get(), 100))
        ifElse(
          lt(playbackTempo.get(), 100),
          () => {
            setVariableTo(bpmHundreds, -1)
          },
          () => {
            setVariableTo(
              bpmHundreds,
              mathop('floor', divide(playbackTempo.get(), 100)),
            )
          },
        )
        setVariableTo(bpmTens, mathop('floor', divide(bpmRemainder.get(), 10)))
        setVariableTo(bpmOnes, mod(playbackTempo.get(), 10))
        setVariableTo(digitCenterY, BPM_DIGIT_Y)

        setVariableTo(bpmDigitCenterX, BPM_DIGIT_X1)
        setVariableTo(bpmDigitValue, bpmHundreds.get())
        callProcedure(drawBpmDigit, {})

        setVariableTo(bpmDigitCenterX, BPM_DIGIT_X2)
        setVariableTo(bpmDigitValue, bpmTens.get())
        callProcedure(drawBpmDigit, {})

        setVariableTo(bpmDigitCenterX, BPM_DIGIT_X3)
        setVariableTo(bpmDigitValue, bpmOnes.get())
        callProcedure(drawBpmDigit, {})

        drawHorizontal(
          BPM_SLIDER_LEFT,
          BPM_SLIDER_RIGHT,
          BPM_SLIDER_Y,
          4,
          '#233143',
        )
        setVariableTo(
          bpmSliderKnobX,
          add(
            BPM_SLIDER_LEFT,
            multiply(
              divide(
                subtract(playbackTempo.get(), BPM_MIN),
                subtract(BPM_MAX, BPM_MIN),
              ),
              subtract(BPM_SLIDER_RIGHT, BPM_SLIDER_LEFT),
            ),
          ),
        )
        drawHorizontal(
          BPM_SLIDER_LEFT,
          bpmSliderKnobX.get(),
          BPM_SLIDER_Y,
          4,
          '#f77f00',
        )
        drawRect(
          subtract(bpmSliderKnobX.get(), 3),
          BPM_SLIDER_Y - 8,
          add(bpmSliderKnobX.get(), 3),
          BPM_SLIDER_Y + 8,
          '#f8fafc',
        )
        drawRect(
          BPM_DEC_BTN_LEFT,
          BPM_STEP_BTN_BOTTOM,
          BPM_DEC_BTN_RIGHT,
          BPM_STEP_BTN_TOP,
          '#223042',
        )
        drawRect(
          BPM_INC_BTN_LEFT,
          BPM_STEP_BTN_BOTTOM,
          BPM_INC_BTN_RIGHT,
          BPM_STEP_BTN_TOP,
          '#223042',
        )
        drawHorizontal(
          BPM_DEC_BTN_LEFT + 3,
          BPM_DEC_BTN_RIGHT - 3,
          divide(add(BPM_STEP_BTN_TOP, BPM_STEP_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawHorizontal(
          BPM_INC_BTN_LEFT + 3,
          BPM_INC_BTN_RIGHT - 3,
          divide(add(BPM_STEP_BTN_TOP, BPM_STEP_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawVertical(
          divide(add(BPM_INC_BTN_LEFT, BPM_INC_BTN_RIGHT), 2),
          BPM_STEP_BTN_TOP - 2,
          BPM_STEP_BTN_BOTTOM + 2,
          1,
          '#f8fafc',
        )

        ifElse(
          equals(isPlaying.get(), 1),
          () => {
            drawRect(
              PLAY_BTN_LEFT,
              PLAY_BTN_BOTTOM,
              PLAY_BTN_RIGHT,
              PLAY_BTN_TOP,
              '#7f1d1d',
            )
            drawHorizontal(
              PLAY_BTN_LEFT,
              PLAY_BTN_RIGHT,
              PLAY_BTN_TOP,
              2,
              '#ef4444',
            )
            drawHorizontal(
              PLAY_BTN_LEFT,
              PLAY_BTN_RIGHT,
              PLAY_BTN_BOTTOM,
              2,
              '#ef4444',
            )
            drawVertical(
              PLAY_BTN_LEFT,
              PLAY_BTN_TOP,
              PLAY_BTN_BOTTOM,
              2,
              '#ef4444',
            )
            drawVertical(
              PLAY_BTN_RIGHT,
              PLAY_BTN_TOP,
              PLAY_BTN_BOTTOM,
              2,
              '#ef4444',
            )
            drawRect(198, 74, 202, 80, '#fee2e2')
            setVariableTo(textRenderScale, 1)
            setVariableTo(textRenderColor, '#fee2e2')
            setVariableTo(textRenderValue, 'STOP')
            setVariableTo(textRenderX, 207)
            setVariableTo(textRenderY, 80)
            callProcedure(drawPixelText, {})
          },
          () => {
            drawRect(
              PLAY_BTN_LEFT,
              PLAY_BTN_BOTTOM,
              PLAY_BTN_RIGHT,
              PLAY_BTN_TOP,
              '#14532d',
            )
            drawHorizontal(
              PLAY_BTN_LEFT,
              PLAY_BTN_RIGHT,
              PLAY_BTN_TOP,
              2,
              '#22c55e',
            )
            drawHorizontal(
              PLAY_BTN_LEFT,
              PLAY_BTN_RIGHT,
              PLAY_BTN_BOTTOM,
              2,
              '#22c55e',
            )
            drawVertical(
              PLAY_BTN_LEFT,
              PLAY_BTN_TOP,
              PLAY_BTN_BOTTOM,
              2,
              '#22c55e',
            )
            drawVertical(
              PLAY_BTN_RIGHT,
              PLAY_BTN_TOP,
              PLAY_BTN_BOTTOM,
              2,
              '#22c55e',
            )
            drawHorizontal(198, 201, 80, 1, '#dcfce7')
            drawHorizontal(198, 202, 79, 1, '#dcfce7')
            drawHorizontal(198, 203, 78, 1, '#dcfce7')
            drawHorizontal(198, 202, 77, 1, '#dcfce7')
            drawHorizontal(198, 201, 76, 1, '#dcfce7')
            setVariableTo(textRenderScale, 1)
            setVariableTo(textRenderColor, '#dcfce7')
            setVariableTo(textRenderValue, 'PLAY')
            setVariableTo(textRenderX, 207)
            setVariableTo(textRenderY, 80)
            callProcedure(drawPixelText, {})
          },
        )
      },
      true,
    )

    const drawTrackPanel = defineProcedure(
      [procedureLabel('draw track panel')],
      () => {
        drawRect(
          TRACK_PANEL_LEFT,
          TRACK_PANEL_BOTTOM,
          TRACK_PANEL_RIGHT,
          TRACK_PANEL_TOP,
          '#101823',
        )
        drawHorizontal(
          TRACK_PANEL_LEFT,
          TRACK_PANEL_RIGHT,
          TRACK_PANEL_TOP,
          2,
          '#3b4556',
        )
        drawHorizontal(
          TRACK_PANEL_LEFT,
          TRACK_PANEL_RIGHT,
          TRACK_PANEL_BOTTOM,
          2,
          '#3b4556',
        )
        drawVertical(
          TRACK_PANEL_LEFT,
          TRACK_PANEL_TOP,
          TRACK_PANEL_BOTTOM,
          2,
          '#3b4556',
        )
        drawVertical(
          TRACK_PANEL_RIGHT,
          TRACK_PANEL_TOP,
          TRACK_PANEL_BOTTOM,
          2,
          '#3b4556',
        )
        drawHorizontal(
          TRACK_PANEL_LEFT + 2,
          TRACK_PANEL_RIGHT - 2,
          -24,
          1,
          '#2a3343',
        )
        drawHorizontal(
          TRACK_PANEL_LEFT + 2,
          TRACK_PANEL_RIGHT - 2,
          TRACK_PANEL_TOP - 2,
          2,
          getItemOfList(trackColors, selectedTrack.get()),
        )
        drawRect(
          TRACK_PANEL_LEFT + 3,
          TRACK_INST_BTN_BOTTOM - 2,
          TRACK_PANEL_RIGHT - 3,
          TRACK_INST_BTN_TOP + 2,
          '#1a2432',
        )
        drawRect(
          TRACK_PANEL_LEFT + 3,
          TRACK_VEL_BTN_BOTTOM - 2,
          TRACK_PANEL_RIGHT - 3,
          TRACK_VEL_BTN_TOP + 2,
          '#1a2432',
        )

        drawRect(
          TRACK_CFG_BTN_LEFT,
          TRACK_INST_BTN_BOTTOM,
          TRACK_CFG_BTN_RIGHT,
          TRACK_INST_BTN_TOP,
          '#223042',
        )
        drawRect(
          TRACK_CFG_BTN2_LEFT,
          TRACK_INST_BTN_BOTTOM,
          TRACK_CFG_BTN2_RIGHT,
          TRACK_INST_BTN_TOP,
          '#223042',
        )
        drawRect(
          TRACK_INST_VALUE_LEFT,
          TRACK_INST_BTN_BOTTOM,
          TRACK_INST_VALUE_RIGHT,
          TRACK_INST_BTN_TOP,
          '#253447',
        )
        drawRect(
          TRACK_CFG_BTN_LEFT,
          TRACK_VEL_BTN_BOTTOM,
          TRACK_CFG_BTN_RIGHT,
          TRACK_VEL_BTN_TOP,
          '#223042',
        )
        drawRect(
          TRACK_CFG_BTN2_LEFT,
          TRACK_VEL_BTN_BOTTOM,
          TRACK_CFG_BTN2_RIGHT,
          TRACK_VEL_BTN_TOP,
          '#223042',
        )

        drawHorizontal(
          TRACK_CFG_BTN_LEFT + 2,
          TRACK_CFG_BTN_RIGHT - 2,
          divide(add(TRACK_INST_BTN_TOP, TRACK_INST_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawHorizontal(
          TRACK_CFG_BTN2_LEFT + 2,
          TRACK_CFG_BTN2_RIGHT - 2,
          divide(add(TRACK_INST_BTN_TOP, TRACK_INST_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawVertical(
          divide(add(TRACK_CFG_BTN2_LEFT, TRACK_CFG_BTN2_RIGHT), 2),
          TRACK_INST_BTN_TOP - 2,
          TRACK_INST_BTN_BOTTOM + 2,
          1,
          '#f8fafc',
        )
        drawHorizontal(
          TRACK_CFG_BTN_LEFT + 2,
          TRACK_CFG_BTN_RIGHT - 2,
          divide(add(TRACK_VEL_BTN_TOP, TRACK_VEL_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawHorizontal(
          TRACK_CFG_BTN2_LEFT + 2,
          TRACK_CFG_BTN2_RIGHT - 2,
          divide(add(TRACK_VEL_BTN_TOP, TRACK_VEL_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawVertical(
          divide(add(TRACK_CFG_BTN2_LEFT, TRACK_CFG_BTN2_RIGHT), 2),
          TRACK_VEL_BTN_TOP - 2,
          TRACK_VEL_BTN_BOTTOM + 2,
          1,
          '#f8fafc',
        )

        setVariableTo(
          trackCfgValue,
          getItemOfList(trackInstruments, selectedTrack.get()),
        )
        setVariableTo(bpmRemainder, mod(trackCfgValue.get(), 100))
        ifElse(
          lt(trackCfgValue.get(), 100),
          () => {
            setVariableTo(bpmHundreds, -1)
          },
          () => {
            setVariableTo(
              bpmHundreds,
              mathop('floor', divide(trackCfgValue.get(), 100)),
            )
          },
        )
        setVariableTo(bpmTens, mathop('floor', divide(bpmRemainder.get(), 10)))
        setVariableTo(bpmOnes, mod(trackCfgValue.get(), 10))
        ifThen(lt(trackCfgValue.get(), 10), () => {
          setVariableTo(bpmTens, -1)
        })

        setVariableTo(digitCenterY, TRACK_INST_DIGIT_Y)
        setVariableTo(bpmDigitCenterX, TRACK_DIGIT_X1)
        setVariableTo(bpmDigitValue, bpmHundreds.get())
        callProcedure(drawBpmDigit, {})
        setVariableTo(bpmDigitCenterX, TRACK_DIGIT_X2)
        setVariableTo(bpmDigitValue, bpmTens.get())
        callProcedure(drawBpmDigit, {})
        setVariableTo(bpmDigitCenterX, TRACK_DIGIT_X3)
        setVariableTo(bpmDigitValue, bpmOnes.get())
        callProcedure(drawBpmDigit, {})

        setVariableTo(
          trackCfgValue,
          getItemOfList(trackVelocities, selectedTrack.get()),
        )
        setVariableTo(bpmRemainder, mod(trackCfgValue.get(), 100))
        ifElse(
          lt(trackCfgValue.get(), 100),
          () => {
            setVariableTo(bpmHundreds, -1)
          },
          () => {
            setVariableTo(
              bpmHundreds,
              mathop('floor', divide(trackCfgValue.get(), 100)),
            )
          },
        )
        setVariableTo(bpmTens, mathop('floor', divide(bpmRemainder.get(), 10)))
        setVariableTo(bpmOnes, mod(trackCfgValue.get(), 10))
        ifThen(lt(trackCfgValue.get(), 10), () => {
          setVariableTo(bpmTens, -1)
        })

        setVariableTo(digitCenterY, TRACK_VEL_DIGIT_Y)
        setVariableTo(bpmDigitCenterX, TRACK_DIGIT_X1)
        setVariableTo(bpmDigitValue, bpmHundreds.get())
        callProcedure(drawBpmDigit, {})
        setVariableTo(bpmDigitCenterX, TRACK_DIGIT_X2)
        setVariableTo(bpmDigitValue, bpmTens.get())
        callProcedure(drawBpmDigit, {})
        setVariableTo(bpmDigitCenterX, TRACK_DIGIT_X3)
        setVariableTo(bpmDigitValue, bpmOnes.get())
        callProcedure(drawBpmDigit, {})
      },
      true,
    )

    const drawZoomPanel = defineProcedure(
      [procedureLabel('draw zoom panel')],
      () => {
        drawRect(
          ZOOM_PANEL_LEFT,
          ZOOM_PANEL_BOTTOM,
          ZOOM_PANEL_RIGHT,
          ZOOM_PANEL_TOP,
          '#101823',
        )
        drawHorizontal(
          ZOOM_PANEL_LEFT,
          ZOOM_PANEL_RIGHT,
          ZOOM_PANEL_TOP,
          2,
          '#3b4556',
        )
        drawHorizontal(
          ZOOM_PANEL_LEFT,
          ZOOM_PANEL_RIGHT,
          ZOOM_PANEL_BOTTOM,
          2,
          '#3b4556',
        )
        drawVertical(
          ZOOM_PANEL_LEFT,
          ZOOM_PANEL_TOP,
          ZOOM_PANEL_BOTTOM,
          2,
          '#3b4556',
        )
        drawVertical(
          ZOOM_PANEL_RIGHT,
          ZOOM_PANEL_TOP,
          ZOOM_PANEL_BOTTOM,
          2,
          '#3b4556',
        )

        drawRect(
          ZOOM_DEC_BTN_LEFT,
          ZOOM_BTN_BOTTOM,
          ZOOM_DEC_BTN_RIGHT,
          ZOOM_BTN_TOP,
          '#223042',
        )
        drawRect(
          ZOOM_INC_BTN_LEFT,
          ZOOM_BTN_BOTTOM,
          ZOOM_INC_BTN_RIGHT,
          ZOOM_BTN_TOP,
          '#223042',
        )

        drawHorizontal(
          ZOOM_DEC_BTN_LEFT + 3,
          ZOOM_DEC_BTN_RIGHT - 3,
          divide(add(ZOOM_BTN_TOP, ZOOM_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawHorizontal(
          ZOOM_INC_BTN_LEFT + 3,
          ZOOM_INC_BTN_RIGHT - 3,
          divide(add(ZOOM_BTN_TOP, ZOOM_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawVertical(
          divide(add(ZOOM_INC_BTN_LEFT, ZOOM_INC_BTN_RIGHT), 2),
          ZOOM_BTN_TOP - 2,
          ZOOM_BTN_BOTTOM + 2,
          1,
          '#f8fafc',
        )

        drawRect(
          ZOOM_DEC_BTN_LEFT,
          TRACK_NAV_BTN_BOTTOM,
          ZOOM_DEC_BTN_RIGHT,
          TRACK_NAV_BTN_TOP,
          '#223042',
        )
        drawRect(
          ZOOM_INC_BTN_LEFT,
          TRACK_NAV_BTN_BOTTOM,
          ZOOM_INC_BTN_RIGHT,
          TRACK_NAV_BTN_TOP,
          '#223042',
        )
        drawHorizontal(
          ZOOM_DEC_BTN_LEFT + 3,
          ZOOM_DEC_BTN_RIGHT - 3,
          divide(add(TRACK_NAV_BTN_TOP, TRACK_NAV_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawHorizontal(
          ZOOM_INC_BTN_LEFT + 3,
          ZOOM_INC_BTN_RIGHT - 3,
          divide(add(TRACK_NAV_BTN_TOP, TRACK_NAV_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawVertical(
          divide(add(ZOOM_INC_BTN_LEFT, ZOOM_INC_BTN_RIGHT), 2),
          TRACK_NAV_BTN_TOP - 2,
          TRACK_NAV_BTN_BOTTOM + 2,
          1,
          '#f8fafc',
        )

        setVariableTo(textRenderScale, 1)
        setVariableTo(textRenderColor, '#9fb3c8')
        setVariableTo(textRenderValue, join('ZOOM ', rollCellH.get()))
        setVariableTo(textRenderX, ZOOM_PANEL_LEFT + 14)
        setVariableTo(textRenderY, ZOOM_PANEL_TOP - 8)
        callProcedure(drawPixelText, {})
        setVariableTo(textRenderValue, join('TR ', selectedTrack.get()))
        setVariableTo(textRenderX, ZOOM_PANEL_LEFT + 14)
        setVariableTo(textRenderY, TRACK_NAV_BTN_TOP - 4)
        callProcedure(drawPixelText, {})
      },
      true,
    )

    const drawInstrumentModal = defineProcedure(
      [procedureLabel('draw instrument modal')],
      () => {
        drawRect(-250, -190, 250, 190, '#060a12')

        drawRect(
          INST_MODAL_LEFT,
          INST_MODAL_BOTTOM,
          INST_MODAL_RIGHT,
          INST_MODAL_TOP,
          '#101823',
        )
        drawHorizontal(
          INST_MODAL_LEFT,
          INST_MODAL_RIGHT,
          INST_MODAL_TOP,
          2,
          '#4c5a70',
        )
        drawHorizontal(
          INST_MODAL_LEFT,
          INST_MODAL_RIGHT,
          INST_MODAL_BOTTOM,
          2,
          '#4c5a70',
        )
        drawVertical(
          INST_MODAL_LEFT,
          INST_MODAL_TOP,
          INST_MODAL_BOTTOM,
          2,
          '#4c5a70',
        )
        drawVertical(
          INST_MODAL_RIGHT,
          INST_MODAL_TOP,
          INST_MODAL_BOTTOM,
          2,
          '#4c5a70',
        )
        drawHorizontal(
          INST_MODAL_LEFT + 2,
          INST_MODAL_RIGHT - 2,
          72,
          1,
          '#2a3343',
        )
        drawHorizontal(
          INST_MODAL_LEFT + 2,
          INST_MODAL_RIGHT - 2,
          -8,
          1,
          '#2a3343',
        )

        drawRect(
          INST_MODAL_PREV_LEFT,
          INST_MODAL_NAV_BOTTOM,
          INST_MODAL_PREV_RIGHT,
          INST_MODAL_NAV_TOP,
          '#223042',
        )
        drawRect(
          INST_MODAL_NEXT_LEFT,
          INST_MODAL_NAV_BOTTOM,
          INST_MODAL_NEXT_RIGHT,
          INST_MODAL_NAV_TOP,
          '#223042',
        )
        drawRect(
          INST_MODAL_FIND_LEFT,
          INST_MODAL_ACTION_BOTTOM,
          INST_MODAL_FIND_RIGHT,
          INST_MODAL_ACTION_TOP,
          '#223042',
        )
        drawRect(
          INST_MODAL_CANCEL_LEFT,
          INST_MODAL_ACTION_BOTTOM,
          INST_MODAL_CANCEL_RIGHT,
          INST_MODAL_ACTION_TOP,
          '#223042',
        )
        drawRect(
          INST_MODAL_OK_LEFT,
          INST_MODAL_ACTION_BOTTOM,
          INST_MODAL_OK_RIGHT,
          INST_MODAL_ACTION_TOP,
          '#f77f00',
        )

        setVariableTo(textRenderColor, '#f8fafc')
        setVariableTo(textRenderScale, 2)
        setVariableTo(textRenderValue, 'INSTRUMENT SELECT')
        setVariableTo(textRenderX, -150)
        setVariableTo(textRenderY, 98)
        callProcedure(drawPixelText, {})

        setVariableTo(textRenderScale, 1)
        setVariableTo(textRenderValue, join('TRACK ', selectedTrack.get()))
        setVariableTo(textRenderX, -150)
        setVariableTo(textRenderY, 62)
        callProcedure(drawPixelText, {})
        setVariableTo(
          textRenderValue,
          join('PROGRAM ', instrumentModalProgram.get()),
        )
        setVariableTo(textRenderX, -150)
        setVariableTo(textRenderY, 48)
        callProcedure(drawPixelText, {})

        setVariableTo(textRenderScale, 1)
        setVariableTo(
          textRenderValue,
          getItemOfList(instrumentNames, instrumentModalProgram.get()),
        )
        setVariableTo(textRenderX, -150)
        setVariableTo(textRenderY, 40)
        callProcedure(drawPixelText, {})

        setVariableTo(textRenderScale, 2)
        setVariableTo(textRenderValue, 'PREV')
        setVariableTo(textRenderX, -144)
        setVariableTo(textRenderY, 21)
        callProcedure(drawPixelText, {})
        setVariableTo(textRenderValue, 'NEXT')
        setVariableTo(textRenderX, 102)
        setVariableTo(textRenderY, 21)
        callProcedure(drawPixelText, {})

        setVariableTo(textRenderScale, 2)
        setVariableTo(textRenderValue, 'FIND')
        setVariableTo(textRenderX, -144)
        setVariableTo(textRenderY, -63)
        callProcedure(drawPixelText, {})
        setVariableTo(textRenderScale, 2)
        setVariableTo(textRenderValue, 'CANCEL')
        setVariableTo(textRenderX, -36)
        setVariableTo(textRenderY, -63)
        callProcedure(drawPixelText, {})
        setVariableTo(textRenderScale, 2)
        setVariableTo(textRenderColor, '#0f172a')
        setVariableTo(textRenderValue, 'OK')
        setVariableTo(textRenderX, 102)
        setVariableTo(textRenderY, -63)
        callProcedure(drawPixelText, {})

        setVariableTo(textRenderScale, 1)
        setVariableTo(textRenderColor, '#9fb3c8')
        setVariableTo(textRenderValue, 'FIND OPENS TEXT INPUT')
        setVariableTo(textRenderX, -150)
        setVariableTo(textRenderY, -18)
        callProcedure(drawPixelText, {})
      },
      true,
    )

    // Repaints the entire sequencer UI: timeline grid, clip thumbnails, piano roll, playhead, and BPM panel.
    const drawFrame = defineProcedure(
      [procedureLabel('draw frame')],
      () => {
        eraseAll()

        drawRect(-250, -190, 250, 190, '#0b121c')

        drawHorizontal(
          TIMELINE_LEFT,
          TIMELINE_RIGHT,
          (TIMELINE_TOP + TIMELINE_BOTTOM) / 2,
          TIMELINE_TOP - TIMELINE_BOTTOM,
          '#151b24',
        )
        drawHorizontal(
          ROLL_LEFT,
          ROLL_RIGHT,
          (ROLL_TOP + ROLL_BOTTOM) / 2,
          ROLL_TOP - ROLL_BOTTOM,
          '#0f1520',
        )

        drawHorizontal(
          TIMELINE_LEFT,
          TIMELINE_RIGHT,
          TIMELINE_BOTTOM,
          2,
          '#3b4556',
        )
        drawHorizontal(
          TIMELINE_LEFT,
          TIMELINE_RIGHT,
          TIMELINE_TOP,
          2,
          '#3b4556',
        )
        drawVertical(TIMELINE_LEFT, TIMELINE_TOP, TIMELINE_BOTTOM, 2, '#3b4556')
        drawVertical(
          TIMELINE_RIGHT,
          TIMELINE_TOP,
          TIMELINE_BOTTOM,
          2,
          '#3b4556',
        )

        forEach(loopTrack, add(TRACK_VIEW_ROWS, 1), () => {
          setVariableTo(
            workY,
            subtract(
              TIMELINE_TOP,
              multiply(subtract(loopTrack.get(), 1), TRACK_HEIGHT),
            ),
          )
          drawHorizontal(
            TIMELINE_LEFT,
            TIMELINE_RIGHT,
            workY.get(),
            1,
            '#2a3343',
          )
        })

        forEach(loopStep, TIMELINE_STEPS + 1, () => {
          setVariableTo(
            workX1,
            add(
              TIMELINE_LEFT,
              multiply(subtract(loopStep.get(), 1), TIMELINE_STEP_W),
            ),
          )
          setVariableTo(
            workIndex,
            add(timelineScrollBeat.get(), subtract(loopStep.get(), 1)),
          )
          ifElse(
            equals(mod(subtract(workIndex.get(), 1), BEATS_PER_BAR), 0),
            () => {
              drawVertical(
                workX1.get(),
                TIMELINE_TOP,
                TIMELINE_BOTTOM,
                2,
                '#4f5b70',
              )
              setVariableTo(
                workStart,
                add(
                  mathop(
                    'floor',
                    divide(subtract(workIndex.get(), 1), BEATS_PER_BAR),
                  ),
                  1,
                ),
              )
              setVariableTo(workLen, mod(workStart.get(), 100))
              setVariableTo(bpmTens, mathop('floor', divide(workLen.get(), 10)))
              setVariableTo(bpmOnes, mod(workStart.get(), 10))
              setVariableTo(digitCenterY, TIMELINE_BAR_LABEL_Y)
              ifElse(
                lt(workStart.get(), 10),
                () => {
                  setVariableTo(bpmDigitCenterX, add(workX1.get(), 11))
                  setVariableTo(bpmDigitValue, bpmOnes.get())
                  callProcedure(drawTimelineDigit, {})
                },
                () => {
                  setVariableTo(bpmDigitCenterX, add(workX1.get(), 4))
                  setVariableTo(bpmDigitValue, bpmTens.get())
                  callProcedure(drawTimelineDigit, {})
                  setVariableTo(bpmDigitCenterX, add(workX1.get(), 18))
                  setVariableTo(bpmDigitValue, bpmOnes.get())
                  callProcedure(drawTimelineDigit, {})
                },
              )
            },
            () => {
              drawVertical(
                workX1.get(),
                TIMELINE_TOP,
                TIMELINE_BOTTOM,
                1,
                '#2a3343',
              )
            },
          )
        })

        drawRect(
          TIMELINE_SCROLLBAR_LEFT,
          TIMELINE_SCROLLBAR_BOTTOM,
          TIMELINE_SCROLLBAR_RIGHT,
          TIMELINE_SCROLLBAR_TOP,
          '#121a27',
        )
        setVariableTo(
          timelineScrollKnobX,
          add(
            TIMELINE_SCROLLBAR_LEFT,
            multiply(
              divide(
                subtract(timelineScrollBeat.get(), 1),
                subtract(TIMELINE_SCROLL_MAX, 1),
              ),
              subtract(
                subtract(TIMELINE_SCROLLBAR_RIGHT, TIMELINE_SCROLLBAR_LEFT),
                TIMELINE_SCROLLBAR_KNOB_W,
              ),
            ),
          ),
        )
        drawRect(
          timelineScrollKnobX.get(),
          TIMELINE_SCROLLBAR_BOTTOM + 1,
          add(timelineScrollKnobX.get(), TIMELINE_SCROLLBAR_KNOB_W),
          TIMELINE_SCROLLBAR_TOP - 1,
          '#f8fafc',
        )

        setVariableTo(
          visibleEventStart,
          add(
            mathop(
              'floor',
              divide(subtract(timelineScrollBeat.get(), 1), CLIP_BEATS),
            ),
            1,
          ),
        )
        setVariableTo(
          visibleEventEnd,
          add(
            mathop(
              'floor',
              divide(
                add(
                  subtract(timelineScrollBeat.get(), 1),
                  subtract(TIMELINE_STEPS, 1),
                ),
                CLIP_BEATS,
              ),
            ),
            1,
          ),
        )
        ifThen(lt(visibleEventStart.get(), 1), () => {
          setVariableTo(visibleEventStart, 1)
        })
        ifThen(gt(visibleEventEnd.get(), EVENTS_PER_TRACK), () => {
          setVariableTo(visibleEventEnd, EVENTS_PER_TRACK)
        })
        setVariableTo(
          visibleEventCount,
          add(subtract(visibleEventEnd.get(), visibleEventStart.get()), 1),
        )
        ifThen(lt(visibleEventCount.get(), 1), () => {
          setVariableTo(visibleEventCount, 1)
        })

        forEach(loopTrack, TRACK_VIEW_ROWS, () => {
          setVariableTo(
            visibleTrack,
            add(trackViewOffset.get(), subtract(loopTrack.get(), 1)),
          )
          ifThen(lt(visibleTrack.get(), add(trackTotal.get(), 1)), () => {
            forEach(loopEvent, visibleEventCount.get(), () => {
              setVariableTo(
                workIndex,
                add(visibleEventStart.get(), subtract(loopEvent.get(), 1)),
              )
              setVariableTo(
                workClip,
                clipIndex(visibleTrack.get(), workIndex.get()),
              )
              setVariableTo(
                workStart,
                getItemOfList(clipStarts, workClip.get()),
              )
              setVariableTo(workLen, getItemOfList(clipLengths, workClip.get()))

              setVariableTo(
                workX1,
                add(
                  TIMELINE_LEFT,
                  multiply(
                    subtract(workStart.get(), timelineScrollBeat.get()),
                    TIMELINE_STEP_W,
                  ),
                ),
              )
              setVariableTo(
                workX2,
                subtract(
                  add(workX1.get(), multiply(workLen.get(), TIMELINE_STEP_W)),
                  1,
                ),
              )
              setVariableTo(workY, trackCenterY(loopTrack.get()))

              setVariableTo(clipBodySize, TRACK_HEIGHT - 12)
              setVariableTo(
                clipFillColor,
                getItemOfList(trackColors, visibleTrack.get()),
              )
              setVariableTo(clipPreviewColor, '#101822')

              ifThen(
                and(
                  equals(visibleTrack.get(), selectedTrack.get()),
                  equals(workIndex.get(), selectedEvent.get()),
                ),
                () => {
                  setVariableTo(clipBodySize, TRACK_HEIGHT - 8)
                  setVariableTo(clipFillColor, '#ffb703')
                  setVariableTo(clipPreviewColor, '#2a1900')
                },
              )

              ifThen(
                and(
                  gt(add(workX2.get(), 1), TIMELINE_LEFT),
                  lt(subtract(workX1.get(), 1), TIMELINE_RIGHT),
                ),
                () => {
                  ifThen(lt(workX1.get(), TIMELINE_LEFT), () => {
                    setVariableTo(workX1, TIMELINE_LEFT)
                  })
                  ifThen(gt(workX2.get(), TIMELINE_RIGHT), () => {
                    setVariableTo(workX2, TIMELINE_RIGHT)
                  })

                  drawHorizontal(
                    workX1.get(),
                    workX2.get(),
                    workY.get(),
                    clipBodySize.get(),
                    clipFillColor.get(),
                  )

                  setVariableTo(
                    rectHalfLow,
                    mathop('floor', divide(subtract(clipBodySize.get(), 1), 2)),
                  )
                  setVariableTo(
                    rectHalfHigh,
                    mathop('floor', divide(clipBodySize.get(), 2)),
                  )
                  setVariableTo(clipTopY, add(workY.get(), rectHalfHigh.get()))
                  setVariableTo(
                    clipBottomY,
                    subtract(workY.get(), rectHalfLow.get()),
                  )
                  setVariableTo(
                    previewStepWidth,
                    divide(
                      add(subtract(workX2.get(), workX1.get()), 1),
                      ROLL_STEPS,
                    ),
                  )
                  setVariableTo(
                    previewLaneHeight,
                    divide(
                      subtract(
                        subtract(clipTopY.get(), 2),
                        add(clipBottomY.get(), 2),
                      ),
                      PREVIEW_ROWS,
                    ),
                  )

                  forEach(previewPitchRow, PREVIEW_ROWS, () => {
                    setVariableTo(
                      previewPitchA,
                      add(multiply(subtract(previewPitchRow.get(), 1), 2), 1),
                    )
                    setVariableTo(previewPitchB, add(previewPitchA.get(), 1))
                    setVariableTo(
                      previewYTop,
                      mathop(
                        'floor',
                        subtract(
                          subtract(clipTopY.get(), 2),
                          multiply(
                            subtract(previewPitchRow.get(), 1),
                            previewLaneHeight.get(),
                          ),
                        ),
                      ),
                    )
                    setVariableTo(
                      previewYBottom,
                      mathop(
                        'floor',
                        add(
                          subtract(previewYTop.get(), previewLaneHeight.get()),
                          1,
                        ),
                      ),
                    )

                    forEach(previewStep, ROLL_STEPS, () => {
                      setVariableTo(
                        previewXLeft,
                        mathop(
                          'floor',
                          add(
                            workX1.get(),
                            multiply(
                              subtract(previewStep.get(), 1),
                              previewStepWidth.get(),
                            ),
                          ),
                        ),
                      )
                      setVariableTo(
                        previewXRight,
                        mathop(
                          'floor',
                          subtract(
                            add(
                              workX1.get(),
                              multiply(
                                previewStep.get(),
                                previewStepWidth.get(),
                              ),
                            ),
                            1,
                          ),
                        ),
                      )
                      setVariableTo(
                        previewNoteIndexA,
                        noteIndex(
                          workClip.get(),
                          previewStep.get(),
                          previewPitchA.get(),
                        ),
                      )
                      setVariableTo(
                        previewNoteIndexB,
                        noteIndex(
                          workClip.get(),
                          previewStep.get(),
                          previewPitchB.get(),
                        ),
                      )

                      ifThen(
                        or(
                          gt(
                            getItemOfList(midiNotes, previewNoteIndexA.get()),
                            0,
                          ),
                          gt(
                            getItemOfList(midiNotes, previewNoteIndexB.get()),
                            0,
                          ),
                        ),
                        () => {
                          drawRect(
                            add(previewXLeft.get(), 1),
                            previewYBottom.get(),
                            subtract(previewXRight.get(), 1),
                            previewYTop.get(),
                            clipPreviewColor.get(),
                          )
                        },
                      )
                    })
                  })
                },
              )
            })
          })
        })

        forEach(loopPitch, rollVisibleCount.get(), () => {
          setVariableTo(
            workY,
            subtract(
              ROLL_TOP,
              multiply(subtract(loopPitch.get(), 1), rollCellH.get()),
            ),
          )
          setVariableTo(
            rollVisiblePitch,
            add(rollPitchOffset.get(), subtract(loopPitch.get(), 1)),
          )
          setVariableTo(
            rollSemitone,
            mod(add(48, subtract(ROLL_PITCHES, rollVisiblePitch.get())), 12),
          )

          ifElse(
            listContainsItem(blackKeySemitones, rollSemitone.get()),
            () => {
              drawRect(
                ROLL_LEFT,
                subtract(workY.get(), subtract(rollCellH.get(), 1)),
                ROLL_GRID_LEFT - 1,
                workY.get(),
                '#1f2a3a',
              )
              drawRect(
                ROLL_GRID_LEFT,
                subtract(workY.get(), subtract(rollCellH.get(), 1)),
                ROLL_GRID_RIGHT,
                workY.get(),
                '#152332',
              )
            },
            () => {
              ifElse(
                equals(mod(subtract(rollVisiblePitch.get(), 1), 2), 0),
                () => {
                  drawRect(
                    ROLL_LEFT,
                    subtract(workY.get(), subtract(rollCellH.get(), 1)),
                    ROLL_GRID_LEFT - 1,
                    workY.get(),
                    '#d7e2f5',
                  )
                },
                () => {
                  drawRect(
                    ROLL_LEFT,
                    subtract(workY.get(), subtract(rollCellH.get(), 1)),
                    ROLL_GRID_LEFT - 1,
                    workY.get(),
                    '#c4d2eb',
                  )
                },
              )
              drawRect(
                ROLL_GRID_LEFT,
                subtract(workY.get(), subtract(rollCellH.get(), 1)),
                ROLL_GRID_RIGHT,
                workY.get(),
                '#1a2b40',
              )
            },
          )

          ifThen(equals(rollSemitone.get(), 0), () => {
            drawHorizontal(
              ROLL_LEFT + 2,
              ROLL_GRID_LEFT - 3,
              subtract(workY.get(), divide(rollCellH.get(), 2)),
              1,
              '#f77f00',
            )
          })
        })

        drawVertical(ROLL_GRID_LEFT, ROLL_TOP, ROLL_BOTTOM, 2, '#2f3a4e')

        forEach(loopStep, ROLL_STEPS + 1, () => {
          setVariableTo(
            workX1,
            add(
              ROLL_GRID_LEFT,
              multiply(subtract(loopStep.get(), 1), ROLL_CELL_W),
            ),
          )
          ifThen(
            equals(mod(subtract(loopStep.get(), 1), quantizeTicks.get()), 0),
            () => {
              ifElse(
                equals(mod(subtract(loopStep.get(), 1), NOTE_LEN_4TH), 0),
                () => {
                  drawVertical(
                    workX1.get(),
                    ROLL_TOP,
                    ROLL_BOTTOM,
                    2,
                    '#4b6078',
                  )
                },
                () => {
                  drawVertical(
                    workX1.get(),
                    ROLL_TOP,
                    ROLL_BOTTOM,
                    1,
                    '#324458',
                  )
                },
              )
            },
          )
        })

        forEach(loopPitch, add(rollVisibleCount.get(), 1), () => {
          setVariableTo(
            workY,
            subtract(
              ROLL_TOP,
              multiply(subtract(loopPitch.get(), 1), rollCellH.get()),
            ),
          )
          setVariableTo(
            rollVisiblePitch,
            add(rollPitchOffset.get(), subtract(loopPitch.get(), 1)),
          )
          ifElse(
            equals(mod(subtract(rollVisiblePitch.get(), 1), 3), 0),
            () => {
              drawHorizontal(
                ROLL_GRID_LEFT,
                ROLL_GRID_RIGHT,
                workY.get(),
                2,
                '#3c4f66',
              )
            },
            () => {
              drawHorizontal(
                ROLL_GRID_LEFT,
                ROLL_GRID_RIGHT,
                workY.get(),
                1,
                '#223042',
              )
            },
          )
        })

        drawRect(
          ROLL_SCROLL_LEFT,
          ROLL_BOTTOM,
          ROLL_SCROLL_RIGHT,
          ROLL_TOP,
          '#152132',
        )
        drawVertical(ROLL_SCROLL_LEFT, ROLL_TOP, ROLL_BOTTOM, 2, '#2f3a4e')
        drawVertical(ROLL_SCROLL_RIGHT, ROLL_TOP, ROLL_BOTTOM, 2, '#2f3a4e')
        ifElse(
          gt(rollScrollMax.get(), 1),
          () => {
            setVariableTo(
              rollScrollKnobY,
              subtract(
                subtract(ROLL_TOP, 6),
                multiply(
                  divide(
                    subtract(rollPitchOffset.get(), 1),
                    subtract(rollScrollMax.get(), 1),
                  ),
                  subtract(subtract(ROLL_TOP, ROLL_BOTTOM), 12),
                ),
              ),
            )
          },
          () => {
            setVariableTo(rollScrollKnobY, subtract(ROLL_TOP, 6))
          },
        )
        drawRect(
          ROLL_SCROLL_LEFT + 1,
          subtract(rollScrollKnobY.get(), 6),
          ROLL_SCROLL_RIGHT - 1,
          add(rollScrollKnobY.get(), 6),
          '#f8fafc',
        )

        drawRect(
          LENGTH_PANEL_LEFT,
          LENGTH_PANEL_BOTTOM,
          LENGTH_PANEL_RIGHT,
          LENGTH_PANEL_TOP,
          '#101823',
        )
        drawHorizontal(
          LENGTH_PANEL_LEFT,
          LENGTH_PANEL_RIGHT,
          LENGTH_PANEL_TOP,
          2,
          '#3b4556',
        )
        drawHorizontal(
          LENGTH_PANEL_LEFT,
          LENGTH_PANEL_RIGHT,
          LENGTH_PANEL_BOTTOM,
          2,
          '#3b4556',
        )
        drawVertical(
          LENGTH_PANEL_LEFT,
          LENGTH_PANEL_TOP,
          LENGTH_PANEL_BOTTOM,
          2,
          '#3b4556',
        )
        drawVertical(
          LENGTH_PANEL_RIGHT,
          LENGTH_PANEL_TOP,
          LENGTH_PANEL_BOTTOM,
          2,
          '#3b4556',
        )
        drawHorizontal(
          LENGTH_PANEL_LEFT + 2,
          LENGTH_PANEL_RIGHT - 2,
          32,
          1,
          '#2a3343',
        )
        drawRect(
          LENGTH_PANEL_LEFT + 3,
          34,
          LENGTH_PANEL_RIGHT - 3,
          55,
          '#1a2432',
        )
        drawRect(
          LENGTH_PANEL_LEFT + 3,
          8,
          LENGTH_PANEL_RIGHT - 3,
          30,
          '#1a2432',
        )

        drawRect(
          LENGTH_QUANT_BTN_LEFT,
          LENGTH_QUANT_BTN_BOTTOM,
          LENGTH_QUANT_BTN_RIGHT,
          LENGTH_QUANT_BTN_TOP,
          '#223042',
        )
        drawRect(
          LENGTH_QUANT_BTN2_LEFT,
          LENGTH_QUANT_BTN_BOTTOM,
          LENGTH_QUANT_BTN2_RIGHT,
          LENGTH_QUANT_BTN_TOP,
          '#223042',
        )
        drawRect(
          LENGTH_QUANT_BTN_LEFT,
          LENGTH_MULT_BTN_BOTTOM,
          LENGTH_QUANT_BTN_RIGHT,
          LENGTH_MULT_BTN_TOP,
          '#223042',
        )
        drawRect(
          LENGTH_QUANT_BTN2_LEFT,
          LENGTH_MULT_BTN_BOTTOM,
          LENGTH_QUANT_BTN2_RIGHT,
          LENGTH_MULT_BTN_TOP,
          '#223042',
        )

        drawHorizontal(
          LENGTH_QUANT_BTN_LEFT + 2,
          LENGTH_QUANT_BTN_RIGHT - 2,
          divide(add(LENGTH_QUANT_BTN_TOP, LENGTH_QUANT_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawHorizontal(
          LENGTH_QUANT_BTN2_LEFT + 2,
          LENGTH_QUANT_BTN2_RIGHT - 2,
          divide(add(LENGTH_QUANT_BTN_TOP, LENGTH_QUANT_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawVertical(
          divide(add(LENGTH_QUANT_BTN2_LEFT, LENGTH_QUANT_BTN2_RIGHT), 2),
          LENGTH_QUANT_BTN_TOP - 2,
          LENGTH_QUANT_BTN_BOTTOM + 2,
          1,
          '#f8fafc',
        )

        drawHorizontal(
          LENGTH_QUANT_BTN_LEFT + 2,
          LENGTH_QUANT_BTN_RIGHT - 2,
          divide(add(LENGTH_MULT_BTN_TOP, LENGTH_MULT_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawHorizontal(
          LENGTH_QUANT_BTN2_LEFT + 2,
          LENGTH_QUANT_BTN2_RIGHT - 2,
          divide(add(LENGTH_MULT_BTN_TOP, LENGTH_MULT_BTN_BOTTOM), 2),
          1,
          '#f8fafc',
        )
        drawVertical(
          divide(add(LENGTH_QUANT_BTN2_LEFT, LENGTH_QUANT_BTN2_RIGHT), 2),
          LENGTH_MULT_BTN_TOP - 2,
          LENGTH_MULT_BTN_BOTTOM + 2,
          1,
          '#f8fafc',
        )

        setVariableTo(
          quantizeTens,
          mathop('floor', divide(quantizeDisplayValue.get(), 10)),
        )
        setVariableTo(quantizeOnes, mod(quantizeDisplayValue.get(), 10))
        ifThen(lt(quantizeDisplayValue.get(), 10), () => {
          setVariableTo(quantizeTens, -1)
        })
        setVariableTo(digitCenterY, LENGTH_QUANT_DIGIT_Y)
        setVariableTo(bpmDigitCenterX, LENGTH_DIGIT_X1)
        setVariableTo(bpmDigitValue, quantizeTens.get())
        callProcedure(drawBpmDigit, {})
        setVariableTo(bpmDigitCenterX, LENGTH_DIGIT_X2)
        setVariableTo(bpmDigitValue, quantizeOnes.get())
        callProcedure(drawBpmDigit, {})

        setVariableTo(
          multiplierTens,
          mathop('floor', divide(noteLengthMultiplier.get(), 10)),
        )
        setVariableTo(multiplierOnes, mod(noteLengthMultiplier.get(), 10))
        ifThen(lt(noteLengthMultiplier.get(), 10), () => {
          setVariableTo(multiplierTens, -1)
        })
        setVariableTo(digitCenterY, LENGTH_MULT_DIGIT_Y)
        setVariableTo(bpmDigitCenterX, LENGTH_DIGIT_X1)
        setVariableTo(bpmDigitValue, multiplierTens.get())
        callProcedure(drawBpmDigit, {})
        setVariableTo(bpmDigitCenterX, LENGTH_DIGIT_X2)
        setVariableTo(bpmDigitValue, multiplierOnes.get())
        callProcedure(drawBpmDigit, {})

        setVariableTo(textRenderScale, 1)
        setVariableTo(textRenderColor, '#9fb3c8')
        setVariableTo(textRenderValue, join('Q ', quantizeLabelText.get()))
        setVariableTo(textRenderX, LENGTH_PANEL_LEFT + 5)
        setVariableTo(textRenderY, LENGTH_PANEL_TOP - 1)
        callProcedure(drawPixelText, {})

        setVariableTo(
          textRenderValue,
          join('MUL X', noteLengthMultiplier.get()),
        )
        setVariableTo(textRenderX, LENGTH_PANEL_LEFT + 5)
        setVariableTo(textRenderY, 31)
        callProcedure(drawPixelText, {})

        ifElse(
          equals(isPlaying.get(), 1),
          () => {
            setVariableTo(workIndex, playheadDisplayStep.get())
          },
          () => {
            setVariableTo(workIndex, playheadStep.get())
          },
        )
        setVariableTo(
          playheadTimelineStep,
          add(
            mathop(
              'floor',
              divide(subtract(workIndex.get(), 1), STEPS_PER_BEAT),
            ),
            1,
          ),
        )
        setVariableTo(
          playheadStepInBeat,
          add(mod(subtract(workIndex.get(), 1), STEPS_PER_BEAT), 1),
        )

        setVariableTo(
          workStart,
          add(
            subtract(playheadTimelineStep.get(), timelineScrollBeat.get()),
            1,
          ),
        )
        ifThen(
          and(
            gt(workStart.get(), 0),
            lt(workStart.get(), add(TIMELINE_STEPS, 1)),
          ),
          () => {
            setVariableTo(
              workX1,
              mathop(
                'floor',
                add(
                  TIMELINE_LEFT,
                  multiply(subtract(workStart.get(), 0.5), TIMELINE_STEP_W),
                ),
              ),
            )
            drawRect(
              workX1.get(),
              TIMELINE_BOTTOM,
              add(workX1.get(), 1),
              TIMELINE_TOP,
              '#ff3b30',
            )
          },
        )

        setVariableTo(
          workClip,
          clipIndex(selectedTrack.get(), selectedEvent.get()),
        )
        setVariableTo(
          selectedClipStart,
          getItemOfList(clipStarts, workClip.get()),
        )
        setVariableTo(
          selectedClipLen,
          getItemOfList(clipLengths, workClip.get()),
        )
        ifThen(
          and(
            gt(
              playheadTimelineStep.get(),
              subtract(selectedClipStart.get(), 1),
            ),
            lt(
              playheadTimelineStep.get(),
              add(selectedClipStart.get(), selectedClipLen.get()),
            ),
          ),
          () => {
            setVariableTo(
              selectedClipBeat,
              add(
                subtract(playheadTimelineStep.get(), selectedClipStart.get()),
                1,
              ),
            )
            setVariableTo(
              rollPlayheadStep,
              add(
                multiply(subtract(selectedClipBeat.get(), 1), STEPS_PER_BEAT),
                playheadStepInBeat.get(),
              ),
            )

            ifThen(
              and(
                gt(rollPlayheadStep.get(), 0),
                lt(rollPlayheadStep.get(), add(ROLL_STEPS, 1)),
              ),
              () => {
                setVariableTo(
                  workX1,
                  mathop(
                    'floor',
                    add(
                      ROLL_GRID_LEFT,
                      multiply(
                        subtract(rollPlayheadStep.get(), 0.5),
                        ROLL_CELL_W,
                      ),
                    ),
                  ),
                )
                drawRect(
                  workX1.get(),
                  ROLL_BOTTOM,
                  add(workX1.get(), 1),
                  ROLL_TOP,
                  '#ff3b30',
                )
              },
            )
          },
        )

        forEach(loopPitch, rollVisibleCount.get(), () => {
          setVariableTo(
            rollVisiblePitch,
            add(rollPitchOffset.get(), subtract(loopPitch.get(), 1)),
          )

          forEach(loopStep, ROLL_STEPS, () => {
            setVariableTo(
              workIndex,
              noteIndex(workClip.get(), loopStep.get(), rollVisiblePitch.get()),
            )
            setVariableTo(
              noteLengthCellValue,
              getItemOfList(midiNotes, workIndex.get()),
            )

            ifThen(gt(noteLengthCellValue.get(), 0), () => {
              setVariableTo(
                noteLengthPreviewW,
                divide(
                  multiply(noteLengthCellValue.get(), ROLL_CELL_W),
                  NOTE_STEP_TICKS,
                ),
              )
              setVariableTo(workX1, add(cellTopLeftX(loopStep.get()), 2))
              setVariableTo(
                workX2,
                subtract(
                  add(cellTopLeftX(loopStep.get()), noteLengthPreviewW.get()),
                  2,
                ),
              )
              setVariableTo(workY, cellCenterY(loopPitch.get()))

              drawHorizontal(
                workX1.get(),
                workX2.get(),
                workY.get(),
                subtract(rollCellH.get(), 4),
                '#00a8ff',
              )
            })
          })
        })

        drawHorizontal(
          ROLL_LEFT,
          ROLL_RIGHT,
          ROLL_TOP,
          2,
          getItemOfList(trackColors, selectedTrack.get()),
        )
        drawHorizontal(
          ROLL_LEFT,
          ROLL_RIGHT,
          ROLL_BOTTOM,
          2,
          getItemOfList(trackColors, selectedTrack.get()),
        )
        drawVertical(
          ROLL_LEFT,
          ROLL_TOP,
          ROLL_BOTTOM,
          2,
          getItemOfList(trackColors, selectedTrack.get()),
        )
        drawVertical(
          ROLL_RIGHT,
          ROLL_TOP,
          ROLL_BOTTOM,
          2,
          getItemOfList(trackColors, selectedTrack.get()),
        )

        callProcedure(drawBpmPanel, {})
        callProcedure(drawTrackPanel, {})
        callProcedure(drawZoomPanel, {})
        ifThen(equals(instrumentModalOpen.get(), 1), () => {
          callProcedure(drawInstrumentModal, {})
        })
      },
      true,
    )

    // Main animation loop: handle UI input, advance audio state, and repaint the UI.
    forever(() => {
      callProcedure(syncRollView, {})
      callProcedure(syncTrackWindow, {})
      ifElse(
        equals(instrumentModalOpen.get(), 0),
        () => {
          callProcedure(handleBpmInput, {})
          callProcedure(handleRollScrollInput, {})
          callProcedure(handleTimelineScrollInput, {})
        },
        () => {
          setVariableTo(bpmSliderDragging, 0)
          setVariableTo(rollScrollDragging, 0)
          setVariableTo(timelineScrollDragging, 0)
        },
      )
      callProcedure(syncQuantizeSettings, {})
      callProcedure(handleInput, {})
      callProcedure(syncRollView, {})
      callProcedure(syncTrackWindow, {})
      callProcedure(syncQuantizeSettings, {})
      callProcedure(syncTempo, {})
      callProcedure(advancePlayhead, {})
      callProcedure(drawFrame, {})
    })
  })

  // Each audio clone plays a single note then kills itself to avoid leaking sprites.
  controlStartAsClone(() => {
    setVolumeTo(audioVelocity.get())
    ifElse(
      equals(audioInstrument.get(), TRACK_DRUM_INSTRUMENT),
      () => {
        midiPlayDrumForBeats(audioNoteToPlay.get(), audioNoteBeats.get())
      },
      () => {
        midiSetInstrument(audioInstrument.get())
        playNoteForBeats(audioNoteToPlay.get(), audioNoteBeats.get())
      },
    )
    deleteThisClone()
  })
})

export default project
