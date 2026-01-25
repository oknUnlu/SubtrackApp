import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "700" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  rowValue: {
    color: "#6b7280",
    fontSize: 14,
  },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginLeft: 48,
  },

  dangerCard: {
    marginTop: 20,
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    padding: 14,
  },
  dangerTitle: {
    fontWeight: "700",
    color: "#991b1b",
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: "#dc2626",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dangerText: {
    color: "#fff",
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  option: {
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
  },
});
