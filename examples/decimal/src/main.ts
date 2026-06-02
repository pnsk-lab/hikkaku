import { type ListReference, Project, type VariableReference } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
import {
  add,
  addToList,
  and,
  askAndWait,
  callProcedure,
  changeVariableBy,
  changeXBy,
  contains,
  defineProcedure,
  deleteAllOfList,
  deleteOfList,
  divide,
  equals,
  eraseAll,
  getAnswer,
  getItemNumOfList,
  getItemOfList,
  getTimer,
  getVariable,
  gotoXY,
  gt,
  hide,
  ifElse,
  ifThen,
  insertAtList,
  join,
  length,
  lengthOfList,
  letterOf,
  lt,
  mathop,
  mod,
  multiply,
  not,
  or,
  penDown,
  penUp,
  procedureLabel,
  procedureStringOrNumber,
  repeatUntil,
  replaceItemOfList,
  resetTimer,
  round,
  setPenColorTo,
  setPenSizeTo,
  setVariableTo,
  subtract,
  wait,
  whenFlagClicked,
  whenKeyPressed,
} from 'hikkaku/blocks'

const BASE = 10000000
const CHUNK_WIDTH = 7
const DIGITS = '0123456789'
const CHUDNOVSKY_C3_OVER_24 = '10939058860032000'
const CHUDNOVSKY_DIGITS_PER_TERM = 14
const CHUDNOVSKY_SPLIT_PROCCODE = 'binary split chudnovsky %s %s'
const SQRT10005_MAX_SCALE = 50000
const integerSquareRoot = (value: bigint) => {
  if (value < 2n) return value
  let current = 1n << BigInt(Math.ceil(value.toString(2).length / 2))
  let next = (current + value / current) >> 1n
  while (next < current) {
    current = next
    next = (current + value / current) >> 1n
  }
  return current
}
const createSqrt10005ScaledDigits = (scale: number) => {
  return integerSquareRoot(10005n * 10n ** BigInt(scale * 2)).toString()
}
const SQRT10005_SCALED_DIGITS = createSqrt10005ScaledDigits(SQRT10005_MAX_SCALE)
const FONT_RAW: Record<string, string> = {
  A: '01100' + '10010' + '10010' + '11110' + '10010' + '10010' + '10010',
  B: '11100' + '10010' + '10010' + '11100' + '10010' + '10010' + '11100',
  C: '01110' + '10000' + '10000' + '10000' + '10000' + '10000' + '01110',
  D: '11100' + '10010' + '10010' + '10010' + '10010' + '10010' + '11100',
  E: '11110' + '10000' + '10000' + '11100' + '10000' + '10000' + '11110',
  F: '11110' + '10000' + '10000' + '11100' + '10000' + '10000' + '10000',
  G: '01110' + '10000' + '10000' + '10110' + '10010' + '10010' + '01100',
  H: '10010' + '10010' + '10010' + '11110' + '10010' + '10010' + '10010',
  I: '01110' + '00100' + '00100' + '00100' + '00100' + '00100' + '01110',
  J: '00110' + '00010' + '00010' + '00010' + '00010' + '10010' + '01100',
  K: '10010' + '10100' + '11000' + '10100' + '10010' + '10010' + '10010',
  L: '10000' + '10000' + '10000' + '10000' + '10000' + '10000' + '11110',
  M: '10001' + '11011' + '10101' + '10001' + '10001' + '10001' + '10001',
  N: '10001' + '11001' + '10101' + '10011' + '10001' + '10001' + '10001',
  O: '01100' + '10010' + '10010' + '10010' + '10010' + '10010' + '01100',
  P: '11100' + '10010' + '10010' + '11100' + '10000' + '10000' + '10000',
  Q: '01100' + '10010' + '10010' + '10010' + '10110' + '01100' + '00010',
  R: '11100' + '10010' + '10010' + '11100' + '10100' + '10010' + '10010',
  S: '01110' + '10000' + '10000' + '01100' + '00010' + '00010' + '11100',
  T: '11111' + '00100' + '00100' + '00100' + '00100' + '00100' + '00100',
  U: '10010' + '10010' + '10010' + '10010' + '10010' + '10010' + '01100',
  V: '10001' + '10001' + '10001' + '01010' + '01010' + '00100' + '00100',
  W: '10001' + '10001' + '10001' + '10101' + '10101' + '01010' + '01010',
  X: '10001' + '01010' + '00100' + '00100' + '01010' + '10001' + '10001',
  Y: '10001' + '01010' + '00100' + '00100' + '00100' + '00100' + '00100',
  Z: '11111' + '00001' + '00010' + '00100' + '01000' + '10000' + '11111',
  '0': '01100' + '10010' + '10010' + '10010' + '10010' + '10010' + '01100',
  '1': '00100' + '01100' + '00100' + '00100' + '00100' + '00100' + '01110',
  '2': '01100' + '10010' + '00010' + '00100' + '01000' + '10000' + '11110',
  '3': '01100' + '10010' + '00010' + '00100' + '00010' + '10010' + '01100',
  '4': '00010' + '00110' + '01010' + '10010' + '11110' + '00010' + '00010',
  '5': '11110' + '10000' + '11100' + '00010' + '00010' + '10010' + '01100',
  '6': '01100' + '10000' + '10000' + '11100' + '10010' + '10010' + '01100',
  '7': '11110' + '00010' + '00100' + '01000' + '01000' + '01000' + '01000',
  '8': '01100' + '10010' + '10010' + '01100' + '10010' + '10010' + '01100',
  '9': '01100' + '10010' + '10010' + '01110' + '00010' + '00100' + '01000',
  ' ': '00000' + '00000' + '00000' + '00000' + '00000' + '00000' + '00000',
  '.': '00000' + '00000' + '00000' + '00000' + '00000' + '01100' + '01100',
  '-': '00000' + '00000' + '00000' + '11110' + '00000' + '00000' + '00000',
  ':': '00000' + '01100' + '01100' + '00000' + '01100' + '01100' + '00000',
  '/': '00001' + '00010' + '00010' + '00100' + '01000' + '01000' + '10000',
  '=': '00000' + '00000' + '11110' + '00000' + '11110' + '00000' + '00000',
  '+': '00000' + '00100' + '00100' + '11111' + '00100' + '00100' + '00000',
  '*': '00000' + '00100' + '10101' + '01110' + '10101' + '00100' + '00000',
  ',': '00000' + '00000' + '00000' + '00000' + '01100' + '00100' + '01000',
  '(': '00010' + '00100' + '00100' + '00100' + '00100' + '00100' + '00010',
  ')': '01000' + '00100' + '00100' + '00100' + '00100' + '00100' + '01000',
  '?': '01100' + '10010' + '00010' + '00100' + '00100' + '00000' + '00100',
  '!': '00100' + '00100' + '00100' + '00100' + '00100' + '00000' + '00100',
  '|': '00100' + '00100' + '00100' + '00100' + '00100' + '00100' + '00100',
}
const UPPER_FONT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const SYMBOL_FONT_CHARS = '0123456789 .-:/=+*,()?!|'
const FONT_CHARS =
  `${UPPER_FONT_CHARS}${UPPER_FONT_CHARS.toLowerCase()}${SYMBOL_FONT_CHARS}`.split(
    '',
  )
const BOX_FONT =
  '11111' + '10001' + '10001' + '10001' + '10001' + '10001' + '11111'
const FONT_STRINGS = [
  ...UPPER_FONT_CHARS.split('').map((char) => FONT_RAW[char] ?? BOX_FONT),
  ...UPPER_FONT_CHARS.split('').map((char) => FONT_RAW[char] ?? BOX_FONT),
  ...SYMBOL_FONT_CHARS.split('').map((char) => FONT_RAW[char] ?? BOX_FONT),
  BOX_FONT,
]

const project = new Project()
const renderer = project.createSprite('decimal-renderer')
renderer.addCostume({ ...IMAGES.BLANK_SVG, name: 'blank' })
const stage = renderer

const read = (variable: VariableReference) => getVariable(variable)

const description = stage.createVariable(
  'description',
  'Pi digit calculator for V8 Scratch runtimes: Chudnovsky formula with binary splitting.',
  {
    monitor: {
      mode: 'large',
      visible: false,
      x: 10,
      y: 10,
    },
  },
)

const leftInput = stage.createVariable(
  'left',
  '314159265358979323846264338327950288.4197169399375105820974944592',
  {
    monitor: {
      mode: 'default',
      visible: false,
      x: 10,
      y: 70,
    },
  },
)

const operation = stage.createVariable('op', '*', {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 100,
  },
})

const rightInput = stage.createVariable(
  'right',
  '271828182845904523536028747135266.2497757247093699959574966967627',
  {
    monitor: {
      mode: 'default',
      visible: false,
      x: 10,
      y: 130,
    },
  },
)

const result = stage.createVariable('result', '', {
  monitor: {
    mode: 'large',
    visible: false,
    x: 10,
    y: 170,
  },
})

const remainder = stage.createVariable('remainder', '', {
  monitor: {
    mode: 'large',
    visible: false,
    x: 10,
    y: 230,
  },
})

const status = stage.createVariable('status', 'Ready', {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 290,
  },
})

const elapsedMs = stage.createVariable('elapsedMs', 0, {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 320,
  },
})

const avgMs = stage.createVariable('avgMs', 0, {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 350,
  },
})

const leftDigitsView = stage.createVariable('leftDigits', 0, {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 380,
  },
})

const rightDigitsView = stage.createVariable('rightDigits', 0, {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 410,
  },
})

const resultDigitsView = stage.createVariable('resultDigits', 0, {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 440,
  },
})

const benchmarkMode = stage.createVariable('benchmarkMode', 'pi', {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 470,
  },
})

const divisionPrecision = stage.createVariable('divisionPrecision', 80, {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 500,
  },
})

const benchmarkDigits = stage.createVariable('benchmarkDigits', 256, {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 530,
  },
})

const benchmarkScale = stage.createVariable('benchmarkScale', 64, {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 560,
  },
})

const benchmarkRepeats = stage.createVariable('benchmarkRepeats', 3, {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 590,
  },
})

const benchmarkSeed = stage.createVariable('benchmarkSeed', 20260312, {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 620,
  },
})

const benchmarkAccuracy = stage.createVariable('benchmarkAccuracy', 'exact', {
  monitor: {
    mode: 'default',
    visible: false,
    x: 10,
    y: 650,
  },
})

const benchmarkResultDigits = stage.createVariable('benchmarkResultDigits', 0)

const benchmarkReport = stage.createVariable('benchmarkReport', '', {
  monitor: {
    mode: 'large',
    visible: false,
    x: 280,
    y: 10,
  },
})

const leftMag = stage.createVariable('leftMag', '0')
const rightMag = stage.createVariable('rightMag', '0')
const leftSign = stage.createVariable('leftSign', 1)
const rightSign = stage.createVariable('rightSign', 1)
const leftScale = stage.createVariable('leftScale', 0)
const rightScale = stage.createVariable('rightScale', 0)
const resultScale = stage.createVariable('resultScale', 0)
const effectiveRightSign = stage.createVariable('effectiveRightSign', 1)
const resultSign = stage.createVariable('resultSign', 1)
const inputValid = stage.createVariable('inputValid', 1)
const cmp = stage.createVariable('cmp', 0)
const carry = stage.createVariable('carry', 0)
const borrow = stage.createVariable('borrow', 0)
const i = stage.createVariable('i', 0)
const j = stage.createVariable('j', 0)
const k = stage.createVariable('k', 0)
const startIndex = stage.createVariable('startIndex', 0)
const value = stage.createVariable('value', 0)
const _low = stage.createVariable('low', 0)
const _high = stage.createVariable('high', 0)
const _mid = stage.createVariable('mid', 0)
const candidate = stage.createVariable('candidate', 0)
const trial = stage.createVariable('trial', 0)
const chunkText = stage.createVariable('chunkText', '')
const seenDot = stage.createVariable('seenDot', 0)
const seenDigit = stage.createVariable('seenDigit', 0)
const scaleDiff = stage.createVariable('scaleDiff', 0)
const integerDigits = stage.createVariable('integerDigits', 0)
const paddingDigits = stage.createVariable('paddingDigits', 0)
const piDigits = stage.createVariable('piDigits', 256)
const piGuardDigits = stage.createVariable('piGuardDigits', 8)
const piScaleDigits = stage.createVariable('piScaleDigits', 264)
const piScaleText = stage.createVariable('piScaleText', '1')
const piQ = stage.createVariable('piQ', 5)
const piSmallDivisor = stage.createVariable('piSmallDivisor', 5)
const piSmallMultiplier = stage.createVariable('piSmallMultiplier', 16)
const piTermIndex = stage.createVariable('piTermIndex', 1)
const piTermIsZero = stage.createVariable('piTermIsZero', 0)
const piSign = stage.createVariable('piSign', 1)
const piDisplayLimit = stage.createVariable('piDisplayLimit', 0)
const piTermLimit = stage.createVariable('piTermLimit', 0)
const piProgress = stage.createVariable('piProgress', 0)
const piPageSize = stage.createVariable('piPageSize', 1000)
const piPageIndex = stage.createVariable('piPageIndex', 1)
const piPageCount = stage.createVariable('piPageCount', 1)
const piPageStartDigit = stage.createVariable('piPageStartDigit', 1)
const piPageEndDigit = stage.createVariable('piPageEndDigit', 0)
const piPageText = stage.createVariable('piPageText', '')
const bsLoadText = stage.createVariable('bsLoadText', '')
const bsMid = stage.createVariable('bsMid', 0)
const bsTSign = stage.createVariable('bsTSign', 1)
const bsLeftTSign = stage.createVariable('bsLeftTSign', 1)
const bsASign = stage.createVariable('bsASign', 1)
const bsBSign = stage.createVariable('bsBSign', 1)
const drawTextValue = stage.createVariable('drawTextValue', '')
const drawStartX = stage.createVariable('drawStartX', -226)
const drawStartY = stage.createVariable('drawStartY', 160)
const drawSize = stage.createVariable('drawSize', 2)
const drawMaxColumns = stage.createVariable('drawMaxColumns', 42)
const drawColor = stage.createVariable('drawColor', '#f8fafc')
const drawCursorX = stage.createVariable('drawCursorX', 0)
const drawCursorY = stage.createVariable('drawCursorY', 0)
const drawColumn = stage.createVariable('drawColumn', 0)
const drawChar = stage.createVariable('drawChar', '')
const drawCharNum = stage.createVariable('drawCharNum', 0)
const drawFont = stage.createVariable('drawFont', '')
const drawRow = stage.createVariable('drawRow', 0)
const drawCol = stage.createVariable('drawCol', 0)
const drawPixelIndex = stage.createVariable('drawPixelIndex', 0)
const generatorState = stage.createVariable('generatorState', 1)
const _repeatCounter = stage.createVariable('repeatCounter', 0)
const fftSize = stage.createVariable('fftSize', 0)
const fftLen = stage.createVariable('fftLen', 0)
const fftHalf = stage.createVariable('fftHalf', 0)
const fftIndex = stage.createVariable('fftIndex', 0)
const fftJIndex = stage.createVariable('fftJIndex', 0)
const fftBit = stage.createVariable('fftBit', 0)
const fftPartner = stage.createVariable('fftPartner', 0)
const fftIndex2 = stage.createVariable('fftIndex2', 0)
const fftAngle = stage.createVariable('fftAngle', 0)
const fftInverse = stage.createVariable('fftInverse', 0)
const fftWlenReal = stage.createVariable('fftWlenReal', 0)
const fftWlenImag = stage.createVariable('fftWlenImag', 0)
const fftWReal = stage.createVariable('fftWReal', 0)
const fftWImag = stage.createVariable('fftWImag', 0)
const fftUReal = stage.createVariable('fftUReal', 0)
const fftUImag = stage.createVariable('fftUImag', 0)
const fftVReal = stage.createVariable('fftVReal', 0)
const fftVImag = stage.createVariable('fftVImag', 0)
const fftTempReal = stage.createVariable('fftTempReal', 0)
const fftTempImag = stage.createVariable('fftTempImag', 0)

