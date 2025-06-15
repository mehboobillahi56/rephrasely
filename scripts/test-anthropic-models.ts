import { getAI } from '../src/ai/genkit';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '<YOUR_ANTHROPIC_API_KEY>';
const models = [
  'Claude Sonnet 4',
  'Claude Sonnet 3.7',
  'Claude Sonnet 3.5',
  'Claude Opus 4',
  'Claude Opus 3',
  'Claude Haiku 3.5',
];

async function testModel(model: string) {
  try {
    const ai = getAI('anthropic', ANTHROPIC_API_KEY, model);
    const response = await ai.generate({ prompt: 'Say hello from ' + model });
    console.log(`[SUCCESS] Model: ${model} =>`, response.text);
  } catch (err) {
    console.error(`[FAIL] Model: ${model} =>`, err);
  }
}

(async () => {
  for (const model of models) {
    await testModel(model);
  }
})();
