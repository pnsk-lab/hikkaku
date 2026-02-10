import { Project, type VariableReference } from 'hikkaku'
import {
  add,
  and,
  callProcedure,
  changeVariableBy,
  defineProcedure,
  divide,
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
  mathop,
  mod,
  multiply,
  not,
  or,
  penDown,
  penUp,
  procedureLabel,
  random,
  replaceItemOfList,
  setPenColorTo,
  setPenSizeTo,
  setVariableTo,
  subtract,
  whenFlagClicked,
} from 'hikkaku/blocks'

const project = new Project()

const score = project.stage.createVariable('score', 0)
const gameOver = project.stage.createVariable('gameOver', 0)
const speed = project.stage.createVariable('speed', 1.5)

const renderer = project.createSprite('renderer')

const playerX = renderer.createVariable('playerX', 0)
const playerY = renderer.createVariable('playerY', -136)
const playerLane = renderer.createVariable('playerLane', 3)
const vx = renderer.createVariable('vx', 0)
const spin = renderer.createVariable('spin', 0)

const slotIndex = renderer.createVariable('slotIndex', 1)
const laneIndex = renderer.createVariable('laneIndex', 1)

const rowDepth = renderer.createVariable('rowDepth', 0)
const rowDepthFar = renderer.createVariable('rowDepthFar', 0)
const rowStart = renderer.createVariable('rowStart', 1)
const rowWidth = renderer.createVariable('rowWidth', 5)
const rowHole = renderer.createVariable('rowHole', 3)
const rowEnd = renderer.createVariable('rowEnd', 5)
const supported = renderer.createVariable('supported', 1)

const tileY = renderer.createVariable('tileY', 0)
const tileYFar = renderer.createVariable('tileYFar', 0)
const laneSpacing = renderer.createVariable('laneSpacing', 0)
const laneSpacingFar = renderer.createVariable('laneSpacingFar', 0)
const tileLeftNear = renderer.createVariable('tileLeftNear', 0)
const tileRightNear = renderer.createVariable('tileRightNear', 0)
const tileLeftFar = renderer.createVariable('tileLeftFar', 0)
const tileRightFar = renderer.createVariable('tileRightFar', 0)

const highlightX = renderer.createVariable('highlightX', 0)
const highlightY = renderer.createVariable('highlightY', 0)

const rowDepthList = renderer.createList(
  'rowDepth',
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
)
const rowStartList = renderer.createList(
  'rowStart',
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
)
const rowWidthList = renderer.createList(
  'rowWidth',
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
)
const rowHoleList = renderer.createList(
  'rowHole',
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
)
const rowCheckedList = renderer.createList(
  'rowChecked',
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
)

const readVar = (variable: VariableReference) => getVariable(variable)

