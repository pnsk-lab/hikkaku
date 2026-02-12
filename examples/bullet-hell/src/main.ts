import { Project, type VariableReference } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
import {
  add,
  and,
  broadcast,
  CREATE_CLONE_MYSELF,
  changeVariableBy,
  controlStartAsClone,
  createClone,
  deleteThisClone,
  divide,
  equals,
  forever,
  getMouseX,
  getVariable,
  goToFrontBack,
  gotoXY,
  gt,
  hide,
  ifElse,
  ifThen,
  lt,
  mathop,
  moveSteps,
  multiply,
  pointInDirection,
  random,
  repeat,
  sayForSecs,
  setLooksEffectTo,
  setRotationStyle,
  setSizeTo,
  setVariableTo,
  setX,
  show,
  showVariable,
  touchingObject,
  wait,
  whenBroadcastReceived,
  whenFlagClicked,
} from 'hikkaku/blocks'

const { BALL_A, ROCKETSHIP_A, WIZARD_A } = IMAGES

const project = new Project()
const gameOverEvent = 'game-over'

const score = project.stage.createVariable('score', 0)
const gameOver = project.stage.createVariable('gameOver', 0)
const bossX = project.stage.createVariable('bossX', 0)
const bossY = project.stage.createVariable('bossY', 120)

const readVar = (variable: VariableReference) => getVariable(variable)

project.stage.run(() => {
  whenFlagClicked(() => {
    showVariable(score)
    setVariableTo(score, 0)
    setVariableTo(gameOver, 0)
    setVariableTo(bossX, 0)
    setVariableTo(bossY, 120)
    forever(() => {
      ifThen(equals(readVar(gameOver), 0), () => {
        changeVariableBy(score, 1)
      })
      wait(0.1)
    })
  })
})

const boss = project.createSprite('boss')
boss.addCostume({
  ...WIZARD_A,
  name: 'boss',
})
boss.run(() => {
  whenFlagClicked(() => {
    show()
    setSizeTo(58)
    setRotationStyle("don't rotate")
    gotoXY(0, 120)
    forever(() => {
      ifThen(equals(readVar(gameOver), 0), () => {
        setVariableTo(
          bossX,
          multiply(mathop('sin', multiply(readVar(score), 0.8)), 170),
        )
        setVariableTo(
          bossY,
          add(110, multiply(mathop('sin', multiply(readVar(score), 1.9)), 25)),
        )
        gotoXY(readVar(bossX), readVar(bossY))
      })
      wait(0.02)
    })
  })
})

const player = project.createSprite('player')
player.addCostume({
  ...ROCKETSHIP_A,
  name: 'player',
})
player.run(() => {
  whenFlagClicked(() => {
    show()
    setSizeTo(38)
    setRotationStyle("don't rotate")
    goToFrontBack('front')
    gotoXY(0, -145)
    forever(() => {
      ifElse(
        lt(getMouseX(), -220),
        () => {
          setX(-220)
        },
        () => {
          ifElse(
            gt(getMouseX(), 220),
            () => {
              setX(220)
            },
            () => {
              setX(getMouseX())
            },
          )
        },
      )
      ifThen(
        and(equals(readVar(gameOver), 0), touchingObject('bullet')),
        () => {
          setVariableTo(gameOver, 1)
          broadcast(gameOverEvent)
        },
      )
    })
  })

  whenBroadcastReceived(gameOverEvent, () => {
    sayForSecs('GAME OVER', 2)
  })
})

const bullet = project.createSprite('bullet')
bullet.addCostume({
  ...BALL_A,
  name: 'bullet',
})
const speed = bullet.createVariable('speed', 4.5)

bullet.run(() => {
  whenFlagClicked(() => {
    hide()
    setSizeTo(22)
    forever(() => {
      repeat(add(3, mathop('floor', divide(readVar(score), 90))), () => {
        gotoXY(readVar(bossX), readVar(bossY))
        pointInDirection(add(180, random(-70, 70)))
        setVariableTo(speed, add(4.5, divide(readVar(score), 180)))
        createClone(CREATE_CLONE_MYSELF)
      })
      wait(divide(35, add(65, readVar(score))))
      wait(0.01)
    })
  })

  controlStartAsClone(() => {
    show()
    setLooksEffectTo('color', random(0, 180))
    forever(() => {
      moveSteps(readVar(speed))
      ifThen(touchingObject('_edge_'), () => {
        deleteThisClone()
      })
      ifThen(touchingObject('player'), () => {
        setVariableTo(gameOver, 1)
        broadcast(gameOverEvent)
        deleteThisClone()
      })
    })
  })

  whenBroadcastReceived(gameOverEvent, () => {
    hide()
  })
})

export default project
