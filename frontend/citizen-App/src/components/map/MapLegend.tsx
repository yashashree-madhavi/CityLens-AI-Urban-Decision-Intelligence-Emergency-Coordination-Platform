import { StyleSheet, Text, View } from "react-native";

export default function MapLegend() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MAP LAYERS</Text>
      <Text style={styles.item}>Emergency Areas</Text>
      <Text style={styles.item}>Flood Risk</Text>
      <Text style={styles.item}>Traffic</Text>
      <Text style={styles.item}>Your Location</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#10282C",
    padding: 15,
    borderRadius: 14,
  },
  title: {
    color: "#82979A",
    fontSize: 10,
    marginBottom: 8,
  },
  item: {
    color: "#fff",
    marginVertical: 3,
  },
});