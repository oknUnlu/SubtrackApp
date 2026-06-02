import { Platform } from "react-native";
import { randomUUID } from "expo-crypto";

export type TransactionItem = {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO string
  category?: string;
  notes?: string;
  paymentMethod?: string; // "cash" | "credit_card" | "debit_card"
  bankName?: string;
  receiptUri?: string;
  installmentId?: string; // links a monthly installment payment to its installment
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

export type SpendingGoalItem = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO date
  category?: string;
  color: string;
};

/**
 * Format a number with thousands separators (dot) and optional decimals (comma).
 * Examples: 10000 → "10.000", 1500.5 → "1.500,50", 250 → "250"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  const fixed = value.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart ? `${formatted},${decPart}` : formatted;
}

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
/*  SERIALIZED ACCESS   */
/* -------------------- */
// expo-sqlite uses a single native connection; running statements concurrently
// (e.g. parallel screen effects on launch) can crash with a NullPointerException.
// All DB access is funneled through this promise chain so calls run one at a time.
type SqlParams = (string | number | null)[];
let _dbLock: Promise<unknown> = Promise.resolve();
function rawDB() { return getDB(); }
function withDbLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = _dbLock.then(fn, fn);
  _dbLock = run.then(() => undefined, () => undefined);
  return run;
}
function dbRun(sql: string, params: SqlParams = []) {
  return withDbLock(() => rawDB().runAsync(sql, params));
}
function dbGetAll<T>(sql: string, params: SqlParams = []) {
  return withDbLock(() => rawDB().getAllAsync<T>(sql, params));
}
function dbGetFirst<T>(sql: string, params: SqlParams = []) {
  return withDbLock(() => rawDB().getFirstAsync<T>(sql, params));
}

