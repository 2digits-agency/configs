// GPUIX's published WASM renderer needs shared memory and same-origin assets.
import path from 'node:path';

import * as Bun from 'bun';

const root = import.meta.dir;

const out = path.resolve(root, 'web-dist');

const bundle = await Bun.build({
  entrypoints: [path.resolve(root, 'src/browser.tsx')],
  outdir: out,
  target: 'browser',
  format: 'esm',
  naming: 'app.js',
});

if (!bundle.success) {
  throw new AggregateError(bundle.logs, 'GPUIX browser build failed');
}

console.log('GPUIX browser build: JS + published Rust WASM. No native rebuild needed.');

if (!process.argv.includes('--build')) {
  const headers = {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cache-Control': 'no-store',
    'X-Amp-Review-Widget': 'off', // Canvas has no DOM blocks for element comments.
  };

  const server = Bun.serve({
    port: Number(process.env.PORT ?? 4175),
    hostname: '0.0.0.0',
    async fetch(request) {
      const pathname = decodeURIComponent(new URL(request.url).pathname);

      const filePath = pathname === '/' ? path.resolve(root, 'index.html') : path.resolve(out, `.${pathname}`);

      if (pathname !== '/' && !filePath.startsWith(`${out}${path.sep}`)) {
        return new Response('Not found', { status: 404, headers });
      }

      const file = Bun.file(filePath);

      if (!(await file.exists())) {
        return new Response('Not found', { status: 404, headers });
      }

      const type = pathname.endsWith('.wasm')
        ? 'application/wasm'
        : pathname.endsWith('.js')
          ? 'text/javascript'
          : 'text/html';

      return new Response(file, { headers: { ...headers, 'Content-Type': type } });
    },
  });

  console.log(`GPUIX demo ready on port ${server.port}`);
}
