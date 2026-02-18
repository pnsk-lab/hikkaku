import { describe, expect, test } from 'vite-plus/test'
import { svg } from '../assets/helpers'
import { whenFlagClicked } from '../blocks/events'
import { say } from '../blocks/looks'
import { moveSteps } from '../blocks/motion'
import { Project } from './project'

describe('core/project', () => {
  test('creates stage/sprite and exports scratch project', () => {
    const project = new Project()
    const sprite = project.createSprite('Cat', { x: 10, y: 20, size: 80 })

    project.stage.run(() => {
      whenFlagClicked(() => {
        say('hello')
      })
    })
    sprite.run(() => {
      moveSteps(10)
    })

    const json = project.toScratch()
    expect(json.targets).toHaveLength(2)
    expect(json.meta.semver).toBe('3.0.0')
  })

  test('supports variables, lists and assets', () => {
    const project = new Project()
    const stage = project.stage
    const bytes = new Uint8Array([1, 2, 3])

    const variable = stage.createVariable('score', 0, {
      monitor: { mode: 'default' },
    })
    const list = stage.createList('items', ['a'], {
      monitor: {},
    })
    stage.addCostume({ ...svg('costume-1'), _data: bytes })
    stage.addSound({
      name: 's',
      assetId: 'snd',
      dataFormat: 'wav',
      _data: bytes,
    })

    const projectJson = project.toScratch() as unknown as {
      monitors: unknown[]
    }
    expect(variable.id).toBeTruthy()
    expect(list.id).toBeTruthy()
    expect(projectJson.monitors.length).toBe(2)
    expect(project.getAdditionalAssets().size).toBe(2)
  })
})
