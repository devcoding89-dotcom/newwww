import { NextResponse } from 'next/server';
import { extractEmails } from '@/ai/flows/ai-email-extraction-flow';

/**
 * POST /api/parse
 * Extracts unique contact details from a provided text block.
 * 
 * Input (JSON): { "text": string }
 * Output (JSON): { "contacts": Array<{ email, firstName, lastName, company, position }> }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input. Please provide a "text" string in the request body.' },
        { status: 400 }
      );
    }

    const result = await extractEmails({ text });

    return NextResponse.json(result);
  } catch (error: any) {
    // Log the error internally for debugging
    console.error('API /api/parse error:', error);

    return NextResponse.json(
      { error: error.message || 'An internal server error occurred while parsing contacts.' },
      { status: 500 }
    );
  }
}
