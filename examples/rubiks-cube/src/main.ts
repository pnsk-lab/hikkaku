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
  getMouseDown,
  getMouseX,
  getMouseY,
  getVariable,
  gotoXY,
  gt,
  hide,
  ifElse,
  ifThen,
  lt,
  mathop,
  multiply,
  not,
  or,
  penDown,
  penUp,
  procedureLabel,
  repeat,
  replaceItemOfList,
  setDragMode,
  setPenColorParamTo,
  setPenColorTo,
  setPenSizeTo,
  setVariableTo,
  subtract,
  whenFlagClicked,
} from 'hikkaku/blocks'

type Vec3 = readonly [number, number, number]
type StickerSeed = {
  pos: Vec3
  normal: Vec3
  u: Vec3
  v: Vec3
  color: number
}

const stickerSeeds: StickerSeed[] = []

const addFace = (normal: Vec3, u: Vec3, v: Vec3, color: number) => {
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const gu = col - 1
      const gv = 1 - row
      stickerSeeds.push({
        pos: [
          normal[0] + u[0] * gu + v[0] * gv,
          normal[1] + u[1] * gu + v[1] * gv,
          normal[2] + u[2] * gu + v[2] * gv,
        ],
        normal,
        u,
        v,
        color,
      })
    }
  }
}

// Front axis is z:-1 because Scratch camera is effectively at negative z.
addFace([0, 0, -1], [1, 0, 0], [0, 1, 0], 3) // F - green
addFace([0, 0, 1], [-1, 0, 0], [0, 1, 0], 4) // B - blue
addFace([1, 0, 0], [0, 0, 1], [0, 1, 0], 5) // R - red
addFace([-1, 0, 0], [0, 0, -1], [0, 1, 0], 6) // L - orange
addFace([0, 1, 0], [1, 0, 0], [0, 0, 1], 1) // U - white
addFace([0, -1, 0], [1, 0, 0], [0, 0, -1], 2) // D - yellow

const stickerCount = stickerSeeds.length
const zeroes = stickerSeeds.map(() => 0)
const drawOrderSeed = stickerSeeds.map((_, index) => index + 1)
const initialViewYaw = 32
const initialViewPitch = -24
const initialTurnAxis = 2
const initialTurnLayer = 1
const initialTurnDir = 1

const project = new Project()
const renderer = project.createSprite('renderer')

const viewYaw = renderer.createVariable('viewYaw', initialViewYaw)
const viewPitch = renderer.createVariable('viewPitch', initialViewPitch)
const cosYaw = renderer.createVariable('cosYaw', 1)
const sinYaw = renderer.createVariable('sinYaw', 0)
const cosPitch = renderer.createVariable('cosPitch', 1)
const sinPitch = renderer.createVariable('sinPitch', 0)

const cameraDistance = renderer.createVariable('cameraDistance', 420)
const focalLength = renderer.createVariable('focalLength', 290)
const modelScale = renderer.createVariable('modelScale', 80.6)

const cubiePitch = renderer.createVariable('cubiePitch', 0.66)
const faceOffset = renderer.createVariable('faceOffset', 0.34)
const stickerHalf = renderer.createVariable('stickerHalf', 0.34)
const stickerScale = renderer.createVariable('stickerScale', 14)

const dragging = renderer.createVariable('dragging', 0)
const lastMouseX = renderer.createVariable('lastMouseX', 0)
const lastMouseY = renderer.createVariable('lastMouseY', 0)

const inputLock = renderer.createVariable('inputLock', 0)
const anyMovePressed = renderer.createVariable('anyMovePressed', 0)

const turnActive = renderer.createVariable('turnActive', 0)
const turnAxis = renderer.createVariable('turnAxis', initialTurnAxis)
const turnLayer = renderer.createVariable('turnLayer', initialTurnLayer)
const turnDir = renderer.createVariable('turnDir', initialTurnDir)
const turnProgress = renderer.createVariable('turnProgress', 0)
const turnSpeed = renderer.createVariable('turnSpeed', 12)
const turnAngle = renderer.createVariable('turnAngle', 0)
const turnCos = renderer.createVariable('turnCos', 1)
const turnSin = renderer.createVariable('turnSin', 0)

const stickerIndex = renderer.createVariable('stickerIndex', 1)
const passIndex = renderer.createVariable('passIndex', 1)
const sortIndex = renderer.createVariable('sortIndex', 1)
const drawIndex = renderer.createVariable('drawIndex', 1)

const inTurningLayer = renderer.createVariable('inTurningLayer', 0)
const visibleFlag = renderer.createVariable('visibleFlag', 0)

const orderA = renderer.createVariable('orderA', 1)
const orderB = renderer.createVariable('orderB', 1)
const depthA = renderer.createVariable('depthA', 0)
const depthB = renderer.createVariable('depthB', 0)
const swapTmp = renderer.createVariable('swapTmp', 0)

const loadX = renderer.createVariable('loadX', 0)
const loadY = renderer.createVariable('loadY', 0)
const loadZ = renderer.createVariable('loadZ', 0)
const newX = renderer.createVariable('newX', 0)
const newY = renderer.createVariable('newY', 0)
const newZ = renderer.createVariable('newZ', 0)

const posX = renderer.createVariable('posX', 0)
const posY = renderer.createVariable('posY', 0)
const posZ = renderer.createVariable('posZ', 0)

const nx = renderer.createVariable('nx', 0)
const ny = renderer.createVariable('ny', 0)
const nz = renderer.createVariable('nz', 0)

const ux = renderer.createVariable('ux', 0)
const uy = renderer.createVariable('uy', 0)
const uz = renderer.createVariable('uz', 0)

const vx = renderer.createVariable('vx', 0)
const vy = renderer.createVariable('vy', 0)
const vz = renderer.createVariable('vz', 0)

const rPosX = renderer.createVariable('rPosX', 0)
const rPosY = renderer.createVariable('rPosY', 0)
const rPosZ = renderer.createVariable('rPosZ', 0)

const rNx = renderer.createVariable('rNx', 0)
const rNy = renderer.createVariable('rNy', 0)
const rNz = renderer.createVariable('rNz', 0)

const rUx = renderer.createVariable('rUx', 0)
const rUy = renderer.createVariable('rUy', 0)
const rUz = renderer.createVariable('rUz', 0)

const rVx = renderer.createVariable('rVx', 0)
const rVy = renderer.createVariable('rVy', 0)
const rVz = renderer.createVariable('rVz', 0)

const centerX = renderer.createVariable('centerX', 0)
const centerY = renderer.createVariable('centerY', 0)
const centerZ = renderer.createVariable('centerZ', 0)

const cornerX = renderer.createVariable('cornerX', 0)
const cornerY = renderer.createVariable('cornerY', 0)
const cornerZ = renderer.createVariable('cornerZ', 0)

const cameraX = renderer.createVariable('cameraX', 0)
const cameraY = renderer.createVariable('cameraY', 0)
const cameraZ1 = renderer.createVariable('cameraZ1', 0)
const cameraZ = renderer.createVariable('cameraZ', 0)
const perspective = renderer.createVariable('perspective', 1)

const qx1 = renderer.createVariable('qx1', 0)
const qy1 = renderer.createVariable('qy1', 0)
const qx2 = renderer.createVariable('qx2', 0)
const qy2 = renderer.createVariable('qy2', 0)
const qx3 = renderer.createVariable('qx3', 0)
const qy3 = renderer.createVariable('qy3', 0)
const qx4 = renderer.createVariable('qx4', 0)
const qy4 = renderer.createVariable('qy4', 0)
const colorId = renderer.createVariable('colorId', 1)
const tileTransparency = renderer.createVariable('tileTransparency', 0)
const edgeTransparency = renderer.createVariable('edgeTransparency', 0)

