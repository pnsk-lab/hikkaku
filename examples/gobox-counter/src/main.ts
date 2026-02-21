import { defineImpl } from '@hikkaku/gobox/functions'
import { defineStruct, Num } from '@hikkaku/gobox/types'
import { useEffect, useSignal } from '@hikkaku/gobox/value'
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
  count: Num,
  doubled: Num,
})

const CounterImpl = defineImpl(Counter, {
  double: {
    args: {
      value: Num,
    },
    returns: Num,
    body: ({ args, returning }) => {
      return returning(add(args.value.get(), args.value.get()))
    },
  },
})

cat.run(() => {
  const count = useSignal(Num.makeScopedValue(0))
  const state = CounterImpl.makeScopedValue()

  useEffect(() => {
    state.count.set(count.get())

    const doubled = state.methods.double.call({
      value: state.count. (),
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
