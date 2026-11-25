import { StyleSheet, Text, View } from "react-native";

export default function AlertCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#10282C",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#203D41",
  },
  title: {
    color: "#fff",
    fontWeight: "700",
  },
  message: {
    color: "#82979A",
    marginTop: 5,
  },
});