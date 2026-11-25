import { StyleSheet, Text, View } from "react-native";

export default function ServiceCard({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#10282C",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  name: {
    color: "#fff",
    fontWeight: "700",
  },
  description: {
    color: "#82979A",
    marginTop: 5,
  },
});