import {config} from 'dotenv';
config({path: '.env'});

import {googleAI} from '@genkit-ai/googleai';
import {genkit} from 'genkit';

// This file is for the Genkit development server.
// We dynamically import the flows within an async function
// to prevent Next.js from trying to bundle server-side code.
async function start() {
  await import('./flows/smart-reply-tool.js');

  // Configure Genkit with the server-side plugin here
  genkit({
    plugins: [googleAI()],
  });
}

start();
