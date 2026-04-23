import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = '/Users/aric/GlobaFlux/agent/demo/eeap';

function buildSdk() {
  execFileSync('npx', ['tsc', '-p', 'sdk/ts'], {
    cwd: root,
    stdio: 'pipe',
  });
}

test('validate-trace example demonstrates valid and broken warehouse traces', () => {
  buildSdk();

  const output = execFileSync('node', ['sdk/ts/examples/validate-trace.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.match(output, /Valid warehouse trace: true/);
  assert.match(output, /Broken warehouse trace: false/);
  assert.match(output, /evidence_required_for_completion/);
});

test('assemble-trace-from-webhook example builds a valid EEAP trace from vendor facts', () => {
  buildSdk();

  const output = execFileSync('node', ['sdk/ts/examples/assemble-trace-from-webhook.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.match(output, /Webhook-assembled trace: true/);
  assert.match(output, /Adapter webhook assembly passed conformance\./);
  assert.match(output, /ctrl-evt-9912/);
  assert.match(output, /vendor:\/\/controllers\/ctrl-a7\/events\/ctrl-evt-9912/);
});
