import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// LEGACY: this endpoint is designed to be called by external monitors (like Better Stack) to
// distribute a flat 2% daily return to users with active packages. The app's real return logic
// now runs inline at login (see lib/investmentReturns.ts, 10%/day) — running both would pay twice,
// so only point a monitor at this if that is genuinely intended.

function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;
  // Allow requests with a valid token or from localhost for testing (unchanged behaviour).
  return (
    (expectedToken && authHeader === `Bearer ${expectedToken}`) ||
    req.nextUrl.hostname === 'localhost' ||
    req.nextUrl.hostname === '127.0.0.1'
  );
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    // One set-based Postgres call: finds every non-Free user with an active investment who hasn't
    // received today's 2% yet, records the legacy transaction and bumps the wallet.
    const { data, error } = await supabaseAdmin.rpc('legacy_investment_cron', { p_today: todayString });
    if (error) throw new Error(error.message);

    const processedCount = data?.processed ?? 0;
    const errorCount = data?.errors ?? 0;

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      message: `Processed ${processedCount} users, ${errorCount} errors`
    });
  } catch (error) {
    console.error('Investment returns cron error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

// GET endpoint for monitoring/testing
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Use POST to trigger investment returns distribution',
    documentation: {
      endpoint: '/api/cron/investment-returns',
      method: 'POST',
      headers: {
        authorization: 'Bearer YOUR_CRON_SECRET'
      },
      description: 'Distributes 2% daily returns to users with active investment packages'
    }
  });
}
