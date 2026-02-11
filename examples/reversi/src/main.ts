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
  lengthOfList,
  lt,
  mathop,
  multiply,
  not,
  or,
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
  wait,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { NN_WEIGHTS } from './nnWeights'

const BOARD_SIZE = 8
const CELL_SIZE = 32
const BOARD_LEFT = -128
const BOARD_RIGHT = 128
const BOARD_TOP = 128
const BOARD_BOTTOM = -128
const CELL_HALF = CELL_SIZE / 2
const STONE_SIZE = 24
const HIGHLIGHT_HALF = 13
const AI_PLAYER = 2

const NN_INPUT_SIZE = NN_WEIGHTS.inputSize
const NN_HIDDEN_SIZE = NN_WEIGHTS.hiddenSize

if (NN_WEIGHTS.w1.length !== NN_INPUT_SIZE * NN_HIDDEN_SIZE) {
  throw new Error('Invalid nnWeights.ts: w1 length mismatch')
}
if (NN_WEIGHTS.b1.length !== NN_HIDDEN_SIZE) {
  throw new Error('Invalid nnWeights.ts: b1 length mismatch')
}
if (NN_WEIGHTS.w2.length !== NN_HIDDEN_SIZE) {
  throw new Error('Invalid nnWeights.ts: w2 length mismatch')
}

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
const flipList = pen.createList('flipList', [])
const nnFeatures = pen.createList('nnFeatures', [])
const nnHidden = pen.createList('nnHidden', [])
const nnW1 = pen.createList('nnW1', [])
const nnB1 = pen.createList('nnB1', [])
const nnW2 = pen.createList('nnW2', [])

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

const nnB2 = pen.createVariable('nnB2', 0)
const nnScore = pen.createVariable('nnScore', 0)
const nnBestScore = pen.createVariable('nnBestScore', -99999)
const nnBestCol = pen.createVariable('nnBestCol', 0)
const nnBestRow = pen.createVariable('nnBestRow', 0)
const nnFeature1 = pen.createVariable('nnFeature1', 0)
const nnFeature2 = pen.createVariable('nnFeature2', 0)
const nnFeature3 = pen.createVariable('nnFeature3', 0)
const nnFeature4 = pen.createVariable('nnFeature4', 0)
const nnFeature5 = pen.createVariable('nnFeature5', 0)
const nnFeature6 = pen.createVariable('nnFeature6', 0)
const nnIsEdge = pen.createVariable('nnIsEdge', 0)
const nnHiddenIndex = pen.createVariable('nnHiddenIndex', 1)
const nnInputIndex = pen.createVariable('nnInputIndex', 1)
const nnWeightIndex = pen.createVariable('nnWeightIndex', 1)
const nnAccumulator = pen.createVariable('nnAccumulator', 0)

