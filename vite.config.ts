import { defineConfig } from 'vite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'web',
  build: { outDir: '../dist', emptyOutDir: true },
  plugins: [{
    name: 'local-preview-names',
    configureServer(server) {
      if (process.env.VITE_DEMO !== '1') return;
      server.middlewares.use('/local-preview/names', async (_request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        try {
          const names = JSON.parse(await readFile(resolve(process.cwd(), '.local/preview-names.json'), 'utf8'));
          if (!Array.isArray(names) || names.length !== 5 || !names.every(name => typeof name === 'string' && name.length <= 80)) throw new Error('Invalid preview names');
          response.end(JSON.stringify(names));
        } catch {
          response.statusCode = 404;
          response.end('[]');
        }
      });
    }
  }]
});
