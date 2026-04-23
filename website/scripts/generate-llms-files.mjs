import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function normalizeBasePath(basePath = '/') {
  if (!basePath || basePath === '/') {
    return '';
  }

  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

function withBase(basePrefix, route) {
  return basePrefix ? `${basePrefix}${route}` : route;
}

function toCompanionRoute(route) {
  if (route === '/') {
    return '/index.html.md';
  }

  return `${route}/index.html.md`;
}

function toOutputRelativePath(route) {
  return toCompanionRoute(route).replace(/^\//, '');
}

function stripSearchAndHash(pathname) {
  return pathname.split('?')[0].split('#')[0];
}

function stripBasePrefix(pathname, basePrefix) {
  if (!basePrefix) {
    return pathname;
  }

  if (pathname === basePrefix) {
    return '/';
  }

  if (pathname.startsWith(`${basePrefix}/`)) {
    return pathname.slice(basePrefix.length);
  }

  return pathname;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    return { data: {}, body: raw };
  }

  const data = {};

  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');

    data[key] = value;
  }

  return {
    data,
    body: raw.slice(match[0].length),
  };
}

function stripMdxOnlyLines(body) {
  return body
    .split('\n')
    .filter((line) => !line.trim().match(/^<[A-Z][A-Za-z0-9]*[^>]*\/>$/))
    .join('\n');
}

function rewriteDocLinks(markdown, basePrefix) {
  return markdown.replace(/\]\((\/docs(?:\/[^)#?\s]*)?)(#[^)]+)?\)/g, (_, route, hash = '') => {
    return `](${withBase(basePrefix, toCompanionRoute(route))}${hash})`;
  });
}

function tidyMarkdown(markdown) {
  return `${markdown.replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

function readDocPages(projectRoot) {
  const docsDir = join(projectRoot, 'website', 'content', 'docs');
  const meta = JSON.parse(readFileSync(join(docsDir, 'meta.json'), 'utf8'));

  return meta.pages.map((slug) => {
    const sourceFile = join(docsDir, `${slug}.mdx`);
    const raw = readFileSync(sourceFile, 'utf8');
    const { data, body } = parseFrontmatter(raw);

    return {
      slug,
      title: data.title,
      description: data.description,
      route: slug === 'index' ? '/docs' : `/docs/${slug}`,
      body,
    };
  });
}

function buildCompanionMarkdown(page, basePrefix) {
  const cleanedBody = tidyMarkdown(
    rewriteDocLinks(stripMdxOnlyLines(page.body), basePrefix),
  );

  return tidyMarkdown(`# ${page.title}\n\n> ${page.description}\n\n${cleanedBody}`);
}

function buildLlmsTxt(pages, basePrefix) {
  const overview = pages.find((page) => page.slug === 'index');

  if (!overview) {
    throw new Error('missing docs index page for llms.txt generation');
  }

  const docsLinks = [
    {
      label: 'Overview',
      route: overview.route,
      note: overview.description,
    },
    ...pages
      .filter((page) => page.slug !== 'index')
      .map((page) => ({
        label: page.title,
        route: page.route,
        note: page.description,
      })),
  ];

  const docsList = docsLinks
    .map(
      ({ label, route, note }) =>
        `- [${label}](${withBase(basePrefix, toCompanionRoute(route))}): ${note}`,
    )
    .join('\n');

  const optionalList = [
    `- [Interactive docs](${withBase(basePrefix, '/docs')}): Rendered HTML docs with diagrams and navigation.`,
    `- [Site home](${withBase(basePrefix, '/')}): Same overview through the public site entrypoint.`,
  ].join('\n');

  return tidyMarkdown(`
# ${overview.title}

> ${overview.description}

EEAP is the External Execution Adapter Protocol. It defines how an agent runtime expresses intent to an external executor, receives lifecycle facts over time, collects evidence for completion claims, and leaves settlement to a later layer.

## Docs

${docsList}

## Optional

${optionalList}
`);
}

function writeOutputFile(targetFile, content) {
  mkdirSync(dirname(targetFile), { recursive: true });
  writeFileSync(targetFile, content);
}

export function resolveLlmsRequest({
  projectRoot,
  requestPath,
  basePath = '/',
}) {
  const basePrefix = normalizeBasePath(basePath);
  const pathname = stripBasePrefix(stripSearchAndHash(requestPath), basePrefix) || '/';
  const pages = readDocPages(projectRoot);

  if (pathname === '/llms.txt') {
    return {
      contentType: 'text/plain; charset=utf-8',
      body: buildLlmsTxt(pages, basePrefix),
    };
  }

  if (pathname === '/index.html.md') {
    const home = pages.find((page) => page.slug === 'index');
    if (!home) {
      return null;
    }

    return {
      contentType: 'text/markdown; charset=utf-8',
      body: buildCompanionMarkdown(home, basePrefix),
    };
  }

  const matchedPage = pages.find((page) => pathname === toCompanionRoute(page.route));
  if (!matchedPage) {
    return null;
  }

  return {
    contentType: 'text/markdown; charset=utf-8',
    body: buildCompanionMarkdown(matchedPage, basePrefix),
  };
}

export async function generateLlmsArtifacts({
  projectRoot,
  clientDir,
  basePath = '/',
}) {
  const pages = readDocPages(projectRoot);

  for (const page of pages) {
    const resolved = resolveLlmsRequest({
      projectRoot,
      requestPath: toCompanionRoute(page.route),
      basePath,
    });

    if (!resolved) {
      continue;
    }

    writeOutputFile(join(clientDir, toOutputRelativePath(page.route)), resolved.body);

    if (page.slug === 'index') {
      writeOutputFile(join(clientDir, toOutputRelativePath('/')), resolved.body);
    }
  }

  const llms = resolveLlmsRequest({
    projectRoot,
    requestPath: '/llms.txt',
    basePath,
  });

  if (!llms) {
    throw new Error('failed to generate llms.txt');
  }

  writeOutputFile(join(clientDir, 'llms.txt'), llms.body);
}

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  const websiteRoot = process.cwd();
  const projectRoot = resolve(websiteRoot, '..');
  const clientDir = join(websiteRoot, 'build', 'client');

  await generateLlmsArtifacts({
    projectRoot,
    clientDir,
    basePath: process.env.WEBSITE_BASENAME ?? '/',
  });
}
