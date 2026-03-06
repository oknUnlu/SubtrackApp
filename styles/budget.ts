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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6b7280",
    marginTop: 4,
  },
  overallCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  overallLabel: {
    color: "#dcfce7",
    fontSize: 14,
    fontWeight: "500",
  },
  overallInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  overallCurrency: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginRight: 8,
  },
  overallInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    padding: 14,
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  overallSave: {
    marginLeft: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontWeight: "600",
    fontSize: 15,
  },
  categoryInput: {
    width: 100,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 8,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  saveCategoryButton: {
    marginLeft: 8,
    padding: 6,
  },
});
