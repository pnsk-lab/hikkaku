import { Project } from 'hikkaku'
import { setVariableTo, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  createProjectHarness,
  runProjectFrames,
  runProjectUntilIdle,
} from './harness'
import { getSnapshotVariable } from './snapshot'

const makeProject = () => {
  const project = new Project()
  const score = project.stage.createVariable('score', 0)
  project.stage.run(() => {
    whenFlagClicked(() => {
      setVariableTo(score, 42)
    })
  })
  return project
}

describe('createProjectHarness', () => {
  test('passes project and vm', async () => {
    const project = makeProject()
    const harness = await createProjectHarness(project, {
      autoStart: false,
      maxFrames: 30,
    })

    expect(harness.project).toEqual(project.toScratch())
    expect(harness.vm).toBeTruthy()
  })

  test('calls setup before auto start and snapshot helper works', async () => {
    const project = makeProject()
    const calls: string[] = []
    const harness = await createProjectHarness(project, {
      autoStart: false,
      setup: () => {
        calls.push('setup')
      },
    })

    expect(calls).toEqual(['setup'])
    expect(harness.snapshotVariable('Stage', 'score')).toBeLooselyEqual(0)

    harness.start()
    harness.runUntilIdle()
    expect(harness.snapshotVariable('Stage', 'score')).toBeLooselyEqual(42)
  })
})

describe('run helpers', () => {
  test('runProjectUntilIdle updates variable state', async () => {
    const project = makeProject()
    const result = await runProjectUntilIdle(project, { maxFrames: 40 })

    expect(result.project).toEqual(project.toScratch())
    expect(result.report).toBeTruthy()
    expect(result.snapshot).toBeTruthy()
    expect(
      getSnapshotVariable(result.snapshot, result.project, 'Stage', 'score'),
    ).toBeLooselyEqual(42)
  })

  test('runProjectFrames advances at least one frame', async () => {
    const project = makeProject()
    const result = await runProjectFrames(project, 3)

    expect(result.report).toBeTruthy()
    expect(result.snapshot).toBeTruthy()
  })
})
