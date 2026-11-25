import { router } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const services = [
  {
    name: "Hospitals",
    description: "Nearby medical facilities",
  },
  {
    name: "Police Stations",
    description: "Nearby police assistance",
  },
  {
    name: "Fire Stations",
    description: "Nearby fire and rescue services",
  },
  {
    name: "Emergency Services",
    description: "Emergency assistance",
  },
];

export default function NearbyServicesScreen() {
  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Nearby Services</Text>
      <Text style={styles.subtitle}>
        Emergency services around your location.
      </Text>

      {services.map((service) => (
        <View style={styles.card} key={service.name}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>+</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{service.name}</Text>
            <Text style={styles.description}>
              {service.description}
            </Text>
            <Text style={styles.distance}>Distance: --</Text>
          </View>

          <View>
            <Pressable
              style={styles.smallButton}
              onPress={() =>
                Alert.alert(service.name, "Calling will be connected later.")
              }
            >
              <Text style={styles.smallButtonText}>CALL</Text>
            </Pressable>

            <Pressable
              style={styles.navigate}
              onPress={() =>
                Alert.alert(
                  service.name,
                  "Navigation will be connected later."
                )
              }
            >
              <Text style={styles.navigateText}>NAVIGATE</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071A1D",
    padding: 20,
  },
  back: {
    color: "#F04444",
    marginTop: 45,
  },
  title: {
    color: "#fff",
    fontSize: 29,
    fontWeight: "800",
    marginTop: 20,
  },
  subtitle: {
    color: "#82979A",
    marginTop: 6,
    marginBottom: 25,
  },
  card: {
    backgroundColor: "#10282C",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#19363A",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    color: "#F04444",
    fontSize: 22,
    fontWeight: "800",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: "#fff",
    fontWeight: "700",
  },
  description: {
    color: "#82979A",
    fontSize: 11,
    marginTop: 4,
  },
  distance: {
    color: "#82979A",
    fontSize: 11,
    marginTop: 4,
  },
  smallButton: {
    backgroundColor: "#D62828",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 7,
  },
  smallButtonText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  navigate: {
    paddingHorizontal: 5,
    paddingVertical: 7,
  },
  navigateText: {
    color: "#F04444",
    fontSize: 9,
    fontWeight: "700",
  },
});