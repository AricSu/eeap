import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = '/Users/aric/GlobaFlux/agent/demo/eeap';

test('llms generator emits llms.txt and markdown companions for public docs', async () => {
  const { generateLlmsArtifacts } = await import('../website/scripts/generate-llms-files.mjs');

  const clientDir = mkdtempSync(join(tmpdir(), 'eeap-llms-'));

  try {
    await generateLlmsArtifacts({
      projectRoot: root,
      clientDir,
      basePath: '/eeap',
    });

    const llmsFile = join(clientDir, 'llms.txt');
    assert.equal(existsSync(llmsFile), true, 'expected llms.txt to be generated');

    const llms = readFileSync(llmsFile, 'utf8');
    assert.match(llms, /^# EEAP/m, 'expected llms.txt to use the docs title as H1');
    assert.match(
      llms,
      /\[Overview\]\(\/eeap\/docs\/index\.html\.md\)/,
      'expected llms.txt to link to the overview companion markdown',
    );
    assert.match(
      llms,
      /\[Lifecycle\]\(\/eeap\/docs\/lifecycle\/index\.html\.md\)/,
      'expected llms.txt to link to the lifecycle companion markdown',
    );

    const architecture = readFileSync(
      join(clientDir, 'docs', 'architecture', 'index.html.md'),
      'utf8',
    );
    assert.match(architecture, /^# Architecture/m, 'expected title heading in companion markdown');
    assert.match(
      architecture,
      /^> The system boundary, flow, and repository structure behind EEAP\./m,
      'expected companion markdown to preserve the page description',
    );
    assert.doesNotMatch(
      architecture,
      /<RuntimeBoundaryDiagram \/>|<ExecutionPathDiagram \/>/,
      'expected JSX diagram components to be stripped from companion markdown',
    );
    assert.match(
      architecture,
      /\[Positioning\]\(\/eeap\/docs\/positioning\/index\.html\.md\)/,
      'expected internal doc links to point at markdown companions',
    );

    const home = readFileSync(join(clientDir, 'index.html.md'), 'utf8');
    assert.match(home, /^# EEAP/m, 'expected root home companion markdown to be generated');
  } finally {
    rmSync(clientDir, { recursive: true, force: true });
  }
});

test('llms resolver serves markdown artifacts for dev requests', async () => {
  const { resolveLlmsRequest } = await import('../website/scripts/generate-llms-files.mjs');

  const llms = resolveLlmsRequest({
    projectRoot: root,
    requestPath: '/llms.txt',
    basePath: '/',
  });
  assert.ok(llms, 'expected llms resolver to handle /llms.txt');
  assert.equal(llms.contentType, 'text/plain; charset=utf-8');
  assert.match(llms.body, /^# EEAP/m);

  const architecture = resolveLlmsRequest({
    projectRoot: root,
    requestPath: '/docs/architecture/index.html.md',
    basePath: '/',
  });
  assert.ok(architecture, 'expected llms resolver to handle doc markdown paths');
  assert.equal(architecture.contentType, 'text/markdown; charset=utf-8');
  assert.match(architecture.body, /^# Architecture/m);
  assert.doesNotMatch(architecture.body, /<RuntimeBoundaryDiagram \/>/);
});
