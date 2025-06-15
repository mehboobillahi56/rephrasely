import fetch from 'node-fetch';

const API_KEY = process.env.ANTHROPIC_API_KEY || '<YOUR_ANTHROPIC_API_KEY>';

async function listModels() {
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
  });
  if (!res.ok) {
    console.error('Failed to fetch models:', res.status, await res.text());
    process.exit(1);
  }
  const data = await res.json();
  console.log('Available Anthropic models:', data);
}

listModels();
