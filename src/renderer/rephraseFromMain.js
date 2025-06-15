// This file exposes a global function for Electron main process to call for rephrasing
import { rephraseText } from '../ai/flows/rephrase-text';

// Helper to get profile and LLM config from localStorage
function getProfileAndConfig() {
  const profiles = JSON.parse(localStorage.getItem('rephrasely-profiles') || '[]');
  const llmConfig = JSON.parse(localStorage.getItem('rephrasely-llm-config') || '{}');

  return { profiles, llmConfig };
}

// The main function to be called from Electron main process
window.rephraseFromMain = async function(selectedText) {
  try {
    const { profiles, llmConfig } = getProfileAndConfig();
    // Find the hotkey config that matches the selected profile
    // For simplicity, use the first profile as default
    const profile = profiles[0];
    if (!profile) {
      console.error('[rephraseFromMain] No profile found. Returning original text.');
      return selectedText;
    }
    const config = llmConfig[profile.provider];
    if (!config || !config.apiKey) {
      console.error('[rephraseFromMain] No API key found for provider:', profile.provider);
      return selectedText;
    }
    const input = {
      text: selectedText,
      prompt: profile.prompt,
      provider: profile.provider,
      model: profile.model,
      apiKey: config.apiKey,
    };
    console.log('[rephraseFromMain] Calling rephraseText with input:', input);
    let result;
    try {
      result = await rephraseText(input);
      console.log('[rephraseFromMain] rephraseText result:', result);
    } catch (apiErr) {
      console.error('[rephraseFromMain] rephraseText threw error:', apiErr);
      return selectedText;
    }
    if (!result || typeof result !== 'object') {
      console.error('[rephraseFromMain] Invalid or empty result from rephraseText:', result);
      return selectedText;
    }
    return result.rephrasedText || selectedText;
  } catch (err) {
    console.error('[rephraseFromMain] Unexpected error:', err);
    return selectedText;
  }
}