const aChunks = stage.createList('aChunks')
const bChunks = stage.createList('bChunks')
const resultChunks = stage.createList('resultChunks')
const quotientChunks = stage.createList('quotientChunks')
const remainderChunks = stage.createList('remainderChunks')
const tmpChunks = stage.createList('tmpChunks')
const fftRealA = stage.createList('fftRealA')
const fftImagA = stage.createList('fftImagA')
const fftRealB = stage.createList('fftRealB')
const fftImagB = stage.createList('fftImagB')
const productDigits = stage.createList('productDigits')
const piTermChunks = stage.createList('piTermChunks')
const piWorkChunks = stage.createList('piWorkChunks')
const piScratchChunks = stage.createList('piScratchChunks')
const piSumChunks = stage.createList('piSumChunks')
const piTotalChunks = stage.createList('piTotalChunks')
const piArctanChunks = stage.createList('piArctanChunks')
const bsPChunks = stage.createList('bsPChunks')
const bsQChunks = stage.createList('bsQChunks')
const bsTChunks = stage.createList('bsTChunks')
const bsLeftPChunks = stage.createList('bsLeftPChunks')
const bsLeftQChunks = stage.createList('bsLeftQChunks')
const bsLeftTChunks = stage.createList('bsLeftTChunks')
const bsStackPChunks = stage.createList('bsStackPChunks')
const bsStackPLengths = stage.createList('bsStackPLengths')
const bsStackQChunks = stage.createList('bsStackQChunks')
const bsStackQLengths = stage.createList('bsStackQLengths')
const bsStackTChunks = stage.createList('bsStackTChunks')
const bsStackTLengths = stage.createList('bsStackTLengths')
const bsStackTSigns = stage.createList('bsStackTSigns')
const bsAChunks = stage.createList('bsAChunks')
const bsBChunks = stage.createList('bsBChunks')
const bsSqrtChunks = stage.createList('bsSqrtChunks')
const fontChars = stage.createList('fontChars', FONT_CHARS)
const fontStrings = stage.createList('fontStrings', FONT_STRINGS)

