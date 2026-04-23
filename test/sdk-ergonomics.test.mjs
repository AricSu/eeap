import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = '/Users/aric/GlobaFlux/agent/demo/eeap';

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

function readFixture(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8')).trace;
}

test('sdk public entry exports ergonomic helpers for common validation flows', async () => {
  const sdk = await loadSdk();

  assert.equal(typeof sdk.assertExecutionTrace, 'function');
  assert.equal(typeof sdk.formatConformanceIssues, 'function');
  assert.equal(typeof sdk.ConformanceError, 'function');
});

test('assertExecutionTrace accepts a valid trace and returns it unchanged', async () => {
  const sdk = await loadSdk();
  const trace = readFixture('conformance/fixtures/valid/requested-acknowledged-completed.json');

  const returnedTrace = sdk.assertExecutionTrace(trace);

  assert.equal(returnedTrace, trace);
});

test('assertExecutionTrace throws a readable ConformanceError for invalid traces', async () => {
  const sdk = await loadSdk();
  const trace = readFixture('conformance/fixtures/invalid/completed-without-acknowledged.json');

  assert.throws(
    () => sdk.assertExecutionTrace(trace),
    (error) => {
      assert.equal(error instanceof sdk.ConformanceError, true);
      assert.equal(Array.isArray(error.issues), true);
      assert.match(error.message, /completed_without_acknowledged/);
      assert.match(error.message, /\/events\/1\/type/);
      return true;
    },
  );
});

test('formatConformanceIssues renders compact multiline diagnostics', async () => {
  const sdk = await loadSdk();
  const rendered = sdk.formatConformanceIssues([
    {
      code: 'completed_without_acknowledged',
      message: 'Execution exec-1 completed without a prior acknowledged event',
      path: '/events/1/type',
    },
    {
      code: 'event_time_regressed',
      message: 'Event time regressed relative to the previous event',
      path: '/events/2/at',
    },
  ]);

  assert.match(rendered, /^EEAP conformance issues \(2\):/);
  assert.match(rendered, /1\. completed_without_acknowledged at \/events\/1\/type/);
  assert.match(rendered, /2\. event_time_regressed at \/events\/2\/at/);
});
