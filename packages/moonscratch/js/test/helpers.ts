import type { Project } from 'hikkaku'
import { createHeadlessVMFromProject } from '../index.ts'
import type {
  FrameReport,
  HeadlessVM,
  JsonValue,
  RenderFrame,
  VMSnapshotTarget,
} from '../vm/index.ts'

export const createVmFromProject = (project: Project): HeadlessVM => {
  return createHeadlessVMFromProject({
    projectJson: project.toScratch(),
    initialNowMs: 0,
  })
}

export const stepMany = (
  vm: HeadlessVM,
  count: number,
  frameMs = 33,
): FrameReport => {
  if (count <= 0) {
    throw new Error('count must be positive')
  }
  let report: FrameReport | null = null
  let nowMs = vm.snapshot().nowMs
  for (let index = 0; index < count; index += 1) {
    nowMs += frameMs
    vm.setTime(nowMs)
    report = vm.stepFrame()
  }
  if (!report) {
    throw new Error('stepMany did not execute any frames')
  }
  return report
}

export const runUntilFinished = (
  vm: HeadlessVM,
  maxFrames = 180,
  frameMs = 33,
): FrameReport => {
  let nowMs = vm.snapshot().nowMs
  for (let index = 0; index < maxFrames; index += 1) {
    nowMs += frameMs
    vm.setTime(nowMs)
    const report = vm.stepFrame()
    if (report.stopReason === 'finished') {
      return report
    }
  }
  throw new Error(`VM did not finish within ${String(maxFrames)} frames`)
}

export const getTargetByName = (
  vm: HeadlessVM,
  name: string,
): VMSnapshotTarget => {
  const target = vm.snapshot().targets.find((item) => item.name === name)
  if (!target) {
    throw new Error(`target "${name}" was not found in snapshot`)
  }
  return target
}

export const getStageTarget = (vm: HeadlessVM): VMSnapshotTarget => {
  const stage = vm.snapshot().targets.find((target) => target.isStage)
  if (!stage) {
    throw new Error('stage target was not found in snapshot')
  }
  return stage
}

export const getStageVariable = (vm: HeadlessVM, id: string): JsonValue => {
  const value = getStageTarget(vm).variables[id]
  if (value === undefined) {
    throw new Error(`stage variable "${id}" was not found in snapshot`)
  }
  return value
}

export const countNonTransparentPixels = (frame: RenderFrame): number => {
  let count = 0
  for (let index = 0; index < frame.pixels.length; index += 4) {
    if ((frame.pixels[index + 3] ?? 0) > 0) {
      count += 1
    }
  }
  return count
}

export const hasApproxColor = (
  frame: RenderFrame,
  rgb: readonly [number, number, number],
  tolerance = 24,
  minAlpha = 32,
): boolean => {
  for (let index = 0; index < frame.pixels.length; index += 4) {
    const r = frame.pixels[index] ?? 0
    const g = frame.pixels[index + 1] ?? 0
    const b = frame.pixels[index + 2] ?? 0
    const a = frame.pixels[index + 3] ?? 0
    if (a < minAlpha) {
      continue
    }
    if (
      Math.abs(r - rgb[0]) <= tolerance &&
      Math.abs(g - rgb[1]) <= tolerance &&
      Math.abs(b - rgb[2]) <= tolerance
    ) {
      return true
    }
  }
  return false
}
