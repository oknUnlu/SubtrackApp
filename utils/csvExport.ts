import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getTransactions, getSubscriptions } from "../database/db";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportTransactionsCsv(): Promise<void> {
  const transactions = await getTransactions();

  // UTF-8 BOM for Excel compatibility
  let csv = "\uFEFF";
  csv += "Date,Title,Amount,Category,Notes\n";

  for (const tx of transactions) {
    const date = new Date(tx.date).toLocaleDateString();
    csv += [
      escapeCsv(date),
      escapeCsv(tx.title),
      tx.amount.toFixed(2),
      escapeCsv(tx.category ?? ""),
      escapeCsv(tx.notes ?? ""),
    ].join(",") + "\n";
  }

  const fileName = `subtrack_expenses_${new Date().toISOString().slice(0, 10)}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(filePath, {
    mimeType: "text/csv",
    dialogTitle: "Export Expenses",
    UTI: "public.comma-separated-values-text",
  });
}

export async function exportSubscriptionsCsv(): Promise<void> {
  const subs = await getSubscriptions();

  let csv = "\uFEFF";
  csv += "Title,Amount,Interval\n";

  for (const sub of subs) {
    csv += [
      escapeCsv(sub.title),
      sub.amount.toFixed(2),
      sub.interval,
    ].join(",") + "\n";
  }

  const fileName = `subtrack_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(filePath, {
    mimeType: "text/csv",
    dialogTitle: "Export Subscriptions",
    UTI: "public.comma-separated-values-text",
  });
}
