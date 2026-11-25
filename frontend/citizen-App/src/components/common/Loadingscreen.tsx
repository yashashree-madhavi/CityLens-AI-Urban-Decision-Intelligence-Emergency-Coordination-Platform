import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#D62828" />
      <Text style={styles.text}>Loading CityLens...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071A1D",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#82979A",
    marginTop: 12,
  },
});