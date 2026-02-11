import { Project, type VariableReference } from 'hikkaku'
import {
  add,
  and,
  callProcedure,
  changeVariableBy,
  defineProcedure,
  equals,
  eraseAll,
  forEach,
  forever,
  getItemOfList,
  getKeyPressed,
  getVariable,
  gotoXY,
  gt,
  hide,
  ifElse,
  ifThen,
  lt,
  mod,
  multiply,
  not,
  or,
  penDown,
  penUp,
  procedureLabel,
  random,
  repeatWhile,
  replaceItemOfList,
  setPenColorTo,
  setPenSizeTo,
  setRotationStyle,
  setVariableTo,
  showVariable,
  subtract,
  whenFlagClicked,
} from 'hikkaku/blocks'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const CELL_SIZE = 16
const BOARD_LEFT = -72
const BOARD_BOTTOM = -152
const BORDER_LEFT = BOARD_LEFT - CELL_SIZE / 2
const BORDER_RIGHT = BOARD_LEFT + (BOARD_WIDTH - 0.5) * CELL_SIZE
const BORDER_BOTTOM = BOARD_BOTTOM - CELL_SIZE / 2
const BORDER_TOP = BOARD_BOTTOM + (BOARD_HEIGHT - 0.5) * CELL_SIZE

