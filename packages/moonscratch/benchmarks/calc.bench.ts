import { Project } from 'hikkaku'
import {
  add,
  addToList,
  and,
  changeVariableBy,
  divide,
  equals,
  gt,
  ifThen,
  lt,
  mathop,
  mod,
  multiply,
  or,
  repeat,
  repeatUntil,
  setVariableTo,
  subtract,
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

const calcProject = new Project()
const calcAcc = calcProject.stage.createVariable('acc', 0)
const calcAngle = calcProject.stage.createVariable('angle', 0)

calcProject.stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(calcAcc, 0)
    setVariableTo(calcAngle, 0)
    repeat(50000, () => {
      setVariableTo(
        calcAcc,
        add(
          calcAcc.get(),
          multiply(
            mathop('sin', calcAngle.get()),
            mathop('cos', calcAngle.get()),
          ),
        ),
      )
      changeVariableBy(calcAngle, subtract(divide(calcAngle.get(), 2), -1))
    })
  })
})

const calcProjectJson = calcProject.toScratch()
const calcProgram = createProgramModuleFromProject({
  projectJson: calcProjectJson,
})
const calcVM = createHeadlessVM({
  program: calcProgram,
  initialNowMs: 0,
  options: {
    stepTimeoutTicks: 1000000,
    turbo: true,
  },
})

bench('calc', () => {
  runUntilFinished(calcVM)
})

const primesProject = new Project()
const primesList = primesProject.stage.createList('primes', [])
const primesCandidate = primesProject.stage.createVariable('candidate', 2)
const primesDivisor = primesProject.stage.createVariable('divisor', 0)
const primesIsPrime = primesProject.stage.createVariable('is prime', 0)
const primesCount = primesProject.stage.createVariable('prime count', 0)

primesProject.stage.run(() => {
  whenFlagClicked(() => {
    setVariableTo(primesCount, 0)
    setVariableTo(primesCandidate, 2)
    setVariableTo(primesDivisor, 2)
    setVariableTo(primesIsPrime, 0)
    repeatUntil(equals(primesCount.get(), 100), () => {
      setVariableTo(primesIsPrime, 1)
      setVariableTo(primesDivisor, 2)
      repeatUntil(
        or(
          gt(primesDivisor.get(), mathop('sqrt', primesCandidate.get())),
          equals(primesIsPrime.get(), 0),
        ),
        () => {
          ifThen(
            and(
              equals(mod(primesCandidate.get(), primesDivisor.get()), 0),
              lt(primesDivisor.get(), primesCandidate.get()),
            ),
            () => {
              setVariableTo(primesIsPrime, 0)
            },
          )
          changeVariableBy(primesDivisor, 1)
        },
      )
      ifThen(equals(primesIsPrime.get(), 1), () => {
        addToList(primesList, primesCandidate.get())
        changeVariableBy(primesCount, 1)
      })
      changeVariableBy(primesCandidate, 1)
    })
  })
})

const primesProjectJson = primesProject.toScratch()
const primesProgram = createProgramModuleFromProject({
  projectJson: primesProjectJson,
})
const primesVM = createHeadlessVM({
  program: primesProgram,
  initialNowMs: 0,
  options: {
    stepTimeoutTicks: 1000000,
    turbo: true,
  },
})

bench('calc-primes', () => {
  runUntilFinished(primesVM)
})

if (import.meta.main) {
  await run()
}
