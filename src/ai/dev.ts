import { config } from 'dotenv';
config({ path: '.env' });

import { googleAI } from '@genkit-ai/googleai';
import { genkit,  } from 'genkit';

// This file is for the Genkit development server.
// It dynamically imports the flows to prevent Next.js from
// trying to bundle server-side code into the client application.
import('./flows/smart-reply-tool.js');


// Configure Genkit with the server-side plugin here
genkit({
    plugins: [googleAI()],
});
