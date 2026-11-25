import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { reportIncident } from "../../services/incidentService";

const types = [
  "Flooding",
  "Accident",
  "Fire",
  "Medical Emergency",
  "Traffic Issue",
  "Other",
];

export default function ReportScreen() {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  const [imageUri, setImageUri] = useState<string | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [typeTouched, setTypeTouched] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getLocation = async () => {
    setLocationLoading(true);
    setLocationError("");

    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationError(
          "Location permission is required to attach your current location."
        );
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
    } catch {
      setLocationError(
        "Unable to get your location. Please try again."
      );
    }

    setLocationLoading(false);
  };

  const chooseFromGallery = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setSubmitError(
        "Photo library permission is required to select an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setSubmitError("");
    }
  };

  const takePhoto = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setSubmitError(
        "Camera permission is required to take a photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setSubmitError("");
    }
  };

  const removePhoto = () => {
    setImageUri(null);
  };

  const submitReport = async () => {
    setTypeTouched(true);
    setDescriptionTouched(true);
    setSubmitError("");

    if (!type || !description.trim()) {
      return;
    }

    if (latitude === null || longitude === null) {
      setSubmitError(
        "Your location is needed to submit a report. Please allow location access and try again."
      );
      return;
    }

    setSubmitting(true);

    try {
      await reportIncident({
        type,
        description: description.trim(),
        latitude,
        longitude,
        imageUri,
      });

      setSubmitting(false);

      router.replace("/my-reports");
    } catch (error: any) {
      setSubmitting(false);
      setSubmitError(
        error?.message ??
          "Something went wrong while sending your report. Please try again."
      );
    }
  };

  const typeError =
    typeTouched && !type
      ? "Please select an incident type."
      : "";

  const descriptionError =
    descriptionTouched && !description.trim()
      ? "Please describe the incident."
      : "";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Report Incident</Text>

      <Text style={styles.subtitle}>
        Help keep your city safe by reporting an incident.
      </Text>

      {/* INCIDENT TYPE */}

      <Text style={styles.section}>INCIDENT TYPE</Text>

      {types.map((item) => (
        <Pressable
          key={item}
          style={[
            styles.type,
            type === item && styles.selected,
          ]}
          onPress={() => {
            setType(item);
            setTypeTouched(true);
            setSubmitError("");
          }}
        >
          <View style={styles.typeRow}>
            <Text style={styles.typeText}>{item}</Text>

            {type === item && (
              <Text style={styles.check}>✓</Text>
            )}
          </View>
        </Pressable>
      ))}

      {typeError ? (
        <Text style={styles.error}>{typeError}</Text>
      ) : type ? (
        <Text style={styles.success}>✓ Incident type selected</Text>
      ) : null}

      {/* DESCRIPTION */}

      <Text style={styles.section}>DESCRIPTION</Text>

      <TextInput
        style={[
          styles.textArea,
          descriptionError && styles.inputError,
        ]}
        placeholder="Describe what happened..."
        placeholderTextColor="#6F8285"
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          setDescriptionTouched(true);
          setSubmitError("");
        }}
        multiline
        textAlignVertical="top"
      />

      {descriptionError ? (
        <Text style={styles.error}>{descriptionError}</Text>
      ) : description.trim() ? (
        <Text style={styles.success}>✓ Description added</Text>
      ) : null}

      {/* PHOTO */}

      <Text style={styles.section}>PHOTO</Text>

      {imageUri ? (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.preview}
          />

          <View style={styles.photoActions}>
            <Pressable
              style={styles.secondaryButton}
              onPress={chooseFromGallery}
            >
              <Text style={styles.secondaryText}>
                Replace
              </Text>
            </Pressable>

            <Pressable
              style={styles.removeButton}
              onPress={removePhoto}
            >
              <Text style={styles.removeText}>
                Remove
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.photoButtons}>
          <Pressable
            style={styles.photoButton}
            onPress={takePhoto}
          >
            <Text style={styles.photoIcon}>⌾</Text>
            <Text style={styles.photoButtonText}>
              Take Photo
            </Text>
          </Pressable>

          <Pressable
            style={styles.photoButton}
            onPress={chooseFromGallery}
          >
            <Text style={styles.photoIcon}>▣</Text>
            <Text style={styles.photoButtonText}>
              Gallery
            </Text>
          </Pressable>
        </View>
      )}

      {/* LOCATION */}

      <Text style={styles.section}>LOCATION</Text>

      <Pressable
        style={styles.location}
        onPress={getLocation}
        disabled={locationLoading}
      >
        <View style={styles.locationRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>
              CURRENT LOCATION
            </Text>

            {locationLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator
                  size="small"
                  color="#F04444"
                />
                <Text style={styles.locationText}>
                  Getting your location...
                </Text>
              </View>
            ) : latitude !== null &&
              longitude !== null ? (
              <>
                <Text style={styles.locationText}>
                  Location attached ✓
                </Text>

                <Text style={styles.coordinates}>
                  {latitude.toFixed(6)},{" "}
                  {longitude.toFixed(6)}
                </Text>
              </>
            ) : (
              <Text style={styles.locationText}>
                Tap to attach your current GPS location
              </Text>
            )}
          </View>

          {!locationLoading && (
            <Text style={styles.locationArrow}>›</Text>
          )}
        </View>
      </Pressable>

      {locationError ? (
        <Text style={styles.error}>{locationError}</Text>
      ) : null}

      {/* GENERAL ERROR */}

      {submitError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>
            {submitError}
          </Text>
        </View>
      ) : null}

      {/* SUBMIT */}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          submitting && styles.disabledButton,
        ]}
        onPress={submitReport}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            SUBMIT REPORT
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071A1D",
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
    color: "#fff",
    fontSize: 29,
    fontWeight: "800",
    marginTop: 20,
  },

  subtitle: {
    color: "#82979A",
    marginTop: 6,
    lineHeight: 20,
  },

  section: {
    color: "#82979A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 10,
  },

  type: {
    backgroundColor: "#10282C",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#203D41",
  },

  selected: {
    borderColor: "#D62828",
    backgroundColor: "#152D31",
  },

  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  typeText: {
    color: "#fff",
    fontSize: 15,
  },

  check: {
    color: "#F04444",
    fontSize: 18,
    fontWeight: "800",
  },

  textArea: {
    height: 130,
    backgroundColor: "#10282C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#203D41",
    padding: 15,
    color: "#fff",
    fontSize: 15,
  },

  inputError: {
    borderColor: "#F04444",
  },

  error: {
    color: "#F04444",
    fontSize: 12,
    marginTop: 6,
  },

  success: {
    color: "#62C98B",
    fontSize: 12,
    marginTop: 6,
  },

  photoButtons: {
    flexDirection: "row",
    gap: 10,
  },

  photoButton: {
    flex: 1,
    height: 105,
    backgroundColor: "#10282C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#203D41",
    justifyContent: "center",
    alignItems: "center",
  },

  photoIcon: {
    color: "#F04444",
    fontSize: 25,
    marginBottom: 6,
  },

  photoButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  photoContainer: {
    backgroundColor: "#10282C",
    borderRadius: 12,
    overflow: "hidden",
  },

  preview: {
    width: "100%",
    height: 220,
  },

  photoActions: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },

  secondaryButton: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#405B5F",
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryText: {
    color: "#fff",
    fontWeight: "700",
  },

  removeButton: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    backgroundColor: "#3A2022",
    justifyContent: "center",
    alignItems: "center",
  },

  removeText: {
    color: "#F04444",
    fontWeight: "700",
  },

  location: {
    backgroundColor: "#10282C",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#203D41",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationTitle: {
    color: "#82979A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  locationText: {
    color: "#fff",
    marginTop: 6,
    lineHeight: 20,
  },

  coordinates: {
    color: "#82979A",
    fontSize: 12,
    marginTop: 4,
  },

  locationArrow: {
    color: "#F04444",
    fontSize: 28,
    marginLeft: 10,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  errorBox: {
    backgroundColor: "#321D20",
    borderWidth: 1,
    borderColor: "#6D3035",
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },

  errorBoxText: {
    color: "#F04444",
    fontSize: 13,
  },

  button: {
    height: 54,
    backgroundColor: "#D62828",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});