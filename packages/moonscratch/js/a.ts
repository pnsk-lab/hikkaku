import { createHeadlessVM } from '.'

const vm = createHeadlessVM({
  projectJson: await Bun.file(
    new URL('../../../examples/3d-cube/dist/project.json', import.meta.url),
  ).json(),
})

vm.greenFlag()
for (let i = 0; i < 200; i += 1) {
  vm.stepFrame()
}
await Bun.write('a.svg', vm.renderSvg())
