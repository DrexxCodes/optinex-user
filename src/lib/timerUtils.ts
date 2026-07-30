export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';

  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

export function getDaysRemaining(expiresAtMs: number): number {
  const now = Date.now();
  const remaining = Math.max(0, expiresAtMs - now);
  return Math.ceil(remaining / (1000 * 60 * 60 * 24));
}
