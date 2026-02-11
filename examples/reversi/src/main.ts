import { Project } from 'hikkaku'
import {
  add,
  addToList,
  and,
  callProcedure,
  changeVariableBy,
  defineProcedure,
  deleteAllOfList,
  divide,
  equals,
  eraseAll,
  forever,
  getItemOfList,
  getKeyPressed,
  getMouseDown,
  getMouseX,
  getMouseY,
  gotoXY,
  gt,
  hide,
  ifElse,
  ifThen,
  lt,
  mathop,
  multiply,
  not,
  penDown,
  penUp,
  procedureLabel,
  procedureStringOrNumber,
  repeat,
  replaceItemOfList,
  setPenColorTo,
  setPenSizeTo,
  setVariableTo,
  subtract,
  whenFlagClicked,
} from 'hikkaku/blocks'

const BOARD_SIZE = 8
const CELL_SIZE = 32
const BOARD_LEFT = -128
const BOARD_RIGHT = 128
const BOARD_TOP = 128
const BOARD_BOTTOM = -128
const CELL_HALF = CELL_SIZE / 2
const STONE_SIZE = 24
const HIGHLIGHT_HALF = 13

const DIRECTIONS: Array<[number, number]> = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]

const boardIndex = (
  col: number | ReturnType<typeof add>,
  row: number | ReturnType<typeof add>,
) => {
  return add(multiply(subtract(row, 1), BOARD_SIZE), col)
}

const cellCenterX = (col: number | ReturnType<typeof add>) => {
  return add(BOARD_LEFT + CELL_HALF, multiply(subtract(col, 1), CELL_SIZE))
}

const cellCenterY = (row: number | ReturnType<typeof add>) => {
  return subtract(BOARD_TOP - CELL_HALF, multiply(subtract(row, 1), CELL_SIZE))
}

const insideBoardCell = (
  col: number | ReturnType<typeof add>,
  row: number | ReturnType<typeof add>,
) => {
  return and(
    and(gt(col, 0), lt(col, BOARD_SIZE + 1)),
    and(gt(row, 0), lt(row, BOARD_SIZE + 1)),
  )
}

const project = new Project()
const pen = project.createSprite('pen')

const board = pen.createList('board', [])

const currentPlayer = pen.createVariable('currentPlayer', 1)
const blackCount = pen.createVariable('blackCount', 2, {
  monitor: { visible: true, x: 8, y: 8 },
})
const whiteCount = pen.createVariable('whiteCount', 2, {
  monitor: { visible: true, x: 8, y: 36 },
})

const gameOver = pen.createVariable('gameOver', 0)
const clickLatch = pen.createVariable('clickLatch', 0)
const restartLatch = pen.createVariable('restartLatch', 0)
const cursorOnBoard = pen.createVariable('cursorOnBoard', 0)
const cursorCol = pen.createVariable('cursorCol', 1)
const cursorRow = pen.createVariable('cursorRow', 1)

const loopRow = pen.createVariable('loopRow', 1)
const loopCol = pen.createVariable('loopCol', 1)
const workX = pen.createVariable('workX', 0)
const workY = pen.createVariable('workY', 0)
const idx = pen.createVariable('idx', 1)
const cellValue = pen.createVariable('cellValue', 0)

const opponent = pen.createVariable('opponent', 2)
const scanX = pen.createVariable('scanX', 0)
const scanY = pen.createVariable('scanY', 0)
const dirCaptured = pen.createVariable('dirCaptured', 0)
const dirValid = pen.createVariable('dirValid', 0)
const totalFlips = pen.createVariable('totalFlips', 0)
const hasMove = pen.createVariable('hasMove', 0)