const yMin = renderer.createVariable('yMin', 0)
const yMax = renderer.createVariable('yMax', 0)
const scanSteps = renderer.createVariable('scanSteps', 1)
const scanIndex = renderer.createVariable('scanIndex', 0)
const yScan = renderer.createVariable('yScan', 0)
const hitCount = renderer.createVariable('hitCount', 0)
const xMin = renderer.createVariable('xMin', 0)
const xMax = renderer.createVariable('xMax', 0)

const edgeMinY = renderer.createVariable('edgeMinY', 0)
const edgeMaxY = renderer.createVariable('edgeMaxY', 0)
const edgeDy = renderer.createVariable('edgeDy', 0)
const edgeT = renderer.createVariable('edgeT', 0)
const xHit = renderer.createVariable('xHit', 0)

const posXList = renderer.createList(
  'posX',
  stickerSeeds.map((seed) => seed.pos[0]),
)
const posYList = renderer.createList(
  'posY',
  stickerSeeds.map((seed) => seed.pos[1]),
)
const posZList = renderer.createList(
  'posZ',
  stickerSeeds.map((seed) => seed.pos[2]),
)

const nxList = renderer.createList(
  'nx',
  stickerSeeds.map((seed) => seed.normal[0]),
)
const nyList = renderer.createList(
  'ny',
  stickerSeeds.map((seed) => seed.normal[1]),
)
const nzList = renderer.createList(
  'nz',
  stickerSeeds.map((seed) => seed.normal[2]),
)

const uxList = renderer.createList(
  'ux',
  stickerSeeds.map((seed) => seed.u[0]),
)
const uyList = renderer.createList(
  'uy',
  stickerSeeds.map((seed) => seed.u[1]),
)
const uzList = renderer.createList(
  'uz',
  stickerSeeds.map((seed) => seed.u[2]),
)

const vxList = renderer.createList(
  'vx',
  stickerSeeds.map((seed) => seed.v[0]),
)
const vyList = renderer.createList(
  'vy',
  stickerSeeds.map((seed) => seed.v[1]),
)
const vzList = renderer.createList(
  'vz',
  stickerSeeds.map((seed) => seed.v[2]),
)

const colorList = renderer.createList(
  'color',
  stickerSeeds.map((seed) => seed.color),
)

const colorHexList = renderer.createList('colorHex', [
  '#f8fafc', // white
  '#fde047', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#f97316', // orange
])

const p1xList = renderer.createList('p1x', zeroes)
const p1yList = renderer.createList('p1y', zeroes)
const p2xList = renderer.createList('p2x', zeroes)
const p2yList = renderer.createList('p2y', zeroes)
const p3xList = renderer.createList('p3x', zeroes)
const p3yList = renderer.createList('p3y', zeroes)
const p4xList = renderer.createList('p4x', zeroes)
const p4yList = renderer.createList('p4y', zeroes)

const depthList = renderer.createList('depth', zeroes)
const visibleList = renderer.createList('visible', zeroes)
const drawOrderList = renderer.createList('drawOrder', drawOrderSeed)
const seedPosXList = renderer.createList(
  'seedPosX',
  stickerSeeds.map((seed) => seed.pos[0]),
)
const seedPosYList = renderer.createList(
  'seedPosY',
  stickerSeeds.map((seed) => seed.pos[1]),
)
const seedPosZList = renderer.createList(
  'seedPosZ',
  stickerSeeds.map((seed) => seed.pos[2]),
)
const seedNxList = renderer.createList(
  'seedNx',
  stickerSeeds.map((seed) => seed.normal[0]),
)
const seedNyList = renderer.createList(
  'seedNy',
  stickerSeeds.map((seed) => seed.normal[1]),
)
const seedNzList = renderer.createList(
  'seedNz',
  stickerSeeds.map((seed) => seed.normal[2]),
)
const seedUxList = renderer.createList(
  'seedUx',
  stickerSeeds.map((seed) => seed.u[0]),
)
const seedUyList = renderer.createList(
  'seedUy',
  stickerSeeds.map((seed) => seed.u[1]),
)
const seedUzList = renderer.createList(
  'seedUz',
  stickerSeeds.map((seed) => seed.u[2]),
)
const seedVxList = renderer.createList(
  'seedVx',
  stickerSeeds.map((seed) => seed.v[0]),
)
const seedVyList = renderer.createList(
  'seedVy',
  stickerSeeds.map((seed) => seed.v[1]),
)
const seedVzList = renderer.createList(
  'seedVz',
  stickerSeeds.map((seed) => seed.v[2]),
)
const seedDrawOrderList = renderer.createList('seedDrawOrder', drawOrderSeed)

const readVar = (variable: VariableReference) => getVariable(variable)

const fillProcCode = 'fill-sticker-quad'
const commitTurnProcCode = 'commit-turn'
const resetStateProcCode = 'reset-state'
const stepProcCode = '1step'
const noArgs: string[] = []