stage.run(() => {
  const defineWarp = (label: string, body: () => void) => {
    return defineProcedure(
      [procedureLabel(label)],
      () => {
        body()
        return undefined
      },
      true,
    )
  }

  const defineTrimList = (label: string, list: ListReference) => {
    return defineWarp(label, () => {
      repeatUntil(
        or(
          equals(lengthOfList(list), 1),
          not(equals(getItemOfList(list, lengthOfList(list)), 0)),
        ),
        () => {
          deleteOfList(list, lengthOfList(list))
        },
      )
    })
  }

  const trimResult = defineTrimList('trim result chunks', resultChunks)
  const trimQuotient = defineTrimList('trim quotient chunks', quotientChunks)
  const trimRemainder = defineTrimList('trim remainder chunks', remainderChunks)
  const trimTmp = defineTrimList('trim tmp chunks', tmpChunks)
  const trimA = defineTrimList('trim a chunks', aChunks)
  const trimB = defineTrimList('trim b chunks', bChunks)
  const trimProductDigits = defineTrimList('trim product digits', productDigits)
  const trimPiTerm = defineTrimList('trim pi term chunks', piTermChunks)
  const trimPiWork = defineTrimList('trim pi work chunks', piWorkChunks)
  const trimPiScratch = defineTrimList(
    'trim pi scratch chunks',
    piScratchChunks,
  )
  const trimPiSum = defineTrimList('trim pi sum chunks', piSumChunks)
  const trimPiTotal = defineTrimList('trim pi total chunks', piTotalChunks)
  const trimPiArctan = defineTrimList('trim pi arctan chunks', piArctanChunks)
  const trimBsP = defineTrimList('trim bs p chunks', bsPChunks)
  const trimBsQ = defineTrimList('trim bs q chunks', bsQChunks)
  const trimBsT = defineTrimList('trim bs t chunks', bsTChunks)
  const trimBsLeftP = defineTrimList('trim bs left p chunks', bsLeftPChunks)
  const trimBsLeftQ = defineTrimList('trim bs left q chunks', bsLeftQChunks)
  const trimBsLeftT = defineTrimList('trim bs left t chunks', bsLeftTChunks)
  const trimBsA = defineTrimList('trim bs a chunks', bsAChunks)
  const trimBsB = defineTrimList('trim bs b chunks', bsBChunks)
  const trimBsSqrt = defineTrimList('trim bs sqrt chunks', bsSqrtChunks)

  const emitCopyList = (
    source: ListReference,
    destination: ListReference,
    trimDestination: ReturnType<typeof defineWarp>,
  ) => {
    deleteAllOfList(destination)
    setVariableTo(i, 1)
    repeatUntil(gt(read(i), lengthOfList(source)), () => {
      addToList(destination, getItemOfList(source, read(i)))
      changeVariableBy(i, 1)
    })
    ifThen(equals(lengthOfList(destination), 0), () => {
      addToList(destination, 0)
    })
    callProcedure(trimDestination, {})
  }

  const emitLoadTextToList = (
    text: VariableReference,
    list: ListReference,
    trimList: ReturnType<typeof defineWarp>,
  ) => {
    deleteAllOfList(list)
    setVariableTo(i, length(read(text)))
    repeatUntil(lt(read(i), 1), () => {
      setVariableTo(startIndex, add(1, subtract(read(i), CHUNK_WIDTH)))
      ifThen(lt(read(startIndex), 1), () => {
        setVariableTo(startIndex, 1)
      })
      setVariableTo(chunkText, '')
      setVariableTo(k, read(startIndex))
      repeatUntil(gt(read(k), read(i)), () => {
        setVariableTo(
          chunkText,
          join(read(chunkText), letterOf(read(k), read(text))),
        )
        changeVariableBy(k, 1)
      })
      addToList(list, read(chunkText))
      changeVariableBy(i, -CHUNK_WIDTH)
    })
    ifThen(equals(lengthOfList(list), 0), () => {
      addToList(list, 0)
    })
    callProcedure(trimList, {})
  }

  const emitSetListToNumber = (
    list: ListReference,
    numberValue: Parameters<typeof setVariableTo>[1],
    trimList: ReturnType<typeof defineWarp>,
  ) => {
    deleteAllOfList(list)
    setVariableTo(value, numberValue)
    ifElse(
      lt(read(value), 1),
      () => {
        addToList(list, 0)
      },
      () => {
        repeatUntil(lt(read(value), 1), () => {
          addToList(list, mod(read(value), BASE))
          setVariableTo(value, mathop('floor', divide(read(value), BASE)))
        })
      },
    )
    callProcedure(trimList, {})
  }

  const emitMultiplyListBySmall = (
    source: ListReference,
    multiplier: Parameters<typeof multiply>[1],
    destination: ListReference,
    trimDestination: ReturnType<typeof defineWarp>,
  ) => {
    deleteAllOfList(destination)
    setVariableTo(carry, 0)
    setVariableTo(i, 1)
    repeatUntil(
      and(gt(read(i), lengthOfList(source)), equals(read(carry), 0)),
      () => {
        setVariableTo(value, read(carry))
        ifThen(not(gt(read(i), lengthOfList(source))), () => {
          setVariableTo(
            value,
            add(
              read(value),
              multiply(getItemOfList(source, read(i)), multiplier),
            ),
          )
        })
        addToList(destination, mod(read(value), BASE))
        setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
        changeVariableBy(i, 1)
      },
    )
    ifThen(equals(lengthOfList(destination), 0), () => {
      addToList(destination, 0)
    })
    callProcedure(trimDestination, {})
  }

  const emitDivideListBySmall = (
    source: ListReference,
    divisor: Parameters<typeof divide>[1],
    destination: ListReference,
    trimDestination: ReturnType<typeof defineWarp>,
  ) => {
    deleteAllOfList(destination)
    setVariableTo(carry, 0)
    setVariableTo(i, lengthOfList(source))
    repeatUntil(lt(read(i), 1), () => {
      setVariableTo(
        value,
        add(multiply(read(carry), BASE), getItemOfList(source, read(i))),
      )
      insertAtList(
        destination,
        1,
        mathop('floor', divide(read(value), divisor)),
      )
      setVariableTo(carry, mod(read(value), divisor))
      changeVariableBy(i, -1)
    })
    ifThen(equals(lengthOfList(destination), 0), () => {
      addToList(destination, 0)
    })
    callProcedure(trimDestination, {})
  }

  const emitCompareLists = (
    leftList: ListReference,
    rightList: ListReference,
    leftTrim: ReturnType<typeof defineWarp>,
    rightTrim: ReturnType<typeof defineWarp>,
  ) => {
    callProcedure(leftTrim, {})
    callProcedure(rightTrim, {})
    setVariableTo(cmp, 0)
    ifElse(
      gt(lengthOfList(leftList), lengthOfList(rightList)),
      () => {
        setVariableTo(cmp, 1)
      },
      () => {
        ifThen(lt(lengthOfList(leftList), lengthOfList(rightList)), () => {
          setVariableTo(cmp, -1)
        })
      },
    )
    ifThen(equals(read(cmp), 0), () => {
      setVariableTo(i, lengthOfList(leftList))
      repeatUntil(or(lt(read(i), 1), not(equals(read(cmp), 0))), () => {
        ifThen(
          gt(
            getItemOfList(leftList, read(i)),
            getItemOfList(rightList, read(i)),
          ),
          () => {
            setVariableTo(cmp, 1)
          },
        )
        ifThen(
          lt(
            getItemOfList(leftList, read(i)),
            getItemOfList(rightList, read(i)),
          ),
          () => {
            setVariableTo(cmp, -1)
          },
        )
        changeVariableBy(i, -1)
      })
    })
  }

  const defineCopyList = (
    label: string,
    source: ListReference,
    destination: ListReference,
    trimDestination: ReturnType<typeof defineWarp>,
  ) => {
    return defineWarp(label, () => {
      deleteAllOfList(destination)
      setVariableTo(i, 1)
      repeatUntil(gt(read(i), lengthOfList(source)), () => {
        addToList(destination, getItemOfList(source, read(i)))
        changeVariableBy(i, 1)
      })
      ifThen(equals(lengthOfList(destination), 0), () => {
        addToList(destination, 0)
      })
      callProcedure(trimDestination, {})
    })
  }

  const copyPiWorkToTerm = defineCopyList(
    'copy pi work to term',
    piWorkChunks,
    piTermChunks,
    trimPiTerm,
  )
  const copyPiTermToSum = defineCopyList(
    'copy pi term to sum',
    piTermChunks,
    piSumChunks,
    trimPiSum,
  )
  const copyPiScratchToSum = defineCopyList(
    'copy pi scratch to sum',
    piScratchChunks,
    piSumChunks,
    trimPiSum,
  )
  const copyPiScratchToTotal = defineCopyList(
    'copy pi scratch to total',
    piScratchChunks,
    piTotalChunks,
    trimPiTotal,
  )
  const copyPiSumToArctan = defineCopyList(
    'copy pi sum to arctan',
    piSumChunks,
    piArctanChunks,
    trimPiArctan,
  )
  const _copyPiWorkToTotal = defineCopyList(
    'copy pi work to total',
    piWorkChunks,
    piTotalChunks,
    trimPiTotal,
  )
  const _copyPiTotalToResult = defineCopyList(
    'copy pi total to result',
    piTotalChunks,
    resultChunks,
    trimResult,
  )

  const dividePiTermBySmall = defineWarp('divide pi term by small', () => {
    deleteAllOfList(piWorkChunks)
    setVariableTo(carry, 0)
    setVariableTo(i, lengthOfList(piTermChunks))
    repeatUntil(lt(read(i), 1), () => {
      setVariableTo(
        value,
        add(multiply(read(carry), BASE), getItemOfList(piTermChunks, read(i))),
      )
      insertAtList(
        piWorkChunks,
        1,
        mathop('floor', divide(read(value), read(piSmallDivisor))),
      )
      setVariableTo(carry, mod(read(value), read(piSmallDivisor)))
      changeVariableBy(i, -1)
    })
    ifThen(equals(lengthOfList(piWorkChunks), 0), () => {
      addToList(piWorkChunks, 0)
    })
    callProcedure(trimPiWork, {})
  })

  const _multiplyPiArctanBySmall = defineWarp(
    'multiply pi arctan by small',
    () => {
      deleteAllOfList(piWorkChunks)
      setVariableTo(carry, 0)
      setVariableTo(i, 1)
      repeatUntil(
        and(gt(read(i), lengthOfList(piArctanChunks)), equals(read(carry), 0)),
        () => {
          setVariableTo(value, read(carry))
          ifThen(not(gt(read(i), lengthOfList(piArctanChunks))), () => {
            setVariableTo(
              value,
              add(
                read(value),
                multiply(
                  getItemOfList(piArctanChunks, read(i)),
                  read(piSmallMultiplier),
                ),
              ),
            )
          })
          addToList(piWorkChunks, mod(read(value), BASE))
          setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
          changeVariableBy(i, 1)
        },
      )
      ifThen(equals(lengthOfList(piWorkChunks), 0), () => {
        addToList(piWorkChunks, 0)
      })
      callProcedure(trimPiWork, {})
    },
  )

  const addPiWorkToSum = defineWarp('add pi work to sum', () => {
    deleteAllOfList(piScratchChunks)
    setVariableTo(carry, 0)
    setVariableTo(i, 1)
    repeatUntil(
      and(
        and(
          gt(read(i), lengthOfList(piSumChunks)),
          gt(read(i), lengthOfList(piWorkChunks)),
        ),
        equals(read(carry), 0),
      ),
      () => {
        setVariableTo(value, read(carry))
        ifThen(not(gt(read(i), lengthOfList(piSumChunks))), () => {
          setVariableTo(
            value,
            add(read(value), getItemOfList(piSumChunks, read(i))),
          )
        })
        ifThen(not(gt(read(i), lengthOfList(piWorkChunks))), () => {
          setVariableTo(
            value,
            add(read(value), getItemOfList(piWorkChunks, read(i))),
          )
        })
        addToList(piScratchChunks, mod(read(value), BASE))
        setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
        changeVariableBy(i, 1)
      },
    )
    callProcedure(trimPiScratch, {})
    callProcedure(copyPiScratchToSum, {})
  })

  const subtractPiWorkFromSum = defineWarp('subtract pi work from sum', () => {
    deleteAllOfList(piScratchChunks)
    setVariableTo(borrow, 0)
    setVariableTo(i, 1)
    repeatUntil(gt(read(i), lengthOfList(piSumChunks)), () => {
      setVariableTo(
        value,
        subtract(getItemOfList(piSumChunks, read(i)), read(borrow)),
      )
      ifThen(not(gt(read(i), lengthOfList(piWorkChunks))), () => {
        setVariableTo(
          value,
          subtract(read(value), getItemOfList(piWorkChunks, read(i))),
        )
      })
      ifElse(
        lt(read(value), 0),
        () => {
          setVariableTo(value, add(read(value), BASE))
          setVariableTo(borrow, 1)
        },
        () => {
          setVariableTo(borrow, 0)
        },
      )
      addToList(piScratchChunks, read(value))
      changeVariableBy(i, 1)
    })
    callProcedure(trimPiScratch, {})
    callProcedure(copyPiScratchToSum, {})
  })

  const _subtractPiWorkFromTotal = defineWarp(
    'subtract pi work from total',
    () => {
      deleteAllOfList(piScratchChunks)
      setVariableTo(borrow, 0)
      setVariableTo(i, 1)
      repeatUntil(gt(read(i), lengthOfList(piTotalChunks)), () => {
        setVariableTo(
          value,
          subtract(getItemOfList(piTotalChunks, read(i)), read(borrow)),
        )
        ifThen(not(gt(read(i), lengthOfList(piWorkChunks))), () => {
          setVariableTo(
            value,
            subtract(read(value), getItemOfList(piWorkChunks, read(i))),
          )
        })
        ifElse(
          lt(read(value), 0),
          () => {
            setVariableTo(value, add(read(value), BASE))
            setVariableTo(borrow, 1)
          },
          () => {
            setVariableTo(borrow, 0)
          },
        )
        addToList(piScratchChunks, read(value))
        changeVariableBy(i, 1)
      })
      callProcedure(trimPiScratch, {})
      callProcedure(copyPiScratchToTotal, {})
    },
  )

  const measurePiTerm = defineWarp('measure pi term', () => {
    callProcedure(trimPiTerm, {})
    ifElse(
      and(
        equals(lengthOfList(piTermChunks), 1),
        equals(getItemOfList(piTermChunks, 1), 0),
      ),
      () => {
        setVariableTo(piTermIsZero, 1)
      },
      () => {
        setVariableTo(piTermIsZero, 0)
      },
    )
  })

  const defineListToText = (
    label: string,
    list: ListReference,
    out: VariableReference,
    trimProcedure: ReturnType<typeof defineWarp>,
  ) => {
    return defineWarp(label, () => {
      callProcedure(trimProcedure, {})
      setVariableTo(out, '')
      setVariableTo(i, lengthOfList(list))
      repeatUntil(lt(read(i), 1), () => {
        setVariableTo(chunkText, getItemOfList(list, read(i)))
        ifElse(
          equals(read(out), ''),
          () => {
            setVariableTo(out, read(chunkText))
          },
          () => {
            repeatUntil(not(lt(length(read(chunkText)), CHUNK_WIDTH)), () => {
              setVariableTo(chunkText, join('0', read(chunkText)))
            })
            setVariableTo(out, join(read(out), read(chunkText)))
          },
        )
        changeVariableBy(i, -1)
      })
    })
  }

  const resultToText = defineListToText(
    'result chunks to text',
    resultChunks,
    result,
    trimResult,
  )
  const quotientToText = defineListToText(
    'quotient chunks to text',
    quotientChunks,
    result,
    trimQuotient,
  )
  const remainderToText = defineListToText(
    'remainder chunks to text',
    remainderChunks,
    remainder,
    trimRemainder,
  )

  const digitsToText = defineWarp('product digits to text', () => {
    callProcedure(trimProductDigits, {})
    setVariableTo(result, '')
    setVariableTo(i, lengthOfList(productDigits))
    repeatUntil(lt(read(i), 1), () => {
      setVariableTo(
        result,
        join(read(result), getItemOfList(productDigits, read(i))),
      )
      changeVariableBy(i, -1)
    })
  })

  const measureProductDigits = defineWarp('measure product digits', () => {
    callProcedure(trimProductDigits, {})
    setVariableTo(benchmarkResultDigits, lengthOfList(productDigits))
    ifThen(lt(read(benchmarkResultDigits), 1), () => {
      setVariableTo(benchmarkResultDigits, 1)
    })
  })

  const defineLoadDigits = (
    label: string,
    text: VariableReference,
    realList: ListReference,
    imagList: ListReference,
  ) => {
    return defineWarp(label, () => {
      deleteAllOfList(realList)
      deleteAllOfList(imagList)
      setVariableTo(i, length(read(text)))
      repeatUntil(lt(read(i), 1), () => {
        addToList(realList, letterOf(read(i), read(text)))
        addToList(imagList, 0)
        changeVariableBy(i, -1)
      })
    })
  }

  const loadLeftDigits = defineLoadDigits(
    'load left digits',
    leftMag,
    fftRealA,
    fftImagA,
  )
  const loadRightDigits = defineLoadDigits(
    'load right digits',
    rightMag,
    fftRealB,
    fftImagB,
  )

  const definePadComplexLists = (
    label: string,
    realList: ListReference,
    imagList: ListReference,
  ) => {
    return defineWarp(label, () => {
      repeatUntil(equals(lengthOfList(realList), read(fftSize)), () => {
        addToList(realList, 0)
        addToList(imagList, 0)
      })
    })
  }

  const padLeftDigits = definePadComplexLists(
    'pad left digits',
    fftRealA,
    fftImagA,
  )
  const padRightDigits = definePadComplexLists(
    'pad right digits',
    fftRealB,
    fftImagB,
  )

  const defineFft = (
    label: string,
    realList: ListReference,
    imagList: ListReference,
  ) => {
    return defineWarp(label, () => {
      setVariableTo(fftJIndex, 0)
      setVariableTo(fftIndex, 1)
      repeatUntil(gt(read(fftIndex), subtract(read(fftSize), 1)), () => {
        setVariableTo(fftBit, divide(read(fftSize), 2))
        repeatUntil(
          or(lt(read(fftBit), 1), lt(read(fftJIndex), read(fftBit))),
          () => {
            setVariableTo(fftJIndex, subtract(read(fftJIndex), read(fftBit)))
            setVariableTo(fftBit, mathop('floor', divide(read(fftBit), 2)))
          },
        )
        setVariableTo(fftJIndex, add(read(fftJIndex), read(fftBit)))
        ifThen(lt(read(fftIndex), read(fftJIndex)), () => {
          setVariableTo(
            fftTempReal,
            getItemOfList(realList, add(read(fftIndex), 1)),
          )
          setVariableTo(
            fftTempImag,
            getItemOfList(imagList, add(read(fftIndex), 1)),
          )
          replaceItemOfList(
            realList,
            add(read(fftIndex), 1),
            getItemOfList(realList, add(read(fftJIndex), 1)),
          )
          replaceItemOfList(
            imagList,
            add(read(fftIndex), 1),
            getItemOfList(imagList, add(read(fftJIndex), 1)),
          )
          replaceItemOfList(
            realList,
            add(read(fftJIndex), 1),
            read(fftTempReal),
          )
          replaceItemOfList(
            imagList,
            add(read(fftJIndex), 1),
            read(fftTempImag),
          )
        })
        changeVariableBy(fftIndex, 1)
      })

      setVariableTo(fftLen, 2)
      repeatUntil(gt(read(fftLen), read(fftSize)), () => {
        setVariableTo(fftHalf, divide(read(fftLen), 2))
        ifElse(
          equals(read(fftInverse), 1),
          () => {
            setVariableTo(fftAngle, divide(360, read(fftLen)))
          },
          () => {
            setVariableTo(fftAngle, multiply(-1, divide(360, read(fftLen))))
          },
        )
        setVariableTo(fftWlenReal, mathop('cos', read(fftAngle)))
        setVariableTo(fftWlenImag, mathop('sin', read(fftAngle)))
        setVariableTo(fftIndex, 0)
        repeatUntil(gt(read(fftIndex), subtract(read(fftSize), 1)), () => {
          setVariableTo(fftWReal, 1)
          setVariableTo(fftWImag, 0)
          setVariableTo(fftJIndex, 0)
          repeatUntil(gt(read(fftJIndex), subtract(read(fftHalf), 1)), () => {
            setVariableTo(fftIndex2, add(read(fftIndex), read(fftJIndex)))
            setVariableTo(fftPartner, add(read(fftIndex2), read(fftHalf)))
            setVariableTo(
              fftUReal,
              getItemOfList(realList, add(read(fftIndex2), 1)),
            )
            setVariableTo(
              fftUImag,
              getItemOfList(imagList, add(read(fftIndex2), 1)),
            )
            setVariableTo(
              fftVReal,
              subtract(
                multiply(
                  getItemOfList(realList, add(read(fftPartner), 1)),
                  read(fftWReal),
                ),
                multiply(
                  getItemOfList(imagList, add(read(fftPartner), 1)),
                  read(fftWImag),
                ),
              ),
            )
            setVariableTo(
              fftVImag,
              add(
                multiply(
                  getItemOfList(realList, add(read(fftPartner), 1)),
                  read(fftWImag),
                ),
                multiply(
                  getItemOfList(imagList, add(read(fftPartner), 1)),
                  read(fftWReal),
                ),
              ),
            )
            replaceItemOfList(
              realList,
              add(read(fftIndex2), 1),
              add(read(fftUReal), read(fftVReal)),
            )
            replaceItemOfList(
              imagList,
              add(read(fftIndex2), 1),
              add(read(fftUImag), read(fftVImag)),
            )
            replaceItemOfList(
              realList,
              add(read(fftPartner), 1),
              subtract(read(fftUReal), read(fftVReal)),
            )
            replaceItemOfList(
              imagList,
              add(read(fftPartner), 1),
              subtract(read(fftUImag), read(fftVImag)),
            )
            setVariableTo(
              fftTempReal,
              subtract(
                multiply(read(fftWReal), read(fftWlenReal)),
                multiply(read(fftWImag), read(fftWlenImag)),
              ),
            )
            setVariableTo(
              fftTempImag,
              add(
                multiply(read(fftWReal), read(fftWlenImag)),
                multiply(read(fftWImag), read(fftWlenReal)),
              ),
            )
            setVariableTo(fftWReal, read(fftTempReal))
            setVariableTo(fftWImag, read(fftTempImag))
            changeVariableBy(fftJIndex, 1)
          })
          changeVariableBy(fftIndex, read(fftLen))
        })
        setVariableTo(fftLen, multiply(read(fftLen), 2))
      })

      ifThen(equals(read(fftInverse), 1), () => {
        setVariableTo(fftIndex, 0)
        repeatUntil(gt(read(fftIndex), subtract(read(fftSize), 1)), () => {
          replaceItemOfList(
            realList,
            add(read(fftIndex), 1),
            divide(
              getItemOfList(realList, add(read(fftIndex), 1)),
              read(fftSize),
            ),
          )
          replaceItemOfList(
            imagList,
            add(read(fftIndex), 1),
            divide(
              getItemOfList(imagList, add(read(fftIndex), 1)),
              read(fftSize),
            ),
          )
          changeVariableBy(fftIndex, 1)
        })
      })
    })
  }

  const fftLeft = defineFft('fft left', fftRealA, fftImagA)
  const fftRight = defineFft('fft right', fftRealB, fftImagB)

  const fftMultiplyDigits = defineWarp('fft multiply digits', () => {
    callProcedure(loadLeftDigits, {})
    callProcedure(loadRightDigits, {})
    setVariableTo(fftSize, 1)
    repeatUntil(
      not(
        lt(read(fftSize), add(lengthOfList(fftRealA), lengthOfList(fftRealB))),
      ),
      () => {
        setVariableTo(fftSize, multiply(read(fftSize), 2))
      },
    )
    callProcedure(padLeftDigits, {})
    callProcedure(padRightDigits, {})

    setVariableTo(fftInverse, 0)
    callProcedure(fftLeft, {})
    callProcedure(fftRight, {})

    setVariableTo(fftIndex, 1)
    repeatUntil(gt(read(fftIndex), read(fftSize)), () => {
      setVariableTo(fftUReal, getItemOfList(fftRealA, read(fftIndex)))
      setVariableTo(fftUImag, getItemOfList(fftImagA, read(fftIndex)))
      setVariableTo(fftVReal, getItemOfList(fftRealB, read(fftIndex)))
      setVariableTo(fftVImag, getItemOfList(fftImagB, read(fftIndex)))
      replaceItemOfList(
        fftRealA,
        read(fftIndex),
        subtract(
          multiply(read(fftUReal), read(fftVReal)),
          multiply(read(fftUImag), read(fftVImag)),
        ),
      )
      replaceItemOfList(
        fftImagA,
        read(fftIndex),
        add(
          multiply(read(fftUReal), read(fftVImag)),
          multiply(read(fftUImag), read(fftVReal)),
        ),
      )
      changeVariableBy(fftIndex, 1)
    })

    setVariableTo(fftInverse, 1)
    callProcedure(fftLeft, {})

    deleteAllOfList(productDigits)
    setVariableTo(carry, 0)
    setVariableTo(fftIndex, 1)
    repeatUntil(
      and(gt(read(fftIndex), read(fftSize)), equals(read(carry), 0)),
      () => {
        setVariableTo(value, read(carry))
        ifThen(not(gt(read(fftIndex), read(fftSize))), () => {
          setVariableTo(
            value,
            add(read(value), round(getItemOfList(fftRealA, read(fftIndex)))),
          )
        })
        addToList(productDigits, mod(read(value), 10))
        setVariableTo(carry, mathop('floor', divide(read(value), 10)))
        changeVariableBy(fftIndex, 1)
      },
    )
    ifThen(equals(lengthOfList(productDigits), 0), () => {
      addToList(productDigits, 0)
    })
    callProcedure(digitsToText, {})
  })

  const fftMultiplyDigitsFast = defineWarp('fft multiply digits fast', () => {
    callProcedure(loadLeftDigits, {})
    callProcedure(loadRightDigits, {})
    setVariableTo(fftSize, 1)
    repeatUntil(
      not(
        lt(read(fftSize), add(lengthOfList(fftRealA), lengthOfList(fftRealB))),
      ),
      () => {
        setVariableTo(fftSize, multiply(read(fftSize), 2))
      },
    )
    callProcedure(padLeftDigits, {})
    callProcedure(padRightDigits, {})

    setVariableTo(fftInverse, 0)
    callProcedure(fftLeft, {})
    callProcedure(fftRight, {})

    setVariableTo(fftIndex, 1)
    repeatUntil(gt(read(fftIndex), read(fftSize)), () => {
      setVariableTo(fftUReal, getItemOfList(fftRealA, read(fftIndex)))
      setVariableTo(fftUImag, getItemOfList(fftImagA, read(fftIndex)))
      setVariableTo(fftVReal, getItemOfList(fftRealB, read(fftIndex)))
      setVariableTo(fftVImag, getItemOfList(fftImagB, read(fftIndex)))
      replaceItemOfList(
        fftRealA,
        read(fftIndex),
        subtract(
          multiply(read(fftUReal), read(fftVReal)),
          multiply(read(fftUImag), read(fftVImag)),
        ),
      )
      replaceItemOfList(
        fftImagA,
        read(fftIndex),
        add(
          multiply(read(fftUReal), read(fftVImag)),
          multiply(read(fftUImag), read(fftVReal)),
        ),
      )
      changeVariableBy(fftIndex, 1)
    })

    setVariableTo(fftInverse, 1)
    callProcedure(fftLeft, {})

    deleteAllOfList(productDigits)
    setVariableTo(carry, 0)
    setVariableTo(fftIndex, 1)
    repeatUntil(
      and(gt(read(fftIndex), read(fftSize)), equals(read(carry), 0)),
      () => {
        setVariableTo(value, read(carry))
        ifThen(not(gt(read(fftIndex), read(fftSize))), () => {
          setVariableTo(
            value,
            add(read(value), round(getItemOfList(fftRealA, read(fftIndex)))),
          )
        })
        addToList(productDigits, mod(read(value), 10))
        setVariableTo(carry, mathop('floor', divide(read(value), 10)))
        changeVariableBy(fftIndex, 1)
      },
    )
    ifThen(equals(lengthOfList(productDigits), 0), () => {
      addToList(productDigits, 0)
    })
    callProcedure(measureProductDigits, {})
  })

  const defineCompareLists = (
    label: string,
    leftList: ListReference,
    rightList: ListReference,
    leftTrim: ReturnType<typeof defineWarp>,
    rightTrim: ReturnType<typeof defineWarp>,
  ) => {
    return defineWarp(label, () => {
      callProcedure(leftTrim, {})
      callProcedure(rightTrim, {})
      setVariableTo(cmp, 0)
      ifElse(
        gt(lengthOfList(leftList), lengthOfList(rightList)),
        () => {
          setVariableTo(cmp, 1)
        },
        () => {
          ifThen(lt(lengthOfList(leftList), lengthOfList(rightList)), () => {
            setVariableTo(cmp, -1)
          })
        },
      )
      ifThen(equals(read(cmp), 0), () => {
        setVariableTo(i, lengthOfList(leftList))
        repeatUntil(or(lt(read(i), 1), not(equals(read(cmp), 0))), () => {
          ifThen(
            gt(
              getItemOfList(leftList, read(i)),
              getItemOfList(rightList, read(i)),
            ),
            () => {
              setVariableTo(cmp, 1)
            },
          )
          ifThen(
            lt(
              getItemOfList(leftList, read(i)),
              getItemOfList(rightList, read(i)),
            ),
            () => {
              setVariableTo(cmp, -1)
            },
          )
          changeVariableBy(i, -1)
        })
      })
    })
  }

  const compareRemainderWithTmp = defineCompareLists(
    'compare remainder with tmp',
    remainderChunks,
    tmpChunks,
    trimRemainder,
    trimTmp,
  )

  const defineMeasureChunkDigits = (
    label: string,
    list: ListReference,
    trimProcedure: ReturnType<typeof defineWarp>,
  ) => {
    return defineWarp(label, () => {
      callProcedure(trimProcedure, {})
      ifElse(
        and(equals(lengthOfList(list), 1), equals(getItemOfList(list, 1), 0)),
        () => {
          setVariableTo(benchmarkResultDigits, 1)
        },
        () => {
          setVariableTo(
            benchmarkResultDigits,
            add(
              multiply(subtract(lengthOfList(list), 1), CHUNK_WIDTH),
              length(getItemOfList(list, lengthOfList(list))),
            ),
          )
        },
      )
    })
  }

  const measureResultChunkDigits = defineMeasureChunkDigits(
    'measure result chunk digits',
    resultChunks,
    trimResult,
  )
  const measureQuotientChunkDigits = defineMeasureChunkDigits(
    'measure quotient chunk digits',
    quotientChunks,
    trimQuotient,
  )

  const defineParseDecimal = (
    label: string,
    sideName: string,
    input: VariableReference,
    mag: VariableReference,
    sign: VariableReference,
    scale: VariableReference,
  ) => {
    return defineWarp(label, () => {
      setVariableTo(sign, 1)
      setVariableTo(mag, '')
      setVariableTo(scale, 0)
      setVariableTo(seenDot, 0)
      setVariableTo(seenDigit, 0)
      setVariableTo(i, 1)
      ifThen(equals(length(read(input)), 0), () => {
        setVariableTo(inputValid, 0)
        setVariableTo(status, join(sideName, ' operand is empty'))
        setVariableTo(mag, '0')
        setVariableTo(scale, 0)
      })
      ifThen(
        and(equals(read(inputValid), 1), equals(letterOf(1, read(input)), '-')),
        () => {
          setVariableTo(sign, -1)
          setVariableTo(i, 2)
        },
      )
      ifThen(
        and(equals(read(inputValid), 1), equals(letterOf(1, read(input)), '+')),
        () => {
          setVariableTo(sign, 1)
          setVariableTo(i, 2)
        },
      )
      ifThen(
        and(equals(read(inputValid), 1), gt(read(i), length(read(input)))),
        () => {
          setVariableTo(inputValid, 0)
          setVariableTo(
            status,
            join(sideName, ' operand has no decimal digits'),
          )
          setVariableTo(sign, 1)
          setVariableTo(mag, '0')
          setVariableTo(scale, 0)
        },
      )
      repeatUntil(
        or(gt(read(i), length(read(input))), equals(read(inputValid), 0)),
        () => {
          setVariableTo(chunkText, letterOf(read(i), read(input)))
          ifElse(
            contains(DIGITS, read(chunkText)),
            () => {
              setVariableTo(seenDigit, 1)
              ifThen(equals(read(seenDot), 1), () => {
                changeVariableBy(scale, 1)
              })
              ifThen(
                or(
                  not(equals(read(mag), '')),
                  not(equals(read(chunkText), '0')),
                ),
                () => {
                  setVariableTo(mag, join(read(mag), read(chunkText)))
                },
              )
            },
            () => {
              ifElse(
                and(equals(read(chunkText), '.'), equals(read(seenDot), 0)),
                () => {
                  setVariableTo(seenDot, 1)
                },
                () => {
                  setVariableTo(inputValid, 0)
                  setVariableTo(
                    status,
                    join(
                      join(sideName, ' operand is not a decimal: '),
                      read(input),
                    ),
                  )
                  setVariableTo(sign, 1)
                  setVariableTo(mag, '0')
                  setVariableTo(scale, 0)
                },
              )
            },
          )
          changeVariableBy(i, 1)
        },
      )
      ifThen(
        and(equals(read(inputValid), 1), equals(read(seenDigit), 0)),
        () => {
          setVariableTo(inputValid, 0)
          setVariableTo(
            status,
            join(sideName, ' operand has no decimal digits'),
          )
          setVariableTo(sign, 1)
          setVariableTo(mag, '0')
          setVariableTo(scale, 0)
        },
      )
      ifThen(and(equals(read(inputValid), 1), equals(read(mag), '')), () => {
        setVariableTo(sign, 1)
        setVariableTo(mag, '0')
        setVariableTo(scale, 0)
      })
    })
  }

  const parseLeft = defineParseDecimal(
    'parse left input',
    'left',
    leftInput,
    leftMag,
    leftSign,
    leftScale,
  )
  const parseRight = defineParseDecimal(
    'parse right input',
    'right',
    rightInput,
    rightMag,
    rightSign,
    rightScale,
  )

  const compareMagnitudeText = defineWarp(
    'compare left and right magnitude',
    () => {
      setVariableTo(cmp, 0)
      ifElse(
        gt(length(read(leftMag)), length(read(rightMag))),
        () => {
          setVariableTo(cmp, 1)
        },
        () => {
          ifThen(lt(length(read(leftMag)), length(read(rightMag))), () => {
            setVariableTo(cmp, -1)
          })
        },
      )
      ifThen(equals(read(cmp), 0), () => {
        setVariableTo(i, 1)
        repeatUntil(
          or(gt(read(i), length(read(leftMag))), not(equals(read(cmp), 0))),
          () => {
            ifThen(
              gt(
                letterOf(read(i), read(leftMag)),
                letterOf(read(i), read(rightMag)),
              ),
              () => {
                setVariableTo(cmp, 1)
              },
            )
            ifThen(
              lt(
                letterOf(read(i), read(leftMag)),
                letterOf(read(i), read(rightMag)),
              ),
              () => {
                setVariableTo(cmp, -1)
              },
            )
            changeVariableBy(i, 1)
          },
        )
      })
    },
  )

  const alignDecimalScales = defineWarp('align decimal scales', () => {
    ifElse(
      gt(read(leftScale), read(rightScale)),
      () => {
        setVariableTo(resultScale, read(leftScale))
        setVariableTo(scaleDiff, subtract(read(leftScale), read(rightScale)))
        setVariableTo(i, 1)
        repeatUntil(gt(read(i), read(scaleDiff)), () => {
          ifThen(not(equals(read(rightMag), '0')), () => {
            setVariableTo(rightMag, join(read(rightMag), '0'))
          })
          changeVariableBy(i, 1)
        })
        setVariableTo(rightScale, read(leftScale))
      },
      () => {
        setVariableTo(resultScale, read(rightScale))
        setVariableTo(scaleDiff, subtract(read(rightScale), read(leftScale)))
        setVariableTo(i, 1)
        repeatUntil(gt(read(i), read(scaleDiff)), () => {
          ifThen(not(equals(read(leftMag), '0')), () => {
            setVariableTo(leftMag, join(read(leftMag), '0'))
          })
          changeVariableBy(i, 1)
        })
        setVariableTo(leftScale, read(rightScale))
      },
    )
  })

  const defineLoadChunks = (
    label: string,
    text: VariableReference,
    list: ListReference,
  ) => {
    return defineWarp(label, () => {
      deleteAllOfList(list)
      setVariableTo(i, length(read(text)))
      repeatUntil(lt(read(i), 1), () => {
        setVariableTo(startIndex, add(1, subtract(read(i), CHUNK_WIDTH)))
        ifThen(lt(read(startIndex), 1), () => {
          setVariableTo(startIndex, 1)
        })
        setVariableTo(chunkText, '')
        setVariableTo(k, read(startIndex))
        repeatUntil(gt(read(k), read(i)), () => {
          setVariableTo(
            chunkText,
            join(read(chunkText), letterOf(read(k), read(text))),
          )
          changeVariableBy(k, 1)
        })
        addToList(list, read(chunkText))
        changeVariableBy(i, -CHUNK_WIDTH)
      })
      ifThen(equals(lengthOfList(list), 0), () => {
        addToList(list, 0)
      })
    })
  }

  const loadLeftChunks = defineLoadChunks('load left chunks', leftMag, aChunks)
  const loadRightChunks = defineLoadChunks(
    'load right chunks',
    rightMag,
    bChunks,
  )
  const loadPiScaleChunks = defineLoadChunks(
    'load pi scale chunks',
    piScaleText,
    piTermChunks,
  )

  const addChunkLists = defineWarp('add chunk lists', () => {
    deleteAllOfList(resultChunks)
    setVariableTo(carry, 0)
    setVariableTo(i, 1)
    repeatUntil(
      and(
        and(
          gt(read(i), lengthOfList(aChunks)),
          gt(read(i), lengthOfList(bChunks)),
        ),
        equals(read(carry), 0),
      ),
      () => {
        setVariableTo(value, read(carry))
        ifThen(not(gt(read(i), lengthOfList(aChunks))), () => {
          setVariableTo(
            value,
            add(read(value), getItemOfList(aChunks, read(i))),
          )
        })
        ifThen(not(gt(read(i), lengthOfList(bChunks))), () => {
          setVariableTo(
            value,
            add(read(value), getItemOfList(bChunks, read(i))),
          )
        })
        addToList(resultChunks, mod(read(value), BASE))
        setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
        changeVariableBy(i, 1)
      },
    )
    callProcedure(trimResult, {})
  })

  const subtractAB = defineWarp('subtract a chunks by b chunks', () => {
    deleteAllOfList(resultChunks)
    setVariableTo(borrow, 0)
    setVariableTo(i, 1)
    repeatUntil(gt(read(i), lengthOfList(aChunks)), () => {
      setVariableTo(
        value,
        subtract(getItemOfList(aChunks, read(i)), read(borrow)),
      )
      ifThen(not(gt(read(i), lengthOfList(bChunks))), () => {
        setVariableTo(
          value,
          subtract(read(value), getItemOfList(bChunks, read(i))),
        )
      })
      ifElse(
        lt(read(value), 0),
        () => {
          setVariableTo(value, add(read(value), BASE))
          setVariableTo(borrow, 1)
        },
        () => {
          setVariableTo(borrow, 0)
        },
      )
      addToList(resultChunks, read(value))
      changeVariableBy(i, 1)
    })
    callProcedure(trimResult, {})
  })

  const subtractBA = defineWarp('subtract b chunks by a chunks', () => {
    deleteAllOfList(resultChunks)
    setVariableTo(borrow, 0)
    setVariableTo(i, 1)
    repeatUntil(gt(read(i), lengthOfList(bChunks)), () => {
      setVariableTo(
        value,
        subtract(getItemOfList(bChunks, read(i)), read(borrow)),
      )
      ifThen(not(gt(read(i), lengthOfList(aChunks))), () => {
        setVariableTo(
          value,
          subtract(read(value), getItemOfList(aChunks, read(i))),
        )
      })
      ifElse(
        lt(read(value), 0),
        () => {
          setVariableTo(value, add(read(value), BASE))
          setVariableTo(borrow, 1)
        },
        () => {
          setVariableTo(borrow, 0)
        },
      )
      addToList(resultChunks, read(value))
      changeVariableBy(i, 1)
    })
    callProcedure(trimResult, {})
  })

  const multiplyChunkLists = defineWarp('multiply chunk lists', () => {
    deleteAllOfList(resultChunks)
    setVariableTo(i, 1)
    repeatUntil(
      gt(read(i), add(lengthOfList(aChunks), add(lengthOfList(bChunks), 1))),
      () => {
        addToList(resultChunks, 0)
        changeVariableBy(i, 1)
      },
    )
    setVariableTo(i, 1)
    repeatUntil(gt(read(i), lengthOfList(aChunks)), () => {
      setVariableTo(carry, 0)
      setVariableTo(j, 1)
      repeatUntil(gt(read(j), lengthOfList(bChunks)), () => {
        setVariableTo(k, add(add(read(i), read(j)), -1))
        setVariableTo(
          value,
          add(
            add(
              getItemOfList(resultChunks, read(k)),
              multiply(
                getItemOfList(aChunks, read(i)),
                getItemOfList(bChunks, read(j)),
              ),
            ),
            read(carry),
          ),
        )
        replaceItemOfList(resultChunks, read(k), mod(read(value), BASE))
        setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
        changeVariableBy(j, 1)
      })
      setVariableTo(k, add(read(i), lengthOfList(bChunks)))
      repeatUntil(equals(read(carry), 0), () => {
        ifThen(gt(read(k), lengthOfList(resultChunks)), () => {
          addToList(resultChunks, 0)
        })
        setVariableTo(
          value,
          add(getItemOfList(resultChunks, read(k)), read(carry)),
        )
        replaceItemOfList(resultChunks, read(k), mod(read(value), BASE))
        setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
        changeVariableBy(k, 1)
      })
      changeVariableBy(i, 1)
    })
    callProcedure(trimResult, {})
  })

  const emitMultiplyLists = (
    leftList: ListReference,
    rightList: ListReference,
    destination: ListReference,
    trimDestination: ReturnType<typeof defineWarp>,
  ) => {
    emitCopyList(leftList, aChunks, trimA)
    emitCopyList(rightList, bChunks, trimB)
    callProcedure(multiplyChunkLists, {})
    emitCopyList(resultChunks, destination, trimDestination)
  }

  const emitAddLists = (
    leftList: ListReference,
    rightList: ListReference,
    destination: ListReference,
    trimDestination: ReturnType<typeof defineWarp>,
  ) => {
    emitCopyList(leftList, aChunks, trimA)
    emitCopyList(rightList, bChunks, trimB)
    callProcedure(addChunkLists, {})
    emitCopyList(resultChunks, destination, trimDestination)
  }

  const emitSubtractLists = (
    leftList: ListReference,
    rightList: ListReference,
    destination: ListReference,
    trimDestination: ReturnType<typeof defineWarp>,
  ) => {
    emitCopyList(leftList, aChunks, trimA)
    emitCopyList(rightList, bChunks, trimB)
    callProcedure(subtractAB, {})
    emitCopyList(resultChunks, destination, trimDestination)
  }

  const emitPushStack = (
    source: ListReference,
    chunkStack: ListReference,
    lengthStack: ListReference,
  ) => {
    addToList(lengthStack, lengthOfList(source))
    setVariableTo(i, 1)
    repeatUntil(gt(read(i), lengthOfList(source)), () => {
      addToList(chunkStack, getItemOfList(source, read(i)))
      changeVariableBy(i, 1)
    })
  }

  const emitPopStack = (
    destination: ListReference,
    trimDestination: ReturnType<typeof defineWarp>,
    chunkStack: ListReference,
    lengthStack: ListReference,
  ) => {
    deleteAllOfList(destination)
    setVariableTo(value, getItemOfList(lengthStack, lengthOfList(lengthStack)))
    deleteOfList(lengthStack, lengthOfList(lengthStack))
    setVariableTo(i, 1)
    repeatUntil(gt(read(i), read(value)), () => {
      insertAtList(
        destination,
        1,
        getItemOfList(chunkStack, lengthOfList(chunkStack)),
      )
      deleteOfList(chunkStack, lengthOfList(chunkStack))
      changeVariableBy(i, 1)
    })
    ifThen(equals(lengthOfList(destination), 0), () => {
      addToList(destination, 0)
    })
    callProcedure(trimDestination, {})
  }

  const multiplyDivisorByTrial = defineWarp('multiply divisor by trial', () => {
    deleteAllOfList(tmpChunks)
    setVariableTo(carry, 0)
    setVariableTo(i, 1)
    repeatUntil(
      and(gt(read(i), lengthOfList(bChunks)), equals(read(carry), 0)),
      () => {
        setVariableTo(value, read(carry))
        ifThen(not(gt(read(i), lengthOfList(bChunks))), () => {
          setVariableTo(
            value,
            add(
              read(value),
              multiply(getItemOfList(bChunks, read(i)), read(trial)),
            ),
          )
        })
        addToList(tmpChunks, mod(read(value), BASE))
        setVariableTo(carry, mathop('floor', divide(read(value), BASE)))
        changeVariableBy(i, 1)
      },
    )
    ifThen(equals(lengthOfList(tmpChunks), 0), () => {
      addToList(tmpChunks, 0)
    })
    callProcedure(trimTmp, {})
  })

  const subtractTmpFromRemainder = defineWarp(
    'subtract tmp from remainder',
    () => {
      setVariableTo(borrow, 0)
      setVariableTo(i, 1)
      repeatUntil(gt(read(i), lengthOfList(remainderChunks)), () => {
        setVariableTo(
          value,
          subtract(getItemOfList(remainderChunks, read(i)), read(borrow)),
        )
        ifThen(not(gt(read(i), lengthOfList(tmpChunks))), () => {
          setVariableTo(
            value,
            subtract(read(value), getItemOfList(tmpChunks, read(i))),
          )
        })
        ifElse(
          lt(read(value), 0),
          () => {
            setVariableTo(value, add(read(value), BASE))
            setVariableTo(borrow, 1)
          },
          () => {
            setVariableTo(borrow, 0)
          },
        )
        replaceItemOfList(remainderChunks, read(i), read(value))
        changeVariableBy(i, 1)
      })
      callProcedure(trimRemainder, {})
    },
  )

  const divideChunkLists = defineWarp('divide chunk lists', () => {
    callProcedure(trimA, {})
    callProcedure(trimB, {})
    setVariableTo(
      scaleDiff,
      mathop(
        'floor',
        divide(BASE, add(getItemOfList(bChunks, lengthOfList(bChunks)), 1)),
      ),
    )
    ifThen(gt(read(scaleDiff), 1), () => {
      emitMultiplyListBySmall(aChunks, read(scaleDiff), tmpChunks, trimTmp)
      emitCopyList(tmpChunks, aChunks, trimA)
      emitMultiplyListBySmall(bChunks, read(scaleDiff), tmpChunks, trimTmp)
      emitCopyList(tmpChunks, bChunks, trimB)
    })
    deleteAllOfList(quotientChunks)
    deleteAllOfList(remainderChunks)
    addToList(remainderChunks, 0)
    setVariableTo(k, lengthOfList(aChunks))
    repeatUntil(lt(read(k), 1), () => {
      ifElse(
        and(
          equals(lengthOfList(remainderChunks), 1),
          equals(getItemOfList(remainderChunks, 1), 0),
        ),
        () => {
          replaceItemOfList(remainderChunks, 1, getItemOfList(aChunks, read(k)))
        },
        () => {
          insertAtList(remainderChunks, 1, getItemOfList(aChunks, read(k)))
        },
      )
      callProcedure(trimRemainder, {})
      setVariableTo(candidate, 0)
      ifThen(
        not(lt(lengthOfList(remainderChunks), lengthOfList(bChunks))),
        () => {
          setVariableTo(
            value,
            getItemOfList(remainderChunks, lengthOfList(remainderChunks)),
          )
          ifThen(
            gt(lengthOfList(remainderChunks), lengthOfList(bChunks)),
            () => {
              setVariableTo(
                value,
                add(
                  multiply(read(value), BASE),
                  getItemOfList(
                    remainderChunks,
                    subtract(lengthOfList(remainderChunks), 1),
                  ),
                ),
              )
            },
          )
          setVariableTo(
            candidate,
            mathop(
              'floor',
              divide(
                read(value),
                getItemOfList(bChunks, lengthOfList(bChunks)),
              ),
            ),
          )
          ifThen(gt(read(candidate), subtract(BASE, 1)), () => {
            setVariableTo(candidate, subtract(BASE, 1))
          })
        },
      )
      setVariableTo(trial, read(candidate))
      callProcedure(multiplyDivisorByTrial, {})
      callProcedure(compareRemainderWithTmp, {})
      repeatUntil(or(not(lt(read(cmp), 0)), equals(read(candidate), 0)), () => {
        changeVariableBy(candidate, -1)
        setVariableTo(trial, read(candidate))
        callProcedure(multiplyDivisorByTrial, {})
        callProcedure(compareRemainderWithTmp, {})
      })
      setVariableTo(trial, read(candidate))
      callProcedure(multiplyDivisorByTrial, {})
      callProcedure(subtractTmpFromRemainder, {})
      insertAtList(quotientChunks, 1, read(candidate))
      changeVariableBy(k, -1)
    })
    callProcedure(trimQuotient, {})
    ifThen(gt(read(scaleDiff), 1), () => {
      emitDivideListBySmall(
        remainderChunks,
        read(scaleDiff),
        tmpChunks,
        trimTmp,
      )
      emitCopyList(tmpChunks, remainderChunks, trimRemainder)
    })
    callProcedure(trimRemainder, {})
  })

  const applyResultSign = defineWarp('format signed decimal result', () => {
    ifThen(equals(read(result), ''), () => {
      setVariableTo(result, '0')
      setVariableTo(resultScale, 0)
    })
    repeatUntil(
      or(
        equals(read(resultScale), 0),
        not(equals(letterOf(length(read(result)), read(result)), '0')),
      ),
      () => {
        setVariableTo(chunkText, '')
        setVariableTo(i, 1)
        repeatUntil(gt(read(i), subtract(length(read(result)), 1)), () => {
          setVariableTo(
            chunkText,
            join(read(chunkText), letterOf(read(i), read(result))),
          )
          changeVariableBy(i, 1)
        })
        setVariableTo(result, read(chunkText))
        changeVariableBy(resultScale, -1)
        ifThen(equals(read(result), ''), () => {
          setVariableTo(result, '0')
          setVariableTo(resultScale, 0)
        })
      },
    )
    ifThen(not(equals(read(resultScale), 0)), () => {
      ifElse(
        gt(length(read(result)), read(resultScale)),
        () => {
          setVariableTo(chunkText, '')
          setVariableTo(i, 1)
          repeatUntil(gt(read(i), length(read(result))), () => {
            ifThen(
              equals(
                read(i),
                add(subtract(length(read(result)), read(resultScale)), 1),
              ),
              () => {
                setVariableTo(chunkText, join(read(chunkText), '.'))
              },
            )
            setVariableTo(
              chunkText,
              join(read(chunkText), letterOf(read(i), read(result))),
            )
            changeVariableBy(i, 1)
          })
        },
        () => {
          setVariableTo(chunkText, '0.')
          setVariableTo(
            paddingDigits,
            subtract(read(resultScale), length(read(result))),
          )
          setVariableTo(i, 1)
          repeatUntil(gt(read(i), read(paddingDigits)), () => {
            setVariableTo(chunkText, join(read(chunkText), '0'))
            changeVariableBy(i, 1)
          })
          setVariableTo(chunkText, join(read(chunkText), read(result)))
        },
      )
      setVariableTo(result, read(chunkText))
    })
    ifThen(
      and(equals(read(resultSign), -1), not(equals(read(result), '0'))),
      () => {
        setVariableTo(result, join('-', read(result)))
      },
    )
  })

  const applyRemainderSign = defineWarp('apply remainder sign', () => {
    ifThen(
      and(equals(read(leftSign), -1), not(equals(read(remainder), '0'))),
      () => {
        setVariableTo(remainder, join('-', read(remainder)))
      },
    )
  })

  const loadChudnovskyLeaf = defineWarp('load chudnovsky leaf', () => {
    deleteAllOfList(bsPChunks)
    addToList(bsPChunks, 1)

    ifElse(
      equals(read(piTermIndex), 0),
      () => {
        deleteAllOfList(bsQChunks)
        addToList(bsQChunks, 1)
        emitSetListToNumber(bsTChunks, 13591409, trimBsT)
        setVariableTo(bsTSign, 1)
      },
      () => {
        emitMultiplyListBySmall(
          bsPChunks,
          subtract(multiply(6, read(piTermIndex)), 5),
          bsAChunks,
          trimBsA,
        )
        emitCopyList(bsAChunks, bsPChunks, trimBsP)
        emitMultiplyListBySmall(
          bsPChunks,
          subtract(multiply(2, read(piTermIndex)), 1),
          bsAChunks,
          trimBsA,
        )
        emitCopyList(bsAChunks, bsPChunks, trimBsP)
        emitMultiplyListBySmall(
          bsPChunks,
          subtract(multiply(6, read(piTermIndex)), 1),
          bsAChunks,
          trimBsA,
        )
        emitCopyList(bsAChunks, bsPChunks, trimBsP)

        setVariableTo(bsLoadText, CHUDNOVSKY_C3_OVER_24)
        emitLoadTextToList(bsLoadText, bsQChunks, trimBsQ)
        emitMultiplyListBySmall(
          bsQChunks,
          read(piTermIndex),
          bsAChunks,
          trimBsA,
        )
        emitCopyList(bsAChunks, bsQChunks, trimBsQ)
        emitMultiplyListBySmall(
          bsQChunks,
          read(piTermIndex),
          bsAChunks,
          trimBsA,
        )
        emitCopyList(bsAChunks, bsQChunks, trimBsQ)
        emitMultiplyListBySmall(
          bsQChunks,
          read(piTermIndex),
          bsAChunks,
          trimBsA,
        )
        emitCopyList(bsAChunks, bsQChunks, trimBsQ)

        emitSetListToNumber(
          bsBChunks,
          add(13591409, multiply(545140134, read(piTermIndex))),
          trimBsB,
        )
        emitMultiplyLists(bsPChunks, bsBChunks, bsTChunks, trimBsT)
        ifElse(
          equals(mod(read(piTermIndex), 2), 1),
          () => {
            setVariableTo(bsTSign, -1)
          },
          () => {
            setVariableTo(bsTSign, 1)
          },
        )
      },
    )
  })

  const pushChudnovskyLeft = defineWarp('push chudnovsky left result', () => {
    emitPushStack(bsPChunks, bsStackPChunks, bsStackPLengths)
    emitPushStack(bsQChunks, bsStackQChunks, bsStackQLengths)
    emitPushStack(bsTChunks, bsStackTChunks, bsStackTLengths)
    addToList(bsStackTSigns, read(bsTSign))
  })

  const popChudnovskyLeft = defineWarp('pop chudnovsky left result', () => {
    emitPopStack(bsLeftPChunks, trimBsLeftP, bsStackPChunks, bsStackPLengths)
    emitPopStack(bsLeftQChunks, trimBsLeftQ, bsStackQChunks, bsStackQLengths)
    emitPopStack(bsLeftTChunks, trimBsLeftT, bsStackTChunks, bsStackTLengths)
    setVariableTo(
      bsLeftTSign,
      getItemOfList(bsStackTSigns, lengthOfList(bsStackTSigns)),
    )
    deleteOfList(bsStackTSigns, lengthOfList(bsStackTSigns))
  })

  const combineChudnovskySplit = defineWarp(
    'combine chudnovsky binary split',
    () => {
      emitMultiplyLists(bsLeftTChunks, bsQChunks, bsAChunks, trimBsA)
      setVariableTo(bsASign, read(bsLeftTSign))

      emitMultiplyLists(bsLeftPChunks, bsTChunks, bsBChunks, trimBsB)
      setVariableTo(bsBSign, read(bsTSign))

      ifElse(
        equals(read(bsASign), read(bsBSign)),
        () => {
          emitAddLists(bsAChunks, bsBChunks, bsTChunks, trimBsT)
          setVariableTo(bsTSign, read(bsASign))
        },
        () => {
          emitCompareLists(bsAChunks, bsBChunks, trimBsA, trimBsB)
          ifElse(
            equals(read(cmp), 0),
            () => {
              deleteAllOfList(bsTChunks)
              addToList(bsTChunks, 0)
              setVariableTo(bsTSign, 1)
            },
            () => {
              ifElse(
                gt(read(cmp), 0),
                () => {
                  emitSubtractLists(bsAChunks, bsBChunks, bsTChunks, trimBsT)
                  setVariableTo(bsTSign, read(bsASign))
                },
                () => {
                  emitSubtractLists(bsBChunks, bsAChunks, bsTChunks, trimBsT)
                  setVariableTo(bsTSign, read(bsBSign))
                },
              )
            },
          )
        },
      )

      emitMultiplyLists(bsLeftPChunks, bsPChunks, bsPChunks, trimBsP)
      emitMultiplyLists(bsLeftQChunks, bsQChunks, bsQChunks, trimBsQ)
    },
  )

  const computePiSplit = defineProcedure(
    [
      procedureLabel('binary split chudnovsky'),
      procedureStringOrNumber('lo'),
      procedureStringOrNumber('hi'),
    ],
    ({ lo, hi }) => {
      ifElse(
        equals(subtract(hi.getter(), lo.getter()), 1),
        () => {
          setVariableTo(piTermIndex, lo.getter())
          callProcedure(loadChudnovskyLeaf, {})
        },
        () => {
          setVariableTo(
            bsMid,
            mathop('floor', divide(add(lo.getter(), hi.getter()), 2)),
          )
          callProcedure(
            CHUDNOVSKY_SPLIT_PROCCODE,
            [lo.id, hi.id],
            {
              [lo.id]: lo.getter(),
              [hi.id]: read(bsMid),
            },
            true,
          )
          callProcedure(pushChudnovskyLeft, {})

          setVariableTo(
            bsMid,
            mathop('floor', divide(add(lo.getter(), hi.getter()), 2)),
          )
          callProcedure(
            CHUDNOVSKY_SPLIT_PROCCODE,
            [lo.id, hi.id],
            {
              [lo.id]: read(bsMid),
              [hi.id]: hi.getter(),
            },
            true,
          )
          callProcedure(popChudnovskyLeft, {})
          callProcedure(combineChudnovskySplit, {})
        },
      )
      return undefined
    },
    true,
  )
  const bsSplitLoArgId = computePiSplit.reference.argumentids[0] ?? ''
  const bsSplitHiArgId = computePiSplit.reference.argumentids[1] ?? ''

  const drawProgressFrame = () => {
    callProcedure('draw pen frame', [], {}, true)
    wait(0)
  }

  const computeSqrt10005 = defineWarp('load sqrt 10005 scaled', () => {
    setVariableTo(status, 'LOAD SQRT CONST')
    setVariableTo(benchmarkReport, 'SQRT CONST')
    drawProgressFrame()
    setVariableTo(bsLoadText, '')
    setVariableTo(value, add(read(piScaleDigits), 3))
    setVariableTo(i, 1)
    repeatUntil(gt(read(i), read(value)), () => {
      setVariableTo(
        bsLoadText,
        join(read(bsLoadText), letterOf(read(i), SQRT10005_SCALED_DIGITS)),
      )
      changeVariableBy(i, 1)
    })
    emitLoadTextToList(bsLoadText, bsSqrtChunks, trimBsSqrt)
  })

  const updatePiPage = defineWarp('update pi page text', () => {
    ifThen(lt(read(piPageSize), 1), () => {
      setVariableTo(piPageSize, 1000)
    })
    setVariableTo(
      piPageCount,
      mathop('ceiling', divide(read(piDigits), read(piPageSize))),
    )
    ifThen(lt(read(piPageCount), 1), () => {
      setVariableTo(piPageCount, 1)
    })
    ifThen(lt(read(piPageIndex), 1), () => {
      setVariableTo(piPageIndex, 1)
    })
    ifThen(gt(read(piPageIndex), read(piPageCount)), () => {
      setVariableTo(piPageIndex, read(piPageCount))
    })

    setVariableTo(
      piPageStartDigit,
      add(multiply(subtract(read(piPageIndex), 1), read(piPageSize)), 1),
    )
    setVariableTo(
      piPageEndDigit,
      add(read(piPageStartDigit), subtract(read(piPageSize), 1)),
    )
    ifThen(gt(read(piPageEndDigit), read(piDigits)), () => {
      setVariableTo(piPageEndDigit, read(piDigits))
    })

    setVariableTo(piPageText, '')
    ifThen(gt(length(read(result)), 0), () => {
      ifThen(equals(read(piPageIndex), 1), () => {
        setVariableTo(piPageText, '3.')
      })
      setVariableTo(i, read(piPageStartDigit))
      repeatUntil(gt(read(i), read(piPageEndDigit)), () => {
        setVariableTo(k, add(read(i), 2))
        ifThen(not(gt(read(k), length(read(result)))), () => {
          setVariableTo(
            piPageText,
            join(read(piPageText), letterOf(read(k), read(result))),
          )
        })
        changeVariableBy(i, 1)
      })
    })
  })

  const finalizeChudnovskyPi = defineProcedure(
    [procedureLabel('finalize chudnovsky pi')],
    () => {
      setVariableTo(status, 'FINAL MULTIPLY')
      setVariableTo(piProgress, 87)
      setVariableTo(benchmarkReport, 'Q*SQRT')
      drawProgressFrame()
      emitMultiplyLists(bsQChunks, bsSqrtChunks, bsAChunks, trimBsA)

      setVariableTo(piProgress, 89)
      setVariableTo(benchmarkReport, '*426880')
      drawProgressFrame()
      emitMultiplyListBySmall(bsAChunks, 426880, bsBChunks, trimBsB)

      setVariableTo(status, 'FINAL DIVISION')
      setVariableTo(piProgress, 91)
      setVariableTo(benchmarkReport, 'DIVIDE')
      drawProgressFrame()
      emitCopyList(bsBChunks, aChunks, trimA)
      emitCopyList(bsTChunks, bChunks, trimB)
      callProcedure(divideChunkLists, {})

      setVariableTo(piProgress, 95)
      setVariableTo(benchmarkReport, 'FORMAT')
      drawProgressFrame()
      callProcedure(quotientToText, {})
      setVariableTo(resultScale, read(piScaleDigits))
      setVariableTo(resultSign, 1)
      callProcedure(applyResultSign, {})

      setVariableTo(piDisplayLimit, add(read(piDigits), 2))
      ifThen(gt(length(read(result)), read(piDisplayLimit)), () => {
        setVariableTo(chunkText, '')
        setVariableTo(i, 1)
        repeatUntil(gt(read(i), read(piDisplayLimit)), () => {
          setVariableTo(
            chunkText,
            join(read(chunkText), letterOf(read(i), read(result))),
          )
          changeVariableBy(i, 1)
        })
        setVariableTo(result, read(chunkText))
      })
      setVariableTo(piPageIndex, 1)
      callProcedure(updatePiPage, {})
      return undefined
    },
    false,
  )

  const _computePiArctan = defineWarp('compute pi arctan', () => {
    callProcedure(loadPiScaleChunks, {})
    setVariableTo(piSmallDivisor, read(piQ))
    callProcedure(dividePiTermBySmall, {})
    callProcedure(copyPiWorkToTerm, {})
    callProcedure(copyPiTermToSum, {})
    setVariableTo(piTermIndex, 1)
    setVariableTo(piSign, -1)
    callProcedure(measurePiTerm, {})
    repeatUntil(
      or(
        equals(read(piTermIsZero), 1),
        gt(read(piTermIndex), add(read(piScaleDigits), 10)),
      ),
      () => {
        setVariableTo(piSmallDivisor, multiply(read(piQ), read(piQ)))
        callProcedure(dividePiTermBySmall, {})
        callProcedure(copyPiWorkToTerm, {})
        callProcedure(measurePiTerm, {})
        ifThen(equals(read(piTermIsZero), 0), () => {
          setVariableTo(piSmallDivisor, add(multiply(read(piTermIndex), 2), 1))
          callProcedure(dividePiTermBySmall, {})
          ifElse(
            equals(read(piSign), 1),
            () => {
              callProcedure(addPiWorkToSum, {})
            },
            () => {
              callProcedure(subtractPiWorkFromSum, {})
            },
          )
          setVariableTo(piSign, multiply(read(piSign), -1))
        })
        changeVariableBy(piTermIndex, 1)
      },
    )
    callProcedure(copyPiSumToArctan, {})
  })

  const computePi = defineProcedure(
    [procedureLabel('compute pi with chudnovsky')],
    () => {
      setVariableTo(piDigits, mathop('floor', mathop('abs', read(piDigits))))
      ifThen(lt(read(piDigits), 1), () => {
        setVariableTo(piDigits, 1)
      })
      setVariableTo(
        piGuardDigits,
        mathop('floor', mathop('abs', read(piGuardDigits))),
      )
      ifThen(lt(read(piGuardDigits), 4), () => {
        setVariableTo(piGuardDigits, 4)
      })
      ifThen(gt(read(piGuardDigits), subtract(SQRT10005_MAX_SCALE, 1)), () => {
        setVariableTo(piGuardDigits, 8)
      })
      setVariableTo(piScaleDigits, add(read(piDigits), read(piGuardDigits)))
      ifThen(gt(read(piScaleDigits), SQRT10005_MAX_SCALE), () => {
        setVariableTo(piScaleDigits, SQRT10005_MAX_SCALE)
        setVariableTo(
          piDigits,
          subtract(SQRT10005_MAX_SCALE, read(piGuardDigits)),
        )
        ifThen(lt(read(piDigits), 1), () => {
          setVariableTo(piDigits, 1)
        })
      })
      setVariableTo(piProgress, 5)
      setVariableTo(benchmarkReport, 'NORMALIZING INPUT')
      setVariableTo(status, 'PREPARING')
      drawProgressFrame()

      setVariableTo(
        piTermLimit,
        add(
          mathop(
            'floor',
            divide(read(piScaleDigits), CHUDNOVSKY_DIGITS_PER_TERM),
          ),
          2,
        ),
      )

      deleteAllOfList(bsStackPChunks)
      deleteAllOfList(bsStackPLengths)
      deleteAllOfList(bsStackQChunks)
      deleteAllOfList(bsStackQLengths)
      deleteAllOfList(bsStackTChunks)
      deleteAllOfList(bsStackTLengths)
      deleteAllOfList(bsStackTSigns)

      setVariableTo(status, 'SQRT 10005')
      setVariableTo(piProgress, 15)
      setVariableTo(benchmarkReport, 'SQRT START')
      drawProgressFrame()
      callProcedure(computeSqrt10005, {})
      setVariableTo(piProgress, 35)
      setVariableTo(benchmarkReport, 'SQRT READY')
      drawProgressFrame()

      setVariableTo(status, join('BINARY SPLIT TERMS=', read(piTermLimit)))
      setVariableTo(piProgress, 40)
      setVariableTo(benchmarkReport, join('TERMS=', read(piTermLimit)))
      drawProgressFrame()
      callProcedure(
        CHUDNOVSKY_SPLIT_PROCCODE,
        [bsSplitLoArgId, bsSplitHiArgId],
        {
          [bsSplitLoArgId]: 0,
          [bsSplitHiArgId]: read(piTermLimit),
        },
        true,
      )
      setVariableTo(piProgress, 75)
      setVariableTo(benchmarkReport, 'P/Q/T READY')
      drawProgressFrame()

      setVariableTo(status, 'FINAL DIVISION')
      setVariableTo(piProgress, 85)
      setVariableTo(benchmarkReport, 'Q*SQRT/T')
      drawProgressFrame()
      callProcedure(finalizeChudnovskyPi, {})
      setVariableTo(remainder, 'CHUDNOVSKY BINARY SPLITTING')
      setVariableTo(piProgress, 100)
      setVariableTo(benchmarkReport, 'PI READY')
      setVariableTo(status, 'PI READY')
      return undefined
    },
    false,
  )

  const normalizeBenchmarkSettings = defineWarp(
    'normalize benchmark settings',
    () => {
      setVariableTo(
        benchmarkDigits,
        mathop('floor', mathop('abs', read(benchmarkDigits))),
      )
      ifThen(lt(read(benchmarkDigits), 1), () => {
        setVariableTo(benchmarkDigits, 1)
      })
      setVariableTo(
        benchmarkScale,
        mathop('floor', mathop('abs', read(benchmarkScale))),
      )
      setVariableTo(
        divisionPrecision,
        mathop('floor', mathop('abs', read(divisionPrecision))),
      )
      setVariableTo(
        benchmarkRepeats,
        mathop('floor', mathop('abs', read(benchmarkRepeats))),
      )
      ifThen(lt(read(benchmarkRepeats), 1), () => {
        setVariableTo(benchmarkRepeats, 1)
      })
      setVariableTo(
        benchmarkSeed,
        mathop('floor', mathop('abs', read(benchmarkSeed))),
      )
    },
  )

  const generateLeftBenchmarkInput = defineWarp(
    'generate left benchmark input',
    () => {
      setVariableTo(leftInput, '')
      setVariableTo(
        integerDigits,
        subtract(read(benchmarkDigits), read(benchmarkScale)),
      )
      ifThen(lt(read(integerDigits), 1), () => {
        setVariableTo(leftInput, '0.')
        setVariableTo(
          paddingDigits,
          subtract(read(benchmarkScale), read(benchmarkDigits)),
        )
        setVariableTo(i, 1)
        repeatUntil(gt(read(i), read(paddingDigits)), () => {
          setVariableTo(leftInput, join(read(leftInput), '0'))
          changeVariableBy(i, 1)
        })
      })
      setVariableTo(
        generatorState,
        mod(add(multiply(read(benchmarkSeed), 109), 907), 10000),
      )
      setVariableTo(i, 1)
      repeatUntil(gt(read(i), read(benchmarkDigits)), () => {
        ifElse(
          equals(read(i), 1),
          () => {
            setVariableTo(chunkText, add(1, mod(read(generatorState), 9)))
          },
          () => {
            setVariableTo(
              generatorState,
              mod(add(multiply(read(generatorState), 73), 19), 10000),
            )
            setVariableTo(chunkText, mod(read(generatorState), 10))
          },
        )
        setVariableTo(leftInput, join(read(leftInput), read(chunkText)))
        ifThen(
          and(
            and(
              gt(read(integerDigits), 0),
              equals(read(i), read(integerDigits)),
            ),
            gt(read(benchmarkScale), 0),
          ),
          () => {
            setVariableTo(leftInput, join(read(leftInput), '.'))
          },
        )
        changeVariableBy(i, 1)
      })
    },
  )

  const generateRightBenchmarkInput = defineWarp(
    'generate right benchmark input',
    () => {
      setVariableTo(rightInput, '')
      setVariableTo(
        integerDigits,
        subtract(read(benchmarkDigits), read(benchmarkScale)),
      )
      ifThen(lt(read(integerDigits), 1), () => {
        setVariableTo(rightInput, '0.')
        setVariableTo(
          paddingDigits,
          subtract(read(benchmarkScale), read(benchmarkDigits)),
        )
        setVariableTo(i, 1)
        repeatUntil(gt(read(i), read(paddingDigits)), () => {
          setVariableTo(rightInput, join(read(rightInput), '0'))
          changeVariableBy(i, 1)
        })
      })
      setVariableTo(
        generatorState,
        mod(add(multiply(read(benchmarkSeed), 131), 571), 10000),
      )
      setVariableTo(i, 1)
      repeatUntil(gt(read(i), read(benchmarkDigits)), () => {
        ifElse(
          equals(read(i), 1),
          () => {
            setVariableTo(chunkText, add(1, mod(read(generatorState), 9)))
          },
          () => {
            setVariableTo(
              generatorState,
              mod(add(multiply(read(generatorState), 89), 43), 10000),
            )
            setVariableTo(
              chunkText,
              mod(add(read(generatorState), read(i)), 10),
            )
          },
        )
        setVariableTo(rightInput, join(read(rightInput), read(chunkText)))
        ifThen(
          and(
            and(
              gt(read(integerDigits), 0),
              equals(read(i), read(integerDigits)),
            ),
            gt(read(benchmarkScale), 0),
          ),
          () => {
            setVariableTo(rightInput, join(read(rightInput), '.'))
          },
        )
        changeVariableBy(i, 1)
      })
    },
  )

  const _generateBenchmarkOperands = defineWarp(
    'generate benchmark operands',
    () => {
      callProcedure(normalizeBenchmarkSettings, {})
      callProcedure(generateLeftBenchmarkInput, {})
      callProcedure(generateRightBenchmarkInput, {})
      setVariableTo(
        benchmarkReport,
        join(
          join(
            join('generated digits=', read(benchmarkDigits)),
            join(' scale=', read(benchmarkScale)),
          ),
          join(' seed=', read(benchmarkSeed)),
        ),
      )
      setVariableTo(status, 'benchmark operands generated')
    },
  )

  const refreshDigitViews = defineWarp('refresh digit views', () => {
    setVariableTo(leftDigitsView, length(read(leftInput)))
    setVariableTo(rightDigitsView, length(read(rightInput)))
    ifThen(
      and(
        gt(length(read(leftInput)), 0),
        equals(letterOf(1, read(leftInput)), '-'),
      ),
      () => {
        changeVariableBy(leftDigitsView, -1)
      },
    )
    ifThen(
      and(
        gt(length(read(rightInput)), 0),
        equals(letterOf(1, read(rightInput)), '-'),
      ),
      () => {
        changeVariableBy(rightDigitsView, -1)
      },
    )
    ifThen(contains(read(leftInput), '.'), () => {
      changeVariableBy(leftDigitsView, -1)
    })
    ifThen(contains(read(rightInput), '.'), () => {
      changeVariableBy(rightDigitsView, -1)
    })
    ifElse(
      and(
        equals(read(benchmarkMode), 'bench'),
        equals(read(benchmarkAccuracy), 'fast'),
      ),
      () => {
        setVariableTo(resultDigitsView, read(benchmarkResultDigits))
      },
      () => {
        setVariableTo(resultDigitsView, length(read(result)))
        ifThen(
          and(
            gt(length(read(result)), 0),
            equals(letterOf(1, read(result)), '-'),
          ),
          () => {
            setVariableTo(resultDigitsView, subtract(length(read(result)), 1))
          },
        )
        ifThen(contains(read(result), '.'), () => {
          changeVariableBy(resultDigitsView, -1)
        })
      },
    )
  })

  const _updateBenchmarkReport = defineWarp('update benchmark report', () => {
    callProcedure(refreshDigitViews, {})
    setVariableTo(
      benchmarkReport,
      join(
        join(
          join(
            join('mode=', read(benchmarkMode)),
            join(' op=', read(operation)),
          ),
          join(
            join(
              join(' accuracy=', read(benchmarkAccuracy)),
              join(' L=', read(leftDigitsView)),
            ),
            join(' R=', read(rightDigitsView)),
          ),
        ),
        join(
          join(
            join(' resultDigits=', read(resultDigitsView)),
            join(' totalMs=', read(elapsedMs)),
          ),
          join(
            join(' avgMs=', read(avgMs)),
            join(' repeats=', read(benchmarkRepeats)),
          ),
        ),
      ),
    )
  })

  const drawText = defineWarp('pen draw text value', () => {
    setVariableTo(drawCursorX, read(drawStartX))
    setVariableTo(drawCursorY, read(drawStartY))
    setVariableTo(drawColumn, 0)
    setVariableTo(i, 1)
    setPenColorTo(read(drawColor))
    setPenSizeTo(read(drawSize))
    repeatUntil(
      or(gt(read(i), length(read(drawTextValue))), lt(read(drawCursorY), -168)),
      () => {
        setVariableTo(drawChar, letterOf(read(i), read(drawTextValue)))
        ifElse(
          equals(read(drawChar), '|'),
          () => {
            setVariableTo(drawCursorX, read(drawStartX))
            changeVariableBy(drawCursorY, multiply(read(drawSize), -10))
            setVariableTo(drawColumn, 0)
          },
          () => {
            setVariableTo(
              drawCharNum,
              getItemNumOfList(fontChars, read(drawChar)),
            )
            ifThen(equals(read(drawCharNum), 0), () => {
              setVariableTo(drawCharNum, lengthOfList(fontStrings))
            })
            setVariableTo(
              drawFont,
              getItemOfList(fontStrings, read(drawCharNum)),
            )
            setVariableTo(drawRow, 0)
            repeatUntil(gt(read(drawRow), 6), () => {
              setVariableTo(drawCol, 0)
              repeatUntil(gt(read(drawCol), 4), () => {
                setVariableTo(
                  drawPixelIndex,
                  add(multiply(read(drawRow), 5), add(read(drawCol), 1)),
                )
                ifThen(
                  equals(letterOf(read(drawPixelIndex), read(drawFont)), '1'),
                  () => {
                    gotoXY(
                      add(
                        read(drawCursorX),
                        multiply(read(drawCol), read(drawSize)),
                      ),
                      subtract(
                        read(drawCursorY),
                        multiply(read(drawRow), read(drawSize)),
                      ),
                    )
                    penDown()
                    changeXBy(0.5)
                    penUp()
                  },
                )
                changeVariableBy(drawCol, 1)
              })
              changeVariableBy(drawRow, 1)
            })
            changeVariableBy(drawCursorX, multiply(read(drawSize), 7))
            changeVariableBy(drawColumn, 1)
            ifThen(gt(read(drawColumn), read(drawMaxColumns)), () => {
              setVariableTo(drawCursorX, read(drawStartX))
              changeVariableBy(drawCursorY, multiply(read(drawSize), -10))
              setVariableTo(drawColumn, 0)
            })
          },
        )
        changeVariableBy(i, 1)
      },
    )
  })

  const drawFrame = defineWarp('draw pen frame', () => {
    eraseAll()
    penUp()

    setPenColorTo('#101312')
    setPenSizeTo(360)
    gotoXY(-240, 0)
    penDown()
    gotoXY(240, 0)
    penUp()

    setPenColorTo('#173c35')
    setPenSizeTo(54)
    gotoXY(-232, 136)
    penDown()
    gotoXY(232, 136)
    penUp()

    setPenColorTo('#25302c')
    setPenSizeTo(76)
    gotoXY(-232, 75)
    penDown()
    gotoXY(232, 75)
    penUp()

    setPenColorTo('#1a1f1d')
    setPenSizeTo(196)
    gotoXY(-232, -48)
    penDown()
    gotoXY(232, -48)
    penUp()

    setVariableTo(drawTextValue, 'PI DIGIT CALCULATOR')
    setVariableTo(drawStartX, -226)
    setVariableTo(drawStartY, 158)
    setVariableTo(drawSize, 2.7)
    setVariableTo(drawMaxColumns, 26)
    setVariableTo(drawColor, '#fff7ed')
    callProcedure(drawText, {})

    setVariableTo(drawTextValue, 'CHUDNOVSKY BINARY SPLIT')
    setVariableTo(drawStartX, -224)
    setVariableTo(drawStartY, 129)
    setVariableTo(drawSize, 1.45)
    setVariableTo(drawMaxColumns, 39)
    setVariableTo(drawColor, '#fbbf24')
    callProcedure(drawText, {})

    setVariableTo(drawTextValue, join('STATUS: ', read(status)))
    setVariableTo(drawStartX, -224)
    setVariableTo(drawStartY, 105)
    setVariableTo(drawSize, 1.35)
    setVariableTo(drawMaxColumns, 46)
    setVariableTo(drawColor, '#d1fae5')
    callProcedure(drawText, {})

    setVariableTo(
      drawTextValue,
      join(
        join('DIGITS: ', read(piDigits)),
        join(
          join('  GUARD: ', read(piGuardDigits)),
          join('  MS: ', round(read(elapsedMs))),
        ),
      ),
    )
    setVariableTo(drawStartX, -224)
    setVariableTo(drawStartY, 86)
    setVariableTo(drawSize, 1.35)
    setVariableTo(drawMaxColumns, 46)
    setVariableTo(drawColor, '#86efac')
    callProcedure(drawText, {})

    setVariableTo(
      drawTextValue,
      join(
        join('PROGRESS: ', read(piProgress)),
        join('/100  ', read(benchmarkReport)),
      ),
    )
    setVariableTo(drawStartX, -224)
    setVariableTo(drawStartY, 67)
    setVariableTo(drawSize, 1.15)
    setVariableTo(drawMaxColumns, 57)
    setVariableTo(drawColor, '#c4b5fd')
    callProcedure(drawText, {})

    ifElse(
      gt(length(read(result)), 0),
      () => {
        setVariableTo(
          drawTextValue,
          join(
            join('PI PAGE ', read(piPageIndex)),
            join(
              join('/', read(piPageCount)),
              join(
                join('  DIGITS ', read(piPageStartDigit)),
                join('-', read(piPageEndDigit)),
              ),
            ),
          ),
        )
      },
      () => {
        setVariableTo(drawTextValue, 'PI:')
      },
    )
    setVariableTo(drawStartX, -224)
    setVariableTo(drawStartY, 42)
    setVariableTo(drawSize, 1.35)
    setVariableTo(drawMaxColumns, 48)
    setVariableTo(drawColor, '#fde68a')
    callProcedure(drawText, {})

    setVariableTo(drawTextValue, read(piPageText))
    setVariableTo(drawStartX, -226)
    setVariableTo(drawStartY, 21)
    setVariableTo(drawSize, 1)
    setVariableTo(drawMaxColumns, 59)
    setVariableTo(drawColor, '#f8fafc')
    callProcedure(drawText, {})
  })

  whenKeyPressed('right arrow', () => {
    ifThen(
      and(
        gt(length(read(result)), 0),
        lt(read(piPageIndex), read(piPageCount)),
      ),
      () => {
        changeVariableBy(piPageIndex, 1)
        callProcedure(updatePiPage, {})
        callProcedure(drawFrame, {})
      },
    )
  })

  whenKeyPressed('left arrow', () => {
    ifThen(and(gt(length(read(result)), 0), gt(read(piPageIndex), 1)), () => {
      changeVariableBy(piPageIndex, -1)
      callProcedure(updatePiPage, {})
      callProcedure(drawFrame, {})
    })
  })

  const performSignedSum = defineWarp('perform signed sum', () => {
    callProcedure(alignDecimalScales, {})
    callProcedure(compareMagnitudeText, {})
    ifElse(
      equals(read(leftSign), read(effectiveRightSign)),
      () => {
        callProcedure(loadLeftChunks, {})
        callProcedure(loadRightChunks, {})
        callProcedure(addChunkLists, {})
        callProcedure(resultToText, {})
        setVariableTo(resultSign, read(leftSign))
      },
      () => {
        ifElse(
          equals(read(cmp), 0),
          () => {
            setVariableTo(result, '0')
            setVariableTo(resultSign, 1)
          },
          () => {
            ifElse(
              gt(read(cmp), 0),
              () => {
                callProcedure(loadLeftChunks, {})
                callProcedure(loadRightChunks, {})
                callProcedure(subtractAB, {})
                callProcedure(resultToText, {})
                setVariableTo(resultSign, read(leftSign))
              },
              () => {
                callProcedure(loadLeftChunks, {})
                callProcedure(loadRightChunks, {})
                callProcedure(subtractBA, {})
                callProcedure(resultToText, {})
                setVariableTo(resultSign, read(effectiveRightSign))
              },
            )
          },
        )
      },
    )
    callProcedure(applyResultSign, {})
    setVariableTo(remainder, 'exact decimal')
    setVariableTo(status, 'ok')
  })

  const performMultiply = defineWarp('perform multiply', () => {
    ifElse(
      or(equals(read(leftMag), '0'), equals(read(rightMag), '0')),
      () => {
        setVariableTo(result, '0')
        setVariableTo(resultSign, 1)
        setVariableTo(resultScale, 0)
      },
      () => {
        setVariableTo(resultScale, add(read(leftScale), read(rightScale)))
        callProcedure(fftMultiplyDigits, {})
        setVariableTo(resultSign, multiply(read(leftSign), read(rightSign)))
        callProcedure(applyResultSign, {})
        setVariableTo(status, 'ok (fft multiply)')
      },
    )
    setVariableTo(remainder, 'exact decimal')
    ifThen(equals(read(result), '0'), () => {
      setVariableTo(status, 'ok')
    })
  })

  const performDivide = defineWarp('perform divide', () => {
    setVariableTo(
      divisionPrecision,
      mathop('floor', mathop('abs', read(divisionPrecision))),
    )
    ifElse(
      equals(read(rightMag), '0'),
      () => {
        setVariableTo(result, 'error')
        setVariableTo(remainder, '')
        setVariableTo(status, 'division by zero')
      },
      () => {
        ifElse(
          equals(read(leftMag), '0'),
          () => {
            setVariableTo(result, '0')
            setVariableTo(remainder, '0')
            setVariableTo(resultScale, 0)
            setVariableTo(status, 'ok')
          },
          () => {
            setVariableTo(
              paddingDigits,
              add(read(rightScale), read(divisionPrecision)),
            )
            setVariableTo(i, 1)
            repeatUntil(gt(read(i), read(paddingDigits)), () => {
              setVariableTo(leftMag, join(read(leftMag), '0'))
              changeVariableBy(i, 1)
            })
            setVariableTo(i, 1)
            repeatUntil(gt(read(i), read(leftScale)), () => {
              setVariableTo(rightMag, join(read(rightMag), '0'))
              changeVariableBy(i, 1)
            })
            callProcedure(loadLeftChunks, {})
            callProcedure(loadRightChunks, {})
            callProcedure(divideChunkLists, {})
            callProcedure(quotientToText, {})
            callProcedure(remainderToText, {})
            setVariableTo(resultScale, read(divisionPrecision))
            setVariableTo(resultSign, multiply(read(leftSign), read(rightSign)))
            callProcedure(applyResultSign, {})
            callProcedure(applyRemainderSign, {})
            setVariableTo(remainder, join('scaled remainder=', read(remainder)))
            setVariableTo(status, 'ok (truncated division)')
          },
        )
      },
    )
  })

  const performCompare = defineWarp('perform compare', () => {
    ifElse(
      gt(read(leftSign), read(rightSign)),
      () => {
        setVariableTo(result, 1)
      },
      () => {
        ifElse(
          lt(read(leftSign), read(rightSign)),
          () => {
            setVariableTo(result, -1)
          },
          () => {
            callProcedure(alignDecimalScales, {})
            callProcedure(compareMagnitudeText, {})
            ifElse(
              equals(read(leftSign), 1),
              () => {
                setVariableTo(result, read(cmp))
              },
              () => {
                setVariableTo(result, multiply(-1, read(cmp)))
              },
            )
          },
        )
      },
    )
    setVariableTo(remainder, 'comparison only')
    setVariableTo(status, 'ok')
  })

  const _runFastBenchmarkOperation = defineWarp(
    'run fast benchmark operation',
    () => {
      setVariableTo(result, '(suppressed)')
      setVariableTo(remainder, '(suppressed)')
      setVariableTo(status, 'running benchmark fast path')
      setVariableTo(inputValid, 1)
      setVariableTo(benchmarkResultDigits, 0)
      callProcedure(parseLeft, {})
      ifThen(equals(read(inputValid), 1), () => {
        callProcedure(parseRight, {})
      })
      ifElse(
        equals(read(inputValid), 0),
        () => {
          setVariableTo(result, 'error')
          setVariableTo(benchmarkResultDigits, 0)
        },
        () => {
          ifElse(
            equals(read(operation), '+'),
            () => {
              setVariableTo(effectiveRightSign, read(rightSign))
              callProcedure(alignDecimalScales, {})
              callProcedure(compareMagnitudeText, {})
              ifElse(
                equals(read(leftSign), read(effectiveRightSign)),
                () => {
                  callProcedure(loadLeftChunks, {})
                  callProcedure(loadRightChunks, {})
                  callProcedure(addChunkLists, {})
                  callProcedure(measureResultChunkDigits, {})
                },
                () => {
                  ifElse(
                    equals(read(cmp), 0),
                    () => {
                      setVariableTo(benchmarkResultDigits, 1)
                    },
                    () => {
                      ifElse(
                        gt(read(cmp), 0),
                        () => {
                          callProcedure(loadLeftChunks, {})
                          callProcedure(loadRightChunks, {})
                          callProcedure(subtractAB, {})
                          callProcedure(measureResultChunkDigits, {})
                        },
                        () => {
                          callProcedure(loadLeftChunks, {})
                          callProcedure(loadRightChunks, {})
                          callProcedure(subtractBA, {})
                          callProcedure(measureResultChunkDigits, {})
                        },
                      )
                    },
                  )
                },
              )
              setVariableTo(status, 'benchmark fast mode')
            },
            () => {
              ifElse(
                equals(read(operation), '-'),
                () => {
                  setVariableTo(
                    effectiveRightSign,
                    multiply(-1, read(rightSign)),
                  )
                  callProcedure(alignDecimalScales, {})
                  callProcedure(compareMagnitudeText, {})
                  ifElse(
                    equals(read(leftSign), read(effectiveRightSign)),
                    () => {
                      callProcedure(loadLeftChunks, {})
                      callProcedure(loadRightChunks, {})
                      callProcedure(addChunkLists, {})
                      callProcedure(measureResultChunkDigits, {})
                    },
                    () => {
                      ifElse(
                        equals(read(cmp), 0),
                        () => {
                          setVariableTo(benchmarkResultDigits, 1)
                        },
                        () => {
                          ifElse(
                            gt(read(cmp), 0),
                            () => {
                              callProcedure(loadLeftChunks, {})
                              callProcedure(loadRightChunks, {})
                              callProcedure(subtractAB, {})
                              callProcedure(measureResultChunkDigits, {})
                            },
                            () => {
                              callProcedure(loadLeftChunks, {})
                              callProcedure(loadRightChunks, {})
                              callProcedure(subtractBA, {})
                              callProcedure(measureResultChunkDigits, {})
                            },
                          )
                        },
                      )
                    },
                  )
                  setVariableTo(status, 'benchmark fast mode')
                },
                () => {
                  ifElse(
                    or(
                      equals(read(operation), '*'),
                      equals(read(operation), 'x'),
                    ),
                    () => {
                      ifElse(
                        or(
                          equals(read(leftMag), '0'),
                          equals(read(rightMag), '0'),
                        ),
                        () => {
                          setVariableTo(benchmarkResultDigits, 1)
                        },
                        () => {
                          callProcedure(fftMultiplyDigitsFast, {})
                        },
                      )
                      setVariableTo(status, 'benchmark fast mode')
                    },
                    () => {
                      ifElse(
                        or(
                          equals(read(operation), '/'),
                          equals(read(operation), '÷'),
                        ),
                        () => {
                          ifElse(
                            equals(read(rightMag), '0'),
                            () => {
                              setVariableTo(result, 'error')
                              setVariableTo(remainder, '')
                              setVariableTo(status, 'division by zero')
                              setVariableTo(benchmarkResultDigits, 0)
                            },
                            () => {
                              setVariableTo(
                                divisionPrecision,
                                mathop(
                                  'floor',
                                  mathop('abs', read(divisionPrecision)),
                                ),
                              )
                              ifElse(
                                equals(read(leftMag), '0'),
                                () => {
                                  setVariableTo(benchmarkResultDigits, 1)
                                },
                                () => {
                                  setVariableTo(
                                    paddingDigits,
                                    add(
                                      read(rightScale),
                                      read(divisionPrecision),
                                    ),
                                  )
                                  setVariableTo(i, 1)
                                  repeatUntil(
                                    gt(read(i), read(paddingDigits)),
                                    () => {
                                      setVariableTo(
                                        leftMag,
                                        join(read(leftMag), '0'),
                                      )
                                      changeVariableBy(i, 1)
                                    },
                                  )
                                  setVariableTo(i, 1)
                                  repeatUntil(
                                    gt(read(i), read(leftScale)),
                                    () => {
                                      setVariableTo(
                                        rightMag,
                                        join(read(rightMag), '0'),
                                      )
                                      changeVariableBy(i, 1)
                                    },
                                  )
                                  callProcedure(loadLeftChunks, {})
                                  callProcedure(loadRightChunks, {})
                                  callProcedure(divideChunkLists, {})
                                  callProcedure(measureQuotientChunkDigits, {})
                                },
                              )
                              setVariableTo(status, 'benchmark fast mode')
                            },
                          )
                        },
                        () => {
                          ifElse(
                            or(
                              equals(read(operation), 'cmp'),
                              equals(read(operation), 'compare'),
                            ),
                            () => {
                              callProcedure(performCompare, {})
                              setVariableTo(result, '(cmp done)')
                              setVariableTo(remainder, '(suppressed)')
                              setVariableTo(benchmarkResultDigits, 1)
                              setVariableTo(status, 'benchmark fast mode')
                            },
                            () => {
                              setVariableTo(result, '?')
                              setVariableTo(remainder, '')
                              setVariableTo(
                                status,
                                'unknown op: use +, -, *, /, cmp',
                              )
                              setVariableTo(benchmarkResultDigits, 0)
                            },
                          )
                        },
                      )
                    },
                  )
                },
              )
            },
          )
        },
      )
      callProcedure(refreshDigitViews, {})
    },
  )

  const _runOperation = defineWarp('run current operation', () => {
    setVariableTo(result, '')
    setVariableTo(remainder, '')
    setVariableTo(status, 'running exact decimal')
    setVariableTo(inputValid, 1)
    callProcedure(parseLeft, {})
    ifThen(equals(read(inputValid), 1), () => {
      callProcedure(parseRight, {})
    })
    ifElse(
      equals(read(inputValid), 0),
      () => {
        setVariableTo(result, 'error')
      },
      () => {
        ifElse(
          equals(read(operation), '+'),
          () => {
            setVariableTo(effectiveRightSign, read(rightSign))
            callProcedure(performSignedSum, {})
          },
          () => {
            ifElse(
              equals(read(operation), '-'),
              () => {
                setVariableTo(effectiveRightSign, multiply(-1, read(rightSign)))
                callProcedure(performSignedSum, {})
              },
              () => {
                ifElse(
                  or(
                    equals(read(operation), '*'),
                    equals(read(operation), 'x'),
                  ),
                  () => {
                    callProcedure(performMultiply, {})
                  },
                  () => {
                    ifElse(
                      or(
                        equals(read(operation), '/'),
                        equals(read(operation), '÷'),
                      ),
                      () => {
                        callProcedure(performDivide, {})
                      },
                      () => {
                        ifElse(
                          or(
                            equals(read(operation), 'cmp'),
                            equals(read(operation), 'compare'),
                          ),
                          () => {
                            callProcedure(performCompare, {})
                          },
                          () => {
                            setVariableTo(result, '?')
                            setVariableTo(remainder, '')
                            setVariableTo(
                              status,
                              'unknown op: use +, -, *, /, cmp',
                            )
                          },
                        )
                      },
                    )
                  },
                )
              },
            )
          },
        )
      },
    )
    callProcedure(refreshDigitViews, {})
  })

  whenFlagClicked(() => {
    hide()
    penUp()

    setVariableTo(
      description,
      'Pi digit calculator for V8 Scratch runtimes. Enter fractional digits, then compute pi with Chudnovsky binary splitting.',
    )
    setVariableTo(leftInput, '')
    setVariableTo(operation, 'pi')
    setVariableTo(rightInput, '')
    setVariableTo(result, '')
    setVariableTo(remainder, '')
    setVariableTo(status, 'PI SETUP')
    setVariableTo(elapsedMs, 0)
    setVariableTo(avgMs, 0)
    setVariableTo(leftDigitsView, 0)
    setVariableTo(rightDigitsView, 0)
    setVariableTo(resultDigitsView, 0)
    setVariableTo(benchmarkMode, 'pi')
    setVariableTo(divisionPrecision, 80)
    setVariableTo(piDigits, 256)
    setVariableTo(piGuardDigits, 8)
    setVariableTo(piProgress, 0)
    setVariableTo(piPageSize, 1000)
    setVariableTo(piPageIndex, 1)
    setVariableTo(piPageCount, 1)
    setVariableTo(piPageStartDigit, 1)
    setVariableTo(piPageEndDigit, 0)
    setVariableTo(piPageText, '')
    setVariableTo(benchmarkDigits, 256)
    setVariableTo(benchmarkScale, 64)
    setVariableTo(benchmarkRepeats, 3)
    setVariableTo(benchmarkSeed, 20260312)
    setVariableTo(benchmarkAccuracy, 'exact')
    setVariableTo(benchmarkResultDigits, 0)
    setVariableTo(benchmarkReport, 'ENTER FRACTIONAL DIGITS ONLY')
    callProcedure(drawFrame, {})

    askAndWait('Pi fractional digits (empty = 256)')
    ifThen(not(equals(getAnswer(), '')), () => {
      setVariableTo(piDigits, getAnswer())
    })
    askAndWait('Guard digits (empty = 8)')
    ifThen(not(equals(getAnswer(), '')), () => {
      setVariableTo(piGuardDigits, getAnswer())
    })
    setVariableTo(status, 'RUNNING PI')
    setVariableTo(benchmarkReport, 'METHOD: CHUDNOVSKY BINARY SPLITTING')
    callProcedure(drawFrame, {})
    resetTimer()
    callProcedure(computePi, {})
    setVariableTo(elapsedMs, multiply(getTimer(), 1000))
    setVariableTo(avgMs, read(elapsedMs))
    setVariableTo(
      benchmarkReport,
      join(
        join('METHOD: CHUDNOVSKY  DIGITS=', read(piDigits)),
        join(' GUARD=', read(piGuardDigits)),
      ),
    )
    callProcedure(refreshDigitViews, {})
    callProcedure(drawFrame, {})

    setVariableTo(
      description,
      'Done. Screen is 100% Pen; pi uses Chudnovsky binary splitting.',
    )
  })
})

export default project
