import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import type { ListReference, VariableReference } from '../core/types'
import * as control from './control'
import * as data from './data'
import * as events from './events'
import * as looks from './looks'
import * as motion from './motion'
import * as music from './music'
import * as operator from './operator'
import * as pen from './pen'
import * as procedures from './procedures'
import * as sensing from './sensing'
import * as sound from './sound'

const toOpcodes = (blocks: Record<string, { opcode: string }>) => {
  return new Set(Object.values(blocks).map((value) => value.opcode))
}

const branch = (condition: boolean, handler: () => void) => {
  return [condition, handler] as [boolean, () => void]
}

describe('blocks/coverage-heavy', () => {
  test('covers block factories across modules', () => {
    const variable: VariableReference = {
      id: 'var-score',
      name: 'score',
      type: 'variable',
    }
    const list: ListReference = {
      id: 'list-items',
      name: 'items',
      type: 'list',
    }
    const costumeRef = { type: 'costume', name: 'costume2' } as const
    const soundRef = { type: 'sound', name: 'meow' } as const

    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })

      motion.moveSteps(10)
      motion.gotoXY(1, 2)
      motion.changeXBy(3)
      motion.changeYBy(4)
      motion.setX(5)
      motion.setY(6)
      motion.goTo('Sprite1')
      motion.goTo(operator.join('Sprite', '2'))
      motion.turnRight(15)
      motion.turnLeft(20)
      motion.pointInDirection(90)
      motion.pointTowards('_mouse_')
      motion.pointTowards(operator.join('mouse', ' pointer'))
      motion.glide(0.2, 10, 20)
      motion.glideTo(0.3, '_random_')
      motion.glideTo(0.3, operator.join('Sprite', '3'))
      motion.ifOnEdgeBounce()
      motion.setRotationStyle('left-right')
      looks.say(motion.getX())
      looks.say(motion.getY())
      looks.say(motion.getDirection())

      looks.say('hello')
      looks.sayForSecs('hello', 0.5)
      looks.think('hmm')
      looks.thinkForSecs('hmm', 0.5)
      looks.show()
      looks.hide()
      looks.switchCostumeTo('costume1')
      looks.switchCostumeTo(costumeRef)
      looks.nextCostume()
      looks.switchBackdropTo('backdrop1')
      looks.switchBackdropTo(operator.join('backdrop', '2'))
      looks.switchBackdropToAndWait('backdrop3')
      looks.nextBackdrop()
      looks.changeLooksEffectBy('color', 10)
      looks.setLooksEffectTo('ghost', 20)
      looks.clearGraphicEffects()
      looks.changeSizeBy(5)
      looks.setSizeTo(120)
      looks.goToFrontBack('front')
      looks.goForwardBackwardLayers('forward', 1)
      looks.say(looks.getSize())
      looks.say(looks.getCostumeNumberName('number'))
      looks.say(looks.getBackdropNumberName('name'))

      sound.playSound('meow')
      sound.playSound(soundRef)
      sound.playSoundUntilDone('meow')
      sound.stopAllSounds()
      sound.setSoundEffectTo('pitch', 20)
      sound.changeSoundEffectBy('pan', -10)
      sound.clearEffects()
      sound.setVolumeTo(80)
      sound.changeVolumeBy(-5)
      looks.say(sound.getVolume())

      music.playDrumForBeats(1, 0.25)
      music.midiPlayDrumForBeats(36, 0.25)
      music.restForBeats(0.5)
      music.playNoteForBeats(60, 0.5)
      music.setInstrument(2)
      music.midiSetInstrument(40)
      music.setTempo(120)
      music.changeTempo(5)
      looks.say(music.getTempo())

      pen.eraseAll()
      pen.clear()
      pen.stamp()
      pen.penDown()
      pen.penUp()
      pen.setPenColorTo('#ff0000')
      pen.setPenColorToColor('#00ff00')
      pen.changePenColorParamBy('color', 3)
      pen.changePenColorParamBy(operator.join('co', 'lor'), 2)
      pen.setPenColorParamTo('brightness', 50)
      pen.changePenSizeBy(1)
      pen.setPenSizeTo(3)
      pen.setPenShadeToNumber(20)
      pen.changePenShadeBy(5)
      pen.setPenHueToNumber(40)
      pen.changePenHueBy(10)

      looks.say(operator.add(1, 2))
      looks.say(operator.subtract(5, 3))
      looks.say(operator.multiply(3, 4))
      looks.say(operator.divide(10, 2))
      control.waitUntil(operator.lt(1, 2))
      control.waitUntil(operator.equals(5, 5))
      control.waitUntil(operator.gt(3, 2))
      control.waitUntil(operator.and(true, false))
      control.waitUntil(operator.or(true, false))
      control.waitUntil(operator.not(false))
      looks.say(operator.random(1, 10))
      looks.say(operator.join('a', 'b'))
      looks.say(operator.letterOf(1, 'abc'))
      looks.say(operator.length('abc'))
      control.waitUntil(operator.contains('abc', 'a'))
      looks.say(operator.mod(10, 3))
      looks.say(operator.round(1.2))
      looks.say(operator.mathop('abs', -1))

      looks.say(sensing.getMouseX())
      looks.say(sensing.getMouseY())
      control.waitUntil(sensing.touchingObject('_mouse_'))
      control.waitUntil(sensing.touchingColor('#ff00ff'))
      control.waitUntil(sensing.colorTouchingColor('#ff0000', '#00ff00'))
      looks.say(sensing.distanceTo('_mouse_'))
      looks.say(sensing.getTimer())
      sensing.resetTimer()
      sensing.setDragMode('draggable')
      control.waitUntil(sensing.getMouseDown())
      control.waitUntil(sensing.getKeyPressed('space'))
      looks.say(sensing.current('year'))
      looks.say(sensing.getAttributeOf('x position', '_stage_'))
      looks.say(sensing.daysSince2000())
      looks.say(sensing.getLoudness())
      control.waitUntil(sensing.isLoud())
      sensing.askAndWait('ready?')
      looks.say(sensing.getAnswer())
      looks.say(sensing.getUsername())

      looks.say(data.getVariable(variable))
      data.setVariableTo(variable, 10)
      data.changeVariableBy(variable, 1)
      data.showVariable(variable)
      data.hideVariable(variable)
      looks.say(data.getListContents(list))
      data.addToList(list, 'apple')
      data.deleteOfList(list, 1)
      data.deleteAllOfList(list)
      data.insertAtList(list, 1, 'banana')
      data.replaceItemOfList(list, 1, 'cherry')
      looks.say(data.getItemOfList(list, 1))
      looks.say(data.getItemNumOfList(list, 'banana'))
      looks.say(data.lengthOfList(list))
      control.waitUntil(data.listContainsItem(list, 'banana'))
      data.showList(list)
      data.hideList(list)

      events.whenFlagClicked(() => motion.moveSteps(1))
      events.whenFlagClicked()
      events.whenKeyPressed('space', () => motion.moveSteps(2))
      events.whenThisSpriteClicked(() => motion.moveSteps(3))
      events.whenStageClicked()
      events.whenBackdropSwitchesTo('backdrop1', () => motion.moveSteps(4))
      events.whenBroadcastReceived('message1', () => motion.moveSteps(5))
      events.whenTouchingObject('_mouse_', () => motion.moveSteps(6))
      events.whenGreaterThan('loudness', 10, () => motion.moveSteps(7))
      events.broadcast('hello')
      events.broadcast(operator.join('hel', 'lo'))
      events.broadcastAndWait('world')
      events.broadcastAndWait(operator.join('wor', 'ld'))

      control.repeat(3, () => motion.moveSteps(1))
      control.repeat(3, () => {})
      control.repeatUntil(false, () => motion.moveSteps(1))
      control.repeatUntil(false, () => {})
      control.repeatWhile(true, () => motion.moveSteps(1))
      control.repeatWhile(true, () => {})
      control.forEach(variable, 5, () => motion.moveSteps(1))
      control.forEach(variable, 5, () => {})
      control.forever(() => motion.moveSteps(1))
      control.forever(() => {})
      control.wait(0.1)
      control.waitUntil(true)
      control.ifThen(true, () => motion.moveSteps(1))
      control.ifThen(true, () => {})
      control.ifElse(
        true,
        () => motion.moveSteps(1),
        () => motion.moveSteps(2),
      )
      control.ifElse(
        true,
        () => {},
        () => {},
      )
      control.match()
      control.match(() => {
        motion.moveSteps(8)
      })
      control.match(branch(true, () => motion.moveSteps(9)))
      control.match(
        branch(false, () => motion.moveSteps(10)),
        branch(true, () => motion.moveSteps(11)),
        () => motion.moveSteps(12),
      )
      control.stop('all')
      control.createClone(control.CREATE_CLONE_MYSELF)
      control.createClone(operator.join('Sprite', '4'))
      control.deleteThisClone()
      looks.say(control.getCounter())
      control.incrCounter()
      control.clearCounter()
      control.controlStartAsClone(() => motion.moveSteps(13))
      control.controlStartAsClone()
      control.allAtOnce(() => motion.moveSteps(14))
      control.allAtOnce(() => {})
    })

    const opcodes = toOpcodes(blocks)
    expect(opcodes).toContain('motion_glideto')
    expect(opcodes).toContain('looks_switchbackdroptoandwait')
    expect(opcodes).toContain('sound_changeeffectby')
    expect(opcodes).toContain('music_midiSetInstrument')
    expect(opcodes).toContain('pen_changePenHueBy')
    expect(opcodes).toContain('operator_mathop')
    expect(opcodes).toContain('sensing_of')
    expect(opcodes).toContain('data_replaceitemoflist')
    expect(opcodes).toContain('event_broadcastandwait')
    expect(opcodes).toContain('control_all_at_once')
  })

  test('covers procedure helpers and call styles', () => {
    const blocks = createBlocks(() => {
      const greet = procedures.defineProcedure(
        [
          procedures.procedureLabel('greet'),
          procedures.procedureBoolean('isLoud'),
          procedures.procedureStringOrNumber('name'),
        ],
        ({ isLoud, name }) => {
          control.ifElse(
            isLoud.getter(),
            () => looks.say('LOUD'),
            () => looks.say(name.getter()),
          )
          return undefined
        },
        true,
      )

      const boolRef = greet.reference.arguments
        .isLoud as procedures.ProcedureBooleanReference
      const nameRef = greet.reference.arguments
        .name as procedures.ProcedureStringOrNumberReference

      procedures.callProcedure(greet, [
        { reference: boolRef, value: true },
        { reference: nameRef, value: 'Ada' },
      ])
      procedures.callProcedure(greet.reference, {
        [boolRef.id]: false,
        [nameRef.id]: 'Bob',
      })
      procedures.callProcedure(
        greet.reference.proccode,
        greet.reference.argumentids,
        {
          [boolRef.id]: true,
          [nameRef.id]: 'Cid',
        },
        false,
      )

      control.waitUntil(procedures.argumentReporterBoolean(boolRef))
      looks.say(procedures.argumentReporterStringNumber(nameRef))

      const ping = procedures.defineProcedure([
        procedures.procedureLabel('ping'),
      ])
      procedures.callProcedure(
        ping.reference.proccode,
        ping.reference.argumentids,
      )
    })

    const opcodes = toOpcodes(blocks)
    expect(opcodes).toContain('procedures_definition')
    expect(opcodes).toContain('procedures_call')
    expect(opcodes).toContain('argument_reporter_boolean')
    expect(opcodes).toContain('argument_reporter_string_number')
  })
})