/* -------------------- */
/*  GENERIC SQL HELPER  */
/* -------------------- */
async function executeSql(
  sql: string,
  params: (string | number | null)[] = []
): Promise<any> {
  try {
    return await dbRun(sql, params);
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

  await executeSql(
    `CREATE TABLE IF NOT EXISTS installments (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      installmentCount INTEGER NOT NULL,
      paidCount INTEGER DEFAULT 0,
      monthlyAmount REAL NOT NULL,
      startDate TEXT NOT NULL,
      bankName TEXT
    )`
  );

  await executeSql(
    `CREATE TABLE IF NOT EXISTS spending_goals (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      currentAmount REAL DEFAULT 0,
      deadline TEXT NOT NULL,
      category TEXT,
      color TEXT NOT NULL
    )`
  );

  // Migrations — use dbRun directly to avoid console.error noise
  // when the column already exists (duplicate column is expected on repeat launches)
  await dbRun(`ALTER TABLE transactions ADD COLUMN notes TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE transactions ADD COLUMN paymentMethod TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE transactions ADD COLUMN bankName TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE transactions ADD COLUMN receiptUri TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE transactions ADD COLUMN installmentId TEXT`).catch(() => {});
  await dbRun(`ALTER TABLE installments ADD COLUMN category TEXT`).catch(() => {});
}

/* -------------------- */
/*  TRANSACTIONS        */
/* -------------------- */
export async function addTransaction(item: TransactionItem) {
  const sql = `
    INSERT INTO transactions (id, title, amount, date, category, notes, paymentMethod, bankName, receiptUri, installmentId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    item.id,
    item.title,
    item.amount,
    item.date,
    item.category ?? null,
    item.notes ?? null,
    item.paymentMethod ?? null,
    item.bankName ?? null,
    item.receiptUri ?? null,
    item.installmentId ?? null,
  ]);
}

export async function updateTransaction(item: TransactionItem) {
  await executeSql(
    `UPDATE transactions SET title = ?, amount = ?, category = ?, notes = ?, paymentMethod = ?, bankName = ?, receiptUri = ? WHERE id = ?`,
    [item.title, item.amount, item.category ?? null, item.notes ?? null, item.paymentMethod ?? null, item.bankName ?? null, item.receiptUri ?? null, item.id]
  );
}

export async function getTransactions(): Promise<TransactionItem[]> {
  return await dbGetAll(
    "SELECT * FROM transactions ORDER BY date DESC"
  );
}

export async function getRecentTransactions(limit: number = 5): Promise<TransactionItem[]> {
  return await dbGetAll(
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

  return await dbGetAll<TransactionItem>(sql, params);
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

  const result = await dbGetFirst<{ count: number }>(sql, params);
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
  return await dbGetAll(
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
  const txResult = await dbGetFirst<{ total: number }>(
    `
    SELECT SUM(amount) as total
    FROM transactions
    WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `
  );

  const subResult = await dbGetAll<{ amount: number; interval: string }>(
    `SELECT amount, interval FROM subscriptions`
  );

  let subMonthly = 0;
  for (const sub of subResult) {
    subMonthly += sub.interval === "monthly" ? sub.amount : sub.amount / 12;
  }

  return (txResult?.total ?? 0) + subMonthly;
}

export async function getSubscriptionCount(): Promise<number> {
  const result = await dbGetFirst<{ count: number }>(
    `SELECT COUNT(*) as count FROM subscriptions`
  );

  return result?.count ?? 0;
}

/** Total monthly cost of all subscriptions (yearly ones normalized to /12). */
export async function getSubscriptionMonthlyTotal(): Promise<number> {
  const subResult = await dbGetAll<{ amount: number; interval: string }>(
    `SELECT amount, interval FROM subscriptions`
  );

  let total = 0;
  for (const sub of subResult) {
    total += sub.interval === "monthly" ? sub.amount : sub.amount / 12;
  }
  return total;
}

export async function getCategoryDistribution() {
  return await dbGetAll<{
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
  return await dbGetAll<{
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
  const result = await dbGetFirst<{ total: number }>(
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
  const result = await dbGetFirst<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    [key]
  );
  return result?.value ?? null;
}

export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case "USD": return "$";
    case "EUR": return "€";
    case "BRL": return "R$";
    case "INR": return "₹";
    case "IDR": return "Rp";
    case "JPY": return "¥";
    case "KRW": return "₩";
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
  return await dbGetFirst<BudgetItem>(sql, params);
}

export async function getAllBudgets(): Promise<BudgetItem[]> {
  return await dbGetAll<BudgetItem>(
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

  const overallBudget = await dbGetFirst<{ amount: number }>(
    `SELECT amount FROM budgets WHERE type = 'overall' AND (month = ? OR month IS NULL) ORDER BY month DESC LIMIT 1`,
    [targetMonth]
  );

  const txTotal = await dbGetFirst<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE strftime('%Y-%m', date) = ?`,
    [targetMonth]
  );

  const catBudgets = await dbGetAll<{ category: string; amount: number }>(
    `SELECT category, amount FROM budgets WHERE type = 'category' AND (month = ? OR month IS NULL)`,
    [targetMonth]
  );

  const catActuals = await dbGetAll<{ category: string; total: number }>(
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
  return await dbGetAll<TemplateItem>(
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
  return await dbGetAll<TagItem>(`SELECT * FROM tags ORDER BY name ASC`);
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
  return await dbGetAll<TagItem>(
    `SELECT t.* FROM tags t INNER JOIN transaction_tags tt ON t.id = tt.tagId WHERE tt.transactionId = ?`,
    [transactionId]
  );
}

export async function getTagsForTransactions(transactionIds: string[]): Promise<Map<string, TagItem[]>> {
  if (transactionIds.length === 0) return new Map();
  const placeholders = transactionIds.map(() => '?').join(',');
  const rows = await dbGetAll<{ transactionId: string; id: string; name: string; color: string }>(
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

export async function getPaymentMethodDistribution(): Promise<{ method: string; total: number }[]> {
  return await dbGetAll<{ method: string; total: number }>(
    `SELECT COALESCE(paymentMethod, 'cash') as method, SUM(amount) as total
     FROM transactions
     WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
     GROUP BY method`
  );
}

/* -------------------- */
/*  SMART CATEGORY       */
/* -------------------- */
export async function predictCategory(title: string): Promise<string | null> {
  if (!title || title.length < 2) return null;
  const result = await dbGetFirst<{ category: string; cnt: number }>(
    `SELECT category, COUNT(*) as cnt FROM transactions
     WHERE LOWER(title) = LOWER(?) AND category IS NOT NULL
     GROUP BY category ORDER BY cnt DESC LIMIT 1`,
    [title.trim()]
  );
  if (result) return result.category;
  // Fuzzy: check if title contains known words
  const fuzzy = await dbGetFirst<{ category: string; cnt: number }>(
    `SELECT category, COUNT(*) as cnt FROM transactions
     WHERE LOWER(title) LIKE LOWER(?) AND category IS NOT NULL
     GROUP BY category ORDER BY cnt DESC LIMIT 1`,
    [`%${title.trim()}%`]
  );
  return fuzzy?.category ?? null;
}

/* -------------------- */
/*  INSTALLMENTS         */
/* -------------------- */
export type InstallmentItem = {
  id: string;
  title: string;
  totalAmount: number;
  installmentCount: number;
  paidCount: number;
  monthlyAmount: number;
  startDate: string;
  bankName?: string;
  category?: string;
};

/* -------------------- */
/*  YEARLY ANALYTICS     */
/* -------------------- */
export async function getYearlyMonthlyTotals(year: number): Promise<{ month: string; total: number }[]> {
  return await dbGetAll<{ month: string; total: number }>(
    `SELECT strftime('%m', date) as month, COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE strftime('%Y', date) = ?
     GROUP BY month ORDER BY month ASC`,
    [String(year)]
  );
}

export async function getYearlyCategoryTotals(year: number): Promise<{ category: string; total: number }[]> {
  return await dbGetAll<{ category: string; total: number }>(
    `SELECT category, COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE strftime('%Y', date) = ?
     GROUP BY category ORDER BY total DESC`,
    [String(year)]
  );
}

export async function getYearlyTotal(year: number): Promise<number> {
  const r = await dbGetFirst<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE strftime('%Y', date) = ?`,
    [String(year)]
  );
  return r?.total ?? 0;
}

/* -------------------- */
/*  BANK REPORT          */
/* -------------------- */
export async function getBankDistribution(): Promise<{ bankName: string; total: number; count: number }[]> {
  return await dbGetAll<{ bankName: string; total: number; count: number }>(
    `SELECT COALESCE(bankName, 'Diğer') as bankName, SUM(amount) as total, COUNT(*) as count
     FROM transactions
     WHERE paymentMethod = 'credit_card'
     AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
     GROUP BY bankName ORDER BY total DESC`
  );
}

/* -------------------- */
/*  CATEGORY TREND       */
/* -------------------- */
export async function getCategoryMonthlyTrend(category: string, months: number = 6): Promise<{ month: string; total: number }[]> {
  return await dbGetAll<{ month: string; total: number }>(
    `SELECT strftime('%Y-%m', date) as month, COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE category = ?
     AND date >= date('now', '-' || ? || ' months')
     GROUP BY month ORDER BY month ASC`,
    [category, months]
  );
}

export async function addInstallment(item: InstallmentItem) {
  await executeSql(
    `INSERT INTO installments (id, title, totalAmount, installmentCount, paidCount, monthlyAmount, startDate, bankName, category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.title, item.totalAmount, item.installmentCount, item.paidCount, item.monthlyAmount, item.startDate, item.bankName ?? null, item.category ?? null]
  );
  // Record the monthly installment payments that are already due as expenses.
  await generateDueInstallmentTransactions(item.id);
}

/**
 * Creates the monthly expense transactions that are due for an installment so
 * far (one per elapsed calendar month, up to installmentCount). Each payment is
 * recorded as a transaction of `monthlyAmount`, so an installment purchase shows
 * up as the monthly portion in each month rather than the full amount up front.
 *
 * Idempotent: it only creates the rows that don't exist yet, so it can be called
 * repeatedly (on add and on app launch) without duplicating payments.
 *
 * Legacy installments (created before this feature, category IS NULL) are left
 * untouched — they keep their original full-amount transaction.
 */
async function generateDueInstallmentTransactions(installmentId: string) {
  const inst = await dbGetFirst<InstallmentItem>(
    `SELECT * FROM installments WHERE id = ?`,
    [installmentId]
  );
  if (!inst || inst.category == null) return;

  const start = new Date(inst.startDate);
  const now = new Date();
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const due = Math.max(1, Math.min(inst.installmentCount, monthsElapsed + 1));

  const existingRow = await dbGetFirst<{ count: number }>(
    `SELECT COUNT(*) as count FROM transactions WHERE installmentId = ?`,
    [installmentId]
  );
  const existing = existingRow?.count ?? 0;

  for (let i = existing; i < due; i++) {
    // Target month = start month + i, clamping the day so day 29-31 start dates
    // don't overflow into the wrong month (e.g. Jan 31 + 1 month).
    const monthIndex = start.getMonth() + i;
    const y = start.getFullYear() + Math.floor(monthIndex / 12);
    const m = ((monthIndex % 12) + 12) % 12;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const day = Math.min(start.getDate(), lastDay);
    const d = new Date(y, m, day, start.getHours(), start.getMinutes(), start.getSeconds());
    await addTransaction({
      id: randomUUID(),
      title: inst.title,
      amount: inst.monthlyAmount,
      date: d.toISOString(),
      category: inst.category ?? "shopping",
      notes: `${i + 1}/${inst.installmentCount}`,
      paymentMethod: "credit_card",
      bankName: inst.bankName ?? undefined,
      installmentId: inst.id,
    });
  }

  // Keep paidCount in sync with how many installments have been billed.
  if (due !== inst.paidCount) {
    await executeSql(`UPDATE installments SET paidCount = ? WHERE id = ?`, [due, installmentId]);
  }
}

let _reconciling: Promise<void> | null = null;

/** Generates any newly-due monthly installment payments. Call on app launch. */
export async function reconcileInstallments() {
  if (_isWeb) return;
  // Dedupe overlapping calls so two runs can't both create the same payment
  // (e.g. React's dev double-invoke of the bootstrap effect).
  if (_reconciling) return _reconciling;
  _reconciling = (async () => {
    try {
      const rows = await dbGetAll<{ id: string }>(
        `SELECT id FROM installments WHERE category IS NOT NULL`
      );
      for (const r of rows) {
        try {
          await generateDueInstallmentTransactions(r.id);
        } catch (err) {
          console.warn("Installment reconcile failed:", r.id, err);
        }
      }
    } catch (err) {
      console.warn("Installment reconcile failed:", err);
    }
  })();
  try {
    await _reconciling;
  } finally {
    _reconciling = null;
  }
}

export async function getInstallments(): Promise<InstallmentItem[]> {
  return await dbGetAll<InstallmentItem>(
    `SELECT * FROM installments WHERE paidCount < installmentCount ORDER BY startDate DESC`
  );
}

export async function getAllInstallments(): Promise<InstallmentItem[]> {
  return await dbGetAll<InstallmentItem>(
    `SELECT * FROM installments ORDER BY startDate DESC`
  );
}

export async function deleteInstallment(id: string) {
  // Remove the generated monthly expense rows along with the installment.
  await executeSql(`DELETE FROM transactions WHERE installmentId = ?`, [id]);
  await executeSql(`DELETE FROM installments WHERE id = ?`, [id]);
}

/* -------------------- */
/*  MONTHLY REPORT       */
/* -------------------- */
export async function getMonthlyReport(yearMonth?: string): Promise<{
  total: number;
  topCategory: { category: string; total: number } | null;
  transactionCount: number;
  avgPerDay: number;
  cashTotal: number;
  cardTotal: number;
  debitTotal: number;
}> {
  const ym = yearMonth ?? new Date().toISOString().slice(0, 7);
  const total = await getMonthlyTotalForMonth(ym);
  const topCat = await dbGetFirst<{ category: string; total: number }>(
    `SELECT category, SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? GROUP BY category ORDER BY total DESC LIMIT 1`,
    [ym]
  );
  const countResult = await dbGetFirst<{ count: number }>(
    `SELECT COUNT(*) as count FROM transactions WHERE strftime('%Y-%m', date) = ?`,
    [ym]
  );
  const daysInMonth = new Date(parseInt(ym.split('-')[0]), parseInt(ym.split('-')[1]), 0).getDate();
  const payMethods = await dbGetAll<{ method: string; total: number }>(
    `SELECT COALESCE(paymentMethod, 'cash') as method, SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? GROUP BY method`,
    [ym]
  );
  const cashTotal = payMethods.find(p => p.method === 'cash')?.total ?? 0;
  const cardTotal = payMethods.find(p => p.method === 'credit_card')?.total ?? 0;
  const debitTotal = payMethods.find(p => p.method === 'debit_card')?.total ?? 0;

  return {
    total,
    topCategory: topCat ?? null,
    transactionCount: countResult?.count ?? 0,
    avgPerDay: daysInMonth > 0 ? total / daysInMonth : 0,
    cashTotal,
    cardTotal,
    debitTotal,
  };
}

/* -------------------- */
/*  SPENDING GOALS       */
/* -------------------- */
export async function addSpendingGoal(item: SpendingGoalItem) {
  await executeSql(
    `INSERT INTO spending_goals (id, title, targetAmount, currentAmount, deadline, category, color) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.title, item.targetAmount, item.currentAmount, item.deadline, item.category ?? null, item.color]
  );
}

export async function getSpendingGoals(): Promise<SpendingGoalItem[]> {
  return await dbGetAll(`SELECT * FROM spending_goals ORDER BY deadline ASC`);
}

export async function updateSpendingGoalAmount(id: string, amount: number) {
  await executeSql(`UPDATE spending_goals SET currentAmount = ? WHERE id = ?`, [amount, id]);
}

export async function deleteSpendingGoal(id: string) {
  await executeSql(`DELETE FROM spending_goals WHERE id = ?`, [id]);
}

export async function clearAllData() {
  await executeSql(`DELETE FROM transactions`);
  await executeSql(`DELETE FROM subscriptions`);
  await executeSql(`DELETE FROM budgets`);
  await executeSql(`DELETE FROM templates`);
  await executeSql(`DELETE FROM tags`);
  await executeSql(`DELETE FROM transaction_tags`);
  await executeSql(`DELETE FROM spending_goals`);
}
