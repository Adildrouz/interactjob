import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

// Execute the real entry point with every I/O dependency replaced. No API calls,
// credentials, delays, production files or GitHub writes are used in these tests.
const url = new URL('./linkedin-remote-poster.js', import.meta.url);
const source = (await readFile(url, 'utf8'))
  .replace(/^import .*;\r?\n/gm, '')
  .replaceAll('import.meta.url', JSON.stringify(url.href))
  .replaceAll('process.exit(', 'return finish(');

async function run({ results = [], token = 'test-only', missingJobs = false, empty = false, aiFails = false } = {}) {
  const logs = [], saved = [], exits = [], pushes = [];
  const jobs = empty ? [] : [1,2,3].map(id => ({ id: String(id), title: `Job ${id}`, summary: 'Example role.', published: new Date().toISOString() }));
  let attempts = 0;
  const context = {
    path, fileURLToPath, dotenvConfig() {},
    process: { env: { LINKEDIN_ACCESS_TOKEN: token, ...(aiFails ? { OPENAI_API_KEY: 'test-only' } : {}) } },
    AgentAI: class { messages = { create: async () => { throw Error('OpenAI HTTP 429'); } }; },
    initLogger() {}, log: message => logs.push(message),
    console: { error() {} }, setTimeout: fn => fn(),
    finish: code => exits.push(code),
    fs: {
      readJson: async () => { if (missingJobs) throw Error('missing'); return jobs; },
      readJsonSync: () => ({}),
      writeJsonSync: (_path, value) => saved.push(value),
    },
    publishTextPost: async () => results[attempts++] ?? null,
    pushToGithub: async (...args) => pushes.push(args),
  };
  await vm.runInNewContext(source, context);
  return { logs, saved, exits, pushes, attempts };
}

test('all rejected posts fail the run and never persist posted IDs', async () => {
  const r = await run();
  assert.deepEqual(r.exits, [1]);
  assert.equal(r.attempts, 3);
  assert.equal(r.saved.length, 0);
  assert.equal(r.pushes.length, 0);
  assert(r.logs.some(s => s.includes('0/3 publication(s) réussie(s), 3 échec(s)')));
  assert(!r.logs.some(s => s.includes('terminé avec succès')));
});
test('partial success fails the run but preserves only successful publication IDs', async () => {
  const r = await run({ results: ['urn:li:share:example', null, null] });
  assert.deepEqual(r.exits, [1]);
  assert.equal(r.saved.length, 1);
  assert.deepEqual(Object.keys(r.saved[0]), ['1']);
  assert.equal(r.pushes.length, 1);
  assert(r.logs.some(s => s.includes('1/3 publication(s) réussie(s), 2 échec(s)')));
});
test('complete success exits zero and reports the actual number published', async () => {
  const r = await run({ results: ['a', 'b', 'c'] });
  assert.deepEqual(r.exits, [0]);
  assert.equal(r.saved.length, 3);
  assert(r.logs.some(s => s.includes('3/3 publication(s) réussie(s), 0 échec(s)')));
});

test('OpenAI outage preserves factual template publication without a second AI provider', async () => {
  const r = await run({ results: ['a', 'b', 'c'], aiFails: true });
  assert.deepEqual(r.exits, [0]);
  assert.equal(r.attempts, 3);
  assert.equal(r.saved.length, 3);
  assert.equal(r.logs.filter(s => s.includes('OpenAI HTTP 429')).length, 3);
});
test('no jobs to publish remains a successful no-op', async () => {
  const r = await run({ empty: true });
  assert.deepEqual(r.exits, [0]);
  assert.equal(r.attempts, 0);
});
test('missing token is a configuration failure', async () => {
  const r = await run({ token: '' });
  assert.deepEqual(r.exits, [1]);
  assert.equal(r.attempts, 0);
});
test('missing jobs data is a configuration failure', async () => {
  const r = await run({ missingJobs: true });
  assert.deepEqual(r.exits, [1]);
  assert.equal(r.attempts, 0);
});
