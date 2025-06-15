'use server';

import { generateWithFallback } from '../genkit';
import { RephraseTextInput, RephraseTextOutput } from '@/lib/schemas';
import type { RephraseTextInput as RephraseTextInputType, RephraseTextOutput as RephraseTextOutputType } from '@/lib/schemas';

// Export only the main async function for server actions
export async function rephraseText(input: RephraseTextInputType): Promise<RephraseTextOutputType> {
  // Validate input
  const validatedInput = RephraseTextInput.parse(input);

  const fullPrompt = `${validatedInput.prompt}

Original text:
${validatedInput.text}

Please provide the rephrased text:`;

  try {
    console.log(`[rephraseText] Starting with provider: ${validatedInput.provider}, model: ${validatedInput.model}`);
    
    // Use the enhanced generateWithFallback function for robust model handling
    const response = await generateWithFallback(
      validatedInput.provider,
      validatedInput.apiKey,
      validatedInput.model,
      fullPrompt
    );

    const result = {
      rephrasedText: response.text,
    };

    console.log(`[rephraseText] Successfully generated response`);
    
    // Validate output
    return RephraseTextOutput.parse(result);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[rephraseText] Error during generation:', error);
    
    // Provide more helpful error messages
    if (errorMessage.includes('All') && errorMessage.includes('models failed')) {
      throw new Error(`Unable to generate response: ${errorMessage}. Please check your API key and try again.`);
    }
    
    if (errorMessage.includes('API key')) {
      throw new Error('Invalid API key. Please check your API key in Settings.');
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      throw new Error('API quota exceeded. Please check your account limits or try again later.');
    }
    
    // Re-throw with original message for other errors
    throw error;
  }
}
