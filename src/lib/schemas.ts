import { z } from 'zod';

// Input and output schemas for AI operations
export const RephraseTextInput = z.object({
  text: z.string().min(1, 'Text is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  provider: z.string().min(1, 'Provider is required'),
  model: z.string().min(1, 'Model is required'),
  apiKey: z.string().min(1, 'API key is required'),
});

export const RephraseTextOutput = z.object({
  rephrasedText: z.string(),
});

export type RephraseTextInput = z.infer<typeof RephraseTextInput>;
export type RephraseTextOutput = z.infer<typeof RephraseTextOutput>;
