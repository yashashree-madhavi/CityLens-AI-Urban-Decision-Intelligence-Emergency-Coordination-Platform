import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  message: string;
};

export default function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>+</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#10282C",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
  },
  icon: {
    color: "#D62828",
    fontSize: 28,
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 8,
  },
  message: {
    color: "#82979A",
    textAlign: "center",
    marginTop: 6,
  },
});