const animCol = pen.createVariable('animCol', 1)
const animRow = pen.createVariable('animRow', 1)
const animSize = pen.createVariable('animSize', 0)
const _animStoneColor = pen.createVariable('animStoneColor', 0)

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

  const loadNNWeights = defineProcedure(
    [procedureLabel('load nn')],
    () => {
      deleteAllOfList(nnW1)
      deleteAllOfList(nnB1)
      deleteAllOfList(nnW2)

      for (const weight of NN_WEIGHTS.w1) {
        addToList(nnW1, weight)
      }
      for (const bias of NN_WEIGHTS.b1) {
        addToList(nnB1, bias)
      }
      for (const weight of NN_WEIGHTS.w2) {
        addToList(nnW2, weight)
      }

      setVariableTo(nnB2, NN_WEIGHTS.b2)
    },
    true,
  )

  const evaluateMoveByNN = defineProcedure(
    [
      procedureLabel('eval nn'),
      procedureStringOrNumber('col'),
      procedureStringOrNumber('row'),
      procedureStringOrNumber('flips'),
    ],
    ({ col, row, flips }) => {
      setVariableTo(nnFeature1, divide(flips.getter(), 18))
      setVariableTo(nnFeature2, 0)
      ifThen(
        and(
          or(equals(col.getter(), 1), equals(col.getter(), BOARD_SIZE)),
          or(equals(row.getter(), 1), equals(row.getter(), BOARD_SIZE)),
        ),
        () => {
          setVariableTo(nnFeature2, 1)
        },
      )

      setVariableTo(nnIsEdge, 0)
      ifThen(
        or(
          or(equals(col.getter(), 1), equals(col.getter(), BOARD_SIZE)),
          or(equals(row.getter(), 1), equals(row.getter(), BOARD_SIZE)),
        ),
        () => {
          setVariableTo(nnIsEdge, 1)
        },
      )
      setVariableTo(nnFeature3, nnIsEdge.get())

      setVariableTo(nnFeature4, 0)
      ifThen(
        or(
          or(
            and(equals(col.getter(), 2), equals(row.getter(), 2)),
            and(equals(col.getter(), 2), equals(row.getter(), BOARD_SIZE - 1)),
          ),
          or(
            and(equals(col.getter(), BOARD_SIZE - 1), equals(row.getter(), 2)),
            and(
              equals(col.getter(), BOARD_SIZE - 1),
              equals(row.getter(), BOARD_SIZE - 1),
            ),
          ),
        ),
        () => {
          setVariableTo(nnFeature4, 1)
        },
      )

      setVariableTo(
        nnFeature5,
        divide(
          add(blackCount.get(), whiteCount.get()),
          BOARD_SIZE * BOARD_SIZE,
        ),
      )
      ifElse(
        equals(currentPlayer.get(), 1),
        () => {
          setVariableTo(nnFeature6, 1)
        },
        () => {
          setVariableTo(nnFeature6, -1)
        },
      )

      deleteAllOfList(nnFeatures)
      addToList(nnFeatures, nnFeature1.get())
      addToList(nnFeatures, nnFeature2.get())
      addToList(nnFeatures, nnFeature3.get())
      addToList(nnFeatures, nnFeature4.get())
      addToList(nnFeatures, nnFeature5.get())
      addToList(nnFeatures, nnFeature6.get())

      deleteAllOfList(nnHidden)
      setVariableTo(nnHiddenIndex, 1)
      repeat(NN_HIDDEN_SIZE, () => {
        setVariableTo(nnAccumulator, getItemOfList(nnB1, nnHiddenIndex.get()))
        setVariableTo(nnInputIndex, 1)

        repeat(NN_INPUT_SIZE, () => {
          setVariableTo(
            nnWeightIndex,
            add(
              multiply(subtract(nnHiddenIndex.get(), 1), NN_INPUT_SIZE),
              nnInputIndex.get(),
            ),
          )
          setVariableTo(
            nnAccumulator,
            add(
              nnAccumulator.get(),
              multiply(
                getItemOfList(nnW1, nnWeightIndex.get()),
                getItemOfList(nnFeatures, nnInputIndex.get()),
              ),
            ),
          )
          changeVariableBy(nnInputIndex, 1)
        })

        ifElse(
          gt(nnAccumulator.get(), 0),
          () => {
            addToList(nnHidden, nnAccumulator.get())
          },
          () => {
            addToList(nnHidden, 0)
          },
        )
        changeVariableBy(nnHiddenIndex, 1)
      })

      setVariableTo(nnScore, nnB2.get())
      setVariableTo(nnHiddenIndex, 1)
      repeat(NN_HIDDEN_SIZE, () => {
        setVariableTo(
          nnScore,
          add(
            nnScore.get(),
            multiply(
              getItemOfList(nnW2, nnHiddenIndex.get()),
              getItemOfList(nnHidden, nnHiddenIndex.get()),
            ),
          ),
        )
        changeVariableBy(nnHiddenIndex, 1)
      })
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

  const animateFlips = defineProcedure(
    [procedureLabel('animate flips')],
    () => {
      // 縮小フェーズ（旧色→グレー）
      setVariableTo(animSize, STONE_SIZE)
      repeat(2, () => {
        changeVariableBy(animSize, -12)

        setVariableTo(idx, 1)
        repeat(divide(lengthOfList(flipList), 2), () => {
          setVariableTo(animCol, getItemOfList(flipList, idx.get()))
          setVariableTo(animRow, getItemOfList(flipList, add(idx.get(), 1)))

          // 背景をクリア（前の石を消す）
          setPenColorTo('#1f8b4c')
          setPenSizeTo(CELL_SIZE - 2)
          gotoXY(cellCenterX(animCol.get()), cellCenterY(animRow.get()))
          penDown()
          penUp()

          ifThen(gt(animSize.get(), 0), () => {
            setPenColorTo('#7f7f7f')
            setPenSizeTo(animSize.get())
            penDown()
            penUp()
          })

          changeVariableBy(idx, 2)
        })
        wait(0)
      })

      // ボードデータを更新
      setVariableTo(idx, 1)
      repeat(divide(lengthOfList(flipList), 2), () => {
        setVariableTo(animCol, getItemOfList(flipList, idx.get()))
        setVariableTo(animRow, getItemOfList(flipList, add(idx.get(), 1)))
        replaceItemOfList(
          board,
          boardIndex(animCol.get(), animRow.get()),
          currentPlayer.get(),
        )
        changeVariableBy(idx, 2)
      })

      // 拡大フェーズ（グレー→新色）
      setVariableTo(animSize, 0)
      repeat(2, () => {
        changeVariableBy(animSize, 12)

        setVariableTo(idx, 1)
        repeat(divide(lengthOfList(flipList), 2), () => {
          setVariableTo(animCol, getItemOfList(flipList, idx.get()))
          setVariableTo(animRow, getItemOfList(flipList, add(idx.get(), 1)))

          // 背景をクリア
          setPenColorTo('#1f8b4c')
          setPenSizeTo(CELL_SIZE - 2)
          gotoXY(cellCenterX(animCol.get()), cellCenterY(animRow.get()))
          penDown()
          penUp()

          ifElse(
            equals(currentPlayer.get(), 1),
            () => {
              setPenColorTo('#111111')
            },
            () => {
              setPenColorTo('#f3f3f3')
            },
          )
          setPenSizeTo(animSize.get())
          penDown()
          penUp()

          changeVariableBy(idx, 2)
        })
        wait(0.01)
      })
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
          addToList(flipList, scanX.get())
          addToList(flipList, scanY.get())
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
            deleteAllOfList(flipList)

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

              // アニメーション実行（全石同時）
              callProcedure(drawScene, {})
              callProcedure(animateFlips, {})

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

  const aiTakeTurn = defineProcedure(
    [procedureLabel('ai turn')],
    () => {
      ifThen(
        and(equals(gameOver.get(), 0), equals(currentPlayer.get(), AI_PLAYER)),
        () => {
          setVariableTo(nnBestScore, -99999)
          setVariableTo(nnBestCol, 0)
          setVariableTo(nnBestRow, 0)
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
                callProcedure(evaluateMoveByNN, [
                  {
                    reference: evaluateMoveByNN.reference.arguments.col,
                    value: loopCol.get(),
                  },
                  {
                    reference: evaluateMoveByNN.reference.arguments.row,
                    value: loopRow.get(),
                  },
                  {
                    reference: evaluateMoveByNN.reference.arguments.flips,
                    value: totalFlips.get(),
                  },
                ])
                ifThen(gt(nnScore.get(), nnBestScore.get()), () => {
                  setVariableTo(nnBestScore, nnScore.get())
                  setVariableTo(nnBestCol, loopCol.get())
                  setVariableTo(nnBestRow, loopRow.get())
                })
              })

              changeVariableBy(loopCol, 1)
            })
            changeVariableBy(loopRow, 1)
          })

          ifThen(gt(nnBestCol.get(), 0), () => {
            callProcedure(placeAt, [
              {
                reference: placeAt.reference.arguments.col,
                value: nnBestCol.get(),
              },
              {
                reference: placeAt.reference.arguments.row,
                value: nnBestRow.get(),
              },
            ])
          })
          ifThen(equals(nnBestCol.get(), 0), () => {
            callProcedure(nextTurn, {})
          })
        },
      )
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

      ifThen(
        and(
          equals(currentPlayer.get(), 1),
          and(getMouseDown(), equals(clickLatch.get(), 0)),
        ),
        () => {
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
        },
      )
      ifThen(not(getMouseDown()), () => {
        setVariableTo(clickLatch, 0)
      })

      callProcedure(recount, {})
      callProcedure(drawScene, {})
      callProcedure(aiTakeTurn, {})
      callProcedure(recount, {})
      callProcedure(drawScene, {})
    },
    true,
  )

  whenFlagClicked(() => {
    hide()
    penUp()
    setPenSizeTo(1)
    callProcedure(loadNNWeights, {})
    callProcedure(initBoard, {})
    callProcedure(recount, {})

    forever(() => {
      callProcedure(oneStep, {}, true)
    })
  })
})

export default project

import.meta.hot?.send('hikkaku:project', project.toScratch())
