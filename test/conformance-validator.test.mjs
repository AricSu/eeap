import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = '/Users/aric/GlobaFlux/agent/demo/eeap';
const fixturesRoot = join(root, 'conformance', 'fixtures');

function buildSdk() {
  execFileSync('npx', ['tsc', '-p', 'sdk/ts'], {
    cwd: root,
    stdio: 'pipe',
  });
}

async function loadSdk() {
  buildSdk();
  const moduleUrl = pathToFileURL(join(root, 'sdk', 'ts', 'dist', 'index.js')).href;
  return import(`${moduleUrl}?t=${Date.now()}`);
}

function readFixtureSet(kind) {
  const dir = join(fixturesRoot, kind);
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => ({
      name: file,
      payload: JSON.parse(readFileSync(join(dir, file), 'utf8')),
    }));
}

test('sdk public entry exports EEAP conformance validators', async () => {
  const sdk = await loadSdk();

  for (const exportName of [
    'validateCapabilityDescriptor',
    'validateExecutionRequest',
    'validateExecutionEvent',
    'validateEvidenceRecord',
    'validateExecutionTrace',
  ]) {
    assert.equal(
      typeof sdk[exportName],
      'function',
      `expected ${exportName} to be exported from the public SDK entry`,
    );
  }
});

test('valid conformance fixtures pass trace validation', async () => {
  const sdk = await loadSdk();
  const fixtures = readFixtureSet('valid');

  for (const fixture of fixtures) {
    const result = sdk.validateExecutionTrace(fixture.payload.trace);
    assert.equal(result.ok, true, `expected ${fixture.name} to pass`);
    assert.deepEqual(result.issues, [], `expected ${fixture.name} to have no issues`);
  }
});

test('invalid conformance fixtures produce the expected stable issue codes', async () => {
  const sdk = await loadSdk();
  const fixtures = readFixtureSet('invalid');

  for (const fixture of fixtures) {
    const result = sdk.validateExecutionTrace(fixture.payload.trace);
    assert.equal(result.ok, false, `expected ${fixture.name} to fail`);
    assert.deepEqual(
      result.issues.map((issue) => issue.code).sort(),
      fixture.payload.expectedIssueCodes.slice().sort(),
      `expected ${fixture.name} to produce the declared issue codes`,
    );
  }
});
