import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = '/Users/aric/GlobaFlux/agent/demo/eeap';

test('root package exposes website workspace scripts', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.ok(pkg.workspaces.includes('website'), 'expected website workspace in root package.json');
  assert.equal(typeof pkg.scripts['docs:dev'], 'string');
  assert.equal(typeof pkg.scripts['docs:build'], 'string');
  assert.equal(typeof pkg.scripts['docs:build:pages'], 'string');
});

test('website workspace uses react router and static pages config', () => {
  const pkgFile = join(root, 'website', 'package.json');
  assert.equal(existsSync(pkgFile), true, 'expected website/package.json to exist');
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
  for (const dep of [
    '@react-router/dev',
    'react-router',
    'fumadocs-core',
    'fumadocs-ui',
    'fumadocs-mdx',
  ]) {
    const present = pkg.dependencies?.[dep] ?? pkg.devDependencies?.[dep];
    assert.ok(present, `expected ${dep} in website/package.json`);
  }

  const config = readFileSync(join(root, 'website', 'react-router.config.ts'), 'utf8');
  assert.match(config, /ssr:\s*false/, 'expected static SPA mode');
  assert.match(pkg.scripts.build, /generate-llms-files\.mjs/, 'expected build to generate llms assets');
  assert.match(
    pkg.scripts['build:pages'],
    /generate-llms-files\.mjs/,
    'expected build:pages to generate llms assets',
  );

  const viteConfig = readFileSync(join(root, 'website', 'vite.config.ts'), 'utf8');
  assert.match(viteConfig, /llmsDevPlugin\(\)/, 'expected vite dev server to expose llms routes');
  assert.match(viteConfig, /browserShimPlugin\(\)/, 'expected vite config to install browser shims');
  assert.match(viteConfig, /node:path/, 'expected vite config to intercept node:path');
  assert.match(viteConfig, /node:fs\/promises/, 'expected vite config to intercept node:fs\/promises');
});

test('website route/content files and pages workflow exist', () => {
  for (const file of [
    'website/app/root.tsx',
    'website/app/routes.ts',
    'website/app/routes/home.tsx',
    'website/app/lib/shims/path.ts',
    'website/app/lib/shims/fs-promises.ts',
    'website/app/components/diagrams.tsx',
    'website/app/docs/page.tsx',
    'website/app/docs/search.ts',
    'website/content/docs/index.mdx',
    'website/content/docs/architecture.mdx',
    'website/content/docs/sdk.mdx',
    'website/content/docs/adapter-example.mdx',
    'website/content/docs/conformance.mdx',
    'website/content/docs/positioning.mdx',
    'website/scripts/generate-llms-files.mjs',
    'website/scripts/prepare-pages.mjs',
    'sdk/ts/examples/assemble-trace-from-webhook.mjs',
    '.github/workflows/deploy-docs.yml',
  ]) {
    assert.equal(existsSync(join(root, file)), true, `expected ${file} to exist`);
  }
});

