const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');

function load(file, mocks = {}, extra = {}) {
  const exports = {};
  const callbacks = [];
  const response = {
    json: (body, opts = {}) => ({ body, status: opts.status || 200, headers: opts.headers }),
    redirect: url => ({ url: String(url), cookies: { set() {} } }),
  };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: name => {
      if (name === 'next/server') return { NextResponse: response, after: fn => callbacks.push(fn) };
      if (name === 'crypto') return { randomUUID, randomBytes };
      if (name === 'path') return path;
      if (name in mocks) return mocks[name];
      throw new Error(`Unmocked import: ${name}`);
    },
    process: { env: {}, cwd: () => '/test' }, Buffer, URL, Date,
    console: { log() {}, error() {} }, ...extra,
  });
  return { api: exports, callbacks };
}
const request = body => ({ json: async () => body, url: 'https://www.interactjob.ma/test' });
const valid = { title: 'Comptable', company: 'Test interne', city: 'Essaouira', sector: 'Finance', contractType: 'CDI', description: 'Description et profil réunis.', contactEmail: 'test@example.com' };

function publication(options = {}) {
  const state = { rows: [{ id: 'existing' }], writes: 0, emails: [], events: [] };
  const loaded = load('app/api/jobs/submit/route.ts', {
    fs: { promises: {
      readFile: async () => { if (options.readError) throw options.readError; return JSON.stringify(state.rows); },
      writeFile: async (_, json) => { state.writes++; state.rows = JSON.parse(json); },
    } },
    '@/lib/github-data': {
      githubConfigured: () => !!options.remote,
      appendJsonArrayToGithub: async (_, job) => { if (options.remoteError) throw new Error('offline'); state.rows.push(job); state.writes++; },
    },
    '@/lib/mailer': { sendEmail: async mail => { state.emails.push(mail); if (options.mailError) throw new Error('smtp'); return { delivered: !options.dryRun }; } },
    '@/lib/trackServerEvent': { trackServerEvent: async (_, event) => state.events.push(event) },
  }, options.vercel ? { process: { env: { VERCEL: '1' }, cwd: () => '/test' } } : {});
  return { ...loaded, state };
}

test('public submission is durable before emails and accepts requirements in the main description', async () => {
  for (const remote of [false, true]) {
    const { api, callbacks, state } = publication({ remote });
    const result = await api.POST(request(valid));
    assert.equal(result.status, 201);
    assert.equal(result.body.status, 'pending');
    assert.ok(result.body.reference);
    assert.equal(state.rows.length, 2);
    assert.equal(state.rows[1].requirements, '');
    assert.equal(state.rows[1].featured, false);
    assert.equal(state.emails.length, 0);
    await callbacks[0]();
    assert.equal(state.emails.length, 2);
    assert.ok(state.emails.some(mail => mail.to === 'contact@interactjob.ma'));
    assert.ok(state.emails.some(mail => mail.to === valid.contactEmail && mail.text.includes(result.body.reference)));
    assert.ok(state.events.includes('stored'));
  }
});

test('invalid requests never store data or send email', async () => {
  for (const body of [null, [], { ...valid, title: 42 }, { ...valid, contactEmail: 'a@' }, { ...valid, contractType: '' }]) {
    const { api, state } = publication();
    assert.equal((await api.POST(request(body))).status, 400);
    assert.equal(state.writes, 0);
    assert.equal(state.emails.length, 0);
  }
});

test('failed remote/local reads never reset the pending queue or claim success', async () => {
  for (const options of [{ readError: new Error('offline') }, { remote: true, remoteError: true }, { vercel: true }]) {
    const { api, callbacks, state } = publication(options);
    assert.equal((await api.POST(request(valid))).status, 500);
    assert.equal(state.writes, 0);
    assert.equal(state.rows.length, 1);
    for (const callback of callbacks) await callback();
    assert.equal(state.emails.length, 0);
    assert.ok(state.events.includes('storage_error'));
  }
});

test('SMTP failure or dry run cannot erase a saved application and is tracked', async () => {
  for (const options of [{ mailError: true }, { dryRun: true }]) {
    const { api, callbacks, state } = publication(options);
    assert.equal((await api.POST(request(valid))).status, 201);
    await callbacks[0]();
    assert.equal(state.rows.length, 2);
    assert.ok(state.events.includes('admin_notification_failed'));
    assert.ok(state.events.includes('employer_notification_failed'));
  }
});

