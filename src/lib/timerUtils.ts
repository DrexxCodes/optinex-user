export type TimeRemainingParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getTimeRemainingParts(ms: number): TimeRemainingParts {
  const clamped = Math.max(0, ms);
  const days = Math.floor(clamped / (1000 * 60 * 60 * 24));
  const hours = Math.floor((clamped % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((clamped % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((clamped % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';

  const { days, hours, minutes, seconds } = getTimeRemainingParts(ms);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s remaining`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  }
  return `${seconds}s remaining`;
}

export function getDaysRemaining(expiresAtMs: number): number {
  const now = Date.now();
  const remaining = Math.max(0, expiresAtMs - now);
  return Math.ceil(remaining / (1000 * 60 * 60 * 24));
}
