import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isActiveDirectJob, directJobCaption } from './direct-job-sharing.js';

const job = { id: 'id-1', slug: 'marketing-marrakech', title: 'Marketing digital', city: 'Marrakech', source: 'Direct', salary: '5 000 à 8 000 DH' };
assert.equal(isActiveDirectJob(job), true);
assert.equal(isActiveDirectJob({ ...job, expired: true }), false);
assert.equal(isActiveDirectJob({ ...job, date_expires: '2020-01-01' }), false);
assert.equal(isActiveDirectJob({ ...job, source: 'Autre' }), false);
assert.ok(directJobCaption(job, 'https://www.interactjob.ma/').includes('https://www.interactjob.ma/offres/marketing-marrakech'));

async function scenario({ failCompany = false, profile = true, live = true } = {}) {
  let state = {};
  const calls = [];
  const mocks = {
    axios: { default: {
      get: async () => ({ data: { sub: 'test-profile' } }),
      post: async url => {
        calls.push(url);
        if (url.includes('buffer')) {
          if (failCompany) return { data: { data: { createPost: { message: 'Try again' } } } };
          return { data: { data: { createPost: { post: { id: 'company-post' } } } } };
        }
        return { headers: { 'x-restli-id': 'profile-post' } };
      },
    } },
    crypto: { default: crypto }, path: { default: path }, url: { fileURLToPath },
    'fs-extra': { default: {
      readJsonSync: () => structuredClone(state),
      writeJsonSync: (_, data) => { state = structuredClone(data); },
    } },
    './logger.js': { log() {} }, './github-sync.js': { pushToGithub: async () => {} },
    './lib/alert.js': { recordFailure: async () => {} },
    './lib/date-guard.js': { validateDateClaim: async () => true },
    './direct-job-sharing.js': { isActiveDirectJob, directJobCaption },
  };
  const context = vm.createContext({ process: { env: {
    LINKEDIN_ACCESS_TOKEN: profile ? 'test-token' : '', BUFFER_ACCESS_TOKEN: 'test-buffer', BUFFER_CHANNEL_ID: 'test-channel',
  } }, URL, Date, AbortSignal, setTimeout,
  fetch: async url => ({ ok: live, status: live ? 200 : 404, url, body: { cancel: async () => {} } }) });
  const module = new vm.SourceTextModule(readFileSync(new URL('./linkedin.js', import.meta.url), 'utf8'), {
    context, initializeImportMeta: meta => { meta.url = import.meta.url; },
  });
  await module.link(specifier => {
    const value = mocks[specifier];
    if (!value) throw new Error(`Unexpected import ${specifier}`);
    return new vm.SyntheticModule(Object.keys(value), function () {
      for (const [key, exported] of Object.entries(value)) this.setExport(key, exported);
    }, { context });
  });
  await module.evaluate();
  await module.namespace.postJobsToLinkedIn([job], 'https://www.interactjob.ma', { maxPosts: 1 });
  const first = calls.length;
  failCompany = false;
  await module.namespace.postJobsToLinkedIn([job], 'https://www.interactjob.ma', { maxPosts: 1 });
  return { calls, first, state };
}

const normal = await scenario();
assert.equal(normal.first, 2);
assert.equal(normal.calls.length, 2, 'Second run must not duplicate either account');
assert.ok(normal.state['linkedin-job|id-1']);
assert.ok(normal.state['linkedin-company-job|id-1']);
const retry = await scenario({ failCompany: true });
assert.equal(retry.calls.filter(url => url.includes('ugcPosts')).length, 1, 'Company retry must preserve the successful profile post');
assert.equal(retry.calls.filter(url => url.includes('buffer')).length, 2);
assert.equal((await scenario({ profile: false })).calls.length, 1, 'Page sharing works independently of the personal profile');
assert.equal((await scenario({ live: false })).calls.length, 0, 'Only live offer pages can be shared');
console.log('OK: active direct offers, captions, both accounts, deduplication, partial failure retries and live-page checks. No real posts.');