test('admin uses live GitHub queue and distinguishes unavailable from empty', async () => {
  let failed = false;
  const { api } = load('app/api/admin/jobs/route.ts', {
    fs: { promises: { readFile: () => { throw new Error('must not read bundled snapshot'); } } },
    '@/lib/github-data': { githubConfigured: () => true, readJsonFromGithub: async () => { if (failed) throw new Error('offline'); return [{ id: 'new-request' }]; } },
  });
  const auth = { cookies: { get: () => ({ value: 'authenticated' }) } };
  const result = await api.GET(auth);
  assert.equal(result.body.jobs[0].id, 'new-request');
  assert.equal(result.headers['Cache-Control'], 'no-store');
  failed = true;
  assert.equal((await api.GET(auth)).status, 503);
  assert.equal((await api.GET({ cookies: { get: () => null } })).status, 401);
});

test('concurrent GitHub append retries against the latest file without losing the other recruiter', async () => {
  let rows = [{ id: 'old' }], version = 1, puts = 0;
  const { api } = load('lib/github-data.ts', {}, {
    process: { env: { GITHUB_TOKEN: 'fake-test', GITHUB_REPO: 'test/test' } },
    fetch: async (_, opts) => {
      if (opts.method === 'GET') return { ok: true, json: async () => ({ sha: String(version), content: Buffer.from(JSON.stringify(rows)).toString('base64') }) };
      const body = JSON.parse(opts.body); puts++;
      if (puts === 1) { rows.push({ id: 'concurrent' }); version++; return { ok: false, status: 409 }; }
      assert.equal(body.sha, String(version));
      rows = JSON.parse(Buffer.from(body.content, 'base64').toString());
      return { ok: true };
    },
  });
  await api.appendJsonArrayToGithub('data/pending-jobs.json', { id: 'mine' }, 'test');
  assert.deepEqual(rows.map(r => r.id), ['old', 'concurrent', 'mine']);
  assert.equal(puts, 2);
});

test('GitHub read errors do not produce an overwrite', async () => {
  let writes = 0;
  const { api } = load('lib/github-data.ts', {}, {
    process: { env: { GITHUB_TOKEN: 'fake-test', GITHUB_REPO: 'test/test' } },
    fetch: async (_, opts) => { if (opts.method !== 'GET') writes++; return { ok: false, status: 503, json: async () => ({ message: 'offline' }) }; },
  });
  await assert.rejects(api.appendJsonArrayToGithub('data/pending-jobs.json', { id: 'mine' }, 'test'));
  assert.equal(writes, 0);
});

test('admin approval or rejection cannot wipe queues following a read error', async () => {
  for (const action of ['approve', 'reject']) {
    let writes = 0;
    const { api } = load(`app/api/admin/jobs/${action}/[id]/route.ts`, {
      fs: { promises: {} },
      '@/lib/github-data': {
        githubConfigured: () => true,
        readJsonFromGithub: async () => { throw new Error('offline'); },
        commitJsonFilesToGithub: async () => { writes++; },
      },
      '@/lib/utils': { safeTruncate: text => text },
    });
    const req = { ...request({ job: { ...valid, applicantEmail: valid.contactEmail } }), cookies: { get: () => ({ value: 'authenticated' }) } };
    assert.equal((await api.POST(req, { params: Promise.resolve({ id: 'test' }) })).status, 500);
    assert.equal(writes, 0);
  }
});

test('old email URL delegates to the real verification handler', () => {
  const source = fs.readFileSync('app/employeur/verify-email/route.ts', 'utf8');
  assert.match(source, /export \{ GET \} from '@\/app\/api\/employer\/auth\/verify-email\/route'/);
});