const TETROMINOES = [
  [
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    [
      [1, -1],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [-1, 1],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [0, 2],
    ],
  ],
  [
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  ],
  [
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [1, 0],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [0, -1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [-1, 0],
    ],
  ],
  [
    [
      [0, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [1, 0],
      [1, 1],
    ],
  ],
  [
    [
      [-1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, -1],
      [1, 0],
      [0, 0],
      [0, 1],
    ],
    [
      [-1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, -1],
      [1, 0],
      [0, 0],
      [0, 1],
    ],
  ],
  [
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [-1, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [1, -1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [-1, -1],
    ],
  ],
  [
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [1, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [1, -1],
    ],
    [
      [-1, -1],
      [-1, 0],
      [0, 0],
      [1, 0],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [-1, 1],
    ],
  ],
] as const

const SHAPE_X: number[] = []
const SHAPE_Y: number[] = []

for (const piece of TETROMINOES) {
  for (const rotation of piece) {
    for (const [x, y] of rotation) {
      SHAPE_X.push(x)
      SHAPE_Y.push(y)
    }
  }
}

const PIECE_COLORS = [
  '#06b6d4',
  '#facc15',
  '#a855f7',
  '#22c55e',
  '#ef4444',
  '#3b82f6',
  '#f97316',
]

const EMPTY_BOARD = Array.from({ length: BOARD_WIDTH * BOARD_HEIGHT }, () => 0)

const project = new Project()
const renderer = project.createSprite('renderer')

const board = renderer.createList('board', EMPTY_BOARD)
const shapeXList = renderer.createList('shapeX', SHAPE_X)
const shapeYList = renderer.createList('shapeY', SHAPE_Y)
const colorList = renderer.createList('pieceColors', PIECE_COLORS)

const pieceType = renderer.createVariable('pieceType', 1)
const pieceRot = renderer.createVariable('pieceRot', 0)
const pieceX = renderer.createVariable('pieceX', 4)
const pieceY = renderer.createVariable('pieceY', 18)

const testX = renderer.createVariable('testX', 0)
const testY = renderer.createVariable('testY', 0)
const testRot = renderer.createVariable('testRot', 0)
const canMove = renderer.createVariable('canMove', 1)

const dropCounter = renderer.createVariable('dropCounter', 0)
const fallInterval = renderer.createVariable('fallInterval', 18)
const gameOver = renderer.createVariable('gameOver', 0)
const score = renderer.createVariable('score', 0, {
  monitor: { visible: true },
})
const lines = renderer.createVariable('lines', 0, {
  monitor: { visible: true },
})

const leftLatch = renderer.createVariable('leftLatch', 0)
const rightLatch = renderer.createVariable('rightLatch', 0)
const rotateLatch = renderer.createVariable('rotateLatch', 0)
const hardLatch = renderer.createVariable('hardLatch', 0)
const restartLatch = renderer.createVariable('restartLatch', 0)
const pieceLocked = renderer.createVariable('pieceLocked', 0)

const blockIndex = renderer.createVariable('blockIndex', 1)
const shapeIndex = renderer.createVariable('shapeIndex', 1)
const cellX = renderer.createVariable('cellX', 0)
const cellY = renderer.createVariable('cellY', 0)
const cellIndex = renderer.createVariable('cellIndex', 1)
const srcIndex = renderer.createVariable('srcIndex', 1)
const destIndex = renderer.createVariable('destIndex', 1)

const drawRow = renderer.createVariable('drawRow', 1)
const drawCol = renderer.createVariable('drawCol', 1)
const drawX = renderer.createVariable('drawX', 0)
const drawY = renderer.createVariable('drawY', 0)
const drawColor = renderer.createVariable('drawColor', 0)

const rowCheck = renderer.createVariable('rowCheck', 1)
const rowShift = renderer.createVariable('rowShift', 1)
const colCheck = renderer.createVariable('colCheck', 1)
const rowFull = renderer.createVariable('rowFull', 0)
const loopIndex = renderer.createVariable('loopIndex', 1)

const read = (variable: VariableReference) => getVariable(variable)

const stepProcCode = '1step'
const collisionProcCode = 'test collision'
const spawnProcCode = 'spawn piece'
const clearProcCode = 'clear lines'
const lockProcCode = 'lock piece'
const drawProcCode = 'draw frame'
const resetProcCode = 'reset game'

renderer.run(() => {
  defineProcedure(
    [procedureLabel(collisionProcCode)],
    () => {
      setVariableTo(canMove, 1)

      forEach(blockIndex, 4, () => {
        setVariableTo(
          shapeIndex,
          add(
            add(
              multiply(subtract(read(pieceType), 1), 16),
              multiply(read(testRot), 4),
            ),
            read(blockIndex),
          ),
        )

        setVariableTo(
          cellX,
          add(read(testX), getItemOfList(shapeXList, read(shapeIndex))),
        )
        setVariableTo(
          cellY,
          add(read(testY), getItemOfList(shapeYList, read(shapeIndex))),
        )

        ifThen(
          or(
            lt(read(cellX), 0),
            or(not(lt(read(cellX), BOARD_WIDTH)), lt(read(cellY), 0)),
          ),
          () => {
            setVariableTo(canMove, 0)
          },
        )

        ifThen(
          and(equals(read(canMove), 1), lt(read(cellY), BOARD_HEIGHT)),
          () => {
            setVariableTo(
              cellIndex,
              add(multiply(read(cellY), BOARD_WIDTH), add(read(cellX), 1)),
            )
            ifThen(
              not(equals(getItemOfList(board, read(cellIndex)), 0)),
              () => {
                setVariableTo(canMove, 0)
              },
            )
          },
        )
      })
    },
    true,
  )

  defineProcedure(
    [procedureLabel(spawnProcCode)],
    () => {
      setVariableTo(pieceType, random(1, 7))
      setVariableTo(pieceRot, 0)
      setVariableTo(pieceX, 4)
      setVariableTo(pieceY, 18)

      setVariableTo(testX, read(pieceX))
      setVariableTo(testY, read(pieceY))
      setVariableTo(testRot, read(pieceRot))
      callProcedure(collisionProcCode, [], {}, true)

      ifThen(equals(read(canMove), 0), () => {
        setVariableTo(gameOver, 1)
      })
    },
    true,
  )

  defineProcedure(
    [procedureLabel(clearProcCode)],
    () => {
      setVariableTo(rowCheck, 1)

      repeatWhile(lt(read(rowCheck), BOARD_HEIGHT + 1), () => {
        setVariableTo(rowFull, 1)

        forEach(colCheck, BOARD_WIDTH, () => {
          setVariableTo(
            cellIndex,
            add(
              multiply(subtract(read(rowCheck), 1), BOARD_WIDTH),
              read(colCheck),
            ),
          )
          ifThen(equals(getItemOfList(board, read(cellIndex)), 0), () => {
            setVariableTo(rowFull, 0)
          })
        })

        ifElse(
          equals(read(rowFull), 1),
          () => {
            changeVariableBy(score, 100)
            changeVariableBy(lines, 1)

            setVariableTo(rowShift, add(read(rowCheck), 1))
            repeatWhile(lt(read(rowShift), BOARD_HEIGHT + 1), () => {
              forEach(colCheck, BOARD_WIDTH, () => {
                setVariableTo(
                  srcIndex,
                  add(
                    multiply(subtract(read(rowShift), 1), BOARD_WIDTH),
                    read(colCheck),
                  ),
                )
                setVariableTo(
                  destIndex,
                  add(
                    multiply(subtract(read(rowShift), 2), BOARD_WIDTH),
                    read(colCheck),
                  ),
                )
                replaceItemOfList(
                  board,
                  read(destIndex),
                  getItemOfList(board, read(srcIndex)),
                )
              })
              changeVariableBy(rowShift, 1)
            })

            forEach(colCheck, BOARD_WIDTH, () => {
              setVariableTo(
                cellIndex,
                add(multiply(BOARD_HEIGHT - 1, BOARD_WIDTH), read(colCheck)),
              )
              replaceItemOfList(board, read(cellIndex), 0)
            })
          },
          () => {
            changeVariableBy(rowCheck, 1)
          },
        )
      })
    },
    true,
  )

  defineProcedure(
    [procedureLabel(lockProcCode)],
    () => {
      forEach(blockIndex, 4, () => {
        setVariableTo(
          shapeIndex,
          add(
            add(
              multiply(subtract(read(pieceType), 1), 16),
              multiply(read(pieceRot), 4),
            ),
            read(blockIndex),
          ),
        )

        setVariableTo(
          cellX,
          add(read(pieceX), getItemOfList(shapeXList, read(shapeIndex))),
        )
        setVariableTo(
          cellY,
          add(read(pieceY), getItemOfList(shapeYList, read(shapeIndex))),
        )

        ifThen(not(lt(read(cellY), BOARD_HEIGHT)), () => {
          setVariableTo(gameOver, 1)
        })

        ifThen(
          and(
            and(not(lt(read(cellX), 0)), lt(read(cellX), BOARD_WIDTH)),
            and(not(lt(read(cellY), 0)), lt(read(cellY), BOARD_HEIGHT)),
          ),
          () => {
            setVariableTo(
              cellIndex,
              add(multiply(read(cellY), BOARD_WIDTH), add(read(cellX), 1)),
            )
            replaceItemOfList(board, read(cellIndex), read(pieceType))
          },
        )
      })

      ifThen(equals(read(gameOver), 0), () => {
        callProcedure(clearProcCode, [], {}, true)
        callProcedure(spawnProcCode, [], {}, true)
      })

      setVariableTo(dropCounter, 0)
    },
    true,
  )

  defineProcedure(
    [procedureLabel(drawProcCode)],
    () => {
      eraseAll()

      setPenColorTo('#334155')
      setPenSizeTo(2)
      penUp()
      gotoXY(BORDER_LEFT, BORDER_BOTTOM)
      penDown()
      gotoXY(BORDER_RIGHT, BORDER_BOTTOM)
      gotoXY(BORDER_RIGHT, BORDER_TOP)
      gotoXY(BORDER_LEFT, BORDER_TOP)
      gotoXY(BORDER_LEFT, BORDER_BOTTOM)
      penUp()

      setPenSizeTo(CELL_SIZE - 2)

      forEach(drawRow, BOARD_HEIGHT, () => {
        forEach(drawCol, BOARD_WIDTH, () => {
          setVariableTo(
            cellIndex,
            add(
              multiply(subtract(read(drawRow), 1), BOARD_WIDTH),
              read(drawCol),
            ),
          )
          setVariableTo(drawColor, getItemOfList(board, read(cellIndex)))

          ifThen(gt(read(drawColor), 0), () => {
            setVariableTo(
              drawX,
              add(BOARD_LEFT, multiply(subtract(read(drawCol), 1), CELL_SIZE)),
            )
            setVariableTo(
              drawY,
              add(
                BOARD_BOTTOM,
                multiply(subtract(read(drawRow), 1), CELL_SIZE),
              ),
            )
            setPenColorTo(getItemOfList(colorList, read(drawColor)))
            gotoXY(read(drawX), read(drawY))
            penDown()
            gotoXY(add(read(drawX), 0.01), read(drawY))
            penUp()
          })
        })
      })

      ifThen(equals(read(gameOver), 0), () => {
        forEach(blockIndex, 4, () => {
          setVariableTo(
            shapeIndex,
            add(
              add(
                multiply(subtract(read(pieceType), 1), 16),
                multiply(read(pieceRot), 4),
              ),
              read(blockIndex),
            ),
          )

          setVariableTo(
            cellX,
            add(read(pieceX), getItemOfList(shapeXList, read(shapeIndex))),
          )
          setVariableTo(
            cellY,
            add(read(pieceY), getItemOfList(shapeYList, read(shapeIndex))),
          )

          ifThen(
            and(
              and(not(lt(read(cellX), 0)), lt(read(cellX), BOARD_WIDTH)),
              and(not(lt(read(cellY), 0)), lt(read(cellY), BOARD_HEIGHT)),
            ),
            () => {
              setVariableTo(
                drawX,
                add(BOARD_LEFT, multiply(read(cellX), CELL_SIZE)),
              )
              setVariableTo(
                drawY,
                add(BOARD_BOTTOM, multiply(read(cellY), CELL_SIZE)),
              )
              setPenColorTo(getItemOfList(colorList, read(pieceType)))
              gotoXY(read(drawX), read(drawY))
              penDown()
              gotoXY(add(read(drawX), 0.01), read(drawY))
              penUp()
            },
          )
        })
      })

      ifThen(equals(read(gameOver), 1), () => {
        setPenColorTo('#ef4444')
        setPenSizeTo(6)
        penUp()
        gotoXY(BORDER_LEFT + CELL_SIZE, BOARD_BOTTOM + CELL_SIZE * 7)
        penDown()
        gotoXY(BORDER_RIGHT - CELL_SIZE, BOARD_BOTTOM + CELL_SIZE * 13)
        penUp()
        gotoXY(BORDER_RIGHT - CELL_SIZE, BOARD_BOTTOM + CELL_SIZE * 7)
        penDown()
        gotoXY(BORDER_LEFT + CELL_SIZE, BOARD_BOTTOM + CELL_SIZE * 13)
        penUp()
      })
    },
    true,
  )

  defineProcedure(
    [procedureLabel(resetProcCode)],
    () => {
      forEach(loopIndex, BOARD_WIDTH * BOARD_HEIGHT, () => {
        replaceItemOfList(board, read(loopIndex), 0)
      })

      setVariableTo(score, 0)
      setVariableTo(lines, 0)
      setVariableTo(dropCounter, 0)
      setVariableTo(fallInterval, 18)
      setVariableTo(gameOver, 0)

      setVariableTo(leftLatch, 0)
      setVariableTo(rightLatch, 0)
      setVariableTo(rotateLatch, 0)
      setVariableTo(hardLatch, 0)
      setVariableTo(restartLatch, 0)
      setVariableTo(pieceLocked, 0)

      callProcedure(spawnProcCode, [], {}, true)
    },
    true,
  )

  defineProcedure(
    [procedureLabel(stepProcCode)],
    () => {
      ifElse(
        equals(read(gameOver), 1),
        () => {
          ifElse(
            or(getKeyPressed('r'), getKeyPressed('space')),
            () => {
              ifThen(equals(read(restartLatch), 0), () => {
                setVariableTo(restartLatch, 1)
                callProcedure(resetProcCode, [], {}, true)
              })
            },
            () => {
              setVariableTo(restartLatch, 0)
            },
          )
        },
        () => {
          setVariableTo(pieceLocked, 0)

          ifElse(
            getKeyPressed('left arrow'),
            () => {
              ifThen(equals(read(leftLatch), 0), () => {
                setVariableTo(leftLatch, 1)
                setVariableTo(testX, subtract(read(pieceX), 1))
                setVariableTo(testY, read(pieceY))
                setVariableTo(testRot, read(pieceRot))
                callProcedure(collisionProcCode, [], {}, true)
                ifThen(equals(read(canMove), 1), () => {
                  changeVariableBy(pieceX, -1)
                })
              })
            },
            () => {
              setVariableTo(leftLatch, 0)
            },
          )

          ifElse(
            getKeyPressed('right arrow'),
            () => {
              ifThen(equals(read(rightLatch), 0), () => {
                setVariableTo(rightLatch, 1)
                setVariableTo(testX, add(read(pieceX), 1))
                setVariableTo(testY, read(pieceY))
                setVariableTo(testRot, read(pieceRot))
                callProcedure(collisionProcCode, [], {}, true)
                ifThen(equals(read(canMove), 1), () => {
                  changeVariableBy(pieceX, 1)
                })
              })
            },
            () => {
              setVariableTo(rightLatch, 0)
            },
          )

          ifElse(
            getKeyPressed('up arrow'),
            () => {
              ifThen(equals(read(rotateLatch), 0), () => {
                setVariableTo(rotateLatch, 1)
                setVariableTo(testRot, mod(add(read(pieceRot), 1), 4))

                setVariableTo(testX, read(pieceX))
                setVariableTo(testY, read(pieceY))
                callProcedure(collisionProcCode, [], {}, true)

                ifElse(
                  equals(read(canMove), 1),
                  () => {
                    setVariableTo(pieceRot, read(testRot))
                  },
                  () => {
                    setVariableTo(testX, add(read(pieceX), 1))
                    setVariableTo(testY, read(pieceY))
                    callProcedure(collisionProcCode, [], {}, true)

                    ifElse(
                      equals(read(canMove), 1),
                      () => {
                        changeVariableBy(pieceX, 1)
                        setVariableTo(pieceRot, read(testRot))
                      },
                      () => {
                        setVariableTo(testX, subtract(read(pieceX), 1))
                        setVariableTo(testY, read(pieceY))
                        callProcedure(collisionProcCode, [], {}, true)

                        ifElse(
                          equals(read(canMove), 1),
                          () => {
                            changeVariableBy(pieceX, -1)
                            setVariableTo(pieceRot, read(testRot))
                          },
                          () => {
                            setVariableTo(testX, read(pieceX))
                            setVariableTo(testY, add(read(pieceY), 1))
                            callProcedure(collisionProcCode, [], {}, true)

                            ifThen(equals(read(canMove), 1), () => {
                              changeVariableBy(pieceY, 1)
                              setVariableTo(pieceRot, read(testRot))
                            })
                          },
                        )
                      },
                    )
                  },
                )
              })
            },
            () => {
              setVariableTo(rotateLatch, 0)
            },
          )

          ifElse(
            getKeyPressed('space'),
            () => {
              ifThen(equals(read(hardLatch), 0), () => {
                setVariableTo(hardLatch, 1)
                setVariableTo(canMove, 1)

                repeatWhile(equals(read(canMove), 1), () => {
                  setVariableTo(testX, read(pieceX))
                  setVariableTo(testY, subtract(read(pieceY), 1))
                  setVariableTo(testRot, read(pieceRot))
                  callProcedure(collisionProcCode, [], {}, true)
                  ifThen(equals(read(canMove), 1), () => {
                    changeVariableBy(pieceY, -1)
                  })
                })

                callProcedure(lockProcCode, [], {}, true)
                setVariableTo(pieceLocked, 1)
              })
            },
            () => {
              setVariableTo(hardLatch, 0)
            },
          )

          ifThen(equals(read(pieceLocked), 0), () => {
            changeVariableBy(dropCounter, 1)

            ifThen(getKeyPressed('down arrow'), () => {
              changeVariableBy(dropCounter, 3)
            })

            ifThen(not(lt(read(dropCounter), read(fallInterval))), () => {
              setVariableTo(dropCounter, 0)
              setVariableTo(testX, read(pieceX))
              setVariableTo(testY, subtract(read(pieceY), 1))
              setVariableTo(testRot, read(pieceRot))
              callProcedure(collisionProcCode, [], {}, true)

              ifElse(
                equals(read(canMove), 1),
                () => {
                  changeVariableBy(pieceY, -1)
                },
                () => {
                  callProcedure(lockProcCode, [], {}, true)
                  setVariableTo(pieceLocked, 1)
                },
              )
            })
          })
        },
      )

      callProcedure(drawProcCode, [], {}, true)
    },
    true,
  )

  whenFlagClicked(() => {
    hide()
    setRotationStyle("don't rotate")
    penUp()

    showVariable(score)
    showVariable(lines)

    callProcedure(resetProcCode, [], {}, true)

    forever(() => {
      callProcedure(stepProcCode, [], {}, true)
    })
  })
})

export default project
