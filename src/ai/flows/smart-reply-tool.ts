// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview A smart reply tool that provides suggested responses based on common customer service scenarios.
 *
 * - generateSmartReply - A function that generates a smart reply based on the input query.
 * - SmartReplyInput - The input type for the generateSmartReply function.
 * - SmartReplyOutput - The return type for the generateSmartReply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartReplyInputSchema = z.object({
  query: z
    .string()
    .describe(
      'The customer service query to generate a smart reply for. Include details of previous interactions and customer history.'
    ),
  knowledgeBase: z.string().optional().describe('The knowledge base for car rental policies.'),
});
export type SmartReplyInput = z.infer<typeof SmartReplyInputSchema>;

const SmartReplyOutputSchema = z.object({
  reply: z.string().describe('The generated smart reply.'),
});
export type SmartReplyOutput = z.infer<typeof SmartReplyOutputSchema>;

export async function generateSmartReply(input: SmartReplyInput): Promise<SmartReplyOutput> {
  return smartReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartReplyPrompt',
  input: {schema: SmartReplyInputSchema},
  output: {schema: SmartReplyOutputSchema},
  prompt: `You are a helpful customer service agent for Virtus Car Rental S.R.L. Your goal is to provide concise and helpful replies to customer inquiries. Use the following knowledge base and query to generate the best reply.\n\nKnowledge Base: {{{knowledgeBase}}}\n\nQuery: {{{query}}}\n\nReply: `,
});

const smartReplyFlow = ai.defineFlow(
  {
    name: 'smartReplyFlow',
    inputSchema: SmartReplyInputSchema,
    outputSchema: SmartReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
