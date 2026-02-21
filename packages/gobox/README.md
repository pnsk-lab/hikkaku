# @hikkaku/gobox

Experimental high-level data structures for Scratch via hikkaku. This package is not intended for production use and may contain breaking changes without deprecation. Maybe it will be included in hikkaku core in future if it proves to be useful and stable.

## Installation

```bash
bun add @hikkaku/gobox
```

## Usage

### Scoped values

Basic usage:
```ts
import { defineStruct, Num } from '@hikkaku/gobox/types'

sprite.run(() => {
  const c = Num.makeScopedValue(10)
  c.set(10) // set value
  c.get() // get value 
})
```

Memory management is automatic. The value will be released when the scope ends like Rust, and it doesn't have GC.
Example:
```ts
sprite.run(() => {
  whenFlagClicked(() => {
    forever(() => {
      const c = Num.makeScopedValue(10) // this value will be automatically released at the end of this scope
    })
  })
})
```

### Built-in types

- `Num`: A number value. It can be used for both integer and floating-point numbers.
- `Str`: A string value.
- `Bool`: A boolean value.
- `Vector`: A fixed-length array

```ts
import { Num, Str, Bool, Vector } from '@hikkaku/gobox/types'

Num.configure({
  // Num doesn't have a property to configure
}).makeScopedValue(defaultValue)
Str.configure({
  // Str doesn't have a property to configure
}).makeScopedValue(defaultValue)
Bool.configure({
  // Bool doesn't have a property to configure
}).makeScopedValue(defaultValue)
Vector.configure(Num, 3).makeScopedValue([0, 0, 0]) // Vector of 3 numbers with default value [0, 0, 0]
```

### Functions

```ts
import { defineFunction } from '@hikkaku/gobox/functions'
import { multiply } from 'hikkaku/blocks'

const double = defineFunction({
  name: 'double',
  args: { x: Num },
  returns: Num,
  body: ({ args, returning }) => {
    const result = multiply(args.x.get(), 2)
    return returning(result)
  },
})
```

And you can use it like this:
```ts
sprite.run(() => {
  const result = double({ x: 10 }).get() // make a block returns a value and get it
  say(result) // say the result
})
```

### Struct

You can define your own struct type like this:
```ts
import { defineStruct } from '@hikkaku/gobox/types'

const Counter = defineStruct({
  count: Num
})
```

And you can use it like this:
```ts
sprite.run(() => {
  const counter = Counter.makeScopedValue({ count: 0 })
  counter.count.set(10) // set count property
  counter.count.get() // get count property
})
```

#### Impl

You can define an impl for a struct to add methods to it. It is similar to Rust's impl.
```ts
import { defineImpl } from '@hikkaku/gobox/functions'

const CounterImpl = defineImpl(Counter, {
  increment: {
    args: {},
    returns: Num,
    body: ({ args, returning, self }) => {
        const count = self.count.get()
        const newCount = count + 1
        self.count.set(newCount)
        return returning(newCount)
    },
  }
})
```

And you can use it like this:
```ts
sprite.run(() => {
  const counter = CounterImpl.makeScopedValue({ count: 0 })
  say(counter.increment().get()) // say the incremented count
})
```

### Signals

Signals are dependency proxies over scoped primitive values. Effects are re-run only when you call `signal.set(...)` explicitly.

```ts
import { useSignal, useEffect } from '@hikkaku/gobox/value'

sprite.run(() => {
  const count = useSignal(Num.makeScopedValue(0))

  whenFlagClicked(() => {
    forever(() => {
      count.set(count.get() + 1) // update the signal value
      wait(2)
    })
  })
  
  useEffect(() => {
    // This effect will run whenever count changes
    sayForSecs(count.get(), 1)
  })
})
```

## Application examples

### 2D vector

```ts
import { Vector } from '@hikkaku/gobox/types'

const myVector3x3 = Vector.configure(Vector.configure(Num, 3), 3).makeScopedValue([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
])
```
