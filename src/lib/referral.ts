import { adminDb } from '@/lib/firebase/admin';

const CODE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomSuffix(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// Referral keys look like `incossify-a3f9k2` — a fixed, on-brand prefix plus six
// random letters/numbers. Retries a handful of times on the (very unlikely)
// chance of a collision before giving up.
export async function generateUniqueReferralKey(): Promise<string> {
  const usersRef = adminDb.collection('users');

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `incossify-${randomSuffix()}`;
    const existing = await usersRef.where('referralKey', '==', candidate).limit(1).get();
    if (existing.empty) return candidate;
  }

  throw new Error('Could not generate a unique referral key — please try again.');
}
