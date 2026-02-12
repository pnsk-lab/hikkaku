import { Project } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
import {
  add,
  addToList,
  and,
  askAndWait,
  callProcedure,
  changeVariableBy,
  changeXBy,
  defineProcedure,
  deleteAllOfList,
  equals,
  eraseAll,
  forever,
  getAnswer,
  getItemNumOfList,
  getItemOfList,
  getKeyPressed,
  gotoXY,
  gt,
  hide,
  hideList,
  ifElse,
  ifThen,
  join,
  length,
  lengthOfList,
  letterOf,
  match,
  multiply,
  penDown,
  penUp,
  procedureLabel,
  procedureStringOrNumber,
  repeat,
  repeatUntil,
  say,
  setPenColorTo,
  setPenSizeTo,
  setVariableTo,
  show,
  subtract,
  switchCostumeTo,
  wait,
  whenFlagClicked,
} from 'hikkaku/blocks'

// ---------------------------------------------------------------------------
// font table (ちょーぜつちからわざ)
// ---------------------------------------------------------------------------
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
  '!': '00100' + '00100' + '00100' + '00100' + '00100' + '00000' + '00100',
  '?': '01100' + '10010' + '00010' + '00100' + '00100' + '00000' + '00100',
  '(': '00010' + '00100' + '00100' + '00100' + '00100' + '00100' + '00010',
  ')': '01000' + '00100' + '00100' + '00100' + '00100' + '00100' + '01000',
  '=': '00000' + '00000' + '11110' + '00000' + '11110' + '00000' + '00000',
  '+': '00000' + '00100' + '00100' + '11111' + '00100' + '00100' + '00000',
  '/': '00001' + '00010' + '00010' + '00100' + '01000' + '01000' + '10000',
  '<': '00010' + '00100' + '01000' + '10000' + '01000' + '00100' + '00010',
  '>': '01000' + '00100' + '00010' + '00001' + '00010' + '00100' + '01000',
  '{': '00110' + '00100' + '00100' + '01000' + '00100' + '00100' + '00110',
  '}': '01100' + '00100' + '00100' + '00010' + '00100' + '00100' + '01100',
  '[': '01110' + '01000' + '01000' + '01000' + '01000' + '01000' + '01110',
  ']': '01110' + '00010' + '00010' + '00010' + '00010' + '00010' + '01110',
  ';': '00000' + '01100' + '01100' + '00000' + '01100' + '00100' + '01000',
  ',': '00000' + '00000' + '00000' + '00000' + '01100' + '00100' + '01000',
  _: '00000' + '00000' + '00000' + '00000' + '00000' + '00000' + '11111',
  '#': '01010' + '11111' + '01010' + '01010' + '11111' + '01010' + '00000',
  "'": '00100' + '00100' + '00000' + '00000' + '00000' + '00000' + '00000',
  '"': '01010' + '01010' + '00000' + '00000' + '00000' + '00000' + '00000',
  '*': '00000' + '00100' + '10101' + '01110' + '10101' + '00100' + '00000',
}

// Character set – order matters (index in list == lookup key)
const CHARS =
  `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-:!?()=+/<>{}[];,_#'"*`.split('')
// Box fallback for unknown characters (last entry in font list)
const BOX_FONT =
  '11111' + '10001' + '10001' + '10001' + '10001' + '10001' + '11111'
const FONT_STRINGS = [...CHARS.map((ch) => FONT_RAW[ch] ?? ''), BOX_FONT]

// Bold font: expand each lit pixel one position to the right
function makeBold(fontStr: string): string {
  let result = ''
  for (let row = 0; row < 7; row++) {
    const bits = fontStr
      .slice(row * 5, row * 5 + 5)
      .split('')
      .map(Number)
    const bold = [...bits]
    for (let i = 3; i >= 0; i--) {
      if (bits[i] === 1) bold[i + 1] = 1
    }
    result += bold.join('')
  }
  return result
}
const BOLD_FONT_STRINGS = FONT_STRINGS.map(makeBold)

// Stage layout
const LEFT = -220
const RIGHT = 220
const TOP = 155

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------
const project = new Project()
const renderer = project.createSprite('renderer')

