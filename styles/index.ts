import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f6f7f9",
    paddingBottom: 32,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
  },
  date: {
    color: "#6b7280",
    marginTop: 2,
  },

  totalCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  totalHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    color: "#dcfce7",
    marginLeft: 8,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    marginVertical: 8,
  },
  totalFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalSubText: {
    color: "#dcfce7",
    marginLeft: 6,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statLabel: {
    color: "#6b7280",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },

  largeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: "#6b7280",
  },

  adArea: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    alignItems: "center",
  },
  adTitle: {
    fontWeight: "600",
    color: "#9ca3af",
  },
  adSubtitle: {
    color: "#cbd5f5",
    marginTop: 4,
  },
});