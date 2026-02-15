/// <reference types="@turbowarp/types" />

declare module '@scratch/scratch-vm' {
  import type VM from 'scratch-vm'
  export { VM }
  const VMClass: typeof VM
  export default VMClass
}

declare module '@scratch/scratch-render' {
  import type Render from 'scratch-render'
  export { Render }
  const RenderClass: typeof Render
  export default RenderClass
}
