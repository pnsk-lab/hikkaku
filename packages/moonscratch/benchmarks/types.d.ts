/// <reference types="@turbowarp/types" />

declare module '@scratch/scratch-vm' {
  import type VM from 'scratch-vm'
  export { VM }
  const VMClass: typeof VM
  export default VMClass
}
