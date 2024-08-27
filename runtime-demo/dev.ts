import { build, stop } from 'esbuild'
import { denoPlugins } from '@luca/esbuild-deno-loader'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  if (url.pathname === '/src/main.ts') {
    const built = await build({
      entryPoints: ['runtime-demo/src/main.ts'],
      write: false,
      bundle: true,
      alias: {
        'scratch-render': 'https://esm.sh/scratch-render'
      },
      format: 'esm'
    })
    await stop()
    return new Response(built.outputFiles[0].text, {
      headers: {
        'Content-Type': 'text/javascript'
      }
    })
  }
  return new Response(`<!doctype HTML><html><head>
  <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
  <meta charset="UTF-8">
  </head><body>
    <script src="/src/main.ts" type="module"></script>
  </body></html>`, {
    headers: {
      'Content-Type': 'text/html'
    }
  })
})
