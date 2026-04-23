import type { Config } from '@react-router/dev/config';
import { glob } from 'node:fs/promises';
import { createGetUrl, getSlugs } from 'fumadocs-core/source';

const docsUrl = createGetUrl('/docs');
const basename = process.env.WEBSITE_BASENAME ?? '/';

export default {
  basename,
  future: {
    v8_middleware: true,
  },
  routeDiscovery: {
    mode: 'initial',
  },
  ssr: false,
  async prerender({ getStaticPaths }) {
    const paths = new Set<string>();

    for (const path of getStaticPaths()) {
      paths.add(path);
    }

    for await (const entry of glob('**/*.mdx', { cwd: 'content/docs' })) {
      paths.add(docsUrl(getSlugs(entry)));
    }

    return [...paths];
  },
} satisfies Config;
