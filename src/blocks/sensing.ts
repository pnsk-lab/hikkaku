import { block } from "../compiler/composer"

export const getMouseX = () => {
  return block('sensing_mousex', {})
}
export const getMouseY = () => {
  return block('sensing_mousey', {})
}
