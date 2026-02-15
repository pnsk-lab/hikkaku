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
import { bench, describe } from 'vite-plus/test'
import { createHeadlessVM, createPrecompiledProject } from '../js/vm/factory.ts'

await import('scratch-storage')

const benchOptions = {
  time: 3000,
  warmupTime: 1000,
}

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

describe('calc', () => {
  const project = new Project()
  const acc = project.stage.createVariable('acc', 0)
  const angle = project.stage.createVariable('angle', 0)

  project.stage.run(() => {
    whenFlagClicked(() => {
      setVariableTo(acc, 0)
      setVariableTo(angle, 0)
      repeat(50000, () => {
        setVariableTo(
          acc,
          add(
            acc.get(),
            multiply(mathop('sin', angle.get()), mathop('cos', angle.get())),
          ),
        )
        changeVariableBy(angle, subtract(divide(angle.get(), 2), -1))
      })
    })
  })

  const projectJson = project.toScratch()
  const precompiled = createPrecompiledProject({ projectJson })
  const vm = createHeadlessVM({
    precompiled,
    initialNowMs: 0,
    options: {
      stepTimeoutTicks: 1000000,
      turbo: true,
    },
  })

  bench(
    'moonscratch',
    () => {
      runUntilFinished(vm)
    },
    benchOptions,
  )
})

describe('calc primes', () => {
  const project = new Project()
  const primes = project.stage.createList('primes', [])
  const candidate = project.stage.createVariable('candidate', 2)
  const divisor = project.stage.createVariable('divisor', 0)
  const isPrime = project.stage.createVariable('is prime', 0)
  const primeCount = project.stage.createVariable('prime count', 0)

  project.stage.run(() => {
    whenFlagClicked(() => {
      setVariableTo(primeCount, 0)
      setVariableTo(candidate, 2)
      setVariableTo(divisor, 2)
      setVariableTo(isPrime, 0)
      repeatUntil(equals(primeCount.get(), 100), () => {
        setVariableTo(isPrime, 1)
        setVariableTo(divisor, 2)
        repeatUntil(
          or(
            gt(divisor.get(), mathop('sqrt', candidate.get())),
            equals(isPrime.get(), 0),
          ),
          () => {
            ifThen(
              and(
                equals(mod(candidate.get(), divisor.get()), 0),
                lt(divisor.get(), candidate.get()),
              ),
              () => {
                setVariableTo(isPrime, 0)
              },
            )
            changeVariableBy(divisor, 1)
          },
        )
        ifThen(equals(isPrime.get(), 1), () => {
          addToList(primes, candidate.get())
          changeVariableBy(primeCount, 1)
        })
        changeVariableBy(candidate, 1)
      })
    })
  })

  const projectJson = project.toScratch()
  const precompiled = createPrecompiledProject({ projectJson })
  const vm = createHeadlessVM({
    precompiled,
    initialNowMs: 0,
    options: {
      stepTimeoutTicks: 1000000,
      turbo: true,
    },
  })

  bench(
    'moonscratch',
    () => {
      runUntilFinished(vm)
    },
    benchOptions,
  )
})
