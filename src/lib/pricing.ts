export type MarkdownTier = {
  maxDaysUntilExpiry: number;
  percentOff: number;
};

const MARKDOWN_SCHEDULE: MarkdownTier[] = [
  { maxDaysUntilExpiry: 1, percentOff: 30 },
  { maxDaysUntilExpiry: 2, percentOff: 15 },
];

export function daysUntil(expiresAt: Date | null, now: Date = new Date()): number | null {
  if (!expiresAt) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((expiresAt.getTime() - now.getTime()) / msPerDay);
}

export function isExpired(expiresAt: Date | null, now: Date = new Date()): boolean {
  const days = daysUntil(expiresAt, now);
  return days !== null && days < 0;
}

export function getMarkdownPercent(expiresAt: Date | null, now: Date = new Date()): number {
  const days = daysUntil(expiresAt, now);
  if (days === null || days < 0) return 0;
  const tier = MARKDOWN_SCHEDULE.find((t) => days <= t.maxDaysUntilExpiry);
  return tier ? tier.percentOff : 0;
}

export function getEffectivePrice(basePrice: number, expiresAt: Date | null, now: Date = new Date()) {
  const percentOff = getMarkdownPercent(expiresAt, now);
  const effectivePrice = Math.round(basePrice * (1 - percentOff / 100) * 100) / 100;
  return { basePrice, effectivePrice, percentOff, isMarkedDown: percentOff > 0, isExpired: isExpired(expiresAt, now) };
}
