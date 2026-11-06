import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';
import { aiGenerationEnabled, linkedinSlotEnabled } from './lib/economy.js';

const sourceRoot = process.env.ECONOMY_TEST_SOURCE_ROOT
  ? pathToFileURL(process.env.ECONOMY_TEST_SOURCE_ROOT.replace(/\\/g, '/') + '/')
  : new URL('./', import.meta.url);
async function source(file) { return readFile(new URL(file, sourceRoot), 'utf8'); }
async function functionSource(file, name) {
  const text = await source(file);
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const fn = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert(fn, `${file}: ${name}`);
  return fn.getText(ast).replace(/^export\s+/, '');
}

test('paid AI disabled by default; only explicit true opts in', () => {
  const saved = process.env.AGENT_AI_ENABLED;
  try {
    delete process.env.AGENT_AI_ENABLED; assert.equal(aiGenerationEnabled(), false);
    process.env.AGENT_AI_ENABLED = 'false'; assert.equal(aiGenerationEnabled(), false);
    process.env.AGENT_AI_ENABLED = 'true'; assert.equal(aiGenerationEnabled(), true);
  } finally { if (saved === undefined) delete process.env.AGENT_AI_ENABLED; else process.env.AGENT_AI_ENABLED = saved; }
});

for (const [file, name, args] of [
  ['stats-reporter.js', 'checkAICitations', []],
  ['linkedin-digests.js', 'generatePost', ['private-test']],
  ['blog-writer.js', 'writeBlogArticle', []],
  ['kpi-reporter.js', 'runKPIReporter', []],
  ['linkedin-messages.js', 'runLinkedInMessages', []],
  ['concours-parser.js', 'enrichWithClaude', [{title_ar:'Title',organization_ar:'Org',content_ar:'Source text'}]],
  ['enricher.js', 'enrichJobs', [[{title:'Example'}]]],
]) {
  test(`${name} makes zero provider requests when disabled`, async () => {
    const context = {
      aiGenerationEnabled: () => false, log() {},
      fallback: job => job, buildJobObject: job => job,
      args,
      fetch: () => { throw Error('Unexpected network request'); },
    };
    await vm.runInNewContext(`${await functionSource(file, name)}; ${name}(...args)`, context);
  });
}

test('only the noon digest slot is enabled', () => {
  assert.equal(linkedinSlotEnabled('12:00 OFFRES MIDI'), true);
  for (const slot of ['08:00 OFFRES MATIN','10:00 OFFRES MID','19:00 ARTICLE BLOG','remote','nuit','soir','offres-individuelles']) {
    assert.equal(linkedinSlotEnabled(slot), false);
  }
});

for (const [file, name, args] of [
  ['linkedin-digests.js', 'postLinkedInSoir', []],
  ['linkedin-digests.js', 'postLinkedInNuit', []],
  ['linkedin-digests.js', 'postLinkedInGeneralJobs', []],
  ['linkedin-digests.js', 'postDigestByLabel', ['08:00 OFFRES MATIN']],
  ['linkedin-remote-poster.js', 'main', []],
  ['linkedin.js', 'postJobsToLinkedIn', [[], 'https://example.invalid']],
]) {
  test(`${name} skips excess automatic publications before doing I/O`, async () => {
    await vm.runInNewContext(`${await functionSource(file, name)}; ${name}(...args)`, { linkedinSlotEnabled, args });
  });
}

test('daily report says IA disabled rather than reporting failed providers', async () => {
  assert((await source('stats-reporter.js')).includes('Vérifications IA désactivées'));
});

test('daemon registers only one LinkedIn publishing schedule', async () => {
  const text = await source('agent.js');
  const ast = ts.createSourceFile('agent.js', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const callbacks = [];
  function walk(node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'cron.schedule') {
      const callback = node.arguments[1]?.getText(ast) || '';
      if (/postDigestByLabel|postLinkedInNuit|postLinkedInGeneralJobs|linkedin-remote-poster/.test(callback)) callbacks.push(node.getText(ast));
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
  assert.equal(callbacks.length, 1);
  assert(callbacks[0].includes('12:00 OFFRES MIDI'));
});
