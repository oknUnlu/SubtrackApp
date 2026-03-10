import { Platform } from "react-native";

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

export type TemplateItem = {
  id: string;
  title: string;
  amount: number;
  category: string;
  notes?: string;
  useCount: number;
};

export type TagItem = {
  id: string;
  name: string;
  color: string;
};

const DB_NAME = "subtrack.db";

/**
 * Lazy-loaded database instance.
 * expo-sqlite requires SharedArrayBuffer on web which is not available
 * without special COOP/COEP headers, so we open the DB lazily and
 * provide a no-op stub on the web platform.
 */
let _db: import("expo-sqlite").SQLiteDatabase | null = null;
let _isWeb = Platform.OS === "web";

/** No-op database stub for web — all queries return empty results */
const webStub = {
  runAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
  getAllAsync: async () => [],
  getFirstAsync: async () => null,
} as unknown as import("expo-sqlite").SQLiteDatabase;

/* ---- Web-only localStorage helpers for settings persistence ---- */
function webGetSetting(key: string): string | null {
  try { return globalThis.localStorage?.getItem(`subtrack_${key}`) ?? null; } catch { return null; }
}
function webSetSetting(key: string, value: string): void {
  try { globalThis.localStorage?.setItem(`subtrack_${key}`, value); } catch { /* noop */ }
}

function getDB(): import("expo-sqlite").SQLiteDatabase {
  if (_isWeb) return webStub;
  if (!_db) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLite = require("expo-sqlite") as typeof import("expo-sqlite");
    _db = SQLite.openDatabaseSync(DB_NAME);
  }
  return _db;
}

/* -------------------- */
/*  GENERIC SQL HELPER  */
/* -------------------- */
async function executeSql(
  sql: string,
  params: (string | number | null)[] = []
): Promise<any> {
  try {
    return await getDB().runAsync(sql, params);
  } catch (err) {
    console.error("SQL error:", err);
    throw err;
  }
}

/* -------------------- */
/*  INIT DATABASE       */
/* -------------------- */
export async function initDB(): Promise<void> {
  if (_isWeb) return;

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

  await executeSql(
    `CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      notes TEXT,
      useCount INTEGER DEFAULT 0
    )`
  );

  await executeSql(
    `CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    )`
  );

  await executeSql(
    `CREATE TABLE IF NOT EXISTS transaction_tags (
      transactionId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      PRIMARY KEY (transactionId, tagId)
    )`
  );

  // Migrations — use getDB().runAsync directly to avoid console.error noise
  // when the column already exists (duplicate column is expected on repeat launches)
  await getDB().runAsync(`ALTER TABLE transactions ADD COLUMN notes TEXT`).catch(() => {});
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
  return await getDB().getAllAsync(
    "SELECT * FROM transactions ORDER BY date DESC"
  );
}

export async function getRecentTransactions(limit: number = 5): Promise<TransactionItem[]> {
  return await getDB().getAllAsync(
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

  return await getDB().getAllAsync<TransactionItem>(sql, params);
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

  const result = await getDB().getFirstAsync<{ count: number }>(sql, params);
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
  return await getDB().getAllAsync(
    "SELECT * FROM subscriptions ORDER BY title ASC"
  );
}

export async function deleteSubscription(id: string) {
  await executeSql("DELETE FROM subscriptions WHERE id = ?", [id]);
}

export async function updateSubscription(item: SubscriptionItem) {
  await executeSql(
    `UPDATE subscriptions SET title = ?, amount = ?, interval = ?, nextDate = ? WHERE id = ?`,
    [item.title, item.amount, item.interval, item.nextDate ?? null, item.id]
  );
}

export async function getMonthlyTotal(): Promise<number> {
  const txResult = await getDB().getFirstAsync<{ total: number }>(
    `
    SELECT SUM(amount) as total
    FROM transactions
    WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `
  );

  const subResult = await getDB().getAllAsync<{ amount: number; interval: string }>(
    `SELECT amount, interval FROM subscriptions`
  );

  let subMonthly = 0;
  for (const sub of subResult) {
    subMonthly += sub.interval === "monthly" ? sub.amount : sub.amount / 12;
  }

  return (txResult?.total ?? 0) + subMonthly;
}

export async function getSubscriptionCount(): Promise<number> {
  const result = await getDB().getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM subscriptions`
  );

  return result?.count ?? 0;
}

export async function getCategoryDistribution() {
  return await getDB().getAllAsync<{
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
  return await getDB().getAllAsync<{
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


export async function getMonthlyTotalForMonth(yearMonth: string): Promise<number> {
  const result = await getDB().getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE strftime('%Y-%m', date) = ?`,
    [yearMonth]
  );
  return result?.total ?? 0;
}

