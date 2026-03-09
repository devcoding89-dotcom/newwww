
import { NextResponse } from 'next/server';

/**
 * GET /api/paystack/verify
 * Handles Paystack callback and verifies transaction status.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!reference) {
    return NextResponse.redirect(new URL('/pricing?error=no_reference', request.url));
  }

  if (!PAYSTACK_SECRET_KEY) {
    // In simulation mode, just redirect to dashboard with success
    return NextResponse.redirect(new URL('/dashboard?payment=success', request.url));
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      // In a real app, you would update the user's subscription tier in Firestore here.
      // Since we don't have the user ID in the query, we'd typically use metadata 
      // passed during initialization or session data.
      return NextResponse.redirect(new URL('/dashboard?payment=success', request.url));
    } else {
      return NextResponse.redirect(new URL('/pricing?error=verification_failed', request.url));
    }
  } catch (error) {
    console.error("Paystack Verification Error:", error);
    return NextResponse.redirect(new URL('/pricing?error=server_error', request.url));
  }
}
