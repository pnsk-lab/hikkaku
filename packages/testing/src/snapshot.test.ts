import type { VMSnapshot } from 'moonscratch'
import type { ScratchProject } from 'sb3-types'
import { describe, expect, test } from 'vite-plus/test'
import { getSnapshotTarget, getSnapshotVariable } from './snapshot'

const createSnapshot = (): VMSnapshot =>
  ({
    targets: [
      {
        name: 'Stage',
        isStage: true,
        variables: {
          v1: 3,
          v2: 7,
        },
      },
    ],
    monitors: [],
    stage: {
      name: 'Stage',
      id: 'stage',
    },
    tempo: 60,
    videoState: 'on',
    videoTransparency: 50,
    currentMSecsPerTick: 16.666666666666668,
    nowMs: 0,
    frameCount: 1,
    targetTime: 0,
    timer: 0,
    randomSeed: 0,
  }) as unknown as VMSnapshot

describe('snapshot helpers', () => {
  test('gets target by name', () => {
    const snapshot = createSnapshot()
    expect(getSnapshotTarget(snapshot, 'Stage')).toBe(snapshot.targets[0])
  })

  test('gets target by index', () => {
    const snapshot = createSnapshot()
    expect(getSnapshotTarget(snapshot, 0)).toBe(snapshot.targets[0])
  })

  test('reads variable by id', () => {
    const snapshot = createSnapshot()
    expect(getSnapshotVariable(snapshot, 'v1')).toBe(3)
    expect(getSnapshotVariable(snapshot, 'not-found')).toBeUndefined()
  })

  test('reads variable by project + name', () => {
    const project = {
      targets: [
        {
          name: 'Stage',
          variables: {
            v1: ['score', 0],
          },
          isStage: true,
          lists: {},
          blocks: {},
          comments: {},
          costumes: [],
          sounds: [],
          currentCostume: 0,
          direction: 90,
          x: 0,
          y: 0,
          size: 100,
          layerOrder: 0,
          visible: true,
          draggable: false,
          rotationStyle: 'all around',
          volume: 100,
          tempoBpm: 60,
          textToSpeechLanguage: null,
          videoState: 'on',
          videoTransparency: 100,
          visibleInLibrary: true,
          visibleInLayer: true,
        },
      ],
      monitors: [],
      extensions: [],
      meta: {
        semver: '',
        vm: '',
        agent: '',
      },
    } as unknown as ScratchProject

    const snapshot = createSnapshot()
    expect(getSnapshotVariable(snapshot, project, 'Stage', 'score')).toBe(3)
    expect(getSnapshotVariable(snapshot, project, 0, 'v1')).toBe(3)
    expect(
      getSnapshotVariable(snapshot, project, 'Stage', 'not-found'),
    ).toBeUndefined()
  })
})
