// Browser-compatible version of rephrase function without Genkit
export async function rephraseText(input: { text: string; prompt: string; apiKey: string }) {
  console.log(' [browser-rephrase] Starting rephraseText function');
  console.log(' Input text:', input.text);
  console.log(' Prompt:', input.prompt);
  console.log(' API key (first 10 chars):', input.apiKey?.substring(0, 10) + '...');
  
  try {
    const { text, prompt, apiKey } = input;
    
    if (!text || !prompt || !apiKey) {
      console.error(' Missing required parameters:', { hasText: !!text, hasPrompt: !!prompt, hasApiKey: !!apiKey });
      throw new Error('Missing required parameters');
    }

    console.log(' Making API call to Anthropic...');
    
    // Call Anthropic API directly
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\n"${text}"`
          }
        ]
      })
    });

    console.log(' API Response status:', response.status);
    console.log(' API Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(' API Error:', response.status, errorData);
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log(' API Response data:', data);
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error(' Invalid response format:', data);
      throw new Error('Invalid response format from API');
    }

    const result = data.content[0].text.trim();
    console.log(' Rephrasing successful!');
    console.log(' Final result:', result);
    return result;
  } catch (error) {
    console.error(' Rephrase error:', error);
    console.error(' Returning original text due to error');
    throw error;
  }
}
