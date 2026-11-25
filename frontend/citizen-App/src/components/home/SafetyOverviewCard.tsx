import { StyleSheet, Text, View } from "react-native";

export default function SafetyOverviewCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>CITY SAFETY STATUS</Text>
      <Text style={styles.title}>Monitoring Active</Text>
      <Text style={styles.text}>
        Stay aware of conditions around you.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#10282C",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#203D41",
  },
  label: {
    color: "#82979A",
    fontSize: 10,
    letterSpacing: 1,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 7,
  },
  text: {
    color: "#82979A",
    marginTop: 5,
  },
});