renderer.run(() => {
  defineProcedure(
    [procedureLabel(fillProcCode)],
    () => {
      setPenColorTo(getItemOfList(colorHexList, readVar(colorId)))
      setPenColorParamTo('transparency', readVar(tileTransparency))
      setPenSizeTo(1)

      setVariableTo(yMin, readVar(qy1))
      ifThen(lt(readVar(qy2), readVar(yMin)), () => {
        setVariableTo(yMin, readVar(qy2))
      })
      ifThen(lt(readVar(qy3), readVar(yMin)), () => {
        setVariableTo(yMin, readVar(qy3))
      })
      ifThen(lt(readVar(qy4), readVar(yMin)), () => {
        setVariableTo(yMin, readVar(qy4))
      })

      setVariableTo(yMax, readVar(qy1))
      ifThen(gt(readVar(qy2), readVar(yMax)), () => {
        setVariableTo(yMax, readVar(qy2))
      })
      ifThen(gt(readVar(qy3), readVar(yMax)), () => {
        setVariableTo(yMax, readVar(qy3))
      })
      ifThen(gt(readVar(qy4), readVar(yMax)), () => {
        setVariableTo(yMax, readVar(qy4))
      })

      setVariableTo(
        scanSteps,
        add(mathop('floor', subtract(readVar(yMax), readVar(yMin))), 1),
      )
      ifThen(lt(readVar(scanSteps), 1), () => {
        setVariableTo(scanSteps, 1)
      })

      setVariableTo(scanIndex, 0)
      repeat(readVar(scanSteps), () => {
        setVariableTo(yScan, add(readVar(yMin), readVar(scanIndex)))
        setVariableTo(hitCount, 0)
        setVariableTo(xMin, 0)
        setVariableTo(xMax, 0)

        setVariableTo(edgeMinY, readVar(qy1))
        ifThen(gt(readVar(edgeMinY), readVar(qy2)), () => {
          setVariableTo(edgeMinY, readVar(qy2))
        })
        setVariableTo(edgeMaxY, readVar(qy1))
        ifThen(lt(readVar(edgeMaxY), readVar(qy2)), () => {
          setVariableTo(edgeMaxY, readVar(qy2))
        })
        ifThen(
          and(
            not(equals(readVar(qy1), readVar(qy2))),
            and(
              not(lt(readVar(yScan), readVar(edgeMinY))),
              lt(readVar(yScan), readVar(edgeMaxY)),
            ),
          ),
          () => {
            setVariableTo(edgeDy, subtract(readVar(qy2), readVar(qy1)))
            setVariableTo(
              edgeT,
              divide(subtract(readVar(yScan), readVar(qy1)), readVar(edgeDy)),
            )
            setVariableTo(
              xHit,
              add(
                readVar(qx1),
                multiply(subtract(readVar(qx2), readVar(qx1)), readVar(edgeT)),
              ),
            )

            ifElse(
              equals(readVar(hitCount), 0),
              () => {
                setVariableTo(xMin, readVar(xHit))
                setVariableTo(xMax, readVar(xHit))
              },
              () => {
                ifThen(lt(readVar(xHit), readVar(xMin)), () => {
                  setVariableTo(xMin, readVar(xHit))
                })
                ifThen(gt(readVar(xHit), readVar(xMax)), () => {
                  setVariableTo(xMax, readVar(xHit))
                })
              },
            )
            changeVariableBy(hitCount, 1)
          },
        )

        setVariableTo(edgeMinY, readVar(qy2))
        ifThen(gt(readVar(edgeMinY), readVar(qy3)), () => {
          setVariableTo(edgeMinY, readVar(qy3))
        })
        setVariableTo(edgeMaxY, readVar(qy2))
        ifThen(lt(readVar(edgeMaxY), readVar(qy3)), () => {
          setVariableTo(edgeMaxY, readVar(qy3))
        })
        ifThen(
          and(
            not(equals(readVar(qy2), readVar(qy3))),
            and(
              not(lt(readVar(yScan), readVar(edgeMinY))),
              lt(readVar(yScan), readVar(edgeMaxY)),
            ),
          ),
          () => {
            setVariableTo(edgeDy, subtract(readVar(qy3), readVar(qy2)))
            setVariableTo(
              edgeT,
              divide(subtract(readVar(yScan), readVar(qy2)), readVar(edgeDy)),
            )
            setVariableTo(
              xHit,
              add(
                readVar(qx2),
                multiply(subtract(readVar(qx3), readVar(qx2)), readVar(edgeT)),
              ),
            )

            ifElse(
              equals(readVar(hitCount), 0),
              () => {
                setVariableTo(xMin, readVar(xHit))
                setVariableTo(xMax, readVar(xHit))
              },
              () => {
                ifThen(lt(readVar(xHit), readVar(xMin)), () => {
                  setVariableTo(xMin, readVar(xHit))
                })
                ifThen(gt(readVar(xHit), readVar(xMax)), () => {
                  setVariableTo(xMax, readVar(xHit))
                })
              },
            )
            changeVariableBy(hitCount, 1)
          },
        )

        setVariableTo(edgeMinY, readVar(qy3))
        ifThen(gt(readVar(edgeMinY), readVar(qy4)), () => {
          setVariableTo(edgeMinY, readVar(qy4))
        })
        setVariableTo(edgeMaxY, readVar(qy3))
        ifThen(lt(readVar(edgeMaxY), readVar(qy4)), () => {
          setVariableTo(edgeMaxY, readVar(qy4))
        })
        ifThen(
          and(
            not(equals(readVar(qy3), readVar(qy4))),
            and(
              not(lt(readVar(yScan), readVar(edgeMinY))),
              lt(readVar(yScan), readVar(edgeMaxY)),
            ),
          ),
          () => {
            setVariableTo(edgeDy, subtract(readVar(qy4), readVar(qy3)))
            setVariableTo(
              edgeT,
              divide(subtract(readVar(yScan), readVar(qy3)), readVar(edgeDy)),
            )
            setVariableTo(
              xHit,
              add(
                readVar(qx3),
                multiply(subtract(readVar(qx4), readVar(qx3)), readVar(edgeT)),
              ),
            )

            ifElse(
              equals(readVar(hitCount), 0),
              () => {
                setVariableTo(xMin, readVar(xHit))
                setVariableTo(xMax, readVar(xHit))
              },
              () => {
                ifThen(lt(readVar(xHit), readVar(xMin)), () => {
                  setVariableTo(xMin, readVar(xHit))
                })
                ifThen(gt(readVar(xHit), readVar(xMax)), () => {
                  setVariableTo(xMax, readVar(xHit))
                })
              },
            )
            changeVariableBy(hitCount, 1)
          },
        )

        setVariableTo(edgeMinY, readVar(qy4))
        ifThen(gt(readVar(edgeMinY), readVar(qy1)), () => {
          setVariableTo(edgeMinY, readVar(qy1))
        })
        setVariableTo(edgeMaxY, readVar(qy4))
        ifThen(lt(readVar(edgeMaxY), readVar(qy1)), () => {
          setVariableTo(edgeMaxY, readVar(qy1))
        })
        ifThen(
          and(
            not(equals(readVar(qy4), readVar(qy1))),
            and(
              not(lt(readVar(yScan), readVar(edgeMinY))),
              lt(readVar(yScan), readVar(edgeMaxY)),
            ),
          ),
          () => {
            setVariableTo(edgeDy, subtract(readVar(qy1), readVar(qy4)))
            setVariableTo(
              edgeT,
              divide(subtract(readVar(yScan), readVar(qy4)), readVar(edgeDy)),
            )
            setVariableTo(
              xHit,
              add(
                readVar(qx4),
                multiply(subtract(readVar(qx1), readVar(qx4)), readVar(edgeT)),
              ),
            )

            ifElse(
              equals(readVar(hitCount), 0),
              () => {
                setVariableTo(xMin, readVar(xHit))
                setVariableTo(xMax, readVar(xHit))
              },
              () => {
                ifThen(lt(readVar(xHit), readVar(xMin)), () => {
                  setVariableTo(xMin, readVar(xHit))
                })
                ifThen(gt(readVar(xHit), readVar(xMax)), () => {
                  setVariableTo(xMax, readVar(xHit))
                })
              },
            )
            changeVariableBy(hitCount, 1)
          },
        )

        ifThen(gt(readVar(hitCount), 1), () => {
          penUp()
          gotoXY(readVar(xMin), readVar(yScan))
          penDown()
          gotoXY(readVar(xMax), readVar(yScan))
          penUp()
        })

        changeVariableBy(scanIndex, 1)
      })

      setPenColorTo('#0f172a')
      setPenColorParamTo('transparency', readVar(edgeTransparency))
      setPenSizeTo(1)
      penUp()
      gotoXY(readVar(qx1), readVar(qy1))
      penDown()
      gotoXY(readVar(qx2), readVar(qy2))
      gotoXY(readVar(qx3), readVar(qy3))
      gotoXY(readVar(qx4), readVar(qy4))
      gotoXY(readVar(qx1), readVar(qy1))
      penUp()
    },
    true,
  )

  defineProcedure(
    [procedureLabel(commitTurnProcCode)],
    () => {
      forEach(stickerIndex, stickerCount, () => {
        setVariableTo(inTurningLayer, 0)
        ifElse(
          equals(readVar(turnAxis), 1),
          () => {
            ifThen(
              equals(
                getItemOfList(posXList, readVar(stickerIndex)),
                readVar(turnLayer),
              ),
              () => {
                setVariableTo(inTurningLayer, 1)
              },
            )
          },
          () => {
            ifElse(
              equals(readVar(turnAxis), 2),
              () => {
                ifThen(
                  equals(
                    getItemOfList(posYList, readVar(stickerIndex)),
                    readVar(turnLayer),
                  ),
                  () => {
                    setVariableTo(inTurningLayer, 1)
                  },
                )
              },
              () => {
                ifThen(
                  equals(
                    getItemOfList(posZList, readVar(stickerIndex)),
                    readVar(turnLayer),
                  ),
                  () => {
                    setVariableTo(inTurningLayer, 1)
                  },
                )
              },
            )
          },
        )

        ifThen(equals(readVar(inTurningLayer), 1), () => {
          setVariableTo(loadX, getItemOfList(posXList, readVar(stickerIndex)))
          setVariableTo(loadY, getItemOfList(posYList, readVar(stickerIndex)))
          setVariableTo(loadZ, getItemOfList(posZList, readVar(stickerIndex)))
          ifElse(
            equals(readVar(turnAxis), 1),
            () => {
              setVariableTo(newX, readVar(loadX))
              ifElse(
                equals(readVar(turnDir), 1),
                () => {
                  setVariableTo(newY, multiply(readVar(loadZ), -1))
                  setVariableTo(newZ, readVar(loadY))
                },
                () => {
                  setVariableTo(newY, readVar(loadZ))
                  setVariableTo(newZ, multiply(readVar(loadY), -1))
                },
              )
            },
            () => {
              ifElse(
                equals(readVar(turnAxis), 2),
                () => {
                  setVariableTo(newY, readVar(loadY))
                  ifElse(
                    equals(readVar(turnDir), 1),
                    () => {
                      setVariableTo(newX, readVar(loadZ))
                      setVariableTo(newZ, multiply(readVar(loadX), -1))
                    },
                    () => {
                      setVariableTo(newX, multiply(readVar(loadZ), -1))
                      setVariableTo(newZ, readVar(loadX))
                    },
                  )
                },
                () => {
                  setVariableTo(newZ, readVar(loadZ))
                  ifElse(
                    equals(readVar(turnDir), 1),
                    () => {
                      setVariableTo(newX, multiply(readVar(loadY), -1))
                      setVariableTo(newY, readVar(loadX))
                    },
                    () => {
                      setVariableTo(newX, readVar(loadY))
                      setVariableTo(newY, multiply(readVar(loadX), -1))
                    },
                  )
                },
              )
            },
          )
          replaceItemOfList(posXList, readVar(stickerIndex), readVar(newX))
          replaceItemOfList(posYList, readVar(stickerIndex), readVar(newY))
          replaceItemOfList(posZList, readVar(stickerIndex), readVar(newZ))

          setVariableTo(loadX, getItemOfList(nxList, readVar(stickerIndex)))
          setVariableTo(loadY, getItemOfList(nyList, readVar(stickerIndex)))
          setVariableTo(loadZ, getItemOfList(nzList, readVar(stickerIndex)))
          ifElse(
            equals(readVar(turnAxis), 1),
            () => {
              setVariableTo(newX, readVar(loadX))
              ifElse(
                equals(readVar(turnDir), 1),
                () => {
                  setVariableTo(newY, multiply(readVar(loadZ), -1))
                  setVariableTo(newZ, readVar(loadY))
                },
                () => {
                  setVariableTo(newY, readVar(loadZ))
                  setVariableTo(newZ, multiply(readVar(loadY), -1))
                },
              )
            },
            () => {
              ifElse(
                equals(readVar(turnAxis), 2),
                () => {
                  setVariableTo(newY, readVar(loadY))
                  ifElse(
                    equals(readVar(turnDir), 1),
                    () => {
                      setVariableTo(newX, readVar(loadZ))
                      setVariableTo(newZ, multiply(readVar(loadX), -1))
                    },
                    () => {
                      setVariableTo(newX, multiply(readVar(loadZ), -1))
                      setVariableTo(newZ, readVar(loadX))
                    },
                  )
                },
                () => {
                  setVariableTo(newZ, readVar(loadZ))
                  ifElse(
                    equals(readVar(turnDir), 1),
                    () => {
                      setVariableTo(newX, multiply(readVar(loadY), -1))
                      setVariableTo(newY, readVar(loadX))
                    },
                    () => {
                      setVariableTo(newX, readVar(loadY))
                      setVariableTo(newY, multiply(readVar(loadX), -1))
                    },
                  )
                },
              )
            },
          )
          replaceItemOfList(nxList, readVar(stickerIndex), readVar(newX))
          replaceItemOfList(nyList, readVar(stickerIndex), readVar(newY))
          replaceItemOfList(nzList, readVar(stickerIndex), readVar(newZ))

          setVariableTo(loadX, getItemOfList(uxList, readVar(stickerIndex)))
          setVariableTo(loadY, getItemOfList(uyList, readVar(stickerIndex)))
          setVariableTo(loadZ, getItemOfList(uzList, readVar(stickerIndex)))
          ifElse(
            equals(readVar(turnAxis), 1),
            () => {
              setVariableTo(newX, readVar(loadX))
              ifElse(
                equals(readVar(turnDir), 1),
                () => {
                  setVariableTo(newY, multiply(readVar(loadZ), -1))
                  setVariableTo(newZ, readVar(loadY))
                },
                () => {
                  setVariableTo(newY, readVar(loadZ))
                  setVariableTo(newZ, multiply(readVar(loadY), -1))
                },
              )
            },
            () => {
              ifElse(
                equals(readVar(turnAxis), 2),
                () => {
                  setVariableTo(newY, readVar(loadY))
                  ifElse(
                    equals(readVar(turnDir), 1),
                    () => {
                      setVariableTo(newX, readVar(loadZ))
                      setVariableTo(newZ, multiply(readVar(loadX), -1))
                    },
                    () => {
                      setVariableTo(newX, multiply(readVar(loadZ), -1))
                      setVariableTo(newZ, readVar(loadX))
                    },
                  )
                },
                () => {
                  setVariableTo(newZ, readVar(loadZ))
                  ifElse(
                    equals(readVar(turnDir), 1),
                    () => {
                      setVariableTo(newX, multiply(readVar(loadY), -1))
                      setVariableTo(newY, readVar(loadX))
                    },
                    () => {
                      setVariableTo(newX, readVar(loadY))
                      setVariableTo(newY, multiply(readVar(loadX), -1))
                    },
                  )
                },
              )
            },
          )
          replaceItemOfList(uxList, readVar(stickerIndex), readVar(newX))
          replaceItemOfList(uyList, readVar(stickerIndex), readVar(newY))
          replaceItemOfList(uzList, readVar(stickerIndex), readVar(newZ))

          setVariableTo(loadX, getItemOfList(vxList, readVar(stickerIndex)))
          setVariableTo(loadY, getItemOfList(vyList, readVar(stickerIndex)))
          setVariableTo(loadZ, getItemOfList(vzList, readVar(stickerIndex)))
          ifElse(
            equals(readVar(turnAxis), 1),
            () => {
              setVariableTo(newX, readVar(loadX))
              ifElse(
                equals(readVar(turnDir), 1),
                () => {
                  setVariableTo(newY, multiply(readVar(loadZ), -1))
                  setVariableTo(newZ, readVar(loadY))
                },
                () => {
                  setVariableTo(newY, readVar(loadZ))
                  setVariableTo(newZ, multiply(readVar(loadY), -1))
                },
              )
            },
            () => {
              ifElse(
                equals(readVar(turnAxis), 2),
                () => {
                  setVariableTo(newY, readVar(loadY))
                  ifElse(
                    equals(readVar(turnDir), 1),
                    () => {
                      setVariableTo(newX, readVar(loadZ))
                      setVariableTo(newZ, multiply(readVar(loadX), -1))
                    },
                    () => {
                      setVariableTo(newX, multiply(readVar(loadZ), -1))
                      setVariableTo(newZ, readVar(loadX))
                    },
                  )
                },
                () => {
                  setVariableTo(newZ, readVar(loadZ))
                  ifElse(
                    equals(readVar(turnDir), 1),
                    () => {
                      setVariableTo(newX, multiply(readVar(loadY), -1))
                      setVariableTo(newY, readVar(loadX))
                    },
                    () => {
                      setVariableTo(newX, readVar(loadY))
                      setVariableTo(newY, multiply(readVar(loadX), -1))
                    },
                  )
                },
              )
            },
          )
          replaceItemOfList(vxList, readVar(stickerIndex), readVar(newX))
          replaceItemOfList(vyList, readVar(stickerIndex), readVar(newY))
          replaceItemOfList(vzList, readVar(stickerIndex), readVar(newZ))
        })
      })
    },
    true,
  )

  defineProcedure(
    [procedureLabel(resetStateProcCode)],
    () => {
      setVariableTo(viewYaw, initialViewYaw)
      setVariableTo(viewPitch, initialViewPitch)
      setVariableTo(dragging, 0)
      setVariableTo(lastMouseX, getMouseX())
      setVariableTo(lastMouseY, getMouseY())
      setVariableTo(inputLock, 0)
      setVariableTo(anyMovePressed, 0)
      setVariableTo(turnActive, 0)
      setVariableTo(turnAxis, initialTurnAxis)
      setVariableTo(turnLayer, initialTurnLayer)
      setVariableTo(turnDir, initialTurnDir)
      setVariableTo(turnProgress, 0)
      setVariableTo(turnAngle, 0)
      setVariableTo(turnCos, 1)
      setVariableTo(turnSin, 0)

      forEach(stickerIndex, stickerCount, () => {
        replaceItemOfList(
          posXList,
          readVar(stickerIndex),
          getItemOfList(seedPosXList, readVar(stickerIndex)),
        )
        replaceItemOfList(
          posYList,
          readVar(stickerIndex),
          getItemOfList(seedPosYList, readVar(stickerIndex)),
        )
        replaceItemOfList(
          posZList,
          readVar(stickerIndex),
          getItemOfList(seedPosZList, readVar(stickerIndex)),
        )

        replaceItemOfList(
          nxList,
          readVar(stickerIndex),
          getItemOfList(seedNxList, readVar(stickerIndex)),
        )
        replaceItemOfList(
          nyList,
          readVar(stickerIndex),
          getItemOfList(seedNyList, readVar(stickerIndex)),
        )
        replaceItemOfList(
          nzList,
          readVar(stickerIndex),
          getItemOfList(seedNzList, readVar(stickerIndex)),
        )

        replaceItemOfList(
          uxList,
          readVar(stickerIndex),
          getItemOfList(seedUxList, readVar(stickerIndex)),
        )
        replaceItemOfList(
          uyList,
          readVar(stickerIndex),
          getItemOfList(seedUyList, readVar(stickerIndex)),
        )
        replaceItemOfList(
          uzList,
          readVar(stickerIndex),
          getItemOfList(seedUzList, readVar(stickerIndex)),
        )

        replaceItemOfList(
          vxList,
          readVar(stickerIndex),
          getItemOfList(seedVxList, readVar(stickerIndex)),
        )
        replaceItemOfList(
          vyList,
          readVar(stickerIndex),
          getItemOfList(seedVyList, readVar(stickerIndex)),
        )
        replaceItemOfList(
          vzList,
          readVar(stickerIndex),
          getItemOfList(seedVzList, readVar(stickerIndex)),
        )
        replaceItemOfList(
          drawOrderList,
          readVar(stickerIndex),
          getItemOfList(seedDrawOrderList, readVar(stickerIndex)),
        )
      })
    },
    true,
  )

  defineProcedure(
    [procedureLabel(stepProcCode)],
    () => {
      ifElse(
        getMouseDown(),
        () => {
          ifElse(
            equals(readVar(dragging), 0),
            () => {
              setVariableTo(dragging, 1)
              setVariableTo(lastMouseX, getMouseX())
              setVariableTo(lastMouseY, getMouseY())
            },
            () => {
              changeVariableBy(
                viewYaw,
                multiply(subtract(getMouseX(), readVar(lastMouseX)), 0.75),
              )
              changeVariableBy(
                viewPitch,
                multiply(subtract(readVar(lastMouseY), getMouseY()), 0.75),
              )
              setVariableTo(lastMouseX, getMouseX())
              setVariableTo(lastMouseY, getMouseY())
            },
          )
        },
        () => {
          setVariableTo(dragging, 0)
        },
      )

      ifThen(getKeyPressed('left arrow'), () => {
        changeVariableBy(viewYaw, -1.2)
      })
      ifThen(getKeyPressed('right arrow'), () => {
        changeVariableBy(viewYaw, 1.2)
      })
      ifThen(getKeyPressed('up arrow'), () => {
        changeVariableBy(viewPitch, 1)
      })
      ifThen(getKeyPressed('down arrow'), () => {
        changeVariableBy(viewPitch, -1)
      })

      ifThen(gt(readVar(viewPitch), 85), () => {
        setVariableTo(viewPitch, 85)
      })
      ifThen(lt(readVar(viewPitch), -85), () => {
        setVariableTo(viewPitch, -85)
      })

      setVariableTo(anyMovePressed, 0)
      ifThen(
        or(
          or(
            or(getKeyPressed('u'), getKeyPressed('j')),
            or(getKeyPressed('r'), getKeyPressed('f')),
          ),
          or(
            or(getKeyPressed('l'), getKeyPressed('k')),
            or(getKeyPressed('d'), getKeyPressed('c')),
          ),
        ),
        () => {
          setVariableTo(anyMovePressed, 1)
        },
      )
      ifThen(
        or(
          or(getKeyPressed('g'), getKeyPressed('h')),
          or(getKeyPressed('b'), getKeyPressed('n')),
        ),
        () => {
          setVariableTo(anyMovePressed, 1)
        },
      )
      ifThen(equals(readVar(anyMovePressed), 0), () => {
        setVariableTo(inputLock, 0)
      })

      ifThen(
        and(equals(readVar(turnActive), 0), equals(readVar(inputLock), 0)),
        () => {
          ifElse(
            getKeyPressed('u'),
            () => {
              setVariableTo(turnActive, 1)
              setVariableTo(turnAxis, 2)
              setVariableTo(turnLayer, 1)
              setVariableTo(turnDir, 1)
              setVariableTo(turnProgress, 0)
              setVariableTo(inputLock, 1)
            },
            () => {
              ifElse(
                getKeyPressed('j'),
                () => {
                  setVariableTo(turnActive, 1)
                  setVariableTo(turnAxis, 2)
                  setVariableTo(turnLayer, 1)
                  setVariableTo(turnDir, -1)
                  setVariableTo(turnProgress, 0)
                  setVariableTo(inputLock, 1)
                },
                () => {
                  ifElse(
                    getKeyPressed('r'),
                    () => {
                      setVariableTo(turnActive, 1)
                      setVariableTo(turnAxis, 1)
                      setVariableTo(turnLayer, 1)
                      setVariableTo(turnDir, 1)
                      setVariableTo(turnProgress, 0)
                      setVariableTo(inputLock, 1)
                    },
                    () => {
                      ifElse(
                        getKeyPressed('f'),
                        () => {
                          setVariableTo(turnActive, 1)
                          setVariableTo(turnAxis, 1)
                          setVariableTo(turnLayer, 1)
                          setVariableTo(turnDir, -1)
                          setVariableTo(turnProgress, 0)
                          setVariableTo(inputLock, 1)
                        },
                        () => {
                          ifElse(
                            getKeyPressed('l'),
                            () => {
                              setVariableTo(turnActive, 1)
                              setVariableTo(turnAxis, 1)
                              setVariableTo(turnLayer, -1)
                              setVariableTo(turnDir, -1)
                              setVariableTo(turnProgress, 0)
                              setVariableTo(inputLock, 1)
                            },
                            () => {
                              ifElse(
                                getKeyPressed('k'),
                                () => {
                                  setVariableTo(turnActive, 1)
                                  setVariableTo(turnAxis, 1)
                                  setVariableTo(turnLayer, -1)
                                  setVariableTo(turnDir, 1)
                                  setVariableTo(turnProgress, 0)
                                  setVariableTo(inputLock, 1)
                                },
                                () => {
                                  ifElse(
                                    getKeyPressed('d'),
                                    () => {
                                      setVariableTo(turnActive, 1)
                                      setVariableTo(turnAxis, 2)
                                      setVariableTo(turnLayer, -1)
                                      setVariableTo(turnDir, -1)
                                      setVariableTo(turnProgress, 0)
                                      setVariableTo(inputLock, 1)
                                    },
                                    () => {
                                      ifElse(
                                        getKeyPressed('c'),
                                        () => {
                                          setVariableTo(turnActive, 1)
                                          setVariableTo(turnAxis, 2)
                                          setVariableTo(turnLayer, -1)
                                          setVariableTo(turnDir, 1)
                                          setVariableTo(turnProgress, 0)
                                          setVariableTo(inputLock, 1)
                                        },
                                        () => {
                                          ifElse(
                                            getKeyPressed('g'),
                                            () => {
                                              setVariableTo(turnActive, 1)
                                              setVariableTo(turnAxis, 3)
                                              setVariableTo(turnLayer, -1)
                                              setVariableTo(turnDir, 1)
                                              setVariableTo(turnProgress, 0)
                                              setVariableTo(inputLock, 1)
                                            },
                                            () => {
                                              ifElse(
                                                getKeyPressed('h'),
                                                () => {
                                                  setVariableTo(turnActive, 1)
                                                  setVariableTo(turnAxis, 3)
                                                  setVariableTo(turnLayer, -1)
                                                  setVariableTo(turnDir, -1)
                                                  setVariableTo(turnProgress, 0)
                                                  setVariableTo(inputLock, 1)
                                                },
                                                () => {
                                                  ifElse(
                                                    getKeyPressed('b'),
                                                    () => {
                                                      setVariableTo(
                                                        turnActive,
                                                        1,
                                                      )
                                                      setVariableTo(turnAxis, 3)
                                                      setVariableTo(
                                                        turnLayer,
                                                        1,
                                                      )
                                                      setVariableTo(turnDir, -1)
                                                      setVariableTo(
                                                        turnProgress,
                                                        0,
                                                      )
                                                      setVariableTo(
                                                        inputLock,
                                                        1,
                                                      )
                                                    },
                                                    () => {
                                                      ifThen(
                                                        getKeyPressed('n'),
                                                        () => {
                                                          setVariableTo(
                                                            turnActive,
                                                            1,
                                                          )
                                                          setVariableTo(
                                                            turnAxis,
                                                            3,
                                                          )
                                                          setVariableTo(
                                                            turnLayer,
                                                            1,
                                                          )
                                                          setVariableTo(
                                                            turnDir,
                                                            1,
                                                          )
                                                          setVariableTo(
                                                            turnProgress,
                                                            0,
                                                          )
                                                          setVariableTo(
                                                            inputLock,
                                                            1,
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
        },
      )

      ifElse(
        equals(readVar(turnActive), 1),
        () => {
          changeVariableBy(turnProgress, readVar(turnSpeed))
          ifThen(gt(readVar(turnProgress), 90), () => {
            setVariableTo(turnProgress, 90)
          })
          setVariableTo(
            turnAngle,
            multiply(readVar(turnProgress), readVar(turnDir)),
          )
          ifThen(equals(readVar(turnProgress), 90), () => {
            callProcedure(commitTurnProcCode, noArgs, {}, true)
            setVariableTo(turnActive, 0)
            setVariableTo(turnProgress, 0)
            setVariableTo(turnAngle, 0)
          })
        },
        () => {
          setVariableTo(turnAngle, 0)
        },
      )

      setVariableTo(cosYaw, mathop('cos', readVar(viewYaw)))
      setVariableTo(sinYaw, mathop('sin', readVar(viewYaw)))
      setVariableTo(cosPitch, mathop('cos', readVar(viewPitch)))
      setVariableTo(sinPitch, mathop('sin', readVar(viewPitch)))
      setVariableTo(turnCos, mathop('cos', readVar(turnAngle)))
      setVariableTo(turnSin, mathop('sin', readVar(turnAngle)))
      setVariableTo(
        stickerScale,
        multiply(readVar(stickerHalf), readVar(modelScale)),
      )

      eraseAll()

      forEach(stickerIndex, stickerCount, () => {
        setVariableTo(posX, getItemOfList(posXList, readVar(stickerIndex)))
        setVariableTo(posY, getItemOfList(posYList, readVar(stickerIndex)))
        setVariableTo(posZ, getItemOfList(posZList, readVar(stickerIndex)))

        setVariableTo(nx, getItemOfList(nxList, readVar(stickerIndex)))
        setVariableTo(ny, getItemOfList(nyList, readVar(stickerIndex)))
        setVariableTo(nz, getItemOfList(nzList, readVar(stickerIndex)))

        setVariableTo(ux, getItemOfList(uxList, readVar(stickerIndex)))
        setVariableTo(uy, getItemOfList(uyList, readVar(stickerIndex)))
        setVariableTo(uz, getItemOfList(uzList, readVar(stickerIndex)))

        setVariableTo(vx, getItemOfList(vxList, readVar(stickerIndex)))
        setVariableTo(vy, getItemOfList(vyList, readVar(stickerIndex)))
        setVariableTo(vz, getItemOfList(vzList, readVar(stickerIndex)))

        setVariableTo(rPosX, readVar(posX))
        setVariableTo(rPosY, readVar(posY))
        setVariableTo(rPosZ, readVar(posZ))

        setVariableTo(rNx, readVar(nx))
        setVariableTo(rNy, readVar(ny))
        setVariableTo(rNz, readVar(nz))

        setVariableTo(rUx, readVar(ux))
        setVariableTo(rUy, readVar(uy))
        setVariableTo(rUz, readVar(uz))

        setVariableTo(rVx, readVar(vx))
        setVariableTo(rVy, readVar(vy))
        setVariableTo(rVz, readVar(vz))

        setVariableTo(inTurningLayer, 0)
        ifThen(equals(readVar(turnActive), 1), () => {
          ifElse(
            equals(readVar(turnAxis), 1),
            () => {
              ifThen(equals(readVar(posX), readVar(turnLayer)), () => {
                setVariableTo(inTurningLayer, 1)
              })
            },
            () => {
              ifElse(
                equals(readVar(turnAxis), 2),
                () => {
                  ifThen(equals(readVar(posY), readVar(turnLayer)), () => {
                    setVariableTo(inTurningLayer, 1)
                  })
                },
                () => {
                  ifThen(equals(readVar(posZ), readVar(turnLayer)), () => {
                    setVariableTo(inTurningLayer, 1)
                  })
                },
              )
            },
          )
        })

        ifThen(equals(readVar(inTurningLayer), 1), () => {
          ifElse(
            equals(readVar(turnAxis), 1),
            () => {
              setVariableTo(rPosX, readVar(posX))
              setVariableTo(
                rPosY,
                subtract(
                  multiply(readVar(posY), readVar(turnCos)),
                  multiply(readVar(posZ), readVar(turnSin)),
                ),
              )
              setVariableTo(
                rPosZ,
                add(
                  multiply(readVar(posY), readVar(turnSin)),
                  multiply(readVar(posZ), readVar(turnCos)),
                ),
              )

              setVariableTo(rNx, readVar(nx))
              setVariableTo(
                rNy,
                subtract(
                  multiply(readVar(ny), readVar(turnCos)),
                  multiply(readVar(nz), readVar(turnSin)),
                ),
              )
              setVariableTo(
                rNz,
                add(
                  multiply(readVar(ny), readVar(turnSin)),
                  multiply(readVar(nz), readVar(turnCos)),
                ),
              )

              setVariableTo(rUx, readVar(ux))
              setVariableTo(
                rUy,
                subtract(
                  multiply(readVar(uy), readVar(turnCos)),
                  multiply(readVar(uz), readVar(turnSin)),
                ),
              )
              setVariableTo(
                rUz,
                add(
                  multiply(readVar(uy), readVar(turnSin)),
                  multiply(readVar(uz), readVar(turnCos)),
                ),
              )

              setVariableTo(rVx, readVar(vx))
              setVariableTo(
                rVy,
                subtract(
                  multiply(readVar(vy), readVar(turnCos)),
                  multiply(readVar(vz), readVar(turnSin)),
                ),
              )
              setVariableTo(
                rVz,
                add(
                  multiply(readVar(vy), readVar(turnSin)),
                  multiply(readVar(vz), readVar(turnCos)),
                ),
              )
            },
            () => {
              ifElse(
                equals(readVar(turnAxis), 2),
                () => {
                  setVariableTo(
                    rPosX,
                    add(
                      multiply(readVar(posX), readVar(turnCos)),
                      multiply(readVar(posZ), readVar(turnSin)),
                    ),
                  )
                  setVariableTo(rPosY, readVar(posY))
                  setVariableTo(
                    rPosZ,
                    subtract(
                      multiply(readVar(posZ), readVar(turnCos)),
                      multiply(readVar(posX), readVar(turnSin)),
                    ),
                  )

                  setVariableTo(
                    rNx,
                    add(
                      multiply(readVar(nx), readVar(turnCos)),
                      multiply(readVar(nz), readVar(turnSin)),
                    ),
                  )
                  setVariableTo(rNy, readVar(ny))
                  setVariableTo(
                    rNz,
                    subtract(
                      multiply(readVar(nz), readVar(turnCos)),
                      multiply(readVar(nx), readVar(turnSin)),
                    ),
                  )

                  setVariableTo(
                    rUx,
                    add(
                      multiply(readVar(ux), readVar(turnCos)),
                      multiply(readVar(uz), readVar(turnSin)),
                    ),
                  )
                  setVariableTo(rUy, readVar(uy))
                  setVariableTo(
                    rUz,
                    subtract(
                      multiply(readVar(uz), readVar(turnCos)),
                      multiply(readVar(ux), readVar(turnSin)),
                    ),
                  )

                  setVariableTo(
                    rVx,
                    add(
                      multiply(readVar(vx), readVar(turnCos)),
                      multiply(readVar(vz), readVar(turnSin)),
                    ),
                  )
                  setVariableTo(rVy, readVar(vy))
                  setVariableTo(
                    rVz,
                    subtract(
                      multiply(readVar(vz), readVar(turnCos)),
                      multiply(readVar(vx), readVar(turnSin)),
                    ),
                  )
                },
                () => {
                  setVariableTo(
                    rPosX,
                    subtract(
                      multiply(readVar(posX), readVar(turnCos)),
                      multiply(readVar(posY), readVar(turnSin)),
                    ),
                  )
                  setVariableTo(
                    rPosY,
                    add(
                      multiply(readVar(posX), readVar(turnSin)),
                      multiply(readVar(posY), readVar(turnCos)),
                    ),
                  )
                  setVariableTo(rPosZ, readVar(posZ))

                  setVariableTo(
                    rNx,
                    subtract(
                      multiply(readVar(nx), readVar(turnCos)),
                      multiply(readVar(ny), readVar(turnSin)),
                    ),
                  )
                  setVariableTo(
                    rNy,
                    add(
                      multiply(readVar(nx), readVar(turnSin)),
                      multiply(readVar(ny), readVar(turnCos)),
                    ),
                  )
                  setVariableTo(rNz, readVar(nz))

                  setVariableTo(
                    rUx,
                    subtract(
                      multiply(readVar(ux), readVar(turnCos)),
                      multiply(readVar(uy), readVar(turnSin)),
                    ),
                  )
                  setVariableTo(
                    rUy,
                    add(
                      multiply(readVar(ux), readVar(turnSin)),
                      multiply(readVar(uy), readVar(turnCos)),
                    ),
                  )
                  setVariableTo(rUz, readVar(uz))

                  setVariableTo(
                    rVx,
                    subtract(
                      multiply(readVar(vx), readVar(turnCos)),
                      multiply(readVar(vy), readVar(turnSin)),
                    ),
                  )
                  setVariableTo(
                    rVy,
                    add(
                      multiply(readVar(vx), readVar(turnSin)),
                      multiply(readVar(vy), readVar(turnCos)),
                    ),
                  )
                  setVariableTo(rVz, readVar(vz))
                },
              )
            },
          )
        })

        setVariableTo(
          centerX,
          multiply(
            add(
              multiply(readVar(rPosX), readVar(cubiePitch)),
              multiply(readVar(rNx), readVar(faceOffset)),
            ),
            readVar(modelScale),
          ),
        )
        setVariableTo(
          centerY,
          multiply(
            add(
              multiply(readVar(rPosY), readVar(cubiePitch)),
              multiply(readVar(rNy), readVar(faceOffset)),
            ),
            readVar(modelScale),
          ),
        )
        setVariableTo(
          centerZ,
          multiply(
            add(
              multiply(readVar(rPosZ), readVar(cubiePitch)),
              multiply(readVar(rNz), readVar(faceOffset)),
            ),
            readVar(modelScale),
          ),
        )

        setVariableTo(
          cameraX,
          add(
            multiply(readVar(centerX), readVar(cosYaw)),
            multiply(readVar(centerZ), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraZ1,
          subtract(
            multiply(readVar(centerZ), readVar(cosYaw)),
            multiply(readVar(centerX), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraY,
          subtract(
            multiply(readVar(centerY), readVar(cosPitch)),
            multiply(readVar(cameraZ1), readVar(sinPitch)),
          ),
        )
        setVariableTo(
          cameraZ,
          add(
            multiply(readVar(centerY), readVar(sinPitch)),
            multiply(readVar(cameraZ1), readVar(cosPitch)),
          ),
        )
        replaceItemOfList(depthList, readVar(stickerIndex), readVar(cameraZ))

        setVariableTo(
          cameraX,
          add(
            multiply(readVar(rNx), readVar(cosYaw)),
            multiply(readVar(rNz), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraZ1,
          subtract(
            multiply(readVar(rNz), readVar(cosYaw)),
            multiply(readVar(rNx), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraZ,
          add(
            multiply(readVar(rNy), readVar(sinPitch)),
            multiply(readVar(cameraZ1), readVar(cosPitch)),
          ),
        )
        setVariableTo(visibleFlag, 0)
        ifThen(
          gt(
            add(
              readVar(cameraDistance),
              getItemOfList(depthList, readVar(stickerIndex)),
            ),
            20,
          ),
          () => {
            ifElse(
              lt(readVar(cameraZ), -0.05),
              () => {
                setVariableTo(visibleFlag, 1)
              },
              () => {
                setVariableTo(visibleFlag, 2)
              },
            )
          },
        )
        replaceItemOfList(
          visibleList,
          readVar(stickerIndex),
          readVar(visibleFlag),
        )

        setVariableTo(
          cornerX,
          add(
            readVar(centerX),
            multiply(
              add(multiply(readVar(rUx), -1), multiply(readVar(rVx), -1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cornerY,
          add(
            readVar(centerY),
            multiply(
              add(multiply(readVar(rUy), -1), multiply(readVar(rVy), -1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cornerZ,
          add(
            readVar(centerZ),
            multiply(
              add(multiply(readVar(rUz), -1), multiply(readVar(rVz), -1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cameraX,
          add(
            multiply(readVar(cornerX), readVar(cosYaw)),
            multiply(readVar(cornerZ), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraZ1,
          subtract(
            multiply(readVar(cornerZ), readVar(cosYaw)),
            multiply(readVar(cornerX), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraY,
          subtract(
            multiply(readVar(cornerY), readVar(cosPitch)),
            multiply(readVar(cameraZ1), readVar(sinPitch)),
          ),
        )
        setVariableTo(
          cameraZ,
          add(
            multiply(readVar(cornerY), readVar(sinPitch)),
            multiply(readVar(cameraZ1), readVar(cosPitch)),
          ),
        )
        setVariableTo(
          perspective,
          divide(
            readVar(focalLength),
            add(readVar(cameraDistance), readVar(cameraZ)),
          ),
        )
        replaceItemOfList(
          p1xList,
          readVar(stickerIndex),
          multiply(readVar(cameraX), readVar(perspective)),
        )
        replaceItemOfList(
          p1yList,
          readVar(stickerIndex),
          multiply(readVar(cameraY), readVar(perspective)),
        )

        setVariableTo(
          cornerX,
          add(
            readVar(centerX),
            multiply(
              add(multiply(readVar(rUx), 1), multiply(readVar(rVx), -1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cornerY,
          add(
            readVar(centerY),
            multiply(
              add(multiply(readVar(rUy), 1), multiply(readVar(rVy), -1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cornerZ,
          add(
            readVar(centerZ),
            multiply(
              add(multiply(readVar(rUz), 1), multiply(readVar(rVz), -1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cameraX,
          add(
            multiply(readVar(cornerX), readVar(cosYaw)),
            multiply(readVar(cornerZ), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraZ1,
          subtract(
            multiply(readVar(cornerZ), readVar(cosYaw)),
            multiply(readVar(cornerX), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraY,
          subtract(
            multiply(readVar(cornerY), readVar(cosPitch)),
            multiply(readVar(cameraZ1), readVar(sinPitch)),
          ),
        )
        setVariableTo(
          cameraZ,
          add(
            multiply(readVar(cornerY), readVar(sinPitch)),
            multiply(readVar(cameraZ1), readVar(cosPitch)),
          ),
        )
        setVariableTo(
          perspective,
          divide(
            readVar(focalLength),
            add(readVar(cameraDistance), readVar(cameraZ)),
          ),
        )
        replaceItemOfList(
          p2xList,
          readVar(stickerIndex),
          multiply(readVar(cameraX), readVar(perspective)),
        )
        replaceItemOfList(
          p2yList,
          readVar(stickerIndex),
          multiply(readVar(cameraY), readVar(perspective)),
        )

        setVariableTo(
          cornerX,
          add(
            readVar(centerX),
            multiply(
              add(multiply(readVar(rUx), 1), multiply(readVar(rVx), 1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cornerY,
          add(
            readVar(centerY),
            multiply(
              add(multiply(readVar(rUy), 1), multiply(readVar(rVy), 1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cornerZ,
          add(
            readVar(centerZ),
            multiply(
              add(multiply(readVar(rUz), 1), multiply(readVar(rVz), 1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cameraX,
          add(
            multiply(readVar(cornerX), readVar(cosYaw)),
            multiply(readVar(cornerZ), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraZ1,
          subtract(
            multiply(readVar(cornerZ), readVar(cosYaw)),
            multiply(readVar(cornerX), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraY,
          subtract(
            multiply(readVar(cornerY), readVar(cosPitch)),
            multiply(readVar(cameraZ1), readVar(sinPitch)),
          ),
        )
        setVariableTo(
          cameraZ,
          add(
            multiply(readVar(cornerY), readVar(sinPitch)),
            multiply(readVar(cameraZ1), readVar(cosPitch)),
          ),
        )
        setVariableTo(
          perspective,
          divide(
            readVar(focalLength),
            add(readVar(cameraDistance), readVar(cameraZ)),
          ),
        )
        replaceItemOfList(
          p3xList,
          readVar(stickerIndex),
          multiply(readVar(cameraX), readVar(perspective)),
        )
        replaceItemOfList(
          p3yList,
          readVar(stickerIndex),
          multiply(readVar(cameraY), readVar(perspective)),
        )

        setVariableTo(
          cornerX,
          add(
            readVar(centerX),
            multiply(
              add(multiply(readVar(rUx), -1), multiply(readVar(rVx), 1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cornerY,
          add(
            readVar(centerY),
            multiply(
              add(multiply(readVar(rUy), -1), multiply(readVar(rVy), 1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cornerZ,
          add(
            readVar(centerZ),
            multiply(
              add(multiply(readVar(rUz), -1), multiply(readVar(rVz), 1)),
              readVar(stickerScale),
            ),
          ),
        )
        setVariableTo(
          cameraX,
          add(
            multiply(readVar(cornerX), readVar(cosYaw)),
            multiply(readVar(cornerZ), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraZ1,
          subtract(
            multiply(readVar(cornerZ), readVar(cosYaw)),
            multiply(readVar(cornerX), readVar(sinYaw)),
          ),
        )
        setVariableTo(
          cameraY,
          subtract(
            multiply(readVar(cornerY), readVar(cosPitch)),
            multiply(readVar(cameraZ1), readVar(sinPitch)),
          ),
        )
        setVariableTo(
          cameraZ,
          add(
            multiply(readVar(cornerY), readVar(sinPitch)),
            multiply(readVar(cameraZ1), readVar(cosPitch)),
          ),
        )
        setVariableTo(
          perspective,
          divide(
            readVar(focalLength),
            add(readVar(cameraDistance), readVar(cameraZ)),
          ),
        )
        replaceItemOfList(
          p4xList,
          readVar(stickerIndex),
          multiply(readVar(cameraX), readVar(perspective)),
        )
        replaceItemOfList(
          p4yList,
          readVar(stickerIndex),
          multiply(readVar(cameraY), readVar(perspective)),
        )
      })

      forEach(passIndex, stickerCount - 1, () => {
        forEach(sortIndex, stickerCount - 1, () => {
          setVariableTo(
            orderA,
            getItemOfList(drawOrderList, readVar(sortIndex)),
          )
          setVariableTo(
            orderB,
            getItemOfList(drawOrderList, add(readVar(sortIndex), 1)),
          )
          setVariableTo(depthA, getItemOfList(depthList, readVar(orderA)))
          setVariableTo(depthB, getItemOfList(depthList, readVar(orderB)))

          ifThen(lt(readVar(depthA), readVar(depthB)), () => {
            setVariableTo(swapTmp, readVar(orderA))
            replaceItemOfList(
              drawOrderList,
              readVar(sortIndex),
              readVar(orderB),
            )
            replaceItemOfList(
              drawOrderList,
              add(readVar(sortIndex), 1),
              readVar(swapTmp),
            )
          })
        })
      })

      forEach(drawIndex, stickerCount, () => {
        setVariableTo(
          stickerIndex,
          getItemOfList(drawOrderList, readVar(drawIndex)),
        )
        ifThen(gt(getItemOfList(visibleList, readVar(stickerIndex)), 0), () => {
          ifElse(
            equals(getItemOfList(visibleList, readVar(stickerIndex)), 1),
            () => {
              setVariableTo(tileTransparency, 0)
              setVariableTo(edgeTransparency, 8)
            },
            () => {
              setVariableTo(tileTransparency, 68)
              setVariableTo(edgeTransparency, 84)
            },
          )
          setVariableTo(qx1, getItemOfList(p1xList, readVar(stickerIndex)))
          setVariableTo(qy1, getItemOfList(p1yList, readVar(stickerIndex)))
          setVariableTo(qx2, getItemOfList(p2xList, readVar(stickerIndex)))
          setVariableTo(qy2, getItemOfList(p2yList, readVar(stickerIndex)))
          setVariableTo(qx3, getItemOfList(p3xList, readVar(stickerIndex)))
          setVariableTo(qy3, getItemOfList(p3yList, readVar(stickerIndex)))
          setVariableTo(qx4, getItemOfList(p4xList, readVar(stickerIndex)))
          setVariableTo(qy4, getItemOfList(p4yList, readVar(stickerIndex)))
          setVariableTo(
            colorId,
            getItemOfList(colorList, readVar(stickerIndex)),
          )
          callProcedure(fillProcCode, noArgs, {}, true)
        })
      })
    },
    true,
  )

  whenFlagClicked(() => {
    hide()
    setDragMode('not draggable')
    penUp()
    setPenSizeTo(1)
    callProcedure(resetStateProcCode, noArgs, {}, true)

    forever(() => {
      callProcedure(stepProcCode, noArgs, {}, true)
    })
  })
})

export default project
