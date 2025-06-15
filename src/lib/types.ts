export type LLMProvider = 'google' | 'meta' | 'anthropic';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
}

export const availableModels: Record<LLMProvider, LLMModel[]> = {
  google: [
    { id: 'googleai/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' },
    { id: 'googleai/gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google' },
    { id: 'googleai/gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google' },
  ],
  meta: [
    { id: 'meta/llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'meta' },
    { id: 'meta/llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'meta' },
    { id: 'meta/llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'meta' },
  ],
  anthropic: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic' },
  ],
};

export interface Profile {
  id: string;
  name: string;
  prompt: string;
  provider: LLMProvider;
  model: string;
}

export interface LLMConfig {
  google: { apiKey: string };
  meta: { apiKey: string };
  anthropic: { apiKey: string };
}

export interface HotkeyConfig {
  id: string;
  profileId: string;
  keyLabel: string;
  combination: string;
}
