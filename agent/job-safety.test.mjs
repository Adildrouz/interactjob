// Run: node agent/job-safety.test.mjs
import assert from 'node:assert/strict';
import { assertDirectOffersIntact, assertNoSuspiciousDrop, JobsSafetyError } from './job-safety.js';
import { expireJobs } from './expirer.js';

const direct = (id, extra = {}) => ({ id, source: 'Direct', title: `Offer ${id}`, expired: false, ...extra });
const scraped = (id, extra = {}) => ({ id, source: 'RSS', title: `Scraped ${id}`, expired: false, ...extra });
const throwsSafety = (fn) => assert.throws(fn, (e) => e instanceof JobsSafetyError);

// 1. Removing one Direct offer aborts even though it is far below the 20% count threshold.
const base = [...Array.from({ length: 70 }, (_, i) => direct(`d${i}`)), ...Array.from({ length: 430 }, (_, i) => scraped(`s${i}`))];
assertNoSuspiciousDrop(base, base.filter((j) => j.id !== 'd3'), 'test');
throwsSafety(() => assertDirectOffersIntact(base, base.filter((j) => j.id !== 'd3'), 'test'));

// 2. Flipping a Direct offer to expired aborts (count unchanged, so the 20% guard cannot see it).
const flipped = base.map((j) => (j.id === 'd5' ? { ...j, expired: true } : j));
assertNoSuspiciousDrop(base, flipped, 'test');
throwsSafety(() => assertDirectOffersIntact(base, flipped, 'test'));

// 3. A manual close (expired + manually_closed) is allowed, and so is removing an already manually-closed offer.
assertDirectOffersIntact(base, base.map((j) => (j.id === 'd5' ? { ...j, expired: true, manually_closed: true } : j)), 'test');
const closed = base.map((j) => (j.id === 'd7' ? { ...j, expired: true, manually_closed: true } : j));
assertDirectOffersIntact(closed, closed.filter((j) => j.id !== 'd7'), 'test');

// 4. Scraped jobs changing is none of this guard's business; new Direct offers are fine.
assertDirectOffersIntact(base, [...base.filter((j) => j.source === 'Direct'), direct('new1')], 'test');
assertDirectOffersIntact(base, base.map((j) => (j.id === 's1' ? { ...j, expired: true } : j)), 'test');

// 5. Already-expired Direct offers staying expired is not a change.
const alreadyExpired = base.map((j) => (j.id === 'd9' ? { ...j, expired: true } : j));
assertDirectOffersIntact(alreadyExpired, alreadyExpired, 'test');

// 6. The real expirer keeps old Direct offers (regression guard for the isDirect exemption).
const old = '2026-01-01';
const aged = [...Array.from({ length: 5 }, (_, i) => direct(`old${i}`, { postedAt: old, date_posted: old })), ...Array.from({ length: 600 }, (_, i) => scraped(`x${i}`, { postedAt: old, date_posted: old }))];
const { jobs: out } = expireJobs(aged);
assertDirectOffersIntact(aged, out, 'test');
assert.equal(out.filter((j) => j.source === 'Direct' && !j.expired).length, 5);

console.log('job-safety tests: all passed');
