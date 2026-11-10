import test from 'node:test';
import assert from 'node:assert/strict';
import AgentAI from './ai-client.js';
import { readdir, readFile } from 'node:fs/promises';

const request = { model: 'fast', max_tokens: 120, system: 'Write factual text.', messages: [{ role: 'user', content: 'Example job' }] };
const completed = {
  status: 'completed', model: 'test-model',
  output: [{ type: 'reasoning' }, { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Example text' }] }],
  usage: { input_tokens: 10, output_tokens: 5 },
};
function stub(data = completed, status = 200) {
  const calls = [];
  const client = new AgentAI({ apiKey: 'test-only', fetch: async (url, options) => {
    calls.push({ url, ...options, body: JSON.parse(options.body) });
    return { ok: status === 200, status, json: async () => data };
  } });
  return { client, calls };
}
test('OpenAI-only endpoint, instructions, budgets and text/usage contracts', async () => {
  const { client, calls } = stub();
  const result = await client.messages.create(request);
  assert.equal(calls[0].url, 'https://api.openai.com/v1/responses');
  assert.equal(calls[0].body.instructions, request.system);
  assert.equal(calls[0].body.model, process.env.OPENAI_MODEL_FAST || 'gpt-6-luna');
  assert.equal(calls[0].body.reasoning.effort, 'none');
  assert.equal(calls[0].body.max_output_tokens, 120);
  assert.equal(calls[0].body.store, false);
  assert.deepEqual(calls[0].body.input, request.messages);
  assert.equal(result.content[0].text, 'Example text');
  assert.deepEqual(result.usage, { input_tokens: 10, output_tokens: 5 });
});
test('writing tier keeps a separate model and allows reasoning overhead', async () => {
  const { client, calls } = stub();
  await client.messages.create({ ...request, model: 'writing' });
  assert.equal(calls[0].body.model, process.env.OPENAI_MODEL_WRITING || 'gpt-6-astra');
  assert.equal(calls[0].body.reasoning.effort, 'low');
  assert.equal(calls[0].body.max_output_tokens, 2168);
});
test('provider failures are sanitized and never call a second provider', async () => {
  const { client, calls } = stub({ error: { message: 'secret' } }, 429);
  await assert.rejects(client.messages.create(request), /^Error: OpenAI HTTP 429$/);
  assert.equal(calls.length, 1);
});
for (const data of [{ ...completed, status: 'incomplete' }, { ...completed, output: [] }, { ...completed, output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'No' }] }] }]) {
  test('rejects incomplete, empty or refused responses instead of accepting false success: ' + JSON.stringify(data.output), async () => {
    const { client } = stub(data);
    await assert.rejects(client.messages.create(request));
  });
}
test('missing key fails before any network call', async () => {
  const { client, calls } = stub();
  client.apiKey = '';
  await assert.rejects(client.messages.create(request), /OPENAI_API_KEY/);
  assert.equal(calls.length, 0);
});
test('rejects unsupported messages, options and workload tiers', async () => {
  const { client, calls } = stub();
  await assert.rejects(client.messages.create({ ...request, tools: [] }));
  await assert.rejects(client.messages.create({ ...request, model: 'unknown' }));
  await assert.rejects(client.messages.create({ ...request, messages: [{ role: 'user', content: [] }] }));
  assert.equal(calls.length, 0);
});

test('every agent entry point is free of direct Anthropic SDK calls and credentials', async () => {
  const dir = new URL('./', import.meta.url);
  for (const name of await readdir(dir)) {
    if (!/\.(js|mjs)$/.test(name) || name.includes('.test.')) continue;
    const source = await readFile(new URL(name, dir), 'utf8');
    assert(!source.includes('@anthropic-ai/sdk'), name);
    assert(!source.includes('ANTHROPIC_API_KEY'), name);
    assert(!source.includes('api.anthropic.com'), name);
  }
});
