import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { anthropic, claude35Sonnet, claude3Opus, claude3Haiku } from 'genkitx-anthropic';

// Define fallback model lists for each provider using PLUGIN constants, not API names
const ANTHROPIC_MODEL_FALLBACKS = [
  claude35Sonnet,      // Plugin constant for Claude 3.5 Sonnet
  claude3Opus,         // Plugin constant for Claude 3 Opus  
  claude3Haiku,        // Plugin constant for Claude 3 Haiku
];

const GOOGLE_MODEL_FALLBACKS = [
  'googleai/gemini-1.5-pro',
  'googleai/gemini-1.5-flash',
  'googleai/gemini-pro',
];

export function getAI(provider: string, apiKey: string, model: string) {
  if (provider === 'google') {
    process.env.GEMINI_API_KEY = apiKey;
    return genkit({ plugins: [googleAI()], model });
  }
  
  if (provider === 'anthropic') {
    process.env.ANTHROPIC_API_KEY = apiKey;
    
    // Map string model IDs to Genkit plugin constants
    function getGenkitModelConstant(model: string): typeof claude35Sonnet | typeof claude3Opus | typeof claude3Haiku {
      const m = model.toLowerCase();
      
      // Map common display names to plugin constants
      if (m.includes('sonnet') || m.includes('claude-3-5-sonnet') || m === 'claude-3.5-sonnet') {
        return claude35Sonnet;
      }
      if (m.includes('opus') || m.includes('claude-3-opus') || m === 'claude-3-opus') {
        return claude3Opus;
      }
      if (m.includes('haiku') || m.includes('claude-3-haiku') || m === 'claude-3-haiku') {
        return claude3Haiku;
      }
      
      // Default fallback to Claude 3.5 Sonnet (most capable)
      return claude35Sonnet;
    }
    
    const modelConstant = getGenkitModelConstant(model);
    return genkit({ plugins: [anthropic({ apiKey })], model: modelConstant });
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

// Enhanced function with fallback logic for the rephraseText flow
export async function generateWithFallback(provider: string, apiKey: string, model: string, prompt: string): Promise<{ text: string }> {
  if (provider === 'anthropic') {
    // Try the requested model first, then fallback to others (using plugin constants)
    const requestedModel = getGenkitModelFromString(model);
    const modelsToTry = [requestedModel, ...ANTHROPIC_MODEL_FALLBACKS.filter(m => m !== requestedModel)];
    
    for (const modelToTry of modelsToTry) {
      try {
        console.log(`[generateWithFallback] Trying Anthropic model: ${modelToTry}`);
        process.env.ANTHROPIC_API_KEY = apiKey;
        const ai = genkit({ plugins: [anthropic({ apiKey })], model: modelToTry });
        const response = await ai.generate(prompt);
        console.log(`[generateWithFallback] Success with model: ${modelToTry}`);
        return response;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[generateWithFallback] Model ${modelToTry} failed:`, errorMessage);
        // Continue to next model
        continue;
      }
    }
    
    throw new Error(`All Anthropic models failed. Last error: Unable to generate response with any available model.`);
  }
  
  if (provider === 'google') {
    // Try the requested model first, then fallback to others
    const modelsToTry = [model, ...GOOGLE_MODEL_FALLBACKS.filter(m => m !== model)];
    
    for (const modelToTry of modelsToTry) {
      try {
        console.log(`[generateWithFallback] Trying Google model: ${modelToTry}`);
        const ai = getAI(provider, apiKey, modelToTry);
        const response = await ai.generate(prompt);
        console.log(`[generateWithFallback] Success with model: ${modelToTry}`);
        return response;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[generateWithFallback] Model ${modelToTry} failed:`, errorMessage);
        // Continue to next model
        continue;
      }
    }
    
    throw new Error(`All Google models failed. Last error: Unable to generate response with any available model.`);
  }
  
  // For other providers, use the original logic
  const ai = getAI(provider, apiKey, model);
  return await ai.generate(prompt);
}

// Helper function to map string model names to plugin constants
function getGenkitModelFromString(model: string): typeof claude35Sonnet | typeof claude3Opus | typeof claude3Haiku {
  const m = model.toLowerCase();
  
  if (m.includes('sonnet') || m.includes('claude-3-5-sonnet') || m === 'claude-3.5-sonnet') {
    return claude35Sonnet;
  }
  if (m.includes('opus') || m.includes('claude-3-opus') || m === 'claude-3-opus') {
    return claude3Opus;
  }
  if (m.includes('haiku') || m.includes('claude-3-haiku') || m === 'claude-3-haiku') {
    return claude3Haiku;
  }
  
  // Default fallback to Claude 3.5 Sonnet
  return claude35Sonnet;
}
