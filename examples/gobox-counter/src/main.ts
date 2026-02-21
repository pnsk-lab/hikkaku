import { defineImpl } from '@hikkaku/gobox/functions'
import { defineStruct, Num } from '@hikkaku/gobox/types'
import { useEffect, useScopedValue, useSignal } from '@hikkaku/gobox/value'
import { Project } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
import {
  add,
  setVariableTo,
  show,
  whenFlagClicked,
  whenThisSpriteClicked,
} from 'hikkaku/blocks'

const project = new Project()

const countMonitor = project.stage.createVariable('count', 0, {
  monitor: {
    mode: 'large',
    visible: true,
    x: 20,
    y: 20,
  },
})

const doubledMonitor = project.stage.createVariable('doubled', 0, {
  monitor: {
    mode: 'large',
    visible: true,
    x: 20,
    y: 70,
  },
})

const cat = project.createSprite('gobox-cat', {
  x: 0,
  y: 0,
})
cat.addCostume({
  ...IMAGES.CAT_A,
  name: 'cat-a',
})

const Counter = defineStruct({
  count: new Num(0),
  doubled: new Num(0),
})

const CounterImpl = defineImpl(Counter, {
  double: {
    args: {
      value: Num,
    },
    returns: Num,
    body: ({
      args,
      returning,
    }: {
      args: { value: { get(): number } }
      returning: (value: number) => { scopeId: number; value: number }
    }) => {
      return returning(add(args.value.get(), args.value.get()) as never)
    },
  },
})

cat.run(() => {
  const count = useSignal(new Num(0))
  const counter = new CounterImpl()
  const state = useScopedValue(counter)

  useEffect(() => {
    state.count.set(count.get())

    const doubled = counter.methods.double.call({
      value: state.count.get(),
    })
    state.doubled.set(doubled.get())

    setVariableTo(countMonitor, state.count.get())
    setVariableTo(doubledMonitor, state.doubled.get())
  })

  whenThisSpriteClicked(() => {
    count.set(add(count.get(), 1))
  })

  whenFlagClicked(() => {
    show()
    count.set(1)
  })
})

export default project
