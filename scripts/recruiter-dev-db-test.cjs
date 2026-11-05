// Runs only against the existing dev database, with all mail/session delivery mocked.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const crypto = require('node:crypto');
const { Mongoose } = require('mongoose');
const bcrypt = require('bcryptjs');
require('@next/env').loadEnvConfig('C:/Users/Adil/interactjob');

const callbacks = [];
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, {
    exports, require: name => {
      if (name === 'next/server') return {
        NextResponse: { json: (body, opts = {}) => ({ body, status: opts.status || 200 }), redirect: url => ({ url: String(url), cookies: { set() {} } }) },
        after: fn => callbacks.push(fn),
      };
      if (name in mocks) return mocks[name];
      throw new Error('Unexpected dependency: ' + name);
    }, console: { log() {}, error() {} }, Buffer, URL, Date,
  });
  return exports;
}

(async () => {
  if (!process.env.MONGODB_URI_DEV) throw new Error('Dev database is not configured');
  const db = new Mongoose();
  let id;
  const email = `qa-recruiter-${crypto.randomUUID()}@example.invalid`;
  try {
    await db.connect(process.env.MONGODB_URI_DEV, { dbName: 'interactjob_dev', serverSelectionTimeoutMS:10000 });
    assert.equal(db.connection.name, 'interactjob_dev');
    const { Employer } = load('lib/models/Employer.ts', { mongoose: db });
    let emails = 0;
    const deps = {
      crypto, bcryptjs: bcrypt,
      '@/lib/models/Employer': { Employer },
      '@/lib/employer/db': { connectEmployerDB: async () => db },
      '@/lib/employer/email': { sendVerificationEmail: async () => { emails++; return { delivered:true }; }, sendWelcomeEmail: async () => {} },
      '@/lib/mailer': { sendEmail: async () => ({ delivered:true }) },
      '@/lib/employer/auth': { signEmployerToken: async () => 'test-only', buildSessionCookie: () => ({}) },
    };
    const register = load('app/api/employer/auth/register/route.ts', deps);
    const result = await register.POST({ json:async()=>({email,password:'temporary-test-password',company_name:'QA internal recruiter test',phone:'+212600000000'}) });
    assert.equal(result.status, 200); id = result.body.employer_id;
    assert.ok(id); assert.equal(result.body.verificationSent, true);
    let employer = await Employer.findById(id);
    const original = employer.email_verify_token;
    assert.equal(employer.email_verified, false);
    // Simulate an email older than the resend cooldown.
    await Employer.updateOne({ _id:id }, { $set:{verification_sent_at:new Date(Date.now()-120000)} });
    const verification = load('lib/employer/verification.ts', deps);
    assert.equal((await verification.resendEmployerVerification(id)).sent, true);
    assert.equal((await verification.resendEmployerVerification(id)).cooldown, true);
    employer = await Employer.findById(id);
    const token = employer.email_verify_token;
    assert.notEqual(token, original);
    const verify = load('app/api/employer/auth/verify-email/route.ts', deps);
    const req = value => ({ nextUrl:new URL('https://example.invalid/employeur/verify-email?token='+value),url:'https://example.invalid/employeur/verify-email?token='+value });
    assert.match((await verify.GET(req(original))).url, /token_invalid/);
    await Employer.updateOne({ _id:id }, { $set:{email_verify_expires_at:new Date(Date.now()-1000)} });
    assert.match((await verify.GET(req(token))).url, /token_invalid/);
    await Employer.updateOne({ _id:id }, { $set:{email_verify_expires_at:new Date(Date.now()+60000)} });
    assert.match((await verify.GET(req(token))).url, /welcome=1/);
    assert.match((await verify.GET(req(token))).url, /token_invalid/);
    employer = await Employer.findById(id);
    assert.equal(employer.email_verified,true); assert.equal(employer.email_verify_token,undefined);
    for (const callback of callbacks) await callback();
    assert.equal(emails,2);
    console.log('PASS: dev MongoDB registration, token rotation, cooldown, expiry, activation and single use. No real email sent.');
  } finally {
    // Delete only the disposable record created by this run, never other records.
    if (id) await db.connection.collection('employers').deleteOne({ _id:new db.Types.ObjectId(id),email });
    else if (db.connection.readyState === 1) await db.connection.collection('employers').deleteOne({email});
    await db.disconnect();
  }
})().catch(error=>{console.error(error.name+': '+error.message);process.exitCode=1});
