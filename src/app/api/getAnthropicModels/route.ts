import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { apiKey } = await req.json();
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch models', detail: await res.text() }, { status: res.status });
    }
    const data = await res.json();
    // Format: [{ id, display_name }]
    const models = (data.data || []).map((m: any) => ({ id: m.id, displayName: m.display_name }));
    return NextResponse.json({ models });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
