import { TransactionItem, SubscriptionItem } from "../database/db";

export type InsightType = "warning" | "tip" | "info" | "achievement";

export type Insight = {
  type: InsightType;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
  priority: number;
};

export function getTopCategory(
  categories: { category: string; total: number }[]
): Insight | null {
  if (categories.length === 0) return null;
  const sorted = [...categories].sort((a, b) => b.total - a.total);
  const top = sorted[0];
  const total = categories.reduce((s, c) => s + c.total, 0);
  const percent = total > 0 ? Math.round((top.total / total) * 100) : 0;

  return {
    type: "info",
    icon: "pie-chart-outline",
    titleKey: "ai.topCategory",
    descriptionKey: "ai.topCategoryDesc",
    descriptionParams: { category: top.category, percent },
    priority: 3,
  };
}

export function detectSpikes(transactions: TransactionItem[]): Insight[] {
  const insights: Insight[] = [];
  const categoryTotals: Record<string, { sum: number; count: number }> = {};

  for (const tx of transactions) {
    const cat = tx.category ?? "other";
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { sum: 0, count: 0 };
    }
    categoryTotals[cat].sum += tx.amount;
    categoryTotals[cat].count += 1;
  }

  for (const tx of transactions) {
    const cat = tx.category ?? "other";
    const avg = categoryTotals[cat].sum / categoryTotals[cat].count;
    if (tx.amount > avg * 2 && categoryTotals[cat].count >= 3) {
      insights.push({
        type: "warning",
        icon: "alert-circle-outline",
        titleKey: "ai.spikeDetected",
        descriptionKey: "ai.spikeDesc",
        descriptionParams: {
          title: tx.title,
          amount: tx.amount,
          average: Math.round(avg),
        },
        priority: 5,
      });
      break; // Only report one spike
    }
  }

  return insights;
}

export function getMonthOverMonthTrend(
  thisMonth: number,
  lastMonth: number
): Insight | null {
  if (lastMonth === 0 && thisMonth === 0) return null;

  if (lastMonth > 0 && thisMonth < lastMonth) {
    const percent = Math.round(((lastMonth - thisMonth) / lastMonth) * 100);
    return {
      type: "achievement",
      icon: "trophy-outline",
      titleKey: "ai.monthTrendDown",
      descriptionKey: "ai.monthTrendDownDesc",
      descriptionParams: { percent },
      priority: 1,
    };
  }

  if (lastMonth > 0 && thisMonth > lastMonth) {
    const percent = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    return {
      type: "warning",
      icon: "trending-up-outline",
      titleKey: "ai.monthTrendUp",
      descriptionKey: "ai.monthTrendUpDesc",
      descriptionParams: { percent },
      priority: 4,
    };
  }

  return null;
}

export function getBudgetInsights(
  budgetData: {
    overall: { budget: number; actual: number } | null;
    categories: { category: string; budget: number; actual: number }[];
  }
): Insight[] {
  const insights: Insight[] = [];

  if (budgetData.overall && budgetData.overall.budget > 0) {
    const percent = Math.round(
      (budgetData.overall.actual / budgetData.overall.budget) * 100
    );
    if (percent >= 90) {
      insights.push({
        type: "warning",
        icon: "warning-outline",
        titleKey: "ai.budgetWarning",
        descriptionKey: "ai.budgetWarningDesc",
        descriptionParams: { percent },
        priority: 6,
      });
    }
  }

  for (const cat of budgetData.categories) {
    if (cat.budget <= 0) continue;
    const percent = Math.round((cat.actual / cat.budget) * 100);
    if (percent >= 80) {
      insights.push({
        type: "warning",
        icon: "wallet-outline",
        titleKey: "ai.categoryBudgetWarning",
        descriptionKey: "ai.categoryBudgetWarningDesc",
        descriptionParams: { category: cat.category, percent },
        priority: 5,
      });
    }
  }

  return insights;
}

export function getSubscriptionInsights(
  subscriptions: SubscriptionItem[],
  monthlyTotal: number
): Insight | null {
  if (subscriptions.length === 0) return null;

  let subMonthly = 0;
  for (const sub of subscriptions) {
    subMonthly += sub.interval === "monthly" ? sub.amount : sub.amount / 12;
  }

  if (monthlyTotal > 0) {
    const percent = Math.round((subMonthly / monthlyTotal) * 100);
    if (percent >= 30) {
      return {
        type: "tip",
        icon: "card-outline",
        titleKey: "ai.subscriptionBurden",
        descriptionKey: "ai.subscriptionBurdenDesc",
        descriptionParams: { percent, count: subscriptions.length },
        priority: 3,
      };
    }
  }

  return null;
}

