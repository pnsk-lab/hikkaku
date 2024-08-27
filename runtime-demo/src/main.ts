// @deno-types="@turbowarp/types"
import Render from 'scratch-render'

const canvas = document.createElement('canvas')
document.body.append(canvas)
const debug = document.createElement('canvas')
document.body.append(debug)

const renderer = new Render(canvas)
renderer.setDebugCanvas(debug)

renderer.resize(480, 360)

const catSVG = await fetch('https://cdn.assets.scratch.mit.edu/internalapi/asset/b7853f557e4426412e64bb3da6531a99.svg/get/').then(res => res.text())
/*const catImage = await new Promise<HTMLImageElement>(resolve => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.src = URL.createObjectURL(catBlob)
})*/

renderer.setLayerGroupOrdering(['my-sprite'])

const skinID = renderer.createSVGSkin(catSVG)
const drawableID = renderer.createDrawable('my-sprite')
renderer.updateDrawableSkinId(drawableID, skinID)
renderer.updateDrawablePosition(drawableID, [0, 0])

function drawStep() {
  renderer.draw()
  renderer.updateDrawablePosition(drawableID, [Math.random() * 100, 2])
  requestAnimationFrame(drawStep)
}
drawStep()
