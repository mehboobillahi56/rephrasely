import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API] Received request body:', JSON.stringify(body, null, 2));
    
    const { text, prompt, provider, model, apiKey } = body;

    // Detailed parameter validation
    if (!text) {
      console.log('[API] Missing parameter: text');
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      );
    }
    
    if (!prompt) {
      console.log('[API] Missing parameter: prompt');
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      );
    }
    
    if (!apiKey) {
      console.log('[API] Missing parameter: apiKey');
      return NextResponse.json(
        { error: 'Missing required field: apiKey' },
        { status: 400 }
      );
    }

    // If provider is not provided, try to infer it from the API key format or default to anthropic
    let inferredProvider = provider;
    if (!inferredProvider) {
      if (apiKey.startsWith('sk-ant-')) {
        inferredProvider = 'anthropic';
      } else if (apiKey.startsWith('sk-')) {
        inferredProvider = 'openai';
      } else {
        // Default to anthropic for backward compatibility
        inferredProvider = 'anthropic';
      }
    }

    console.log('[API] Rephrasing request:', { provider: inferredProvider, model, textLength: text.length });

    let result: string;

    if (inferredProvider === 'anthropic') {
      // Call Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\n"${text}"`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[API] Anthropic error:', response.status, errorData);
        throw new Error(`Anthropic API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      result = data.content[0].text.trim();

    } else if (inferredProvider === 'openai') {
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-4',
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\n"${text}"`
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[API] OpenAI error:', response.status, errorData);
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      result = data.choices[0].message.content.trim();

    } else {
      throw new Error(`Unsupported provider: ${inferredProvider}`);
    }

    console.log('[API] Rephrasing successful');
    return NextResponse.json({ rephrasedText: result });

  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to rephrase text' },
      { status: 500 }
    );
  }
}
