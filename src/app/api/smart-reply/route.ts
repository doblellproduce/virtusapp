
import {NextRequest, NextResponse} from 'next/server';
import { generateSmartReply, type SmartReplyInput } from '@/ai/flows/smart-reply-tool';

export async function POST(request: NextRequest) {
  try {
    const {query} = await request.json();
    if (!query) {
      return NextResponse.json({error: 'Query is required'}, {status: 400});
    }

    const knowledgeBase = `
- The minimum rental period is 3 days.
- Full insurance coverage is mandatory and included in the rental price.
- Drivers must be at least 25 years old to rent a vehicle.
- A valid driver's license and a national ID card or passport are required for all rentals.
- We offer various vehicle categories: Economy, Sedan, SUV, and Luxury.
- Payment can be made via credit card or bank transfer. A security deposit is required.
- Cancellations made 48 hours before pickup are fully refundable.
  `;

    const input: SmartReplyInput = {
        query,
        knowledgeBase,
    };

    const result = await generateSmartReply(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error generating smart reply:', error);
    return NextResponse.json(
      {reply: 'Sorry, I was unable to generate a response at this time.'},
      {status: 500}
    );
  }
}
