import { TransactionItem } from "../database/db";

export type RecurringPattern = {
  title: string;
  amount: number;
  category: string;
  avgIntervalDays: number;
  occurrences: number;
  lastDate: string;
};

/**
 * Groups transactions by title and detects ~monthly recurring patterns.
 * Requires at least 3 occurrences with ~25-35 day intervals.
 */
export function detectRecurringExpenses(transactions: TransactionItem[]): RecurringPattern[] {
  // Group by normalized title
  const groups = new Map<string, TransactionItem[]>();
  for (const tx of transactions) {
    const key = tx.title.trim().toLowerCase();
    const list = groups.get(key) ?? [];
    list.push(tx);
    groups.set(key, list);
  }

  const results: RecurringPattern[] = [];

  for (const [, txList] of groups) {
    if (txList.length < 3) continue;

    // Sort by date ascending
    const sorted = txList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate intervals between consecutive transactions
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(diff);
    }

    // Check if the average interval is roughly monthly (20-40 days)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avgInterval < 20 || avgInterval > 40) continue;

    // Check that most intervals are within range (allow some variance)
    const monthlyCount = intervals.filter(d => d >= 20 && d <= 40).length;
    if (monthlyCount / intervals.length < 0.6) continue;

    const latest = sorted[sorted.length - 1];
    const avgAmount = sorted.reduce((s, t) => s + t.amount, 0) / sorted.length;

    results.push({
      title: latest.title,
      amount: Math.round(avgAmount * 100) / 100,
      category: latest.category ?? "other",
      avgIntervalDays: Math.round(avgInterval),
      occurrences: sorted.length,
      lastDate: latest.date,
    });
  }

  return results.sort((a, b) => b.occurrences - a.occurrences);
}
