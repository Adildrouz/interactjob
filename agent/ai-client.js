/** OpenAI-only text adapter. Keeps existing agent text/usage contracts intact. */
export default class AgentAI {
  constructor({ apiKey = process.env.OPENAI_API_KEY, fetch: fetchImpl = globalThis.fetch } = {}) {
    this.apiKey = apiKey;
    this.fetch = fetchImpl;
    this.messages = { create: request => this.create(request) };
  }

  async create({ model = 'fast', max_tokens = 600, system, messages, ...unsupported }) {
    if (!this.apiKey?.trim()) throw new Error('OPENAI_API_KEY manquant');
    if (Object.keys(unsupported).length) throw new Error('Unsupported AI request options');
    if (!['fast', 'writing'].includes(model)) throw new Error('Unknown AI workload tier');
    if (!Number.isInteger(max_tokens) || max_tokens < 1) throw new Error('Invalid token budget');
    if (!Array.isArray(messages) || messages.some(m => !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string')) {
      throw new Error('Only text messages are supported');
    }
    const writing = model === 'writing';
    const selectedModel = writing
      ? process.env.OPENAI_MODEL_WRITING || 'gpt-6-astra'
      : process.env.OPENAI_MODEL_FAST || 'gpt-6-luna';
    // Preserve the previous non-reasoning fast path. Astra needs a reasoning budget.
    const body = {
      model: selectedModel,
      input: messages,
      ...(system ? { instructions: system } : {}),
      reasoning: { effort: writing ? 'low' : 'none' },
      max_output_tokens: writing ? max_tokens + 2048 : max_tokens,
      store: false,
    };
    const response = await this.fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      // Never log provider error bodies, prompts, authorization headers or credentials.
      throw new Error(`OpenAI HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== 'completed') throw new Error(`OpenAI response not completed (${data.status || 'unknown'})`);
    const text = (data.output || [])
      .filter(item => item.type === 'message' && item.role === 'assistant')
      .flatMap(item => item.content || [])
      .filter(item => item.type === 'output_text')
      .map(item => item.text).join('\n');
    if (!text.trim()) throw new Error('OpenAI returned no text');
    return {
      content: [{ type: 'text', text }],
      usage: { input_tokens: data.usage?.input_tokens || 0, output_tokens: data.usage?.output_tokens || 0 },
      model: data.model || selectedModel,
    };
  }
}
