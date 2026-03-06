import * as SQLite from "expo-sqlite";

export type TransactionItem = {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO string
  category?: string;
  notes?: string;
};

export type SubscriptionItem = {
  id: string;
  title: string;
  amount: number;
  interval: string;
  nextDate?: string;
};

export type SettingItem = {
  key: string;
  value: string;
};


const DB_NAME = "subtrack.db";
const db = SQLite.openDatabaseSync(DB_NAME);

/* -------------------- */
/*  GENERIC SQL HELPER  */
/* -------------------- */
async function executeSql(
  sql: string,
  params: (string | number | null)[] = []
): Promise<any> {
  try {
    return await db.runAsync(sql, params);
  } catch (err) {
    console.error("SQL error:", err);
    throw err;
  }
}

/* -------------------- */
/*  INIT DATABASE       */
/* -------------------- */
export async function initDB(): Promise<void> {
  await executeSql(
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category TEXT
    )`
  );

  await executeSql(
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      amount REAL,
      interval TEXT,
      nextDate TEXT
    )`
  );

  await executeSql(
    `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT
  )`
  );

  await executeSql(
    `CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      amount REAL NOT NULL,
      month TEXT
    )`
  );

  // Migrations
  await executeSql(`ALTER TABLE transactions ADD COLUMN notes TEXT`).catch(() => {});
}

/* -------------------- */
/*  TRANSACTIONS        */
/* -------------------- */
export async function addTransaction(item: TransactionItem) {
  const sql = `
    INSERT INTO transactions (id, title, amount, date, category, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    item.id,
    item.title,
    item.amount,
    item.date,
    item.category ?? null,
    item.notes ?? null,
  ]);
}

export async function updateTransaction(item: TransactionItem) {
  await executeSql(
    `UPDATE transactions SET title = ?, amount = ?, category = ?, notes = ? WHERE id = ?`,
    [item.title, item.amount, item.category ?? null, item.notes ?? null, item.id]
  );
}

export async function getTransactions(): Promise<TransactionItem[]> {
  return await db.getAllAsync(
    "SELECT * FROM transactions ORDER BY date DESC"
  );
}

export async function getRecentTransactions(limit: number = 5): Promise<TransactionItem[]> {
  return await db.getAllAsync(
    "SELECT * FROM transactions ORDER BY date DESC LIMIT ?",
    [limit]
  );
}

export async function deleteTransaction(id: string) {
  await executeSql("DELETE FROM transactions WHERE id = ?", [id]);
}

export async function searchTransactions(opts: {
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}): Promise<TransactionItem[]> {
  let sql = `SELECT * FROM transactions WHERE 1=1`;
  const params: (string | number)[] = [];

  if (opts.search) {
    sql += ` AND title LIKE ?`;
    params.push(`%${opts.search}%`);
  }
  if (opts.category) {
    sql += ` AND category = ?`;
    params.push(opts.category);
  }
  if (opts.dateFrom) {
    sql += ` AND date >= ?`;
    params.push(opts.dateFrom);
  }
  if (opts.dateTo) {
    sql += ` AND date <= ?`;
    params.push(opts.dateTo);
  }

  sql += ` ORDER BY date DESC`;

  if (opts.limit) {
    sql += ` LIMIT ?`;
    params.push(opts.limit);
  }
  if (opts.offset) {
    sql += ` OFFSET ?`;
    params.push(opts.offset);
  }

  return await db.getAllAsync<TransactionItem>(sql, params);
}

export async function getTransactionCount(opts?: {
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<number> {
  let sql = `SELECT COUNT(*) as count FROM transactions WHERE 1=1`;
  const params: string[] = [];

  if (opts?.search) {
    sql += ` AND title LIKE ?`;
    params.push(`%${opts.search}%`);
  }
  if (opts?.category) {
    sql += ` AND category = ?`;
    params.push(opts.category);
  }
  if (opts?.dateFrom) {
    sql += ` AND date >= ?`;
    params.push(opts.dateFrom);
  }
  if (opts?.dateTo) {
    sql += ` AND date <= ?`;
    params.push(opts.dateTo);
  }

  const result = await db.getFirstAsync<{ count: number }>(sql, params);
  return result?.count ?? 0;
}

/* -------------------- */
/*  SUBSCRIPTIONS       */
/* -------------------- */
export async function addSubscription(item: SubscriptionItem) {
  const sql = `
    INSERT INTO subscriptions (id, title, amount, interval, nextDate)
    VALUES (?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    item.id,
    item.title,
    item.amount,
    item.interval,
    item.nextDate ?? null,
  ]);
}

export async function getSubscriptions(): Promise<SubscriptionItem[]> {
  return await db.getAllAsync(
    "SELECT * FROM subscriptions ORDER BY title ASC"
  );
}

