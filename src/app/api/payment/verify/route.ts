import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Environment variable validation - fail fast if missing
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PORTONE_API_SECRET) {
  throw new Error('PORTONE_API_SECRET environment variable is required');
}
if (!SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
}
if (!SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

/**
 * Validates authentication using Bearer token or Supabase session
 * @returns User ID if authenticated, null otherwise
 */
async function validateAuthentication(request: NextRequest): Promise<string | null> {
  // Check for Bearer token
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  // Support both Bearer token and session-based auth
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Validate token with Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user.id;
  }

  return null;
}

/**
 * Validates that the user owns the reservation
 */
async function validateReservationOwnership(
  userId: string,
  reservationId: string
): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  const { data, error } = await supabase
    .from('reservations')
    .select('user_id')
    .eq('id', reservationId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.user_id === userId;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the request
    const userId = await validateAuthentication(request);

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { paymentId, reservationId, expectedAmount } = await request.json();

    if (!paymentId || !reservationId) {
      return NextResponse.json(
        { error: '결제 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 2. Verify reservation ownership
    const isOwner = await validateReservationOwnership(userId, reservationId);

    if (!isOwner) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 3. Fetch payment details from PortOne API
    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.text();
      console.error('PortOne API error:', errorData);
      return NextResponse.json(
        { error: '결제 정보를 확인할 수 없습니다.' },
        { status: 400 }
      );
    }

    const payment = await paymentResponse.json();

    // 4. Verify payment status
    if (payment.status !== 'PAID') {
      return NextResponse.json(
        { error: `결제가 완료되지 않았습니다. 상태: ${payment.status}` },
        { status: 400 }
      );
    }

    // 5. Verify payment amount
    if (expectedAmount && payment.amount.total !== expectedAmount) {
      return NextResponse.json(
        { error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 6. Update reservation status in Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
      })
      .eq('id', reservationId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: '예약 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: payment.id,
      paidAmount: payment.amount.total,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: '결제 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