export function getDayOfWeekPattern(
  transactions: TransactionItem[]
): Insight | null {
  if (transactions.length < 7) return null;

  const dayTotals: Record<number, number> = {};
  for (const tx of transactions) {
    const day = new Date(tx.date).getDay();
    dayTotals[day] = (dayTotals[day] ?? 0) + tx.amount;
  }

  let maxDay = 0;
  let maxAmount = 0;
  for (const [day, total] of Object.entries(dayTotals)) {
    if (total > maxAmount) {
      maxAmount = total;
      maxDay = Number(day);
    }
  }

  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  return {
    type: "info",
    icon: "calendar-outline",
    titleKey: "ai.weekdayPattern",
    descriptionKey: "ai.weekdayPatternDesc",
    descriptionParams: { day: dayNames[maxDay] },
    priority: 2,
  };
}

export function getSavingsTips(
  categories: { category: string; total: number }[]
): Insight[] {
  const insights: Insight[] = [];
  const total = categories.reduce((s, c) => s + c.total, 0);
  if (total === 0) return insights;

  for (const cat of categories) {
    const percent = Math.round((cat.total / total) * 100);
    if (percent >= 40) {
      insights.push({
        type: "tip",
        icon: "bulb-outline",
        titleKey: "ai.savingsTip",
        descriptionKey: "ai.savingsTipDesc",
        descriptionParams: { category: cat.category, percent },
        priority: 2,
      });
    }
  }

  return insights;
}

export function getBudgetSuggestions(
  categories: { category: string; total: number }[],
  budgetData: {
    overall: { budget: number; actual: number } | null;
    categories: { category: string; budget: number; actual: number }[];
  }
): Insight[] {
  const insights: Insight[] = [];
  const total = categories.reduce((s, c) => s + c.total, 0);

  // Suggest setting overall budget if none exists
  if (!budgetData.overall && total > 0) {
    const suggested = Math.round(total * 0.9 / 100) * 100; // 90% rounded to nearest 100
    insights.push({
      type: "tip",
      icon: "calculator-outline",
      titleKey: "ai.budgetSuggestion",
      descriptionKey: "ai.budgetSuggestionDesc",
      descriptionParams: { amount: suggested },
      priority: 4,
    });
  }

  // Suggest category budgets for top spending categories without budgets
  const existingCatBudgets = new Set(budgetData.categories.map(c => c.category));
  const sorted = [...categories].sort((a, b) => b.total - a.total);
  for (const cat of sorted.slice(0, 3)) {
    if (!existingCatBudgets.has(cat.category) && cat.total > 0) {
      const suggested = Math.round(cat.total * 1.1 / 10) * 10; // 110% rounded to nearest 10
      insights.push({
        type: "tip",
        icon: "bulb-outline",
        titleKey: "ai.categorySuggestion",
        descriptionKey: "ai.categorySuggestionDesc",
        descriptionParams: { category: cat.category, amount: suggested },
        priority: 3,
      });
      break; // Only suggest one at a time
    }
  }

  return insights;
}

export function generateAllInsights(data: {
  transactions: TransactionItem[];
  subscriptions: SubscriptionItem[];
  categories: { category: string; total: number }[];
  monthlyTotal: number;
  comparison: { thisMonth: number; lastMonth: number };
  budgetData: {
    overall: { budget: number; actual: number } | null;
    categories: { category: string; budget: number; actual: number }[];
  };
}): Insight[] {
  const insights: Insight[] = [];

  const topCat = getTopCategory(data.categories);
  if (topCat) insights.push(topCat);

  insights.push(...detectSpikes(data.transactions));

  const trend = getMonthOverMonthTrend(
    data.comparison.thisMonth,
    data.comparison.lastMonth
  );
  if (trend) insights.push(trend);

  insights.push(...getBudgetInsights(data.budgetData));

  const subInsight = getSubscriptionInsights(
    data.subscriptions,
    data.monthlyTotal
  );
  if (subInsight) insights.push(subInsight);

  const dayPattern = getDayOfWeekPattern(data.transactions);
  if (dayPattern) insights.push(dayPattern);

  insights.push(...getSavingsTips(data.categories));
  insights.push(...getBudgetSuggestions(data.categories, data.budgetData));

  return insights.sort((a, b) => b.priority - a.priority);
}
