import { Project } from 'hikkaku'
import type { HikkakuBool, PrimitiveSource } from 'hikkaku'
import {
  add,
  changeVariableBy,
  equals,
  gt,
  ifThen,
  repeat,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { bench, run } from 'mitata'
import {
  createHeadlessVM,
  createProgramModuleFromProject,
} from '../js/vm/factory.ts'

const runUntilFinished = (vm: {
  greenFlag(): void
  stepFrame(): { stopReason: string }
}) => {
  vm.greenFlag()
  while (true) {
    const result = vm.stepFrame()
    if (result.stopReason === 'finished') {
      break
    }
  }
}

const ITERATIONS = 50_000

const sameTypeNumberProject = new Project()
const sameTypeNumber = sameTypeNumberProject.stage.createVariable('same_type_number', 0)

sameTypeNumberProject.stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(sameTypeNumber, 0)
    repeat(ITERATIONS, () => {
      setVariableTo(sameTypeNumber, add(sameTypeNumber.get(), 1))
    })
  })
})

const sameTypeNumberProgram = createProgramModuleFromProject({
  projectJson: sameTypeNumberProject.toScratch(),
})
const sameTypeNumberVM = createHeadlessVM({
  program: sameTypeNumberProgram,
  initialNowMs: 0,
  options: {
    stepTimeoutTicks: 1000000,
    turbo: true,
  },
})

const sameTypeStringProject = new Project()
const sameTypeString = sameTypeStringProject.stage.createVariable('same_type_string', '')

sameTypeStringProject.stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(sameTypeString, 'seed')
    repeat(ITERATIONS, () => {
      setVariableTo(sameTypeString, sameTypeString.get())
    })
  })
})

const sameTypeStringProgram = createProgramModuleFromProject({
  projectJson: sameTypeStringProject.toScratch(),
})
const sameTypeStringVM = createHeadlessVM({
  program: sameTypeStringProgram,
  initialNowMs: 0,
  options: {
    stepTimeoutTicks: 1000000,
    turbo: true,
  },
})

const conversionProject = new Project()
const conversionValue = conversionProject.stage.createVariable('conversion_value', '')
const conversionSink = conversionProject.stage.createVariable('conversion_sink', 0)

conversionProject.stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(conversionSink, 0)

    setVariableTo(conversionValue, 'true')
    repeat(ITERATIONS, () => {
      ifThen(
        conversionValue.get() as unknown as PrimitiveSource<HikkakuBool>,
        () => {
          changeVariableBy(conversionSink, 1)
        },
      )
    })

    setVariableTo(conversionValue, '0')
    repeat(ITERATIONS, () => {
      ifThen(gt(conversionValue.get(), 0), () => {
        changeVariableBy(conversionSink, 1)
      })
    })
  })
})

const conversionProgram = createProgramModuleFromProject({
  projectJson: conversionProject.toScratch(),
})
const conversionVM = createHeadlessVM({
  program: conversionProgram,
  initialNowMs: 0,
  options: {
    stepTimeoutTicks: 1000000,
    turbo: true,
  },
})

const mixedTypeProjectA = new Project()
const mixedTypeA = mixedTypeProjectA.stage.createVariable('mixed_type_a', 0)

mixedTypeProjectA.stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(mixedTypeA, 0)
    repeat(ITERATIONS, () => {
      ifThen(equals(mixedTypeA.get(), 0), () => {
        setVariableTo(mixedTypeA, 'string-a')
      })
      ifThen(equals(mixedTypeA.get(), 'string-a'), () => {
        setVariableTo(mixedTypeA, 0)
      })
    })
  })
})

const mixedTypeProgramA = createProgramModuleFromProject({
  projectJson: mixedTypeProjectA.toScratch(),
})
const mixedTypeVA = createHeadlessVM({
  program: mixedTypeProgramA,
  initialNowMs: 0,
  options: {
    stepTimeoutTicks: 1000000,
    turbo: true,
  },
})

const mixedTypeProjectB = new Project()
const mixedTypeB = mixedTypeProjectB.stage.createVariable('mixed_type_b', 1)

mixedTypeProjectB.stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(mixedTypeB, 1)
    repeat(ITERATIONS, () => {
      ifThen(equals(mixedTypeB.get(), 1), () => {
        setVariableTo(mixedTypeB, '0')
      })
      ifThen(equals(mixedTypeB.get(), '0'), () => {
        setVariableTo(mixedTypeB, 1)
      })
    })
  })
})

const mixedTypeProgramB = createProgramModuleFromProject({
  projectJson: mixedTypeProjectB.toScratch(),
})
const mixedTypeVB = createHeadlessVM({
  program: mixedTypeProgramB,
  initialNowMs: 0,
  options: {
    stepTimeoutTicks: 1000000,
    turbo: true,
  },
})

const mixedTypeProjectC = new Project()
const mixedTypeC = mixedTypeProjectC.stage.createVariable('mixed_type_c', 1)

mixedTypeProjectC.stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(mixedTypeC, 1)
    repeat(ITERATIONS, () => {
      ifThen(equals(mixedTypeC.get(), 1), () => {
        setVariableTo(mixedTypeC, 'true')
      })
      ifThen(equals(mixedTypeC.get(), 'true'), () => {
        setVariableTo(mixedTypeC, 1)
      })
    })
  })
})

const mixedTypeProgramC = createProgramModuleFromProject({
  projectJson: mixedTypeProjectC.toScratch(),
})
const mixedTypeVC = createHeadlessVM({
  program: mixedTypeProgramC,
  initialNowMs: 0,
  options: {
    stepTimeoutTicks: 1000000,
    turbo: true,
  },
})

bench('data/same-type/number', () => {
  runUntilFinished(sameTypeNumberVM)
})

bench('data/same-type/string', () => {
  runUntilFinished(sameTypeStringVM)
})

bench('data/conversion/true-zero', () => {
  runUntilFinished(conversionVM)
})

bench('data/mixed-type/number-string', () => {
  runUntilFinished(mixedTypeVA)
})

bench('data/mixed-type/number-numeric-string', () => {
  runUntilFinished(mixedTypeVB)
})

bench('data/mixed-type/number-string-true', () => {
  runUntilFinished(mixedTypeVC)
})

if (import.meta.main) {
  await run()
}
