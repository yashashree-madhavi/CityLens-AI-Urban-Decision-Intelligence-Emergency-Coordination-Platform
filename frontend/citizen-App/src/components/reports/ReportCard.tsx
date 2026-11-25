import { StyleSheet, Text, View } from "react-native";

export default function ReportCard({
  type,
  status,
}: {
  type: string;
  status: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.type}>{type}</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#10282C",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  type: {
    color: "#fff",
    fontWeight: "700",
  },
  status: {
    color: "#F04444",
    marginTop: 5,
    fontSize: 12,
  },
});