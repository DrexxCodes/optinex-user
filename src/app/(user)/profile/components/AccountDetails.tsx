import type { CurrentUser } from '../../lib/useCurrentUser';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-sm text-ink/50">{label}</span>
      <span className="max-w-[60%] truncate text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export default function AccountDetails({ user }: { user: CurrentUser }) {
  return (
    <div className="glass-panel mt-4 divide-y divide-ink/5 rounded-3xl px-5 shadow-card">
      <Row label="Email" value={user.email} />
      <Row label="Wallet Balance" value={`₦${user.walletAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`} />
      <Row label="Package" value={user.packageStatus} />
      <Row
        label="Payout Method"
        value={user.payoutMethod ? `${user.payoutMethod.bankName} •••• ${user.payoutMethod.accountNumber.slice(-4)}` : 'Not set up'}
      />
    </div>
  );
}
