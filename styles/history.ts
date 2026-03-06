import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7f9",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6b7280",
    marginTop: 4,
  },
  searchBar: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  searchIcon: {
    position: "absolute",
    left: 28,
    top: 85,
    zIndex: 1,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#22c55e",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  categoryFilterRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  txIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontWeight: "600",
    fontSize: 15,
  },
  txSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  txNotes: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  txAmount: {
    fontWeight: "700",
    fontSize: 15,
    marginRight: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 15,
  },
  resultCount: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
  },
});
