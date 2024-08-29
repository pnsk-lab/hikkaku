import project from '../../runtime-demo/main.ts'
import type { Project } from '../project.ts'
import { Hono } from '@hono/hono'
import { prettyJSON } from '@hono/hono/pretty-json'
import { build, stop } from 'esbuild'

interface DevInit {
  project: Project
}

export const startDev = async (init: DevInit) => {
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
      <div class="grid place-items-center w-full h-dvh p-3">
        <canvas id="canvas" class="border rounded-md max-w-72"></canvas>
      </div>
      <script src="/client.js" type="module"></script>
    </body>
  </html>` satisfies string))

  app.get('/ast.json', c => {
    const ast = project.exportAsAST()
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
    c.header('Content-Type', 'text/javascript')
    return c.body(built.outputFiles[0].text)
  })

  Deno.serve(app.fetch)
}
