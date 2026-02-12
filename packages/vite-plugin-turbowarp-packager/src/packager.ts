/// <reference path="./packager.d.ts" />

export async function loadPackager() {
  const packagerModule = await import('@turbowarp/packager')
  const Packager =
    packagerModule.Packager ??
    packagerModule.packager?.Packager ??
    (packagerModule as { default: { Packager: unknown } }).default?.Packager ??
    (packagerModule as { default: { packager: { Packager: unknown } } }).default
      ?.packager?.Packager
  const loadProject =
    packagerModule.loadProject ??
    packagerModule.packager?.loadProject ??
    (packagerModule as { default: { loadProject: unknown } }).default
      ?.loadProject ??
    (packagerModule as { default: { packager: { loadProject: unknown } } })
      .default?.packager?.loadProject

  if (!Packager || !loadProject) {
    throw new Error(
      `Could not find Packager or loadProject in @turbowarp/packager module. Keys: ${Object.keys(
        packagerModule,
      )}`,
    )
  }

  return { Packager, loadProject }
}
