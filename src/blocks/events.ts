import { block } from "../compiler/composer"

export const whenFlagClicked = (stack?: () => void) => {
  const res = block('event_whenflagclicked', {
    topLevel: true
  })
  stack?.()
  return res
}
