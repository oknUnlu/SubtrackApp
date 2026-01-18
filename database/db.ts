import * as SQLite from "expo-sqlite";

export type TransactionItem = {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO string
  category?: string;
};

export type SubscriptionItem = {
  id: string;
  title: string;
  amount: number;
  interval: string;
  nextDate?: string;
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
}

/* -------------------- */
/*  TRANSACTIONS        */
/* -------------------- */
export async function addTransaction(item: TransactionItem) {
  const sql = `
    INSERT INTO transactions (id, title, amount, date, category)
    VALUES (?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    item.id,
    item.title,
    item.amount,
    item.date,
    item.category ?? null,
  ]);
}

export async function getTransactions(): Promise<TransactionItem[]> {
  return await db.getAllAsync(
    "SELECT * FROM transactions ORDER BY date DESC"
  );
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

export async function getMonthlyTotal(): Promise<number> {
  const result = await db.getFirstAsync<{ total: number }>(
    `
    SELECT SUM(amount) as total
    FROM transactions
    WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `
  );

  return result?.total ?? 0;
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

