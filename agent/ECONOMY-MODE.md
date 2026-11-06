# Agent economy mode

Requested 2026-11-02: reduce automatic LinkedIn posts and stop paid AI generation
attempts, while retaining site availability and operational Telegram alerts.

- Paid agent generations are disabled by default. Only an explicit
  `AGENT_AI_ENABLED=true` enables the existing providers again.
- Daily/weekly/monthly factual statistics remain. Provider citation checks do not
  run when disabled; Telegram displays a paused status, not three provider errors.
- AI-written blog articles, narrative KPI emails, AI message replies and AI job
  enrichment are paused. Existing local templates remain where available.
- The sole automatic LinkedIn digest is `12:00 OFFRES MIDI`, at noon Casablanca.
  Its existing personal-profile/company-page mirroring remains: one digest may
  produce one publication on each account. Independent remote/job/night posts
  are disabled. Existing per-day digest dedup remains in place.
- PM2 has a dedicated `--linkedin-daily` one-shot; obsolete publishing/blog jobs
  are excluded. Reconcile the loaded PM2 process list when deploying: changing
  the ecosystem file alone does not remove existing registered processes.
- Scraping, candidate data, websites and genuine technical failure alerts are not
  disabled by this change. Some enrichment/translation text falls back to source
  content while paid AI is disabled.

## Verification and deployment status

`node --test agent/economy.test.mjs` checks real function guards in a sandbox,
without provider calls, public posts, Telegram sends or production writes.

The known Railway service reported no active deployments; its health URL returned
404 on 2026-11-02. Do not start a new paid service just to apply this change.
The local copy received targeted guards, preserving unrelated existing edits.
No active local PM2 daemon was found during the audit; its saved process list is
not evidence of running processes. One pre-existing local file, concours-parser.js,
is absent, so that local source cannot be treated as a verified deployable clone.
Identify the sender of any newly received Telegram message before claiming the
live scheduler has been updated. Deploy this reviewed branch to that instance,
then verify startup scheduling and the next factual report without sending a
public test post. The earlier OpenAI migration PR is not required for this change.

This change does not lower Vercel's fixed subscription or Atlas Flex's minimum
charge. Previously rejected API calls may have generated no billable output;
no exact monetary saving is claimed without provider billing records.