export async function deleteSubscription(id: string) {
  await executeSql("DELETE FROM subscriptions WHERE id = ?", [id]);
}

export async function updateSubscription(item: SubscriptionItem) {
  await executeSql(
    `UPDATE subscriptions SET title = ?, amount = ?, interval = ? WHERE id = ?`,
    [item.title, item.amount, item.interval, item.id]
  );
}

export async function getMonthlyTotal(): Promise<number> {
  const txResult = await db.getFirstAsync<{ total: number }>(
    `
    SELECT SUM(amount) as total
    FROM transactions
    WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `
  );

  const subResult = await db.getAllAsync<{ amount: number; interval: string }>(
    `SELECT amount, interval FROM subscriptions`
  );

  let subMonthly = 0;
  for (const sub of subResult) {
    subMonthly += sub.interval === "monthly" ? sub.amount : sub.amount / 12;
  }

  return (txResult?.total ?? 0) + subMonthly;
}

export async function getSubscriptionCount(): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM subscriptions`
  );

  return result?.count ?? 0;
}

export async function getCategoryDistribution() {
  return await db.getAllAsync<{
    category: string;
    total: number;
  }>(
    `
    SELECT category, SUM(amount) as total
    FROM transactions
    GROUP BY category
    `
  );
}

export async function getWeeklyTrend() {
  return await db.getAllAsync<{
    day: string;
    total: number;
  }>(
    `
    SELECT strftime('%w', date) as day, SUM(amount) as total
    FROM transactions
    WHERE date >= date('now', '-6 days')
    GROUP BY day
    ORDER BY day ASC
    `
  );
}


export async function setSetting(key: string, value: string) {
  await executeSql(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const result = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    [key]
  );
  return result?.value ?? null;
}

export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case "USD": return "$";
    case "EUR": return "€";
    default: return "₺";
  }
}

/* -------------------- */
/*  BUDGETS              */
/* -------------------- */
export type BudgetItem = {
  id: string;
  type: "overall" | "category";
  category: string | null;
  amount: number;
  month: string | null;
};

export async function setBudget(budget: BudgetItem) {
  await executeSql(
    `INSERT OR REPLACE INTO budgets (id, type, category, amount, month) VALUES (?, ?, ?, ?, ?)`,
    [budget.id, budget.type, budget.category, budget.amount, budget.month]
  );
}

export async function getBudget(type: string, category?: string, month?: string): Promise<BudgetItem | null> {
  let sql = `SELECT * FROM budgets WHERE type = ?`;
  const params: (string | number | null)[] = [type];

  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  } else {
    sql += ` AND category IS NULL`;
  }

  if (month) {
    sql += ` AND month = ?`;
    params.push(month);
  }

  sql += ` LIMIT 1`;
  return await db.getFirstAsync<BudgetItem>(sql, params);
}

export async function getAllBudgets(): Promise<BudgetItem[]> {
  return await db.getAllAsync<BudgetItem>(
    `SELECT * FROM budgets ORDER BY type ASC, category ASC`
  );
}

export async function deleteBudget(id: string) {
  await executeSql(`DELETE FROM budgets WHERE id = ?`, [id]);
}

export async function getBudgetVsActual(month?: string): Promise<{
  overall: { budget: number; actual: number } | null;
  categories: { category: string; budget: number; actual: number }[];
}> {
  const targetMonth = month ?? new Date().toISOString().slice(0, 7);

  const overallBudget = await db.getFirstAsync<{ amount: number }>(
    `SELECT amount FROM budgets WHERE type = 'overall' AND (month = ? OR month IS NULL) ORDER BY month DESC LIMIT 1`,
    [targetMonth]
  );

  const txTotal = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE strftime('%Y-%m', date) = ?`,
    [targetMonth]
  );

  const catBudgets = await db.getAllAsync<{ category: string; amount: number }>(
    `SELECT category, amount FROM budgets WHERE type = 'category' AND (month = ? OR month IS NULL)`,
    [targetMonth]
  );

  const catActuals = await db.getAllAsync<{ category: string; total: number }>(
    `SELECT category, COALESCE(SUM(amount), 0) as total FROM transactions WHERE strftime('%Y-%m', date) = ? GROUP BY category`,
    [targetMonth]
  );

  const actualMap = new Map(catActuals.map(c => [c.category, c.total]));

  return {
    overall: overallBudget ? { budget: overallBudget.amount, actual: txTotal?.total ?? 0 } : null,
    categories: catBudgets.map(b => ({
      category: b.category,
      budget: b.amount,
      actual: actualMap.get(b.category) ?? 0,
    })),
  };
}

export async function clearAllData() {
  await executeSql(`DELETE FROM transactions`);
  await executeSql(`DELETE FROM subscriptions`);
  await executeSql(`DELETE FROM budgets`);
}
