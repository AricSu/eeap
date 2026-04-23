import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const root = '/Users/aric/GlobaFlux/agent/demo/eeap';
const port = 43123;

let serverProcess;
let serverOutput = '';

async function waitForServer(url) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`docs dev server did not start in time\n${serverOutput}`);
}

before(async () => {
  serverProcess = spawn(
    'npm',
    ['run', 'dev', '--workspace', 'website', '--', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: root,
      detached: true,
      env: {
        ...process.env,
        BROWSER: 'none',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  serverProcess.stdout?.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });
  serverProcess.stderr?.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });

  await waitForServer(`http://127.0.0.1:${port}/api/search`);
});

after(async () => {
  if (!serverProcess?.pid) return;

  try {
    process.kill(-serverProcess.pid, 'SIGTERM');
  } catch {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    process.kill(-serverProcess.pid, 'SIGKILL');
  } catch {
    // Process group already exited.
  }
});

test('docs search route returns search results for query requests and index data otherwise', async () => {
  const queryResponse = await fetch(`http://127.0.0.1:${port}/api/search?query=core`);
  assert.equal(queryResponse.ok, true, 'expected query search request to succeed');

  const queryBody = await queryResponse.json();
  assert.equal(
    Array.isArray(queryBody),
    true,
    `expected queried search response to be an array, received ${JSON.stringify(queryBody).slice(0, 240)}`,
  );
  assert.ok(queryBody.length > 0, 'expected query to return at least one docs result');

  const staticResponse = await fetch(`http://127.0.0.1:${port}/api/search`);
  assert.equal(staticResponse.ok, true, 'expected static search export request to succeed');

  const staticBody = await staticResponse.json();
  assert.equal(Array.isArray(staticBody), false, 'expected static search export to remain an object');
  assert.equal(staticBody.type, 'advanced', 'expected static search export to expose Orama metadata');
});
