import type { Block, TopLevelPrimitive } from 'sb3-types'
import { describe, expect, test } from 'vite-plus/test'
import type { ScratchProjectLike } from './minify'
import { minifyScratchProject, minifyScratchProjectJson } from './minify'

const createProject = (): ScratchProjectLike => {
  return {
    meta: {
      semver: '3.0.0',
      agent: 'Hikkaku | Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    },
    extensions: [],
    monitors: [
      {
        id: 'var-stage',
        mode: 'default',
        opcode: 'data_variable',
        params: {
          VARIABLE: 'score',
        },
        spriteName: null,
        value: 0,
        sliderMin: 0,
        sliderMax: 100,
        isDiscrete: true,
        x: null,
        y: null,
        width: 0,
        height: 0,
        visible: true,
      },
      {
        id: 'list-sprite',
        mode: 'list',
        opcode: 'data_listcontents',
        params: {
          LIST: 'history',
        },
        spriteName: 'Player',
        value: [],
        x: null,
        y: null,
        width: 0,
        height: 0,
        visible: true,
      },
    ],
    targets: [
      {
        isStage: true,
        name: 'Stage',
        currentCostume: 0,
        costumes: [
          {
            assetId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            dataFormat: 'svg',
            md5ext: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.svg',
            name: 'Backdrop One',
          },
        ],
        sounds: [],
        comments: {},
        broadcasts: {
          'broadcast-id': 'broadcast-start',
        },
        variables: {
          'var-stage': ['score', 0],
        },
        lists: {},
        blocks: {
          top: {
            opcode: 'event_whenbroadcastreceived',
            topLevel: true,
            parent: null,
            next: 'switch-backdrop',
            shadow: false,
            x: 64,
            y: 72,
            fields: {
              BROADCAST_OPTION: ['broadcast-start', null],
            },
            inputs: {},
          },
          'switch-backdrop': {
            opcode: 'looks_switchbackdropto',
            topLevel: false,
            parent: 'top',
            next: null,
            shadow: false,
            fields: {},
            inputs: {
              BACKDROP: [3, 'backdrop-menu', [10, 'stale backdrop']],
            },
          },
          'backdrop-menu': {
            opcode: 'looks_backdrops',
            topLevel: false,
            parent: 'switch-backdrop',
            next: null,
            shadow: true,
            fields: {
              BACKDROP: ['Backdrop One', null],
            },
            inputs: {},
          },
          unused: {
            opcode: 'operator_join',
            topLevel: false,
            parent: null,
            next: null,
            shadow: false,
            fields: {},
            inputs: {
              STRING1: [1, [10, 'unused']],
              STRING2: [1, [10, 'block']],
            },
          },
          orphanPrimitive: [12, 'score', 'var-stage', 320, 40],
        },
      },
      {
        isStage: false,
        name: 'Player',
        visible: true,
        currentCostume: 0,
        x: 10,
        y: 20,
        size: 100,
        costumes: [
          {
            assetId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            dataFormat: 'svg',
            md5ext: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.svg',
            name: 'Idle',
          },
        ],
        sounds: [
          {
            assetId: 'cccccccccccccccccccccccccccccccc',
            dataFormat: 'wav',
            md5ext: 'cccccccccccccccccccccccccccccccc.wav',
            name: 'Laser',
          },
        ],
        comments: {},
        broadcasts: {},
        variables: {},
        lists: {
          'list-sprite': ['history', []],
        },
        blocks: {
          spriteTop: {
            opcode: 'motion_goto',
            topLevel: true,
            parent: null,
            next: 'switch-costume',
            shadow: false,
            x: 64,
            y: 72,
            fields: {},
            inputs: {
              TO: [1, 'goto-menu'],
            },
          },
          'goto-menu': {
            opcode: 'motion_goto_menu',
            topLevel: false,
            parent: 'spriteTop',
            next: null,
            shadow: true,
            fields: {
              TO: ['Player', null],
            },
            inputs: {},
          },
          'switch-costume': {
            opcode: 'looks_switchcostumeto',
            topLevel: false,
            parent: 'spriteTop',
            next: 'play-sound',
            shadow: false,
            fields: {},
            inputs: {
              COSTUME: [1, 'costume-menu'],
            },
          },
          'costume-menu': {
            opcode: 'looks_costume',
            topLevel: false,
            parent: 'switch-costume',
            next: null,
            shadow: true,
            fields: {
              COSTUME: ['Idle', null],
            },
            inputs: {},
          },
          'play-sound': {
            opcode: 'sound_playuntildone',
            topLevel: false,
            parent: 'switch-costume',
            next: 'touching-check',
            shadow: false,
            fields: {},
            inputs: {
              SOUND_MENU: [1, 'sound-menu'],
            },
          },
          'sound-menu': {
            opcode: 'sound_sounds_menu',
            topLevel: false,
            parent: 'play-sound',
            next: null,
            shadow: true,
            fields: {
              SOUND_MENU: ['Laser', null],
            },
            inputs: {},
          },
          'touching-check': {
            opcode: 'sensing_touchingobject',
            topLevel: false,
            parent: 'play-sound',
            next: 'list-read',
            shadow: false,
            fields: {},
            inputs: {
              TOUCHINGOBJECTMENU: [1, 'touch-menu'],
            },
          },
          'touch-menu': {
            opcode: 'sensing_touchingobjectmenu',
            topLevel: false,
            parent: 'touching-check',
            next: null,
            shadow: true,
            fields: {
              TOUCHINGOBJECTMENU: ['Player', null],
            },
            inputs: {},
          },
          'list-read': {
            opcode: 'data_itemoflist',
            topLevel: false,
            parent: 'touching-check',
            next: null,
            shadow: false,
            fields: {
              LIST: ['history', 'list-sprite'],
            },
            inputs: {
              INDEX: [1, [6, 1]],
            },
          },
        },
      },
    ],
  }
}

const isBlockObject = (block: Block | TopLevelPrimitive): block is Block => {
  return typeof block === 'object' && block !== null && 'opcode' in block
}

describe('minifyScratchProject', () => {
  test('renames known entities and removes unreachable block data', () => {
    const minified = minifyScratchProject(createProject())
    const stage = minified.targets[0]
    const sprite = minified.targets[1]
    if (!stage || !sprite) {
      throw new Error('expected stage and sprite targets')
    }

    expect(minified.meta.agent).toBeUndefined()
    expect(stage.variables['var-stage']?.[0]).toBe('a')
    expect(stage.broadcasts['broadcast-id']).toBe('a')
    expect(stage.costumes[0]?.name).toBe('a')
    expect(sprite.name).toBe('a')
    expect(sprite.lists['list-sprite']?.[0]).toBe('a')
    expect(sprite.costumes[0]?.name).toBe('a')
    expect(sprite.sounds[0]?.name).toBe('a')

    const backdropMenu = stage.blocks['backdrop-menu']
    if (!backdropMenu || !isBlockObject(backdropMenu)) {
      throw new Error('expected backdrop menu block')
    }
    expect(backdropMenu.fields?.BACKDROP?.[0]).toBe('a')

    const soundMenu = sprite.blocks['sound-menu']
    if (!soundMenu || !isBlockObject(soundMenu)) {
      throw new Error('expected sound menu block')
    }
    expect(soundMenu.fields?.SOUND_MENU?.[0]).toBe('a')

    const touchMenu = sprite.blocks['touch-menu']
    if (!touchMenu || !isBlockObject(touchMenu)) {
      throw new Error('expected touch menu block')
    }
    expect(touchMenu.fields?.TOUCHINGOBJECTMENU?.[0]).toBe('a')

    const top = stage.blocks.top
    if (!top || !isBlockObject(top)) {
      throw new Error('expected top block')
    }
    expect(top.fields?.BROADCAST_OPTION?.[0]).toBe('a')
    expect(top.inputs).toBeUndefined()
    expect(top.parent).toBeUndefined()

    const switchBackdrop = stage.blocks['switch-backdrop']
    if (!switchBackdrop || !isBlockObject(switchBackdrop)) {
      throw new Error('expected switch backdrop block')
    }
    expect(switchBackdrop.inputs?.BACKDROP).toEqual([1, 'backdrop-menu'])

    expect(stage.blocks.unused).toBeUndefined()
    expect(stage.blocks.orphanPrimitive).toBeUndefined()
  })

  test('minifies JSON text directly', () => {
    const minifiedJson = minifyScratchProjectJson(
      JSON.stringify(createProject()),
      {
        renameCostumes: false,
        renameSounds: false,
        renameSprites: false,
      },
    )
    const minified = JSON.parse(minifiedJson) as ScratchProjectLike

    expect(minified.targets[0]?.costumes[0]?.name).toBe('Backdrop One')
    expect(minified.targets[1]?.sounds[0]?.name).toBe('Laser')
    expect(minified.targets[1]?.name).toBe('Player')
    expect(minified.targets[0]?.variables['var-stage']?.[0]).toBe('a')
  })
})
