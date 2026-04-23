import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = '/Users/aric/GlobaFlux/agent/demo/eeap';

test('positioning document exists and covers adjacent standards', () => {
  const file = join(root, 'spec', 'positioning.md');
  assert.equal(existsSync(file), true, 'expected spec/positioning.md to exist');

  const content = readFileSync(file, 'utf8');
  for (const section of [
    'oneM2M',
    'Web of Things',
    'LwM2M',
    'OPC UA',
    'CloudEvents',
    'AsyncAPI',
    'ROS 2 Actions',
    'EPCIS',
  ]) {
    assert.match(content, new RegExp(section), `expected positioning doc to mention ${section}`);
  }
});

test('readme links to the positioning document', () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  assert.match(
    readme,
    /positioning\.md/,
    'expected README.md to link to the positioning document',
  );
});

test('spec index covers architecture and positioning source docs', () => {
  const specReadme = readFileSync(join(root, 'spec', 'README.md'), 'utf8');
  assert.match(specReadme, /architecture\.md/, 'expected spec/README.md to link architecture.md');
  assert.match(specReadme, /positioning\.md/, 'expected spec/README.md to link positioning.md');

  const architecture = join(root, 'spec', 'architecture.md');
  assert.equal(existsSync(architecture), true, 'expected spec/architecture.md to exist');
});