pen.run(() => {
  const initBoard = defineProcedure(
    [procedureLabel('init board')],
    () => {
      deleteAllOfList(board)
      repeat(BOARD_SIZE * BOARD_SIZE, () => {
        addToList(board, 0)
      })

      replaceItemOfList(board, 28, 2)
      replaceItemOfList(board, 29, 1)
      replaceItemOfList(board, 36, 1)
      replaceItemOfList(board, 37, 2)

      setVariableTo(currentPlayer, 1)
      setVariableTo(gameOver, 0)
      setVariableTo(clickLatch, 0)
      setVariableTo(cursorOnBoard, 0)
    },
    true,
  )

  const scanDirection = defineProcedure(
    [
      procedureLabel('scan dir'),
      procedureStringOrNumber('col'),
      procedureStringOrNumber('row'),
      procedureStringOrNumber('dx'),
      procedureStringOrNumber('dy'),
    ],
    ({ col, row, dx, dy }) => {
      setVariableTo(opponent, subtract(3, currentPlayer.get()))
      setVariableTo(scanX, add(col.getter(), dx.getter()))
      setVariableTo(scanY, add(row.getter(), dy.getter()))
      setVariableTo(dirCaptured, 0)
      setVariableTo(dirValid, 0)

      repeat(BOARD_SIZE, () => {
        ifElse(
          insideBoardCell(scanX.get(), scanY.get()),
          () => {
            setVariableTo(idx, boardIndex(scanX.get(), scanY.get()))

            ifElse(
              equals(getItemOfList(board, idx.get()), opponent.get()),
              () => {
                changeVariableBy(dirCaptured, 1)
                changeVariableBy(scanX, dx.getter())
                changeVariableBy(scanY, dy.getter())
              },
              () => {
                ifThen(
                  and(
                    gt(dirCaptured.get(), 0),
                    equals(
                      getItemOfList(board, idx.get()),
                      currentPlayer.get(),
                    ),
                  ),
                  () => {
                    setVariableTo(dirValid, 1)
                  },
                )
                setVariableTo(scanX, 99)
                setVariableTo(scanY, 99)
              },
            )
          },
          () => {
            setVariableTo(scanX, 99)
            setVariableTo(scanY, 99)
          },
        )
      })
    },
    true,
  )

  const countFlipsAt = defineProcedure(
    [
      procedureLabel('count flips at'),
      procedureStringOrNumber('col'),
      procedureStringOrNumber('row'),
    ],
    ({ col, row }) => {
      setVariableTo(totalFlips, 0)

      ifThen(
        equals(getItemOfList(board, boardIndex(col.getter(), row.getter())), 0),
        () => {
          for (const [dx, dy] of DIRECTIONS) {
            callProcedure(scanDirection, [
              {
                reference: scanDirection.reference.arguments.col,
                value: col.getter(),
              },
              {
                reference: scanDirection.reference.arguments.row,
                value: row.getter(),
              },
              { reference: scanDirection.reference.arguments.dx, value: dx },
              { reference: scanDirection.reference.arguments.dy, value: dy },
            ])
            ifThen(equals(dirValid.get(), 1), () => {
              changeVariableBy(totalFlips, dirCaptured.get())
            })
          }
        },
      )
    },
    true,
  )

  const flipDirection = defineProcedure(
    [
      procedureLabel('flip dir'),
      procedureStringOrNumber('col'),
      procedureStringOrNumber('row'),
      procedureStringOrNumber('dx'),
      procedureStringOrNumber('dy'),
    ],
    ({ col, row, dx, dy }) => {
      callProcedure(scanDirection, [
        {
          reference: scanDirection.reference.arguments.col,
          value: col.getter(),
        },
        {
          reference: scanDirection.reference.arguments.row,
          value: row.getter(),
        },
        { reference: scanDirection.reference.arguments.dx, value: dx.getter() },
        { reference: scanDirection.reference.arguments.dy, value: dy.getter() },
      ])

      ifThen(equals(dirValid.get(), 1), () => {
        setVariableTo(scanX, add(col.getter(), dx.getter()))
        setVariableTo(scanY, add(row.getter(), dy.getter()))

        repeat(dirCaptured.get(), () => {
          setVariableTo(idx, boardIndex(scanX.get(), scanY.get()))
          replaceItemOfList(board, idx.get(), currentPlayer.get())
          changeVariableBy(scanX, dx.getter())
          changeVariableBy(scanY, dy.getter())
        })

        changeVariableBy(totalFlips, dirCaptured.get())
      })
    },
    true,
  )

  const findAnyMove = defineProcedure(
    [procedureLabel('find any move')],
    () => {
      setVariableTo(hasMove, 0)
      setVariableTo(loopRow, 1)

      repeat(BOARD_SIZE, () => {
        setVariableTo(loopCol, 1)
        repeat(BOARD_SIZE, () => {
          ifThen(equals(hasMove.get(), 0), () => {
            callProcedure(countFlipsAt, [
              {
                reference: countFlipsAt.reference.arguments.col,
                value: loopCol.get(),
              },
              {
                reference: countFlipsAt.reference.arguments.row,
                value: loopRow.get(),
              },
            ])
            ifThen(gt(totalFlips.get(), 0), () => {
              setVariableTo(hasMove, 1)
            })
          })
          changeVariableBy(loopCol, 1)
        })
        changeVariableBy(loopRow, 1)
      })
    },
    true,
  )

  const nextTurn = defineProcedure(
    [procedureLabel('next turn')],
    () => {
      setVariableTo(currentPlayer, subtract(3, currentPlayer.get()))
      callProcedure(findAnyMove, {})

      ifThen(equals(hasMove.get(), 0), () => {
        setVariableTo(currentPlayer, subtract(3, currentPlayer.get()))
        callProcedure(findAnyMove, {})

        ifThen(equals(hasMove.get(), 0), () => {
          setVariableTo(gameOver, 1)
        })
      })
    },
    true,
  )

  const placeAt = defineProcedure(
    [
      procedureLabel('place at'),
      procedureStringOrNumber('col'),
      procedureStringOrNumber('row'),
    ],
    ({ col, row }) => {
      ifThen(equals(gameOver.get(), 0), () => {
        ifThen(
          equals(
            getItemOfList(board, boardIndex(col.getter(), row.getter())),
            0,
          ),
          () => {
            setVariableTo(totalFlips, 0)

            for (const [dx, dy] of DIRECTIONS) {
              callProcedure(flipDirection, [
                {
                  reference: flipDirection.reference.arguments.col,
                  value: col.getter(),
                },
                {
                  reference: flipDirection.reference.arguments.row,
                  value: row.getter(),
                },
                { reference: flipDirection.reference.arguments.dx, value: dx },
                { reference: flipDirection.reference.arguments.dy, value: dy },
              ])
            }

            ifThen(gt(totalFlips.get(), 0), () => {
              replaceItemOfList(
                board,
                boardIndex(col.getter(), row.getter()),
                currentPlayer.get(),
              )
              callProcedure(nextTurn, {})
            })
          },
        )
      })
    },
    true,
  )

  const updateCursor = defineProcedure(
    [procedureLabel('update cursor')],
    () => {
      setVariableTo(cursorOnBoard, 0)
      ifThen(
        and(
          and(gt(getMouseX(), BOARD_LEFT), lt(getMouseX(), BOARD_RIGHT)),
          and(gt(getMouseY(), BOARD_BOTTOM), lt(getMouseY(), BOARD_TOP)),
        ),
        () => {
          setVariableTo(cursorOnBoard, 1)
          setVariableTo(
            cursorCol,
            add(
              mathop(
                'floor',
                divide(subtract(getMouseX(), BOARD_LEFT), CELL_SIZE),
              ),
              1,
            ),
          )
          setVariableTo(
            cursorRow,
            add(
              mathop(
                'floor',
                divide(subtract(BOARD_TOP, getMouseY()), CELL_SIZE),
              ),
              1,
            ),
          )
        },
      )
    },
    true,
  )

  const recount = defineProcedure(
    [procedureLabel('recount')],
    () => {
      setVariableTo(blackCount, 0)
      setVariableTo(whiteCount, 0)
      setVariableTo(loopRow, 1)

      repeat(BOARD_SIZE, () => {
        setVariableTo(loopCol, 1)
        repeat(BOARD_SIZE, () => {
          setVariableTo(idx, boardIndex(loopCol.get(), loopRow.get()))
          setVariableTo(cellValue, getItemOfList(board, idx.get()))

          ifThen(equals(cellValue.get(), 1), () => {
            changeVariableBy(blackCount, 1)
          })
          ifThen(equals(cellValue.get(), 2), () => {
            changeVariableBy(whiteCount, 1)
          })

          changeVariableBy(loopCol, 1)
        })
        changeVariableBy(loopRow, 1)
      })

      ifThen(
        and(
          equals(gameOver.get(), 0),
          equals(
            add(blackCount.get(), whiteCount.get()),
            BOARD_SIZE * BOARD_SIZE,
          ),
        ),
        () => {
          setVariableTo(gameOver, 1)
        },
      )
    },
    true,
  )

  const drawScene = defineProcedure(
    [procedureLabel('draw scene')],
    () => {
      eraseAll()

      setPenColorTo('#1f8b4c')
      setPenSizeTo(CELL_SIZE - 2)
      setVariableTo(workY, BOARD_TOP - CELL_HALF)
      repeat(BOARD_SIZE, () => {
        gotoXY(BOARD_LEFT + CELL_HALF, workY.get())
        penDown()
        gotoXY(BOARD_RIGHT - CELL_HALF, workY.get())
        penUp()
        changeVariableBy(workY, -CELL_SIZE)
      })

      setPenColorTo('#103b22')
      setPenSizeTo(2)
      setVariableTo(workX, BOARD_LEFT)
      repeat(BOARD_SIZE + 1, () => {
        gotoXY(workX.get(), BOARD_TOP)
        penDown()
        gotoXY(workX.get(), BOARD_BOTTOM)
        penUp()
        changeVariableBy(workX, CELL_SIZE)
      })

      setVariableTo(workY, BOARD_TOP)
      repeat(BOARD_SIZE + 1, () => {
        gotoXY(BOARD_LEFT, workY.get())
        penDown()
        gotoXY(BOARD_RIGHT, workY.get())
        penUp()
        changeVariableBy(workY, -CELL_SIZE)
      })

      setPenSizeTo(STONE_SIZE)
      setVariableTo(loopRow, 1)
      repeat(BOARD_SIZE, () => {
        setVariableTo(loopCol, 1)
        repeat(BOARD_SIZE, () => {
          setVariableTo(idx, boardIndex(loopCol.get(), loopRow.get()))
          setVariableTo(cellValue, getItemOfList(board, idx.get()))

          ifThen(equals(cellValue.get(), 1), () => {
            setPenColorTo('#111111')
            gotoXY(cellCenterX(loopCol.get()), cellCenterY(loopRow.get()))
            penDown()
            penUp()
          })
          ifThen(equals(cellValue.get(), 2), () => {
            setPenColorTo('#f3f3f3')
            gotoXY(cellCenterX(loopCol.get()), cellCenterY(loopRow.get()))
            penDown()
            penUp()
          })

          changeVariableBy(loopCol, 1)
        })
        changeVariableBy(loopRow, 1)
      })

      ifThen(equals(gameOver.get(), 0), () => {
        setPenColorTo('#9ddf6e')
        setPenSizeTo(2)
        setVariableTo(loopRow, 1)
        repeat(BOARD_SIZE, () => {
          setVariableTo(loopCol, 1)
          repeat(BOARD_SIZE, () => {
            callProcedure(countFlipsAt, [
              {
                reference: countFlipsAt.reference.arguments.col,
                value: loopCol.get(),
              },
              {
                reference: countFlipsAt.reference.arguments.row,
                value: loopRow.get(),
              },
            ])

            ifThen(gt(totalFlips.get(), 0), () => {
              setVariableTo(workX, cellCenterX(loopCol.get()))
              setVariableTo(workY, cellCenterY(loopRow.get()))

              gotoXY(
                subtract(workX.get(), HIGHLIGHT_HALF),
                subtract(workY.get(), HIGHLIGHT_HALF),
              )
              penDown()
              gotoXY(
                add(workX.get(), HIGHLIGHT_HALF),
                subtract(workY.get(), HIGHLIGHT_HALF),
              )
              gotoXY(
                add(workX.get(), HIGHLIGHT_HALF),
                add(workY.get(), HIGHLIGHT_HALF),
              )
              gotoXY(
                subtract(workX.get(), HIGHLIGHT_HALF),
                add(workY.get(), HIGHLIGHT_HALF),
              )
              gotoXY(
                subtract(workX.get(), HIGHLIGHT_HALF),
                subtract(workY.get(), HIGHLIGHT_HALF),
              )
              penUp()
            })

            changeVariableBy(loopCol, 1)
          })
          changeVariableBy(loopRow, 1)
        })

        ifThen(equals(cursorOnBoard.get(), 1), () => {
          callProcedure(countFlipsAt, [
            {
              reference: countFlipsAt.reference.arguments.col,
              value: cursorCol.get(),
            },
            {
              reference: countFlipsAt.reference.arguments.row,
              value: cursorRow.get(),
            },
          ])

          ifThen(gt(totalFlips.get(), 0), () => {
            setPenColorTo('#f5d74a')
            setPenSizeTo(3)
            setVariableTo(workX, cellCenterX(cursorCol.get()))
            setVariableTo(workY, cellCenterY(cursorRow.get()))

            gotoXY(
              subtract(workX.get(), HIGHLIGHT_HALF),
              subtract(workY.get(), HIGHLIGHT_HALF),
            )
            penDown()
            gotoXY(
              add(workX.get(), HIGHLIGHT_HALF),
              subtract(workY.get(), HIGHLIGHT_HALF),
            )
            gotoXY(
              add(workX.get(), HIGHLIGHT_HALF),
              add(workY.get(), HIGHLIGHT_HALF),
            )
            gotoXY(
              subtract(workX.get(), HIGHLIGHT_HALF),
              add(workY.get(), HIGHLIGHT_HALF),
            )
            gotoXY(
              subtract(workX.get(), HIGHLIGHT_HALF),
              subtract(workY.get(), HIGHLIGHT_HALF),
            )
            penUp()
          })
        })
      })

      setPenColorTo('#1f8b4c')
      setPenSizeTo(34)
      gotoXY(-224, 158)
      penDown()
      gotoXY(-156, 158)
      penUp()

      setPenColorTo('#103b22')
      setPenSizeTo(2)
      gotoXY(-226, 140)
      penDown()
      gotoXY(-154, 140)
      gotoXY(-154, 176)
      gotoXY(-226, 176)
      gotoXY(-226, 140)
      penUp()

      setPenSizeTo(18)
      setPenColorTo('#111111')
      gotoXY(-210, 158)
      penDown()
      penUp()

      setPenColorTo('#f3f3f3')
      gotoXY(-170, 158)
      penDown()
      penUp()

      ifElse(
        equals(currentPlayer.get(), 1),
        () => {
          setVariableTo(workX, -210)
        },
        () => {
          setVariableTo(workX, -170)
        },
      )

      setPenColorTo('#f5d74a')
      setPenSizeTo(3)
      gotoXY(subtract(workX.get(), 14), 144)
      penDown()
      gotoXY(add(workX.get(), 14), 144)
      gotoXY(add(workX.get(), 14), 172)
      gotoXY(subtract(workX.get(), 14), 172)
      gotoXY(subtract(workX.get(), 14), 144)
      penUp()

      ifThen(equals(gameOver.get(), 1), () => {
        setPenColorTo('#d33a2c')
        setPenSizeTo(6)
        gotoXY(BOARD_LEFT, BOARD_TOP)
        penDown()
        gotoXY(BOARD_RIGHT, BOARD_BOTTOM)
        penUp()
        gotoXY(BOARD_LEFT, BOARD_BOTTOM)
        penDown()
        gotoXY(BOARD_RIGHT, BOARD_TOP)
        penUp()
      })
    },
    true,
  )

  const oneStep = defineProcedure(
    [procedureLabel('1step')],
    () => {
      ifThen(and(getKeyPressed('r'), equals(restartLatch.get(), 0)), () => {
        setVariableTo(restartLatch, 1)
        callProcedure(initBoard, {})
      })
      ifThen(not(getKeyPressed('r')), () => {
        setVariableTo(restartLatch, 0)
      })

      callProcedure(updateCursor, {})

      ifThen(and(getMouseDown(), equals(clickLatch.get(), 0)), () => {
        setVariableTo(clickLatch, 1)
        ifThen(equals(cursorOnBoard.get(), 1), () => {
          callProcedure(placeAt, [
            {
              reference: placeAt.reference.arguments.col,
              value: cursorCol.get(),
            },
            {
              reference: placeAt.reference.arguments.row,
              value: cursorRow.get(),
            },
          ])
        })
      })
      ifThen(not(getMouseDown()), () => {
        setVariableTo(clickLatch, 0)
      })

      callProcedure(recount, {})
      callProcedure(drawScene, {})
    },
    true,
  )

  whenFlagClicked(() => {
    hide()
    penUp()
    setPenSizeTo(1)
    callProcedure(initBoard, {})
    callProcedure(recount, {})

    forever(() => {
      callProcedure(oneStep, {}, true)
    })
  })
})

export default project

import.meta.hot?.send('hikkaku:project', project.toScratch())
