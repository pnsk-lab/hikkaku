import { Hono } from '@hono/hono'
import { prettyJSON } from '@hono/hono/pretty-json'
import { build, stop } from 'esbuild'
import type { Config } from '../config/mod.ts'
import { compile } from '../compiler/mod.ts'

export const startDev = (config: Config) => {
  const app = new Hono()

  app.use(prettyJSON())

  app.get('/', c => c.html(`<!doctype HTML><html>
    <head>
      <meta charset="UTF_8" />
      <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
      <script>eruda.init();</script>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
      <div class="flex h-dvh flex-col justify-between items-center">
        <div class="w-full flex justify-between text-xl">
          <div class="grid grid-cols-3 place-items-start gap-1">
            <button class="w-8 h-8 hover:bg-blue-100" id="flag">🚩</button>
            <button class="w-8 h-8 hover:bg-blue-100" id="stop">🛑</button>
          </div>
          <div class="grid grid-cols-3 place-items-end gap-1">
            <a title="Compile to sb3" href="/sb3" download="compiled.sb3">⬇️</a>
          </div>
        </div>
        <div class="grow">
          <canvas id="canvas" class="border rounded-md max-h-80"></canvas>
        </div>
      </div>
      <script src="/client.js" type="module"></script>
    </body>
  </html>` satisfies string))

  app.get('/ast.json', c => {
    const ast = config.project.exportAsAST()
    return c.json(ast)
  })

  app.get('/client.js', async c => {
    const built = await build({
      entryPoints: [import.meta.resolve('./client.ts').replace(/^file:\/\//, '')],
      alias: {
        'scratch-render': 'https://esm.sh/scratch-render'
      },
      write: false,
      format: 'esm',
      bundle: true,
      sourcemap: 'inline'
    })
    await stop()
    c.header('Content-Type', 'text/javascript')
    return c.body(built.outputFiles[0].text)
  })

  app.get('/sb3', async c => {
    const sb3 = await compile(config)
    c.header('Content-Type', 'application/x.scratch.sb3')
    return c.body(sb3)
  })

  Deno.serve(app.fetch)
}
