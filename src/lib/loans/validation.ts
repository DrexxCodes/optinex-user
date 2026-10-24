// Shared by the apply form (instant feedback) and /api/loans/apply (the real
// enforcement). Pure functions only — no server imports — so it's safe in
// client components.
import { MAX_LOAN_AMOUNT, MIN_LOAN_AMOUNT } from './config';

export type LoanApplicationInput = {
  reason: string;
  amount: number;
  occupation: string;
  phone: string;
  address: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  accountNumber: string;
  bankCode: string;
};

// Accepts 080…, +23480…, 23480… (spaces/dashes ignored) and returns the
// canonical local form 080XXXXXXXX, or null if it isn't a Nigerian mobile number.
export function normalizeNigerianPhone(raw: unknown): string | null {
  const digits = String(raw ?? '').replace(/[\s\-()]/g, '');
  const local = digits.replace(/^\+?234/, '0');
  return /^0[789][01]\d{8}$/.test(local) ? local : null;
}

const clean = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ');

export function validateLoanInput(raw: Record<string, unknown>): { ok: true; value: LoanApplicationInput } | { ok: false; error: string } {
  const reason = clean(raw.reason);
  const occupation = clean(raw.occupation);
  const address = clean(raw.address);
  const nextOfKinName = clean(raw.nextOfKinName);
  const amount = Number(raw.amount);
  const phone = normalizeNigerianPhone(raw.phone);
  const nextOfKinPhone = normalizeNigerianPhone(raw.nextOfKinPhone);
  const accountNumber = String(raw.accountNumber ?? '');
  const bankCode = String(raw.bankCode ?? '');

  if (reason.length < 10 || reason.length > 500) return { ok: false, error: 'Tell us the reason for the loan (10–500 characters).' };
  if (!Number.isInteger(amount) || amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) {
    return { ok: false, error: `Enter a whole-naira amount between ₦${MIN_LOAN_AMOUNT.toLocaleString()} and ₦${MAX_LOAN_AMOUNT.toLocaleString()}.` };
  }
  if (occupation.length < 2 || occupation.length > 100) return { ok: false, error: 'Enter your occupation.' };
  if (!phone) return { ok: false, error: 'Enter a valid Nigerian phone number for yourself.' };
  if (address.length < 10 || address.length > 200) return { ok: false, error: 'Enter your full address (10–200 characters).' };
  if (nextOfKinName.length < 2 || nextOfKinName.length > 100) return { ok: false, error: "Enter your next of kin's full name." };
  if (!nextOfKinPhone) return { ok: false, error: "Enter a valid Nigerian phone number for your next of kin." };
  if (nextOfKinPhone === phone) return { ok: false, error: "Your next of kin's phone number must be different from yours." };
  if (!/^\d{10}$/.test(accountNumber) || !bankCode) return { ok: false, error: 'Select a bank and enter a valid 10-digit account number.' };

  return { ok: true, value: { reason, amount, occupation, phone, address, nextOfKinName, nextOfKinPhone, accountNumber, bankCode } };
}
