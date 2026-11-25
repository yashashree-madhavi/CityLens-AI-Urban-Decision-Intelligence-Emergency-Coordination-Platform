import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import { sendSOS as sendSOSRequest } from "../../services/sosService";

const emergencyTypes = [
  "Medical Emergency",
  "Fire",
  "Accident",
  "Flooding",
  "Traffic",
  "Other",
];

export default function SOSScreen() {
  const [selected, setSelected] = useState("");
  const [description, setDescription] = useState("");

  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [locationLoading, setLocationLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocation(null);
        setLocationLoading(false);
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setLocation(currentLocation);
    } catch (error) {
      console.log("Location error:", error);
      setLocation(null);
    } finally {
      setLocationLoading(false);
    }
  };

  const selectEmergencyType = (type: string) => {
    setSelected(type);

    if (type !== "Other") {
      setDescription("");
    }
  };

  const sendSOS = () => {
    if (!selected) {
      Alert.alert(
        "Select Emergency Type",
        "Please select the emergency type first."
      );
      return;
    }

    if (selected === "Other" && !description.trim()) {
      Alert.alert(
        "Describe the Emergency",
        "Please describe the emergency before sending the SOS."
      );
      return;
    }

    if (!location) {
      Alert.alert(
        "Location needed",
        "We need your location to send help to the right place. Please turn on location and tap TRY AGAIN."
      );
      return;
    }

    Alert.alert(
      "Confirm SOS",
      `Are you sure you want to send an SOS for:\n\n${selected}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "SEND SOS",
          style: "destructive",
          onPress: saveSOS,
        },
      ]
    );
  };

  const saveSOS = async () => {
    try {
      setSending(true);

      if (!location) {
        throw new Error("Location not available.");
      }

      await sendSOSRequest({
        type: selected,
        description:
          selected === "Other"
            ? description.trim()
            : undefined,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setSending(false);
      setSelected("");
      setDescription("");
      setShowSuccess(true);
    } catch (error: any) {
      console.log("SOS send error:", error);

      setSending(false);

      Alert.alert(
        "SOS not sent",
        (error?.message ?? "Unable to send SOS.") +
          "\n\nIf this is life-threatening, call 112 now."
      );
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* BACK */}
        <Pressable
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        {/* HEADER */}
        <Text style={styles.title}>Emergency SOS</Text>

        <Text style={styles.subtitle}>
          Use this when you need immediate emergency assistance.
        </Text>

        {/* SOS CIRCLE */}
        <View style={styles.sosCircle}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSub}>EMERGENCY</Text>
        </View>

        {/* EMERGENCY TYPE */}
        <Text style={styles.section}>
          SELECT EMERGENCY TYPE
        </Text>

        {emergencyTypes.map((type) => (
          <Pressable
            key={type}
            onPress={() => selectEmergencyType(type)}
            style={[
              styles.type,
              selected === type && styles.selectedType,
            ]}
          >
            <Text
              style={[
                styles.typeText,
                selected === type && styles.selectedText,
              ]}
            >
              {type}
            </Text>

            {selected === type && (
              <Text style={styles.check}>✓</Text>
            )}
          </Pressable>
        ))}

        {/* OTHER DESCRIPTION */}
        {selected === "Other" && (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionLabel}>
              DESCRIBE THE EMERGENCY
            </Text>

            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what happened..."
              placeholderTextColor="#60777A"
              multiline
              textAlignVertical="top"
              maxLength={300}
            />

            <Text style={styles.characterCount}>
              {description.length}/300
            </Text>
          </View>
        )}

        {/* LOCATION */}
        <Text style={styles.section}>
          CURRENT LOCATION
        </Text>

        <View style={styles.location}>
          {locationLoading ? (
            <View style={styles.locationRow}>
              <ActivityIndicator color="#F04444" />

              <Text style={styles.locationText}>
                Getting your location...
              </Text>
            </View>
          ) : location ? (
            <>
              <Text style={styles.locationReady}>
                ✓ Location captured
              </Text>

              <Text style={styles.coordinates}>
                Latitude:{" "}
                {location.coords.latitude.toFixed(6)}
              </Text>

              <Text style={styles.coordinates}>
                Longitude:{" "}
                {location.coords.longitude.toFixed(6)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.locationError}>
                Location unavailable
              </Text>

              <Text style={styles.locationHelp}>
                Location permission is required for SOS.
              </Text>

              <Pressable
                style={styles.retryButton}
                onPress={getLocation}
              >
                <Text style={styles.retryText}>
                  TRY AGAIN
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* INFORMATION */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Emergency Assistance
          </Text>

          <Text style={styles.infoText}>
            Your SOS request includes your emergency type
            and current location, and is sent live to the
            CityLens control room. In a life-threatening
            emergency, also call 112.
          </Text>
        </View>

        {/* SEND SOS */}
        <Pressable
          style={[
            styles.button,
            (!selected || sending) &&
              styles.disabledButton,
          ]}
          onPress={sendSOS}
          disabled={!selected || sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              SEND SOS
            </Text>
          )}
        </Pressable>
      </ScrollView>

      {/* SUCCESS POPUP */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Text style={styles.successCheck}>✓</Text>
            </View>

            <Text style={styles.successTitle}>
              SOS Sent
            </Text>

            <Text style={styles.successText}>
              Your emergency assistance request has been
              recorded successfully.
            </Text>

            <Pressable
              style={styles.successButton}
              onPress={() => setShowSuccess(false)}
            >
              <Text style={styles.successButtonText}>
                OK
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#071A1D",
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  back: {
    color: "#F04444",
    marginTop: 45,
    fontSize: 16,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
    marginTop: 20,
  },

  subtitle: {
    color: "#82979A",
    marginTop: 6,
    lineHeight: 20,
  },

  sosCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#D62828",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 35,
    elevation: 10,
  },

  sosText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
  },

  sosSub: {
    color: "#FFD5D5",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  section: {
    color: "#82979A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 35,
    marginBottom: 10,
  },

  type: {
    backgroundColor: "#10282C",
    borderWidth: 1,
    borderColor: "#203D41",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectedType: {
    borderColor: "#D62828",
    backgroundColor: "#28191B",
  },

  typeText: {
    color: "#FFFFFF",
    fontSize: 15,
  },

  selectedText: {
    color: "#F04444",
    fontWeight: "700",
  },

  check: {
    color: "#F04444",
    fontSize: 20,
    fontWeight: "800",
  },

  descriptionBox: {
    backgroundColor: "#10282C",
    borderRadius: 12,
    padding: 15,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#203D41",
  },

  descriptionLabel: {
    color: "#82979A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },

  descriptionInput: {
    minHeight: 100,
    backgroundColor: "#0D2226",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#304A4E",
    padding: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },

  characterCount: {
    color: "#60777A",
    fontSize: 11,
    textAlign: "right",
    marginTop: 6,
  },

  location: {
    backgroundColor: "#10282C",
    borderRadius: 12,
    padding: 16,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    color: "#FFFFFF",
    marginLeft: 10,
  },

  locationReady: {
    color: "#55D68A",
    fontWeight: "700",
    marginBottom: 10,
  },

  coordinates: {
    color: "#B8C7C9",
    marginTop: 4,
    fontSize: 13,
  },

  locationError: {
    color: "#F04444",
    fontWeight: "700",
  },

  locationHelp: {
    color: "#82979A",
    marginTop: 5,
  },

  retryButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D62828",
  },

  retryText: {
    color: "#F04444",
    fontWeight: "700",
    fontSize: 12,
  },

  infoBox: {
    backgroundColor: "#0D2226",
    borderRadius: 12,
    padding: 16,
    marginTop: 18,
    borderLeftWidth: 3,
    borderLeftColor: "#D62828",
  },

  infoTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  infoText: {
    color: "#82979A",
    lineHeight: 19,
    marginTop: 6,
  },

  button: {
    backgroundColor: "#D62828",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },

  disabledButton: {
    opacity: 0.45,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  successBox: {
    width: "100%",
    backgroundColor: "#10282C",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#28503B",
  },

  successIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#183D2B",
    justifyContent: "center",
    alignItems: "center",
  },

  successCheck: {
    color: "#55D68A",
    fontSize: 35,
    fontWeight: "900",
  },

  successTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 16,
  },

  successText: {
    color: "#82979A",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },

  successButton: {
    backgroundColor: "#55D68A",
    width: "100%",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  successButtonText: {
    color: "#071A1D",
    fontWeight: "800",
  },
});