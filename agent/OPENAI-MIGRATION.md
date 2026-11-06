# OpenAI-only publishing agent

The agent's generation workloads use the OpenAI Responses API, not Anthropic.
`OPENAI_API_KEY` is required. Fast text workloads default to `gpt-6-luna`
(`reasoning.effort: none`); longer writing defaults to `gpt-6-astra` (`low`).
`OPENAI_MODEL_FAST` and `OPENAI_MODEL_WRITING` can override these defaults;
verify each replacement supports the configured reasoning effort first.
Prompts, text output contracts and existing plain-template fallbacks are retained.
There is no automatic fallback to another AI provider. Requests use `store: false`.
The separate Claude visibility measurement is disabled (not relabelled as OpenAI).

## Verification and rollout gate (2026-10-26)

- Automated adapter and remote publication tests: `node --test agent/ai-client.test.mjs agent/linkedin-remote-poster.test.mjs`.
- OpenAI model-list authentication succeeded; configured models are accessible.
- Real private text-generation attempts failed with HTTP 429,
  `credit_balance_exhausted` / `insufficient_quota`.
- Railway uses the same OpenAI credential as the local agent (comparison only;
  no credential recorded in source or test output).
- No production code deployment was performed for this migration.

Before rollout: fund the OpenAI API project or provision a funded project key,
then repeat private generation tests for both workloads and representative JSON
and LinkedIn teaser prompts. Review and deploy the dedicated branch only after
these pass. Do not trigger public test posts to validate model access. ChatGPT /
Codex subscription usage does not fund this Railway API integration.
