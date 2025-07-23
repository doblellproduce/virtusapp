import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [], // Remove server-side plugins from client-safe file
  model: 'googleai/gemini-2.0-flash',
});