const blankCostume = renderer.addCostume({ ...IMAGES.BLANK_SVG, name: 'blank' })

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------
const curX = renderer.createVariable('curX', 0)
const curY = renderer.createVariable('curY', 0)
const wrapX = renderer.createVariable('wrapX', LEFT)
const lineIdx = renderer.createVariable('lineIdx', 0)
const charIdx = renderer.createVariable('charIdx', 0)
const charNum = renderer.createVariable('charNum', 0)
const currentLine = renderer.createVariable('currentLine', '')
const lastInput = renderer.createVariable('lastInput', '')
const segment = renderer.createVariable('segment', '')
const fontStr = renderer.createVariable('fontStr', '')
const pxRow = renderer.createVariable('pxRow', 0)
const pxCol = renderer.createVariable('pxCol', 0)
const pxIdx = renderer.createVariable('pxIdx', 0)
const scrollY = renderer.createVariable('scrollY', 0)
const isBold = renderer.createVariable('isBold', 0)
const isItalic = renderer.createVariable('isItalic', 0)
const isCode = renderer.createVariable('isCode', 0)
const inCodeBlock = renderer.createVariable('inCodeBlock', 0)
const noFormat = renderer.createVariable('noFormat', 0)
const textColor = renderer.createVariable('textColor', '#333333')

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------
const chars = renderer.createList('chars', CHARS)
const font = renderer.createList('font', FONT_STRINGS)
const boldFont = renderer.createList('boldFont', BOLD_FONT_STRINGS)
const lines = renderer.createList('lines', [])

