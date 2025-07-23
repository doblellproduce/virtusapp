import { config } from 'dotenv';
config({ path: '.env' });

import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

// Configure Genkit with the server-side plugin here
genkit({
    plugins: [googleAI()],
});


import '@/ai/flows/smart-reply-tool.ts';
