import { resolve } from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import mdx from 'fumadocs-mdx/vite';
import * as MdxConfig from './source.config';
import { resolveLlmsRequest } from './scripts/generate-llms-files.mjs';

const basename = process.env.WEBSITE_BASENAME ?? '/';
const assetBase = basename.endsWith('/') ? basename : `${basename}/`;
const projectRoot = resolve(process.cwd(), '..');

function llmsDevPlugin() {
  return {
    name: 'eeap-llms-dev',
    configureServer(server: {
      middlewares: {
        use: (
          handler: (
            req: { method?: string; url?: string },
            res: {
              statusCode: number;
              setHeader: (name: string, value: string) => void;
              end: (body: string) => void;
            },
            next: () => void,
          ) => void,
        ) => void;
      };
    }) {
      server.middlewares.use((req, res, next) => {
        if (req.method && !['GET', 'HEAD'].includes(req.method)) {
          next();
          return;
        }

        const resolved = resolveLlmsRequest({
          projectRoot,
          requestPath: req.url ?? '/',
          basePath: basename,
        });

        if (!resolved) {
          next();
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', resolved.contentType);
        res.end(req.method === 'HEAD' ? '' : resolved.body);
      });
    },
  };
}

function browserShimPlugin() {
  const pathShim = resolve(process.cwd(), 'app/lib/shims/path.ts');
  const fsPromisesShim = resolve(process.cwd(), 'app/lib/shims/fs-promises.ts');

  return {
    name: 'eeap-browser-shims',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id === 'path' || id === 'node:path') return pathShim;
      if (id === 'fs/promises' || id === 'node:fs/promises') return fsPromisesShim;
      return null;
    },
  };
}

export default defineConfig({
  base: assetBase,
  plugins: [browserShimPlugin(), llmsDevPlugin(), mdx(MdxConfig), tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      path: resolve(process.cwd(), 'app/lib/shims/path.ts'),
      'node:path': resolve(process.cwd(), 'app/lib/shims/path.ts'),
      'fs/promises': resolve(process.cwd(), 'app/lib/shims/fs-promises.ts'),
      'node:fs/promises': resolve(process.cwd(), 'app/lib/shims/fs-promises.ts'),
    },
    tsconfigPaths: true,
  },
});