renderer.run(() => {
  const stepProcedure = defineProcedure(
    [procedureLabel('1step')],
    () => {
      ifElse(
        equals(readVar(gameOver), 0),
        () => {
          ifThen(or(getKeyPressed('left arrow'), getKeyPressed('a')), () => {
            changeVariableBy(vx, -1)
          })
          ifThen(or(getKeyPressed('right arrow'), getKeyPressed('d')), () => {
            changeVariableBy(vx, 1)
          })

          setVariableTo(vx, multiply(readVar(vx), 0.8))
          changeVariableBy(playerX, readVar(vx))
          changeVariableBy(
            spin,
            add(multiply(readVar(speed), 1.8), readVar(vx)),
          )

          ifThen(lt(readVar(playerX), -190), () => {
            setVariableTo(playerX, -190)
            setVariableTo(vx, 0)
          })
          ifThen(gt(readVar(playerX), 190), () => {
            setVariableTo(playerX, 190)
            setVariableTo(vx, 0)
          })

          ifElse(
            lt(readVar(playerX), -127),
            () => {
              setVariableTo(playerLane, 1)
            },
            () => {
              ifElse(
                lt(readVar(playerX), -42),
                () => {
                  setVariableTo(playerLane, 2)
                },
                () => {
                  ifElse(
                    lt(readVar(playerX), 42),
                    () => {
                      setVariableTo(playerLane, 3)
                    },
                    () => {
                      ifElse(
                        lt(readVar(playerX), 127),
                        () => {
                          setVariableTo(playerLane, 4)
                        },
                        () => {
                          setVariableTo(playerLane, 5)
                        },
                      )
                    },
                  )
                },
              )
            },
          )

          changeVariableBy(score, 1)
          setVariableTo(speed, add(1.5, divide(readVar(score), 320)))
          setVariableTo(playerY, -136)

          forEach(slotIndex, 14, () => {
            setVariableTo(
              rowDepth,
              add(
                getItemOfList(rowDepthList, readVar(slotIndex)),
                readVar(speed),
              ),
            )

            ifThen(gt(readVar(rowDepth), 112), () => {
              setVariableTo(rowDepth, subtract(readVar(rowDepth), 112))

              setVariableTo(rowStart, 1)
              setVariableTo(rowWidth, 5)
              setVariableTo(rowHole, random(1, 5))

              replaceItemOfList(
                rowStartList,
                readVar(slotIndex),
                readVar(rowStart),
              )
              replaceItemOfList(
                rowWidthList,
                readVar(slotIndex),
                readVar(rowWidth),
              )
              replaceItemOfList(
                rowHoleList,
                readVar(slotIndex),
                readVar(rowHole),
              )
              replaceItemOfList(rowCheckedList, readVar(slotIndex), 0)
            })

            replaceItemOfList(
              rowDepthList,
              readVar(slotIndex),
              readVar(rowDepth),
            )

            ifThen(
              and(
                equals(getItemOfList(rowCheckedList, readVar(slotIndex)), 0),
                gt(readVar(rowDepth), 92),
              ),
              () => {
                replaceItemOfList(rowCheckedList, readVar(slotIndex), 1)

                setVariableTo(
                  rowStart,
                  getItemOfList(rowStartList, readVar(slotIndex)),
                )
                setVariableTo(
                  rowWidth,
                  getItemOfList(rowWidthList, readVar(slotIndex)),
                )
                setVariableTo(
                  rowHole,
                  getItemOfList(rowHoleList, readVar(slotIndex)),
                )
                setVariableTo(
                  rowEnd,
                  add(readVar(rowStart), subtract(readVar(rowWidth), 1)),
                )

                setVariableTo(supported, 0)
                ifThen(
                  and(
                    gt(readVar(playerLane), subtract(readVar(rowStart), 1)),
                    lt(readVar(playerLane), add(readVar(rowEnd), 1)),
                  ),
                  () => {
                    setVariableTo(supported, 1)
                  },
                )
                ifThen(equals(readVar(playerLane), readVar(rowHole)), () => {
                  setVariableTo(supported, 0)
                })

                ifThen(equals(readVar(supported), 0), () => {
                  setVariableTo(gameOver, 1)
                })
              },
            )
          })
        },
        () => {
          ifThen(gt(readVar(playerY), -220), () => {
            changeVariableBy(playerY, -6)
          })
        },
      )

      eraseAll()

      setPenColorTo('#1e293b')
      setPenSizeTo(6)
      gotoXY(-38, 94)
      penDown()
      gotoXY(-220, -178)
      penUp()
      gotoXY(38, 94)
      penDown()
      gotoXY(220, -178)
      penUp()

      forEach(slotIndex, 14, () => {
        setVariableTo(rowDepth, getItemOfList(rowDepthList, readVar(slotIndex)))
        setVariableTo(rowStart, getItemOfList(rowStartList, readVar(slotIndex)))
        setVariableTo(rowWidth, getItemOfList(rowWidthList, readVar(slotIndex)))
        setVariableTo(rowHole, getItemOfList(rowHoleList, readVar(slotIndex)))
        setVariableTo(
          rowEnd,
          add(readVar(rowStart), subtract(readVar(rowWidth), 1)),
        )

        ifElse(
          lt(readVar(rowDepth), 8),
          () => {
            setVariableTo(rowDepthFar, 0)
          },
          () => {
            setVariableTo(rowDepthFar, subtract(readVar(rowDepth), 8))
          },
        )
        setVariableTo(tileY, subtract(96, multiply(readVar(rowDepth), 2.35)))
        setVariableTo(
          tileYFar,
          subtract(96, multiply(readVar(rowDepthFar), 2.35)),
        )
        setVariableTo(laneSpacing, add(12, multiply(readVar(rowDepth), 0.78)))
        setVariableTo(
          laneSpacingFar,
          add(12, multiply(readVar(rowDepthFar), 0.78)),
        )

        forEach(laneIndex, 5, () => {
          ifThen(
            and(
              and(
                gt(readVar(laneIndex), subtract(readVar(rowStart), 1)),
                lt(readVar(laneIndex), add(readVar(rowEnd), 1)),
              ),
              not(equals(readVar(laneIndex), readVar(rowHole))),
            ),
            () => {
              setVariableTo(
                tileLeftNear,
                multiply(
                  subtract(readVar(laneIndex), 3.5),
                  readVar(laneSpacing),
                ),
              )
              setVariableTo(
                tileRightNear,
                multiply(
                  subtract(readVar(laneIndex), 2.5),
                  readVar(laneSpacing),
                ),
              )
              setVariableTo(
                tileLeftFar,
                multiply(
                  subtract(readVar(laneIndex), 3.5),
                  readVar(laneSpacingFar),
                ),
              )
              setVariableTo(
                tileRightFar,
                multiply(
                  subtract(readVar(laneIndex), 2.5),
                  readVar(laneSpacingFar),
                ),
              )

              setPenColorTo('#64748b')
              setPenSizeTo(1)
              gotoXY(readVar(tileLeftNear), readVar(tileY))
              penDown()
              gotoXY(readVar(tileRightNear), readVar(tileY))
              gotoXY(readVar(tileRightFar), readVar(tileYFar))
              gotoXY(readVar(tileLeftFar), readVar(tileYFar))
              gotoXY(readVar(tileLeftNear), readVar(tileY))
              penUp()

              setPenColorTo('#94a3b8')
              gotoXY(readVar(tileLeftFar), readVar(tileYFar))
              penDown()
              gotoXY(readVar(tileRightFar), readVar(tileYFar))
              penUp()
            },
          )
        })
      })

      setPenColorTo('#0f172a')
      setPenSizeTo(22)
      gotoXY(add(readVar(playerX), 5), subtract(readVar(playerY), 13))
      penDown()
      gotoXY(add(readVar(playerX), 5), subtract(readVar(playerY), 12.8))
      penUp()

      setPenColorTo('#22c55e')
      setPenSizeTo(38)
      gotoXY(readVar(playerX), readVar(playerY))
      penDown()
      gotoXY(readVar(playerX), add(readVar(playerY), 0.2))
      penUp()

      setVariableTo(
        highlightX,
        add(readVar(playerX), multiply(mathop('cos', readVar(spin)), 8)),
      )
      setVariableTo(
        highlightY,
        add(readVar(playerY), multiply(mathop('sin', readVar(spin)), 5)),
      )

      setPenColorTo('#86efac')
      setPenSizeTo(11)
      gotoXY(readVar(highlightX), readVar(highlightY))
      penDown()
      gotoXY(readVar(highlightX), add(readVar(highlightY), 0.2))
      penUp()

      setPenColorTo('#0ea5e9')
      setPenSizeTo(7)
      gotoXY(-220, 162)
      penDown()
      gotoXY(add(-220, multiply(mod(readVar(score), 300), 1.45)), 162)
      penUp()

      ifThen(equals(readVar(gameOver), 1), () => {
        setPenColorTo('#ef4444')
        setPenSizeTo(16)
        gotoXY(-95, 35)
        penDown()
        gotoXY(95, -65)
        penUp()

        gotoXY(-95, -65)
        penDown()
        gotoXY(95, 35)
        penUp()
      })
    },
    true,
  )

  whenFlagClicked(() => {
    hide()
    penUp()

    setVariableTo(score, 0)
    setVariableTo(gameOver, 0)
    setVariableTo(speed, 1.5)

    setVariableTo(playerX, 0)
    setVariableTo(playerY, -136)
    setVariableTo(playerLane, 3)
    setVariableTo(vx, 0)
    setVariableTo(spin, 0)

    forEach(slotIndex, 14, () => {
      setVariableTo(rowStart, 1)
      setVariableTo(rowWidth, 5)
      setVariableTo(rowHole, random(1, 5))

      replaceItemOfList(
        rowDepthList,
        readVar(slotIndex),
        multiply(subtract(readVar(slotIndex), 1), 8),
      )
      replaceItemOfList(rowStartList, readVar(slotIndex), readVar(rowStart))
      replaceItemOfList(rowWidthList, readVar(slotIndex), readVar(rowWidth))
      replaceItemOfList(rowHoleList, readVar(slotIndex), readVar(rowHole))
      replaceItemOfList(rowCheckedList, readVar(slotIndex), 0)
    })

    forever(() => {
      callProcedure(stepProcedure, {})
    })
  })
})

export default project
