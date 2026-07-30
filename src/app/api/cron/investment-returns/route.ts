import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// This endpoint is designed to be called by external monitors (like Better Stack)
// to automatically distribute daily investment returns to users with active packages.
// It checks if users have received their 2% daily return and creates transaction records if not.

const DAILY_RETURN_PERCENTAGE = 2; // 2% per day

export async function POST(req: NextRequest) {
  // Verify the request is coming from an authorized monitor
  // You can enhance this with a secret token if needed
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  // Allow requests with valid token or from localhost for testing
  const isAuthorized =
    expectedToken && authHeader === `Bearer ${expectedToken}` ||
    req.nextUrl.hostname === 'localhost' ||
    req.nextUrl.hostname === '127.0.0.1';

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    // Get all users with active investment packages
    const usersSnapshot = await adminDb
      .collection('users')
      .where('packageStatus', '!=', 'Free')
      .get();

    let processedCount = 0;
    let errorCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id;
        const user = userDoc.data();

        // Get the active investment for this user
        const investmentSnapshot = await adminDb
          .collection('investments')
          .where('uid', '==', userId)
          .where('status', '==', 'active')
          .limit(1)
          .get();

        if (investmentSnapshot.empty) {
          continue; // No active investment found
        }

        const investment = investmentSnapshot.docs[0].data();
        const investmentAmount = investment.amount ?? 0;
        const dailyReturn = (investmentAmount * DAILY_RETURN_PERCENTAGE) / 100;

        // Check if this user already received their return today
        const transactionSnapshot = await adminDb
          .collection('transactions')
          .where('uid', '==', userId)
          .where('type', '==', 'Investment Rewards')
          .where('date', '==', todayString)
          .limit(1)
          .get();

        if (!transactionSnapshot.empty) {
          continue; // Already received return today
        }

        // Create the transaction record
        const batch = adminDb.batch();

        // Create transaction
        const transactionRef = adminDb.collection('transactions').doc();
        batch.set(transactionRef, {
          uid: userId,
          type: 'Investment Rewards',
          amount: dailyReturn,
          date: todayString,
          createdAt: new Date().toISOString(),
          status: 'completed'
        });

        // Update user wallet
        batch.update(userDoc.ref, {
          walletAmount: (user.walletAmount ?? 0) + dailyReturn
        });

        await batch.commit();
        processedCount++;
      } catch (error) {
        console.error(`Error processing user ${userDoc.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      message: `Processed ${processedCount} users, ${errorCount} errors`
    });
  } catch (error) {
    console.error('Investment returns cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for monitoring/testing
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  const isAuthorized =
    expectedToken && authHeader === `Bearer ${expectedToken}` ||
    req.nextUrl.hostname === 'localhost' ||
    req.nextUrl.hostname === '127.0.0.1';

  if (!isAuthorized) {
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
