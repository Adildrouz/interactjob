export type AiProvider = 'openai' | 'deepseek';

export interface ChatCompletionRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

function resolveProxyUrl(provider: AiProvider): string {
  if (provider === 'deepseek') {
    return (
      process.env.NEXT_PUBLIC_DEEPSEEK_PROXY_URL ?? '/api.php?provider=deepseek'
    );
  }
  return process.env.NEXT_PUBLIC_OPENAI_PROXY_URL ?? '/api.php?provider=openai';
}

/** Appels IA via proxy serveur (api.php ou routes Next) — jamais de clé API dans le bundle client. */
export async function chatCompletions(
  provider: AiProvider,
  payload: ChatCompletionRequest
): Promise<Response> {
  return fetch(resolveProxyUrl(provider), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