export async function getMonthlyComparison(): Promise<{
  thisMonth: number;
  lastMonth: number;
  changePercent: number;
}> {
  const now = new Date();
  const thisYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYM = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, "0")}`;

  const thisMonth = await getMonthlyTotalForMonth(thisYM);
  const lastMonth = await getMonthlyTotalForMonth(lastYM);

  const changePercent = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  return { thisMonth, lastMonth, changePercent };
}

export async function setSetting(key: string, value: string) {
  if (_isWeb) { webSetSetting(key, value); return; }
  await executeSql(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

export async function getSetting(key: string): Promise<string | null> {
  if (_isWeb) return webGetSetting(key);
  const result = await getDB().getFirstAsync<{ value: string }>(
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
  return await getDB().getFirstAsync<BudgetItem>(sql, params);
}

export async function getAllBudgets(): Promise<BudgetItem[]> {
  return await getDB().getAllAsync<BudgetItem>(
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

  const overallBudget = await getDB().getFirstAsync<{ amount: number }>(
    `SELECT amount FROM budgets WHERE type = 'overall' AND (month = ? OR month IS NULL) ORDER BY month DESC LIMIT 1`,
    [targetMonth]
  );

  const txTotal = await getDB().getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE strftime('%Y-%m', date) = ?`,
    [targetMonth]
  );

  const catBudgets = await getDB().getAllAsync<{ category: string; amount: number }>(
    `SELECT category, amount FROM budgets WHERE type = 'category' AND (month = ? OR month IS NULL)`,
    [targetMonth]
  );

  const catActuals = await getDB().getAllAsync<{ category: string; total: number }>(
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

/* -------------------- */
/*  TEMPLATES            */
/* -------------------- */
export async function addTemplate(item: TemplateItem) {
  await executeSql(
    `INSERT INTO templates (id, title, amount, category, notes, useCount) VALUES (?, ?, ?, ?, ?, ?)`,
    [item.id, item.title, item.amount, item.category, item.notes ?? null, item.useCount ?? 0]
  );
}

export async function getTemplates(): Promise<TemplateItem[]> {
  return await getDB().getAllAsync<TemplateItem>(
    `SELECT * FROM templates ORDER BY useCount DESC, title ASC`
  );
}

export async function deleteTemplate(id: string) {
  await executeSql(`DELETE FROM templates WHERE id = ?`, [id]);
}

export async function incrementTemplateUseCount(id: string) {
  await executeSql(`UPDATE templates SET useCount = useCount + 1 WHERE id = ?`, [id]);
}

/* -------------------- */
/*  TAGS                 */
/* -------------------- */
export async function createTag(tag: TagItem) {
  await executeSql(
    `INSERT INTO tags (id, name, color) VALUES (?, ?, ?)`,
    [tag.id, tag.name, tag.color]
  );
}

export async function getTags(): Promise<TagItem[]> {
  return await getDB().getAllAsync<TagItem>(`SELECT * FROM tags ORDER BY name ASC`);
}

export async function deleteTag(id: string) {
  await executeSql(`DELETE FROM transaction_tags WHERE tagId = ?`, [id]);
  await executeSql(`DELETE FROM tags WHERE id = ?`, [id]);
}

export async function addTagsToTransaction(transactionId: string, tagIds: string[]) {
  for (const tagId of tagIds) {
    await executeSql(
      `INSERT OR IGNORE INTO transaction_tags (transactionId, tagId) VALUES (?, ?)`,
      [transactionId, tagId]
    );
  }
}

export async function getTagsForTransaction(transactionId: string): Promise<TagItem[]> {
  return await getDB().getAllAsync<TagItem>(
    `SELECT t.* FROM tags t INNER JOIN transaction_tags tt ON t.id = tt.tagId WHERE tt.transactionId = ?`,
    [transactionId]
  );
}

export async function getTagsForTransactions(transactionIds: string[]): Promise<Map<string, TagItem[]>> {
  if (transactionIds.length === 0) return new Map();
  const placeholders = transactionIds.map(() => '?').join(',');
  const rows = await getDB().getAllAsync<{ transactionId: string; id: string; name: string; color: string }>(
    `SELECT tt.transactionId, t.id, t.name, t.color FROM tags t INNER JOIN transaction_tags tt ON t.id = tt.tagId WHERE tt.transactionId IN (${placeholders})`,
    transactionIds
  );
  const map = new Map<string, TagItem[]>();
  for (const row of rows) {
    const list = map.get(row.transactionId) ?? [];
    list.push({ id: row.id, name: row.name, color: row.color });
    map.set(row.transactionId, list);
  }
  return map;
}

export async function clearAllData() {
  await executeSql(`DELETE FROM transactions`);
  await executeSql(`DELETE FROM subscriptions`);
  await executeSql(`DELETE FROM budgets`);
  await executeSql(`DELETE FROM templates`);
  await executeSql(`DELETE FROM tags`);
  await executeSql(`DELETE FROM transaction_tags`);
}
