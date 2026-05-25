import { Project, type CostumeData } from 'hikkaku'
import {
  nextBackdrop,
  switchBackdropTo,
  whenFlagClicked,
  whenKeyPressed,
} from 'hikkaku/blocks'

const project = new Project()

const slideModules = import.meta.glob('../../../../slide/assets/mock/*.png', {
  eager: true,
  import: 'default',
  query: '?scratch',
}) as Record<string, CostumeData>

const slides = Object.entries(slideModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, image]) =>
    project.stage.addCostume({
      ...image,
      name: path.match(/([^/]+)\.png$/)?.[1] ?? image.name,
    }),
  )

project.stage.run(() => {
  whenFlagClicked(() => {
    switchBackdropTo(slides[0]?.name ?? '1')
  })

  whenKeyPressed('right arrow', () => {
    nextBackdrop()
  })
})

export default project