test('pages workflow uses current actions and explicit enablement handling', () => {
  const workflow = readFileSync(join(root, '.github', 'workflows', 'deploy-docs.yml'), 'utf8');

  assert.match(
    workflow,
    /actions\/checkout@v6/,
    'expected Pages workflow to use checkout@v6',
  );
  assert.match(
    workflow,
    /actions\/setup-node@v6/,
    'expected Pages workflow to use setup-node@v6',
  );
  assert.match(
    workflow,
    /actions\/configure-pages@v6/,
    'expected Pages workflow to use configure-pages@v6',
  );
  assert.match(
    workflow,
    /actions\/upload-pages-artifact@v4/,
    'expected Pages workflow to use upload-pages-artifact@v4',
  );
  assert.match(
    workflow,
    /PAGES_ENABLEMENT_TOKEN|Pages is not enabled for this repository|Settings > Pages/,
    'expected Pages workflow to document or automate the repo enablement prerequisite',
  );
  assert.doesNotMatch(
    workflow,
    /if:\s*\$\{\{\s*secrets\./,
    'expected Pages workflow to avoid using secrets directly in if expressions',
  );
  assert.match(
    workflow,
    /env:\s*[\s\S]*PAGES_ENABLEMENT_TOKEN:/,
    'expected Pages workflow to map the optional enablement token into env before branching on it',
  );
});

test('docs information architecture includes architecture page and diagrams', () => {
  const meta = readFileSync(join(root, 'website', 'content', 'docs', 'meta.json'), 'utf8');
  assert.match(meta, /"architecture"/, 'expected docs meta to include architecture page');
  assert.match(meta, /"sdk"/, 'expected docs meta to include sdk page');
  assert.match(meta, /"adapter-example"/, 'expected docs meta to include adapter example page');
  assert.match(meta, /"conformance"/, 'expected docs meta to include conformance page');

  const index = readFileSync(join(root, 'website', 'content', 'docs', 'index.mdx'), 'utf8');
  assert.match(index, /System At A Glance/, 'expected docs home to include a system overview section');
  assert.match(index, /Repo Structure/, 'expected docs home to include a repo structure section');
  assert.match(index, /\[SDK\]\(\/docs\/sdk\)/, 'expected docs home to link to the SDK page');
  assert.match(
    index,
    /\[Adapter Example\]\(\/docs\/adapter-example\)/,
    'expected docs home to link to the adapter example page',
  );
  assert.match(
    index,
    /\[Conformance\]\(\/docs\/conformance\)/,
    'expected docs home to link to the conformance page',
  );

  const architecture = readFileSync(
    join(root, 'website', 'content', 'docs', 'architecture.mdx'),
    'utf8',
  );
  assert.match(
    architecture,
    /Runtime Boundary|Execution Path/,
      'expected architecture page to explain the boundary and flow',
  );
});

test('built docs bundle avoids vite browser externals for node builtins', () => {
  const assetsDir = join(root, 'website', 'build', 'client', 'assets');
  assert.equal(existsSync(assetsDir), true, 'expected website build assets to exist after docs build');

  const pageCandidates = readdirSync(assetsDir)
    .filter((file) => /^page-.*\.js$/.test(file))
    .map((file) => ({
      file,
      source: readFileSync(join(assetsDir, file), 'utf8'),
    }));
  const pageBundle = pageCandidates.find(
    ({ source }) => source.includes('createClientLoader') || source.includes('resolveHref'),
  );
  assert.ok(pageBundle, 'expected built docs page bundle');

  assert.doesNotMatch(
    pageBundle.source,
    /__vite-browser-external/,
    'expected docs page bundle to use browser shims instead of vite browser externals',
  );
  assert.match(
    pageBundle.source,
    /fs-promises-[A-Za-z0-9_-]+\.js|readFile is unavailable in the browser runtime/,
    'expected docs page bundle to reference the browser-safe fs shim',
  );
});

test('sdk and conformance pages explain implementation and validator usage', () => {
  const sdk = readFileSync(join(root, 'website', 'content', 'docs', 'sdk.mdx'), 'utf8');
  assert.match(sdk, /assertExecutionTrace/, 'expected sdk page to document assertExecutionTrace');
  assert.match(sdk, /formatConformanceIssues/, 'expected sdk page to document issue formatting');
  assert.match(sdk, /ExecutionTrace/, 'expected sdk page to explain trace validation');
  assert.match(
    sdk,
    /warehouse\.door\.unlock|readback_confirmed|door-8/,
    'expected sdk page to include a real warehouse door example',
  );
  assert.match(
    sdk,
    /applyControllerWebhook|vendor:\/\/controllers|assemble-trace-from-webhook\.mjs|\/docs\/adapter-example/,
    'expected sdk page to explain adapter webhook-to-trace assembly',
  );

  const adapter = readFileSync(
    join(root, 'website', 'content', 'docs', 'adapter-example.mdx'),
    'utf8',
  );
  assert.match(adapter, /applyControllerWebhook/, 'expected adapter example page to show webhook translation');
  assert.match(adapter, /vendor:\/\/controllers/, 'expected adapter example page to preserve sourceRef');
  assert.match(adapter, /Webhook-assembled trace: true/, 'expected adapter example page to show runnable output');

  const conformance = readFileSync(
    join(root, 'website', 'content', 'docs', 'conformance.mdx'),
    'utf8',
  );
  assert.match(conformance, /Conformance Profile v1/, 'expected conformance page heading');
  assert.match(
    conformance,
    /completed_without_acknowledged|dual_terminal_events/,
    'expected conformance page to list stable issue codes',
  );
});

test('core object diagram pins multiline copy for tight boxes', () => {
  const diagrams = readFileSync(join(root, 'website', 'app', 'components', 'diagrams.tsx'), 'utf8');

  assert.match(
    diagrams,
    /title="ExecutionEvent"[\s\S]*lines=\{\['immutable lifecycle fact', 'requested \/ acknowledged \/', 'completed \/ failed'\]\}/,
    'expected ExecutionEvent copy to be manually split across three lines',
  );

  assert.match(
    diagrams,
    /title="Settlement Attachment"[\s\S]*lines=\{\['later layer, not forced', 'into v0 core'\]\}/,
    'expected Settlement Attachment copy to be manually split across two lines',
  );
});

test('lifecycle timeline uses wrapped callouts for long state descriptions', () => {
  const diagrams = readFileSync(join(root, 'website', 'app', 'components', 'diagrams.tsx'), 'utf8');

  assert.match(
    diagrams,
    /function TimelineState[\s\S]*<DiagramLabel text=\{description\}/,
    'expected lifecycle timeline states to render descriptions through TimelineState callouts',
  );

  for (const phrase of [
    'executor accepts responsibility',
    'only after completion rule is satisfied',
    'terminal non-success outcome',
  ]) {
    assert.match(
      diagrams,
      new RegExp(`description=\\\"${phrase.replace(/[.*+?^${}()|[\]\\\\]/g, '\\\\$&')}\\\"`),
      `expected lifecycle timeline to keep "${phrase}" as a TimelineState description`,
    );
  }
});

test('diagram boxes can grow to fit wrapped content', () => {
  const diagrams = readFileSync(join(root, 'website', 'app', 'components', 'diagrams.tsx'), 'utf8');

  assert.match(
    diagrams,
    /const actualHeight = Math\.max\(h, requiredHeight\);/,
    'expected DiagramBox to compute an auto-expanded height',
  );
  assert.match(
    diagrams,
    /height=\{actualHeight\}/,
    'expected DiagramBox to render using the expanded height',
  );
});
