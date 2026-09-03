// Shared between the spin API route (server) and the wheel UI (client) so
// the segments the user sees always line up with what the server can award.
// `weight` drives probability server-side and is ignored on the client.

export type PrizeId = 'no_win' | 'extra_spin' | '1000' | '2000' | '3000' | '5000' | '10000';

export type Prize = {
  id: PrizeId;
  label: string;
  amount: number; // naira credited to the wallet; 0 for no_win / extra_spin
  weight: number; // relative probability weight
  color: string; // wheel segment fill
};

export const MAX_DAILY_SPINS = 3;

export const PRIZES: Prize[] = [
  { id: 'no_win', label: 'No Win', amount: 0, weight: 30, color: '#94a3b8' },
  { id: '1000', label: '₦1,000', amount: 1000, weight: 20, color: '#34d399' },
  { id: 'extra_spin', label: 'Extra Spin', amount: 0, weight: 15, color: '#C084FC' },
  { id: '2000', label: '₦2,000', amount: 2000, weight: 18, color: '#4ade80' },
  { id: '3000', label: '₦3,000', amount: 3000, weight: 10, color: '#fbbf24' },
  { id: '5000', label: '₦5,000', amount: 5000, weight: 5, color: '#fb923c' },
  { id: '10000', label: '₦10,000', amount: 10000, weight: 2, color: '#f87171' }
];

export function pickWeightedPrize(): Prize {
  const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const prize of PRIZES) {
    roll -= prize.weight;
    if (roll <= 0) return prize;
  }
  return PRIZES[0];
}
