'use server';

import { generateSmartReply, type SmartReplyInput, type SmartReplyOutput } from '@/ai/flows/smart-reply-tool';

export async function handleSmartReply(input: SmartReplyInput): Promise<SmartReplyOutput> {
  const knowledgeBase = `
- The minimum rental period is 3 days.
- Full insurance coverage is mandatory and included in the rental price.
- Drivers must be at least 25 years old to rent a vehicle.
- A valid driver's license and a national ID card or passport are required for all rentals.
- We offer various vehicle categories: Economy, Sedan, SUV, and Luxury.
- Payment can be made via credit card or bank transfer. A security deposit is required.
- Cancellations made 48 hours before pickup are fully refundable.
  `;
  try {
    const output = await generateSmartReply({
        query: input.query,
        knowledgeBase: knowledgeBase,
    });
    return output;
  } catch (error) {
    console.error('Error generating smart reply:', error);
    // In a real app, you might want to throw a more specific error
    // or return a structured error object.
    return { reply: 'Sorry, I was unable to generate a response at this time.' };
  }
}
