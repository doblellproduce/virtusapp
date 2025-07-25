'use client';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is the client-safe `ai` object.
// It should not contain any server-side plugins like `googleAI()`.
export const ai = genkit({
  plugins: [],
});
