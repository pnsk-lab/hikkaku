import { fromPrimitiveSource } from '../compiler/block-helper'
import { valueBlock } from '../compiler/composer'
import type { PrimitiveSource } from '../compiler/types'

export const add = (a: PrimitiveSource<number>, b: PrimitiveSource<number>) => {
  return valueBlock('operator_add', {
    inputs: {
      NUM1: fromPrimitiveSource(a),
      NUM2: fromPrimitiveSource(b),
    },
  })
}

export const subtract = (
  a: PrimitiveSource<number>,
  b: PrimitiveSource<number>,
) => {
  return valueBlock('operator_subtract', {
    inputs: {
      NUM1: fromPrimitiveSource(a),
      NUM2: fromPrimitiveSource(b),
    },
  })
}

export const multiply = (
  a: PrimitiveSource<number>,
  b: PrimitiveSource<number>,
) => {
  return valueBlock('operator_multiply', {
    inputs: {
      NUM1: fromPrimitiveSource(a),
      NUM2: fromPrimitiveSource(b),
    },
  })
}

export const divide = (
  a: PrimitiveSource<number>,
  b: PrimitiveSource<number>,
) => {
  return valueBlock('operator_divide', {
    inputs: {
      NUM1: fromPrimitiveSource(a),
      NUM2: fromPrimitiveSource(b),
    },
  })
}

export const lt = (
  a: PrimitiveSource<number | string>,
  b: PrimitiveSource<number | string>,
) => {
  return valueBlock('operator_lt', {
    inputs: {
      OPERAND1: fromPrimitiveSource(a),
      OPERAND2: fromPrimitiveSource(b),
    },
  })
}

export const equals = (
  a: PrimitiveSource<number | string>,
  b: PrimitiveSource<number | string>,
) => {
  return valueBlock('operator_equals', {
    inputs: {
      OPERAND1: fromPrimitiveSource(a),
      OPERAND2: fromPrimitiveSource(b),
    },
  })
}

export const gt = (
  a: PrimitiveSource<number | string>,
  b: PrimitiveSource<number | string>,
) => {
  return valueBlock('operator_gt', {
    inputs: {
      OPERAND1: fromPrimitiveSource(a),
      OPERAND2: fromPrimitiveSource(b),
    },
  })
}

export const and = (
  a: PrimitiveSource<boolean>,
  b: PrimitiveSource<boolean>,
) => {
  return valueBlock('operator_and', {
    inputs: {
      OPERAND1: fromPrimitiveSource(a),
      OPERAND2: fromPrimitiveSource(b),
    },
  })
}

export const or = (
  a: PrimitiveSource<boolean>,
  b: PrimitiveSource<boolean>,
) => {
  return valueBlock('operator_or', {
    inputs: {
      OPERAND1: fromPrimitiveSource(a),
      OPERAND2: fromPrimitiveSource(b),
    },
  })
}

export const not = (operand: PrimitiveSource<boolean>) => {
  return valueBlock('operator_not', {
    inputs: {
      OPERAND: fromPrimitiveSource(operand),
    },
  })
}

export const random = (
  from: PrimitiveSource<number>,
  to: PrimitiveSource<number>,
) => {
  return valueBlock('operator_random', {
    inputs: {
      FROM: fromPrimitiveSource(from),
      TO: fromPrimitiveSource(to),
    },
  })
}

export const join = (
  a: PrimitiveSource<string>,
  b: PrimitiveSource<string>,
) => {
  return valueBlock('operator_join', {
    inputs: {
      STRING1: fromPrimitiveSource(a),
      STRING2: fromPrimitiveSource(b),
    },
  })
}

export const letterOf = (
  letter: PrimitiveSource<number>,
  text: PrimitiveSource<string>,
) => {
  return valueBlock('operator_letter_of', {
    inputs: {
      LETTER: fromPrimitiveSource(letter),
      STRING: fromPrimitiveSource(text),
    },
  })
}

export const length = (text: PrimitiveSource<string>) => {
  return valueBlock('operator_length', {
    inputs: {
      STRING: fromPrimitiveSource(text),
    },
  })
}

export const contains = (
  text: PrimitiveSource<string>,
  substring: PrimitiveSource<string>,
) => {
  return valueBlock('operator_contains', {
    inputs: {
      STRING1: fromPrimitiveSource(text),
      STRING2: fromPrimitiveSource(substring),
    },
  })
}

export const mod = (a: PrimitiveSource<number>, b: PrimitiveSource<number>) => {
  return valueBlock('operator_mod', {
    inputs: {
      NUM1: fromPrimitiveSource(a),
      NUM2: fromPrimitiveSource(b),
    },
  })
}

export const round = (value: PrimitiveSource<number>) => {
  return valueBlock('operator_round', {
    inputs: {
      NUM: fromPrimitiveSource(value),
    },
  })
}

export type MathOpOperator =
  | 'abs'
  | 'floor'
  | 'ceiling'
  | 'sqrt'
  | 'sin'
  | 'cos'
  | 'tan'
  | 'asin'
  | 'acos'
  | 'atan'
  | 'ln'
  | 'log'
  | 'e ^'
  | '10 ^'

export const mathop = (
  operator: MathOpOperator,
  value: PrimitiveSource<number>,
) => {
  return valueBlock('operator_mathop', {
    inputs: {
      NUM: fromPrimitiveSource(value),
    },
    fields: {
      OPERATOR: [operator, null],
    },
  })
}
