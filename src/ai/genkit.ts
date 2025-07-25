'use server';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is the server-side `ai` object.
// It should contain server-side plugins like `googleAI()`.
export const ai = genkit({
  plugins: [googleAI()],
});
