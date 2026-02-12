declare module '@turbowarp/packager' {
  export interface PackagerOptions {
    turbo: boolean
    interpolation: boolean
    framerate: number
    highQualityPen: boolean
    maxClones: number
    fencing: boolean
    miscLimits: boolean
    stageWidth: number
    stageHeight: number
    resizeMode: 'preserve-ratio' | 'stretch' | 'none'
    autoplay: boolean
    username: string
    closeWhenStopped: boolean
    projectId: string
    custom: {
      css: string
      js: string
    }
    appearance: {
      background: string
      foreground: string
      accent: string
    }
    loadingScreen: {
      progressBar: boolean
      text: string
      imageMode: 'normal' | 'stretch'
      image: unknown | null
    }
    controls: {
      greenFlag: {
        enabled: boolean
      }
      stopAll: {
        enabled: boolean
      }
      fullscreen: {
        enabled: boolean
      }
      pause: {
        enabled: boolean
      }
    }
    monitors: {
      editableLists: boolean
      variableColor: string
      listColor: string
    }
    compiler: {
      enabled: boolean
      warpTimer: boolean
    }
    packagedRuntime: boolean
    target:
      | 'html'
      | 'zip'
      | 'zip-one-asset'
      | 'nwjs-win32'
      | 'nwjs-win64'
      | 'nwjs-mac'
      | 'nwjs-linux-x64'
      | 'electron-win32'
      | 'electron-win64'
      | 'electron-win-arm'
      | 'electron-mac'
      | 'electron-linux64'
      | 'electron-linux-arm32'
      | 'electron-linux-arm64'
      | 'webview-mac'
    app: {
      icon: unknown | null
      packageName: string
      windowTitle: string
      windowMode: 'window' | 'maximize' | 'fullscreen'
      version: string
      escapeBehavior:
        | 'unfullscreen-only'
        | 'unfullscreen-or-exit'
        | 'exit-only'
        | 'none'
      windowControls: 'default' | 'frameless'
      backgroundThrottling: boolean
    }
    chunks: {
      gamepad: boolean
      pointerlock: boolean
    }
    cloudVariables: {
      mode: 'ws' | 'local' | 'custom'
      cloudHost: string | string[]
      custom: Record<string, 'ws' | 'local'>
      specialCloudBehaviors: boolean
      unsafeCloudBehaviors: boolean
    }
    cursor: {
      type: 'auto' | 'none' | 'custom'
      custom: unknown | null
      center: {
        x: number
        y: number
      }
    }
    steamworks: {
      appId: string
      onError: 'ignore' | 'warning' | 'error'
    }
    extensions: string[]
    bakeExtensions: boolean
    maxTextureDimension: number
  }

  export class Packager {
    constructor()
    options: PackagerOptions
    project: unknown
    loadProject(data: ArrayBuffer | Uint8Array | ArrayBufferLike): Promise<void>
    package(): Promise<{ data: Uint8Array | string; type: string }>
  }

  export function loadProject(
    data: ArrayBuffer | Uint8Array | ArrayBufferLike,
  ): Promise<unknown>

  export const packager: {
    Packager: typeof Packager
    loadProject: typeof loadProject
  }
}
