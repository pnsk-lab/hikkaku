import { type GoboxFunctionDefinition, useImpl } from '@hikkaku/gobox/functions'
import {
  type GoboxNumberType,
  number,
  struct,
  trait,
} from '@hikkaku/gobox/types'
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

const counterLayout = struct({
  count: number(0),
  doubled: number(0),
})

const counterTrait = trait<{
  double: GoboxFunctionDefinition<{ value: GoboxNumberType }, GoboxNumberType>
}>(['double'])

cat.run(() => {
  const count = useSignal(number(0))
  const counter = useImpl(counterLayout, counterTrait, {
    double: {
      args: {
        value: number(0),
      },
      returns: number(0),
      body: ({ args, returnValue }) => {
        returnValue.set(add(args.value.get(), args.value.get()))
      },
    },
  })
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
