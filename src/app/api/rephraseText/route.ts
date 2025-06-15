import { NextRequest, NextResponse } from 'next/server';
import { rephraseText } from '@/ai/flows/rephrase-text';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.text || !body.provider || !body.apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: text, provider, apiKey' },
        { status: 400 }
      );
    }

    // Call the server action
    const result = await rephraseText({
      text: body.text,
      prompt: body.prompt || '',
      provider: body.provider,
      model: body.model,
      apiKey: body.apiKey,
    });

    return NextResponse.json({
      rephrased: result.rephrasedText,
      success: true,
    });

  } catch (error: any) {
    console.error('[API rephraseText] Error:', error);
    
    // Return JSON error response instead of HTML
    return NextResponse.json(
      { 
        error: error.message || 'Failed to rephrase text',
        detail: error.originalMessage || error.detail || undefined,
      },
      { status: error.status || error.code || 500 }
    );
  }
}
