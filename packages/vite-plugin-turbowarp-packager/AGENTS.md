Inherit repository-wide rules from the root `AGENTS.md`.

Package scope: `packages/vite-plugin-turbowarp-packager/**`

- Plugin source is in `src/index.ts` and packaging implementation is in `src/packager.ts`.
- HTML output filename is configurable via `outputFileName` and defaults to `turbowarp-packager.html`.
- Run `bun run build` in this package after changing plugin behavior or output artifacts.
- Keep `src/packager.d.ts` and `README.md` aligned with runtime option changes.
- If build output path or plugin contract changes, update this file and docs in the same change.
