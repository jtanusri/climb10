import { getBudgetTier, type BudgetTier } from '../db/types';

export function parseBudgetToMillions(budget: string): number {
  if (!budget) return 0;
  const cleaned = budget.replace(/[^0-9.BMKbmk]/g, '');
  const numMatch = cleaned.match(/([0-9.]+)/);
  if (!numMatch) return 0;
  let value = parseFloat(numMatch[1]);
  const upper = budget.toUpperCase();
  if (upper.includes('B')) value *= 1000;
  else if (upper.includes('K')) value /= 1000;
  else if (value > 1000) value /= 1000000;
  return value;
}

export function parseBudgetTier(budget: string): BudgetTier {
  return getBudgetTier(parseBudgetToMillions(budget));
}
