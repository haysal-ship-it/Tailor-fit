const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Load the pure TypeScript helper without a subprocess or browser dependencies.
const compiled = ts.transpileModule(fs.readFileSync('lib/client-details.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(compiled, sandbox);
const { emptyClientDetails, validateClientDetails, hasClientDetailsChanges, saveClientDetails } = sandbox.exports;
const values = { name: '  Ada Okafor  ', phone: ' +234 800 000 0000 ', email: '', notes: ' Prefers loose sleeves ' };

test('creation only creates and returns the new profile ID', async () => {
  let received;
  const result = await saveClientDetails({ kind: 'create' }, values, {
    create: async data => { received = data; return { id: 'new-client', name: data.name }; },
    update: async () => { assert.fail('Creation must never update a client'); },
  });
  assert.equal(result.id, 'new-client');
  assert.equal(result.created, true);
  assert.equal(received.name, 'Ada Okafor');
  assert.equal(received.phone, '+234 800 000 0000');
  assert.equal(received.notes, 'Prefers loose sleeves');
});

test('editing uses the captured client ID and never creates', async () => {
  let editedId;
  const result = await saveClientDetails({ kind: 'edit', client: { ...values, id: 'client-a' } }, values, {
    create: async () => { assert.fail('Editing must never create a client'); },
    update: async id => { editedId = id; return true; },
  });
  assert.equal(editedId, 'client-a');
  assert.equal(result.created, false);
});

test('failed persistence produces no success result', async () => {
  const actions = { create: async () => null, update: async () => false };
  assert.equal(await saveClientDetails({ kind: 'create' }, values, actions), null);
  assert.equal(await saveClientDetails({ kind: 'edit', client: { ...values, id: 'a' } }, values, actions), null);
});

test('invalid fields prevent writes; contact details remain optional', async () => {
  let writes = 0;
  const actions = { create: async () => { writes++; return null; }, update: async () => { writes++; return true; } };
  await assert.rejects(saveClientDetails({ kind: 'create' }, { ...values, name: '  ' }, actions));
  await assert.rejects(saveClientDetails({ kind: 'create' }, { ...values, email: 'invalid' }, actions));
  assert.equal(writes, 0);
  assert.equal(Object.keys(validateClientDetails({ ...emptyClientDetails(), name: 'Ada' })).length, 0);
});

test('draft protection detects changed details without treating whitespace as an edit', () => {
  assert.equal(hasClientDetailsChanges({ ...values, name: 'Ada Okafor' }, values), false);
  assert.equal(hasClientDetailsChanges({ ...values, notes: 'New fit preference' }, values), true);
});
