import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7f9",
  },
  content: {
    padding: 16,
    paddingBottom: 120,
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
    color: "#777",
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    color: "#777",
    marginBottom: 6,
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#22c55e",
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 8,
  },
  adArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  adTitle: {
    fontWeight: "600",
    color: "#999",
  },
  adSubtitle: {
    color: "#bbb",
    marginTop: 4,
  },
  bottomTab: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  tabItem: {
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden" as const,
  },
  subCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  subCardTitle: {
    fontWeight: "600" as const,
    fontSize: 16,
  },
  subCardInterval: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 2,
  },
  subCardAmount: {
    fontWeight: "700" as const,
    fontSize: 16,
    marginRight: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center" as const,
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  intervalRow: {
    flexDirection: "row" as const,
    marginBottom: 12,
  },
  intervalButton: {
    flex: 1,
    padding: 10,
    marginRight: 6,
    borderRadius: 10,
  },
  intervalButtonText: {
    textAlign: "center" as const,
    fontWeight: "600" as const,
  },
  modalActions: {
    flexDirection: "row" as const,
  },
  modalActionButton: {
    flex: 1,
    padding: 12,
  },
});