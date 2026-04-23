import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const clientDir = join(process.cwd(), 'build', 'client');
const primaryIndex = join(clientDir, 'index.html');
const spaFallback = join(clientDir, '__spa-fallback.html');
const fallbackSource = existsSync(primaryIndex) ? primaryIndex : spaFallback;

if (!existsSync(clientDir)) {
  throw new Error(`missing build output at ${clientDir}`);
}

if (!existsSync(fallbackSource)) {
  throw new Error('expected either build/client/index.html or build/client/__spa-fallback.html');
}

copyFileSync(fallbackSource, join(clientDir, '404.html'));
writeFileSync(join(clientDir, '.nojekyll'), '');
