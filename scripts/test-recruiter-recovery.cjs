const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => mocks[name] || require(name),
    process, console: { error() {} }, Date, setTimeout: fn => fn() });
  return exports;
}
const policy = load('lib/recruiter-policy.ts');
const next = callbacks => ({ NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) },
  after: callback => callbacks.push(callback) });
const valid = { companyName: 'Entreprise', email: 'rh@example.com', message: 'Descriptif complet' };
const request = body => ({ json: async () => body });

function leadsScenario({ delivered = true, emailFailure = false } = {}) {
  const callbacks = [], emails = [], records = [], updates = [];
  const mocks = {
    'next/server': next(callbacks),
    '@/lib/db': { connectDB: async () => {} },
    '@/lib/recruiter-policy': policy,
    '@/lib/mailer': { sendEmail: async email => {
      emails.push(email);
      if (emailFailure) throw new Error('SMTP unavailable');
      return { delivered };
    } },
    '@/lib/models/EmployerInboundLead': { EmployerInboundLead: {
      create: async data => { const lead = { _id: 'lead-id', ...data }; records.push(lead); return lead; },
      updateOne: async (query, update) => updates.push({ query, update }),
    } },
  };
  return { api: load('app/api/recruteurs/lead/route.ts', mocks), callbacks, emails, records, updates };
}

(async () => {
  for (const company of ['Pumpkin', 'PUMPKIN', 'M2 Square Meter', 'Square-Metre']) {
    assert.equal(policy.excludedFromRecruiterOutreach(company), true);
  }
  assert.equal(policy.excludedFromRecruiterOutreach('SPANA'), false);
  assert.equal(policy.excludedFromRecruiterOutreach('Autre', 'direction@m2squaremeter.com'), true);

  const normal = leadsScenario();
  assert.equal((await normal.api.POST(request({ ...valid, message: 'a'.repeat(12000) }))).status, 200);
  assert.equal(normal.records[0].message.length, 12000);
  assert.equal(normal.emails.length, 0, 'Email runs after durable save');
  await normal.callbacks[0]();
  assert.equal(normal.emails.length, 2);
  assert.equal(normal.updates[0].update.$set.admin_notification, 'sent');
  assert.equal(normal.updates[0].update.$set.acknowledgement, 'sent');
  assert.ok(!normal.emails[0].text.includes(valid.email), 'Admin alert stays free of contact details');

  for (const body of [null, [], { ...valid, companyName: 12 }, { ...valid, email: 'invalid' }, { ...valid, message: 'a'.repeat(30001) }]) {
    const scenario = leadsScenario();
    assert.equal((await scenario.api.POST(request(body))).status, 400);
    assert.equal(scenario.records.length, 0);
  }
  const bot = leadsScenario();
  assert.equal((await bot.api.POST(request({ ...valid, website: 'spam' }))).status, 200);
  assert.equal(bot.records.length, 0);

  for (const options of [{ delivered: false }, { emailFailure: true }]) {
    const scenario = leadsScenario(options);
    assert.equal((await scenario.api.POST(request(valid))).status, 200);
    await scenario.callbacks[0]();
    assert.equal(scenario.records.length, 1, 'Mail failure never loses the request');
    assert.equal(scenario.updates[0].update.$set.admin_notification, 'failed');
  }
  const excluded = leadsScenario();
  await excluded.api.POST(request({ ...valid, companyName: 'M2 Square Meter' }));
  await excluded.callbacks[0]();
  assert.equal(excluded.emails.length, 1, 'No outbound contact to excluded employer');
  assert.equal(excluded.updates[0].update.$set.acknowledgement, 'skipped');

  const outbound = [], logs = [];
  const col = {
    find: () => ({ toArray: async () => [
      { _id: '1', company_name: 'Pumpkin', email: 'pumpkin@example.com' },
      { _id: '2', company_name: 'M2 Square Meter', email: 'square@example.com' },
      { _id: '3', company_name: 'Entreprise', email: 'rh@example.com', status: 'prospect' },
    ] }),
    updateOne: async () => {}, insertOne: async data => logs.push(data),
  };
  const send = load('app/api/admin/employers/send/route.ts', {
    'next/server': next([]), '@/lib/recruiter-policy': policy,
    '@/lib/mailer': { sendEmail: async email => { outbound.push(email); return { delivered: true }; } },
    mongodb: { ObjectId: class {}, MongoClient: class {
      async connect() {} async close() {} db() { return { collection: () => col }; }
    } },
  });
  const res = await send.POST({ cookies: { get: () => ({ value: 'authenticated' }) },
    json: async () => ({ employerIds: ['1', '2', '3'], template: 'cold' }) });
  assert.equal(res.body.sent, 1);
  assert.equal(outbound[0].to, 'rh@example.com');
  assert.ok(outbound[0].text.includes('/publier'));
  assert.ok(!outbound[0].text.includes('/publier-offre'));
  assert.ok(!outbound[0].text.includes('990 MAD'));
  assert.equal(logs.length, 1);
  console.log('OK : descriptif intégral, validation, honeypot, alerte/accusé, panne email, exclusions et lien gratuit de prospection. Aucun envoi ni accès réseau réel.');
})().catch(error => { console.error(error); process.exitCode = 1; });
