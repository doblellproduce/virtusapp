
import {NextRequest, NextResponse} from 'next/server';
import {handleSmartReply} from '@/app/(app)/smart-reply/actions';

export async function POST(request: NextRequest) {
  try {
    const {query} = await request.json();
    if (!query) {
      return NextResponse.json({error: 'Query is required'}, {status: 400});
    }

    const result = await handleSmartReply({query});
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error generating smart reply:', error);
    return NextResponse.json(
      {reply: 'Sorry, I was unable to generate a response at this time.'},
      {status: 500}
    );
  }
}
