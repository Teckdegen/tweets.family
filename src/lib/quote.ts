// Same quote the bot uses in bot/bot.js. Collateral is what leaves the wallet.
// The fee is taken first; the stake is the rest; a win pays the stake back plus profit.

export const MIN_MINUTES = 1;
export const MAX_MINUTES = 60;
export const LINES = [2, 3, 4, 5] as const;
export const MAX_STAKE = 1000;

export type Line = (typeof LINES)[number];

const FEE_TIERS = [
  { below: 0.3, rate: 0.05 },
  { below: 0.6, rate: 0.1 },
  { below: Infinity, rate: 0.2 },
];
const CROWD_STEP = 0.02;
const CROWD_MAX = 0.1;

export function profitRate(minutes: number, leverage: number) {
  return (60 / minutes) * (leverage - 1) * 0.05;
}

export function riskFeeRate(utilization: number) {
  return FEE_TIERS.find((tier) => utilization < tier.below)!.rate;
}

export function crowdFeeRate(openOnPost: number) {
  return Math.min(openOnPost * CROWD_STEP, CROWD_MAX);
}

export function openingFeeRate(openOnPost: number, utilization = 0) {
  return riskFeeRate(utilization) + crowdFeeRate(openOnPost);
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function quoteTrade(amount: number, minutes: number, leverage: number, feeRate: number) {
  const fee = round2(amount * feeRate);
  const stake = round2(amount - fee);
  const back = round2(stake + stake * profitRate(minutes, leverage));
  return { amount, fee, stake, back, feeRate, profitRate: profitRate(minutes, leverage) };
}

export function lineAtMinute(minutes: number): Line {
  if (minutes <= 15) return 2;
  if (minutes <= 30) return 3;
  if (minutes <= 45) return 4;
  return 5;
}

export function minuteForLine(line: Line): number {
  if (line === 2) return 15;
  if (line === 3) return 30;
  if (line === 4) return 45;
  return 60;
}

export function lineAllowed(leverage: number, minutes: number) {
  if (!LINES.includes(leverage as Line)) return false;
  if (!Number.isInteger(minutes) || minutes < MIN_MINUTES || minutes > MAX_MINUTES) return false;
  return true;
}

export function formatPct(rate: number) {
  return `${Math.round(rate * 1000) / 10}%`;
}

export function formatUsdg(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
