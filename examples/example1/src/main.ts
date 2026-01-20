import { ASSET_CAT1, ASSET_CAT2, Project } from 'hikkaku'
import {
  broadcast,
  changeVariableBy,
  changeXBy,
  changeYBy,
  createClone,
  controlStartAsClone,
  deleteThisClone,
  and,
  equals,
  forever,
  getKeyPressed,
  getVariable,
  getX,
  getY,
  gotoXY,
  hide,
  or,
  ifThen,
  lt,
  say,
  setRotationStyle,
  setSizeTo,
  setVariableTo,
  setX,
  setY,
  show,
  showVariable,
  stop,
  switchCostumeTo,
  touchingObject,
  wait,
  whenFlagClicked,
  whenBroadcastReceived,
} from 'hikkaku/blocks'

const project = new Project()

const stage = project.stage
const player = project.createSprite('ネコ')
const obstacle = project.createSprite('トゲ')

const playerCostume = player.addCostume({
  name: 'cat',
  assetId: ASSET_CAT1,
  dataFormat: 'svg',
})

const obstacleCostume = obstacle.addCostume({
  name: 'obstacle',
  assetId: ASSET_CAT2,
  dataFormat: 'svg',
})

const score = stage.createVariable('score', 0)
const yVel = player.createVariable('yVel', 0)
const canJump = player.createVariable('canJump', 1)
stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(score, 0)
    showVariable(score)
  })

  whenBroadcastReceived('game over', () => {
    wait(0.6)
    stop('all')
  })
})

player.run(() => {
  whenFlagClicked(() => {
    switchCostumeTo(playerCostume)
    setRotationStyle('left-right')
    setSizeTo(70)
    gotoXY(-120, -80)
    setVariableTo(yVel, 0)
    setVariableTo(canJump, 1)
    show()
    forever(() => {
      changeVariableBy(yVel, -1.2)
      changeYBy(getVariable(yVel))
      ifThen(or(lt(getY(), -80), equals(getY(), -80)), () => {
        setY(-80)
        setVariableTo(yVel, 0)
        setVariableTo(canJump, 1)
      })
      ifThen(
        and(getKeyPressed('space'), equals(getVariable(canJump), 1)),
        () => {
          setVariableTo(yVel, 16)
          setVariableTo(canJump, 0)
        },
      )
      ifThen(touchingObject('トゲ'), () => {
        broadcast('game over')
      })
    })
  })

  whenBroadcastReceived('game over', () => {
    say('GAME OVER')
  })
})

obstacle.run(() => {
  whenFlagClicked(() => {
    switchCostumeTo(obstacleCostume)
    setSizeTo(40)
    hide()
    forever(() => {
      wait(1.2)
      createClone('トゲ')
    })
  })

  controlStartAsClone(() => {
    show()
    gotoXY(240, -80)
    forever(() => {
      changeXBy(-6)
      ifThen(lt(getX(), -260), () => {
        changeVariableBy(score, 1)
        deleteThisClone()
      })
      ifThen(touchingObject('ネコ'), () => {
        broadcast('game over')
      })
    })
  })
})

export default project

import.meta.hot?.send('hikkaku:project', project.toScratch())
