import * as SQLite from 'expo-sqlite';

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
  interval: string; // e.g. monthly
  nextDate?: string;
};

const DB_NAME = 'subtrack.db';
const db = SQLite.openDatabaseSync(DB_NAME);

async function executeSql(
  sql: string,
  params: (string | number | null)[] = []
): Promise<any> {
  try {
    const result = await db.runAsync(sql, params);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function initDB(): Promise<void> {
  await executeSql(
    `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY NOT NULL, title TEXT, amount REAL, date TEXT, category TEXT)`
  );

  await executeSql(
    `CREATE TABLE IF NOT EXISTS subscriptions (id TEXT PRIMARY KEY NOT NULL, title TEXT, amount REAL, interval TEXT, nextDate TEXT)`
  );
}

export async function addTransaction(item: TransactionItem) {
  const sql = `INSERT OR REPLACE INTO transactions (id, title, amount, date, category) VALUES (?, ?, ?, ?, ?)`;
  await executeSql(sql, [item.id, item.title, item.amount, item.date, item.category ?? null]);
}

export async function getTransactions(): Promise<TransactionItem[]> {
  const rows: TransactionItem[] = await db.getAllAsync('SELECT * FROM transactions ORDER BY date DESC');
  return rows;
}

export async function addSubscription(item: SubscriptionItem) {
  const sql = `INSERT OR REPLACE INTO subscriptions (id, title, amount, interval, nextDate) VALUES (?, ?, ?, ?, ?)`;
  await executeSql(sql, [item.id, item.title, item.amount, item.interval, item.nextDate ?? null]);
}

export async function getSubscriptions(): Promise<SubscriptionItem[]> {
  const rows: SubscriptionItem[] = await db.getAllAsync('SELECT * FROM subscriptions ORDER BY title ASC');
  return rows;
}

export default {
  initDB,
  addTransaction,
  getTransactions,
  addSubscription,
  getSubscriptions,
};
