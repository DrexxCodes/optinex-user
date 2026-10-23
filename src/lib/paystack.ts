// Server-only Paystack helpers (the secret key must never reach the client).
const PAYSTACK_BASE = 'https://api.paystack.co';

function authHeaders() {
  return { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` };
}

export type Bank = { code: string; name: string };

// Same list (and same de-duplication by code) as /api/withdrawal/banks.
export async function fetchBanks(): Promise<Bank[] | null> {
  try {
    const res = await fetch(`${PAYSTACK_BASE}/bank?country=nigeria&type=nuban`, {
      headers: authHeaders(),
      next: { revalidate: 60 * 60 * 24 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const seen = new Set<string>();
    const banks: Bank[] = [];
    for (const b of data.data ?? []) {
      if (!b.code || seen.has(b.code)) continue;
      seen.add(b.code);
      banks.push({ code: b.code, name: b.name });
    }
    return banks;
  } catch {
    return null;
  }
}

export type ResolveResult = { ok: true; accountName: string } | { ok: false; status: number; error: string };

export async function resolveBankAccount(accountNumber: string, bankCode: string): Promise<ResolveResult> {
  const url = `${PAYSTACK_BASE}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;

  let res: Response;
  try {
    res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
  } catch {
    return { ok: false, status: 502, error: 'Could not reach Paystack. Try again.' };
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body — handled below */
  }

  if (!res.ok || !data?.data?.account_name) {
    return { ok: false, status: 422, error: data?.message || 'Could not resolve that account. Double-check the details.' };
  }

  return { ok: true, accountName: data.data.account_name };
}