test('verification is atomic, single use, and welcome email failure does not block login', async () => {
  let used = false, welcomeCalls = 0;
  const { api, callbacks } = load('app/api/employer/auth/verify-email/route.ts', {
    '@/lib/employer/db': { connectEmployerDB: async () => {} },
    '@/lib/models/Employer': { Employer: { findOneAndUpdate: async (query, update) => {
      assert.equal(query.email_verified, false);
      assert.ok(query.$or.some(term => term.email_verify_expires_at?.$gt));
      assert.equal(update.$unset.email_verify_token, '');
      if (used) return null; used = true;
      return { _id: 'test', email: 'test@example.com', company_name: 'Test', slug: 'test', plan: 'standard' };
    } } },
    '@/lib/employer/email': { sendWelcomeEmail: async () => { welcomeCalls++; throw new Error('smtp'); } },
    '@/lib/employer/auth': { signEmployerToken: async () => 'mock-session', buildSessionCookie: () => ({}) },
  });
  const req = { nextUrl: new URL('https://www.interactjob.ma/employeur/verify-email?token=test'), url: 'https://www.interactjob.ma/employeur/verify-email?token=test' };
  assert.match((await api.GET(req)).url, /\/employeur\?welcome=1$/);
  await callbacks[0](); assert.equal(welcomeCalls, 1);
  assert.match((await api.GET(req)).url, /token_invalid/);
});

test('resend requires the existing password, enforces cooldown and reports email failures', async () => {
  let calls = 0, outcome = { sent: true, cooldown: false };
  const { api } = load('app/api/employer/auth/resend-verification/route.ts', {
    bcryptjs: { compare: async value => value === 'correct' },
    '@/lib/employer/db': { connectEmployerDB: async () => {} },
    '@/lib/models/Employer': { Employer: { findOne: async () => ({ _id: 'test', password_hash: 'mock', email_verified: false }) } },
    '@/lib/employer/verification': { resendEmployerVerification: async () => { calls++; return outcome; } },
  });
  assert.equal((await api.POST(request({ email: 'test@example.com', password: 'wrong' }))).status, 401);
  assert.equal(calls, 0);
  assert.equal((await api.POST(request({ email: 'test@example.com', password: 'correct' }))).status, 200);
  outcome = { sent: false, cooldown: true };
  assert.equal((await api.POST(request({ email: 'test@example.com', password: 'correct' }))).status, 429);
  outcome = { sent: false, cooldown: false };
  assert.equal((await api.POST(request({ email: 'test@example.com', password: 'correct' }))).status, 503);
});

test('resend rotates the token with expiry and reserves the cooldown atomically', async () => {
  let reserved = false, emails = 0;
  const { api } = load('lib/employer/verification.ts', {
    '@/lib/models/Employer': { Employer: { findOneAndUpdate: async (filter, update) => {
      assert.ok(filter.$or); assert.equal(filter.email_verified, false);
      assert.equal(update.$set.email_verify_token.length, 64);
      assert.ok(update.$set.email_verify_expires_at > new Date());
      if (reserved) return null; reserved = true;
      return { email: 'test@example.com', company_name: 'Test', ...update.$set };
    } } },
    '@/lib/employer/email': { sendVerificationEmail: async () => { emails++; return { delivered: true }; } },
  });
  assert.equal((await api.resendEmployerVerification('test')).sent, true);
  assert.equal((await api.resendEmployerVerification('test')).cooldown, true);
  assert.equal(emails, 1);
});

test('registration preserves the account when SMTP fails and gives an honest response', async () => {
  let created = 0;
  const { api, callbacks } = load('app/api/employer/auth/register/route.ts', {
    bcryptjs: { hash: async () => 'mock-hash' },
    '@/lib/employer/db': { connectEmployerDB: async () => {} },
    '@/lib/models/Employer': { Employer: { findOne: async () => null, create: async fields => { created++; assert.ok(fields.email_verify_expires_at); return { ...fields, _id: 'test' }; } } },
    '@/lib/employer/email': { sendVerificationEmail: async () => { throw new Error('smtp'); } },
    '@/lib/mailer': { sendEmail: async () => ({ delivered: true }) },
  });
  const result = await api.POST(request({ email: 'test@example.com', password: 'not-a-real-password', company_name: 'Test', phone: '+212600000000' }));
  assert.equal(result.status, 200);
  assert.equal(result.body.verificationSent, false);
  assert.equal(created, 1);
  await callbacks[0]();
});

test('verification email retains actionable links and returns the real send outcome', async () => {
  let mail;
  const { api } = load('lib/employer/email.ts', {
    '@/lib/mailer': { sendEmail: async data => { mail = data; return { delivered: true }; } },
  }, { process: { env: { GMAIL_APP_PASSWORD: 'fake-test' } } });
  assert.equal((await api.sendVerificationEmail('test@example.com', 'test-token', 'Test')).delivered, true);
  assert.match(mail.text, /https:\/\/www.interactjob.ma\/employeur\/verify-email\?token=test-token/);
  assert.match(mail.text, /\/publier/);
});
