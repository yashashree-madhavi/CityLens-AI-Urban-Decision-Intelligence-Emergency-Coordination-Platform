import { StyleSheet, Text, View } from "react-native";

export default function CityLensLogo() {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Text style={styles.c}>C</Text>
      </View>

      <Text style={styles.title}>CITYLENS</Text>
      <Text style={styles.subtitle}>URBAN SAFETY INTELLIGENCE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#D62828",
    justifyContent: "center",
    alignItems: "center",
  },
  c: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 10,
  },
  subtitle: {
    color: "#82979A",
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 3,
  },
});