// ---------------------------------------------------------------------------
// Block scripts
// ---------------------------------------------------------------------------
renderer.run(() => {
  // ==== splitInput: split lastInput by "|" into lines list ====
  const splitInput = defineProcedure(
    [procedureLabel('splitInput')],
    () => {
      deleteAllOfList(lines)
      setVariableTo(segment, '')
      setVariableTo(charIdx, 1)
      repeat(length(lastInput.get()), () => {
        ifElse(
          equals(letterOf(charIdx.get(), lastInput.get()), '|'),
          () => {
            addToList(lines, segment.get())
            setVariableTo(segment, '')
          },
          () => {
            setVariableTo(
              segment,
              join(segment.get(), letterOf(charIdx.get(), lastInput.get())),
            )
          },
        )
        changeVariableBy(charIdx, 1)
      })
      addToList(lines, segment.get())
      return undefined
    },
    true,
  )

  // ==== renderText: draw text with pixel font + inline formatting ====
  // Handles **bold**, *italic*, `code`
  const renderText = defineProcedure(
    [
      procedureLabel('renderText'),
      procedureStringOrNumber('startIdx'),
      procedureStringOrNumber('ps'),
      procedureStringOrNumber('lh'),
    ],
    ({ startIdx, ps, lh }) => {
      setVariableTo(charIdx, startIdx.getter())
      setVariableTo(isBold, 0)
      setVariableTo(isItalic, 0)
      setVariableTo(isCode, 0)

      repeatUntil(gt(charIdx.get(), length(currentLine.get())), () => {
        ifElse(
          and(
            equals(letterOf(charIdx.get(), currentLine.get()), '*'),
            and(equals(isCode.get(), 0), equals(noFormat.get(), 0)),
          ),
          () => {
            // Check ** (bold) vs * (italic)
            ifElse(
              equals(letterOf(add(charIdx.get(), 1), currentLine.get()), '*'),
              () => {
                setVariableTo(isBold, subtract(1, isBold.get()))
                changeVariableBy(charIdx, 2)
              },
              () => {
                setVariableTo(isItalic, subtract(1, isItalic.get()))
                changeVariableBy(charIdx, 1)
              },
            )
          },
          () => {
            ifElse(
              and(
                equals(letterOf(charIdx.get(), currentLine.get()), '`'),
                equals(noFormat.get(), 0),
              ),
              () => {
                // Toggle code mode
                setVariableTo(isCode, subtract(1, isCode.get()))
                changeVariableBy(charIdx, 1)
              },
              () => {
                // Normal character – render it
                setVariableTo(
                  charNum,
                  getItemNumOfList(
                    chars,
                    letterOf(charIdx.get(), currentLine.get()),
                  ),
                )
                // Unknown char → use box font (last entry)
                ifThen(equals(charNum.get(), 0), () => {
                  setVariableTo(charNum, lengthOfList(font))
                })
                // Code background + color selection
                ifElse(
                  equals(isCode.get(), 1),
                  () => {
                    setPenColorTo('#2d2d2d')
                    setPenSizeTo(add(multiply(ps.getter(), 8), 2))
                    gotoXY(
                      add(curX.get(), multiply(ps.getter(), 2.5)),
                      subtract(curY.get(), multiply(ps.getter(), 3)),
                    )
                    penDown()
                    gotoXY(
                      add(curX.get(), multiply(ps.getter(), 4.5)),
                      subtract(curY.get(), multiply(ps.getter(), 3)),
                    )
                    penUp()
                    setPenColorTo('#00ff88')
                  },
                  () => {
                    setPenColorTo(textColor.get())
                  },
                )

                // Select font (bold or normal)
                ifElse(
                  equals(isBold.get(), 1),
                  () =>
                    setVariableTo(
                      fontStr,
                      getItemOfList(boldFont, charNum.get()),
                    ),
                  () =>
                    setVariableTo(fontStr, getItemOfList(font, charNum.get())),
                )

                setPenSizeTo(ps.getter())

                // Draw 5×7 pixel grid
                setVariableTo(pxRow, 0)
                repeat(7, () => {
                  setVariableTo(pxCol, 0)
                  repeat(5, () => {
                    setVariableTo(
                      pxIdx,
                      add(multiply(pxRow.get(), 5), add(pxCol.get(), 1)),
                    )
                    ifThen(
                      equals(letterOf(pxIdx.get(), fontStr.get()), '1'),
                      () => {
                        gotoXY(
                          add(
                            add(curX.get(), multiply(pxCol.get(), ps.getter())),
                            multiply(
                              isItalic.get(),
                              multiply(
                                subtract(3, pxRow.get()),
                                multiply(ps.getter(), 0.35),
                              ),
                            ),
                          ),
                          subtract(
                            curY.get(),
                            multiply(pxRow.get(), ps.getter()),
                          ),
                        )
                        penDown()
                        changeXBy(0.5)
                        penUp()
                      },
                    )
                    changeVariableBy(pxCol, 1)
                  })
                  changeVariableBy(pxRow, 1)
                })

                // Advance cursor
                changeVariableBy(curX, multiply(7, ps.getter()))

                // Line wrap (skip in code blocks – just clip)
                ifThen(
                  and(gt(curX.get(), RIGHT), equals(inCodeBlock.get(), 0)),
                  () => {
                    setVariableTo(curX, wrapX.get())
                    changeVariableBy(curY, multiply(-1, lh.getter()))
                  },
                )

                changeVariableBy(charIdx, 1)
              },
            )
          },
        )
      })

      // Move below rendered text
      changeVariableBy(curY, multiply(-1, lh.getter()))
      return undefined
    },
    true,
  )

  // ==== renderOneLine: render the line at lineIdx ====
  const renderOneLine = defineProcedure(
    [procedureLabel('renderOneLine')],
    () => {
      setVariableTo(currentLine, getItemOfList(lines, lineIdx.get()))
      setVariableTo(curX, LEFT)
      setVariableTo(wrapX, LEFT)
      setVariableTo(noFormat, 0)

      match(
        // ---- Code fence: ``` ----
        [
          and(
            and(
              equals(letterOf(1, currentLine.get()), '`'),
              equals(letterOf(2, currentLine.get()), '`'),
            ),
            equals(letterOf(3, currentLine.get()), '`'),
          ),
          () => {
            setVariableTo(inCodeBlock, subtract(1, inCodeBlock.get()))
            // Draw dark padding strip (top or bottom cap)
            setPenColorTo('#1e1e1e')
            setPenSizeTo(8)
            gotoXY(LEFT, subtract(curY.get(), 4))
            penDown()
            gotoXY(RIGHT, subtract(curY.get(), 4))
            penUp()
            changeVariableBy(curY, -10)
          },
        ],

        // ---- Code block content ----
        [
          equals(inCodeBlock.get(), 1),
          () => {
            // Dark background
            setPenColorTo('#1e1e1e')
            setPenSizeTo(20)
            gotoXY(LEFT, subtract(curY.get(), 9))
            penDown()
            gotoXY(RIGHT, subtract(curY.get(), 9))
            penUp()
            // Green text, no formatting
            setVariableTo(textColor, '#00ff88')
            setPenColorTo('#00ff88')
            setVariableTo(noFormat, 1)
            callProcedure(renderText, [
              {
                reference: renderText.reference.arguments.startIdx,
                value: 1,
              },
              { reference: renderText.reference.arguments.ps, value: 2 },
              { reference: renderText.reference.arguments.lh, value: 18 },
            ])
          },
        ],

        // ---- Horizontal rule: --- ----
        [
          equals(currentLine.get(), '---'),
          () => {
            changeVariableBy(curY, -6)
            setPenColorTo('#888888')
            setPenSizeTo(2)
            gotoXY(LEFT, curY.get())
            penDown()
            gotoXY(RIGHT, curY.get())
            penUp()
            changeVariableBy(curY, -12)
          },
        ],

        // ---- H2: ## heading ----
        [
          and(
            and(
              equals(letterOf(1, currentLine.get()), '#'),
              equals(letterOf(2, currentLine.get()), '#'),
            ),
            equals(letterOf(3, currentLine.get()), ' '),
          ),
          () => {
            setVariableTo(textColor, '#006064')
            setPenColorTo('#006064')
            callProcedure(renderText, [
              {
                reference: renderText.reference.arguments.startIdx,
                value: 4,
              },
              { reference: renderText.reference.arguments.ps, value: 2 },
              { reference: renderText.reference.arguments.lh, value: 20 },
            ])
            // Underline
            setPenColorTo('#44aacc')
            setPenSizeTo(2)
            gotoXY(LEFT, add(curY.get(), 1))
            penDown()
            gotoXY(RIGHT, add(curY.get(), 1))
            penUp()
            changeVariableBy(curY, -4)
          },
        ],

        // ---- H1: # heading ----
        [
          and(
            equals(letterOf(1, currentLine.get()), '#'),
            equals(letterOf(2, currentLine.get()), ' '),
          ),
          () => {
            setVariableTo(textColor, '#1a237e')
            setPenColorTo('#1a237e')
            callProcedure(renderText, [
              {
                reference: renderText.reference.arguments.startIdx,
                value: 3,
              },
              { reference: renderText.reference.arguments.ps, value: 3 },
              { reference: renderText.reference.arguments.lh, value: 27 },
            ])
            // Underline
            setPenColorTo('#5599ff')
            setPenSizeTo(3)
            gotoXY(LEFT, add(curY.get(), 1))
            penDown()
            gotoXY(RIGHT, add(curY.get(), 1))
            penUp()
            changeVariableBy(curY, -6)
          },
        ],

        // ---- Bullet list: - item ----
        [
          and(
            equals(letterOf(1, currentLine.get()), '-'),
            equals(letterOf(2, currentLine.get()), ' '),
          ),
          () => {
            // Bullet dot
            setPenColorTo('#ff8844')
            setPenSizeTo(5)
            gotoXY(LEFT + 6, subtract(curY.get(), 6))
            penDown()
            changeXBy(0.5)
            penUp()
            // Render text
            setVariableTo(textColor, '#333333')
            setPenColorTo('#333333')
            setVariableTo(curX, LEFT + 18)
            setVariableTo(wrapX, LEFT + 18)
            callProcedure(renderText, [
              {
                reference: renderText.reference.arguments.startIdx,
                value: 3,
              },
              { reference: renderText.reference.arguments.ps, value: 2 },
              { reference: renderText.reference.arguments.lh, value: 18 },
            ])
            changeVariableBy(curY, -2)
          },
        ],

        // ---- Default: paragraph ----
        () => {
          setVariableTo(textColor, '#333333')
          setPenColorTo('#333333')
          callProcedure(renderText, [
            {
              reference: renderText.reference.arguments.startIdx,
              value: 1,
            },
            { reference: renderText.reference.arguments.ps, value: 2 },
            { reference: renderText.reference.arguments.lh, value: 18 },
          ])
          changeVariableBy(curY, -6)
        },
      )

      changeVariableBy(lineIdx, 1)
      return undefined
    },
    true,
  )

  // ==== renderAll: instant render (warp, for scrolling) ====
  const renderAll = defineProcedure(
    [procedureLabel('renderAll')],
    () => {
      eraseAll()
      setVariableTo(inCodeBlock, 0)
      setVariableTo(curY, add(TOP, scrollY.get()))
      setVariableTo(lineIdx, 1)
      repeat(lengthOfList(lines), () => {
        callProcedure(renderOneLine, [])
      })
      return undefined
    },
    true,
  )

  // ==== animatedRender: line-by-line with 0.1s delay (non-warp) ====
  const animatedRender = defineProcedure(
    [procedureLabel('animatedRender')],
    () => {
      eraseAll()
      setVariableTo(inCodeBlock, 0)
      setVariableTo(curY, add(TOP, scrollY.get()))
      setVariableTo(lineIdx, 1)
      repeat(lengthOfList(lines), () => {
        callProcedure(renderOneLine, [])
        wait(0.1)
      })
      return undefined
    },
    false,
  )

  // ==== Main ====
  whenFlagClicked(() => {
    eraseAll()
    hide()
    deleteAllOfList(lines)
    hideList(lines)
    hideList(chars)
    hideList(font)
    hideList(boldFont)
    setVariableTo(scrollY, 0)

    // Title screen
    setVariableTo(textColor, '#1a237e')
    setVariableTo(currentLine, 'MARKDOWN')
    setVariableTo(curX, -84)
    setVariableTo(curY, 50)
    setPenColorTo('#1a237e')
    callProcedure(renderText, [
      { reference: renderText.reference.arguments.startIdx, value: 1 },
      { reference: renderText.reference.arguments.ps, value: 3 },
      { reference: renderText.reference.arguments.lh, value: 27 },
    ])
    wait(0.3)
    setVariableTo(textColor, '#5599ff')
    setVariableTo(currentLine, 'RENDERER')
    setVariableTo(curX, -84)
    setPenColorTo('#5599ff')
    callProcedure(renderText, [
      { reference: renderText.reference.arguments.startIdx, value: 1 },
      { reference: renderText.reference.arguments.ps, value: 3 },
      { reference: renderText.reference.arguments.lh, value: 27 },
    ])
    // Decorative line
    setPenColorTo('#44aacc')
    setPenSizeTo(2)
    gotoXY(-100, subtract(curY.get(), 2))
    penDown()
    gotoXY(100, subtract(curY.get(), 2))
    penUp()
    wait(0.5)

    // First input
    askAndWait('MARKDOWN (USE | FOR NEW LINE)')
    setVariableTo(lastInput, getAnswer())
    callProcedure(splitInput, [])
    setVariableTo(scrollY, 0)
    callProcedure(animatedRender, [])

    // View ↔ Edit loop
    forever(() => {
      switchCostumeTo(blankCostume)
      gotoXY(0, -155)
      show()
      say('SPACE:EDIT\nUP/DOWN:SCROLL')
      repeatUntil(getKeyPressed('space'), () => {
        ifThen(getKeyPressed('down arrow'), () => {
          changeVariableBy(scrollY, 8)
          callProcedure(renderAll, [])
        })
        ifThen(and(getKeyPressed('up arrow'), gt(scrollY.get(), 0)), () => {
          changeVariableBy(scrollY, -8)
          callProcedure(renderAll, [])
        })
      })
      say('')
      hide()

      askAndWait('MARKDOWN (ENTER = KEEP PREV)')
      ifThen(gt(length(getAnswer()), 0), () => {
        setVariableTo(lastInput, getAnswer())
        callProcedure(splitInput, [])
        setVariableTo(scrollY, 0)
      })
      callProcedure(animatedRender, [])
    })
  })
})

export default project
