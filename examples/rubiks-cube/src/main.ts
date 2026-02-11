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
  for (let row = 0; row < 3; row += 1)
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
addFace([0, 0, -1], [1, 0, 0], [0, 1, 0], 3)
addFace([0, 0, 1], [-1, 0, 0], [0, 1, 0], 4)
addFace([1, 0, 0], [0, 0, 1], [0, 1, 0], 5)
addFace([-1, 0, 0], [0, 0, -1], [0, 1, 0], 6)
addFace([0, 1, 0], [1, 0, 0], [0, 0, 1], 1)
addFace([0, -1, 0], [1, 0, 0], [0, 0, -1], 2)
var stickerCount = stickerSeeds.length
var zeroes = stickerSeeds.map(() => 0)
var drawOrderSeed = stickerSeeds.map((_, index) => index + 1)
var initialViewYaw = 32
var initialViewPitch = -24
var initialTurnAxis = 2
var initialTurnLayer = 1
var initialTurnDir = 1
var project = new Project()
var renderer = project.createSprite('renderer')
var viewYaw = renderer.createVariable('viewYaw', initialViewYaw)
var viewPitch = renderer.createVariable('viewPitch', initialViewPitch)
var cosYaw = renderer.createVariable('cosYaw', 1)
var sinYaw = renderer.createVariable('sinYaw', 0)
var cosPitch = renderer.createVariable('cosPitch', 1)
var sinPitch = renderer.createVariable('sinPitch', 0)
var cameraDistance = renderer.createVariable('cameraDistance', 420)
var focalLength = renderer.createVariable('focalLength', 290)
var modelScale = renderer.createVariable('modelScale', 80.6)
var cubiePitch = renderer.createVariable('cubiePitch', 0.66)
var faceOffset = renderer.createVariable('faceOffset', 0.34)
var stickerHalf = renderer.createVariable('stickerHalf', 0.34)
var stickerScale = renderer.createVariable('stickerScale', 14)
var dragging = renderer.createVariable('dragging', 0)
var lastMouseX = renderer.createVariable('lastMouseX', 0)
var lastMouseY = renderer.createVariable('lastMouseY', 0)
var inputLock = renderer.createVariable('inputLock', 0)
var anyMovePressed = renderer.createVariable('anyMovePressed', 0)
var turnActive = renderer.createVariable('turnActive', 0)
var turnAxis = renderer.createVariable('turnAxis', initialTurnAxis)
var turnLayer = renderer.createVariable('turnLayer', initialTurnLayer)
var turnDir = renderer.createVariable('turnDir', initialTurnDir)
var turnProgress = renderer.createVariable('turnProgress', 0)
var turnSpeed = renderer.createVariable('turnSpeed', 12)
var turnAngle = renderer.createVariable('turnAngle', 0)
var turnCos = renderer.createVariable('turnCos', 1)
var turnSin = renderer.createVariable('turnSin', 0)
var stickerIndex = renderer.createVariable('stickerIndex', 1)
var passIndex = renderer.createVariable('passIndex', 1)
var sortIndex = renderer.createVariable('sortIndex', 1)
var drawIndex = renderer.createVariable('drawIndex', 1)
var inTurningLayer = renderer.createVariable('inTurningLayer', 0)
var visibleFlag = renderer.createVariable('visibleFlag', 0)
var orderA = renderer.createVariable('orderA', 1)
var orderB = renderer.createVariable('orderB', 1)
var depthA = renderer.createVariable('depthA', 0)
var depthB = renderer.createVariable('depthB', 0)
var swapTmp = renderer.createVariable('swapTmp', 0)
var loadX = renderer.createVariable('loadX', 0)
var loadY = renderer.createVariable('loadY', 0)
var loadZ = renderer.createVariable('loadZ', 0)
var newX = renderer.createVariable('newX', 0)
var newY = renderer.createVariable('newY', 0)
var newZ = renderer.createVariable('newZ', 0)
var posX = renderer.createVariable('posX', 0)
var posY = renderer.createVariable('posY', 0)
var posZ = renderer.createVariable('posZ', 0)
var nx = renderer.createVariable('nx', 0)
var ny = renderer.createVariable('ny', 0)
var nz = renderer.createVariable('nz', 0)
var ux = renderer.createVariable('ux', 0)
var uy = renderer.createVariable('uy', 0)
var uz = renderer.createVariable('uz', 0)
var vx = renderer.createVariable('vx', 0)
var vy = renderer.createVariable('vy', 0)
var vz = renderer.createVariable('vz', 0)
var rPosX = renderer.createVariable('rPosX', 0)
var rPosY = renderer.createVariable('rPosY', 0)
var rPosZ = renderer.createVariable('rPosZ', 0)
var rNx = renderer.createVariable('rNx', 0)
var rNy = renderer.createVariable('rNy', 0)
var rNz = renderer.createVariable('rNz', 0)
var rUx = renderer.createVariable('rUx', 0)
var rUy = renderer.createVariable('rUy', 0)
var rUz = renderer.createVariable('rUz', 0)
var rVx = renderer.createVariable('rVx', 0)
var rVy = renderer.createVariable('rVy', 0)
var rVz = renderer.createVariable('rVz', 0)
var centerX = renderer.createVariable('centerX', 0)
var centerY = renderer.createVariable('centerY', 0)
var centerZ = renderer.createVariable('centerZ', 0)
var cornerX = renderer.createVariable('cornerX', 0)
var cornerY = renderer.createVariable('cornerY', 0)
var cornerZ = renderer.createVariable('cornerZ', 0)
var cameraX = renderer.createVariable('cameraX', 0)
var cameraY = renderer.createVariable('cameraY', 0)
var cameraZ1 = renderer.createVariable('cameraZ1', 0)
var cameraZ = renderer.createVariable('cameraZ', 0)
var perspective = renderer.createVariable('perspective', 1)
var qx1 = renderer.createVariable('qx1', 0)
var qy1 = renderer.createVariable('qy1', 0)
var qx2 = renderer.createVariable('qx2', 0)
var qy2 = renderer.createVariable('qy2', 0)
var qx3 = renderer.createVariable('qx3', 0)
var qy3 = renderer.createVariable('qy3', 0)
var qx4 = renderer.createVariable('qx4', 0)
var qy4 = renderer.createVariable('qy4', 0)
var colorId = renderer.createVariable('colorId', 1)
var tileTransparency = renderer.createVariable('tileTransparency', 0)
var edgeTransparency = renderer.createVariable('edgeTransparency', 0)
var yMin = renderer.createVariable('yMin', 0)
var yMax = renderer.createVariable('yMax', 0)
var scanSteps = renderer.createVariable('scanSteps', 1)
var scanIndex = renderer.createVariable('scanIndex', 0)
var yScan = renderer.createVariable('yScan', 0)
var hitCount = renderer.createVariable('hitCount', 0)
var xMin = renderer.createVariable('xMin', 0)
var xMax = renderer.createVariable('xMax', 0)
var edgeMinY = renderer.createVariable('edgeMinY', 0)
var edgeMaxY = renderer.createVariable('edgeMaxY', 0)
var edgeDy = renderer.createVariable('edgeDy', 0)
var edgeT = renderer.createVariable('edgeT', 0)
var xHit = renderer.createVariable('xHit', 0)
var posXList = renderer.createList(
  'posX',
  stickerSeeds.map((seed) => seed.pos[0]),
)
var posYList = renderer.createList(
  'posY',
  stickerSeeds.map((seed) => seed.pos[1]),
)
var posZList = renderer.createList(
  'posZ',
  stickerSeeds.map((seed) => seed.pos[2]),
)
var nxList = renderer.createList(
  'nx',
  stickerSeeds.map((seed) => seed.normal[0]),
)
var nyList = renderer.createList(
  'ny',
  stickerSeeds.map((seed) => seed.normal[1]),
)
var nzList = renderer.createList(
  'nz',
  stickerSeeds.map((seed) => seed.normal[2]),
)
var uxList = renderer.createList(
  'ux',
  stickerSeeds.map((seed) => seed.u[0]),
)
var uyList = renderer.createList(
  'uy',
  stickerSeeds.map((seed) => seed.u[1]),
)
var uzList = renderer.createList(
  'uz',
  stickerSeeds.map((seed) => seed.u[2]),
)
var vxList = renderer.createList(
  'vx',
  stickerSeeds.map((seed) => seed.v[0]),
)
var vyList = renderer.createList(
  'vy',
  stickerSeeds.map((seed) => seed.v[1]),
)
var vzList = renderer.createList(
  'vz',
  stickerSeeds.map((seed) => seed.v[2]),
)
var colorList = renderer.createList(
  'color',
  stickerSeeds.map((seed) => seed.color),
)
var colorHexList = renderer.createList('colorHex', [
  '#f8fafc',
  '#fde047',
  '#22c55e',
  '#3b82f6',
  '#ef4444',
  '#f97316',
])
var p1xList = renderer.createList('p1x', zeroes)
var p1yList = renderer.createList('p1y', zeroes)
var p2xList = renderer.createList('p2x', zeroes)
var p2yList = renderer.createList('p2y', zeroes)
var p3xList = renderer.createList('p3x', zeroes)
var p3yList = renderer.createList('p3y', zeroes)
var p4xList = renderer.createList('p4x', zeroes)
var p4yList = renderer.createList('p4y', zeroes)
var depthList = renderer.createList('depth', zeroes)
var visibleList = renderer.createList('visible', zeroes)
var drawOrderList = renderer.createList('drawOrder', drawOrderSeed)
var seedPosXList = renderer.createList(
  'seedPosX',
  stickerSeeds.map((seed) => seed.pos[0]),
)
var seedPosYList = renderer.createList(
  'seedPosY',
  stickerSeeds.map((seed) => seed.pos[1]),
)
var seedPosZList = renderer.createList(
  'seedPosZ',
  stickerSeeds.map((seed) => seed.pos[2]),
)
var seedNxList = renderer.createList(
  'seedNx',
  stickerSeeds.map((seed) => seed.normal[0]),
)
var seedNyList = renderer.createList(
  'seedNy',
  stickerSeeds.map((seed) => seed.normal[1]),
)
var seedNzList = renderer.createList(
  'seedNz',
  stickerSeeds.map((seed) => seed.normal[2]),
)
var seedUxList = renderer.createList(
  'seedUx',
  stickerSeeds.map((seed) => seed.u[0]),
)
var seedUyList = renderer.createList(
  'seedUy',
  stickerSeeds.map((seed) => seed.u[1]),
)
var seedUzList = renderer.createList(
  'seedUz',
  stickerSeeds.map((seed) => seed.u[2]),
)
var seedVxList = renderer.createList(
  'seedVx',
  stickerSeeds.map((seed) => seed.v[0]),
)
var seedVyList = renderer.createList(
  'seedVy',
  stickerSeeds.map((seed) => seed.v[1]),
)
var seedVzList = renderer.createList(
  'seedVz',
  stickerSeeds.map((seed) => seed.v[2]),
)
var seedDrawOrderList = renderer.createList('seedDrawOrder', drawOrderSeed)
const readVar = (variable: VariableReference) => getVariable(variable)
var fillProcCode = 'fill-sticker-quad'
var commitTurnProcCode = 'commit-turn'
var resetStateProcCode = 'reset-state'
var stepProcCode = '1step'
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
