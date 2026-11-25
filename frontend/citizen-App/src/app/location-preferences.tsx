import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../ThemeContext";

const STORAGE_KEY = "citylens_location_preferences";

export default function LocationPreferences() {
  const { colors } = useTheme();

  const [permission, setPermission] = useState<string>("Checking...");
  const [useForSOS, setUseForSOS] = useState(true);
  const [useForReports, setUseForReports] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const permissionResult =
        await Location.getForegroundPermissionsAsync();

      if (permissionResult.status === "granted") {
        setPermission("Allowed");
      } else {
        setPermission("Not allowed");
      }

      const data = await AsyncStorage.getItem(STORAGE_KEY);

      if (data) {
        const saved = JSON.parse(data);

        setUseForSOS(saved.useForSOS ?? true);
        setUseForReports(saved.useForReports ?? true);
      }
    } catch (error) {
      console.log("Location settings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    const result =
      await Location.requestForegroundPermissionsAsync();

    setPermission(
      result.status === "granted"
        ? "Allowed"
        : "Not allowed"
    );
  };

  const save = async (
    key: "useForSOS" | "useForReports",
    value: boolean
  ) => {
    const updated = {
      useForSOS,
      useForReports,
      [key]: value,
    };

    if (key === "useForSOS") {
      setUseForSOS(value);
    }

    if (key === "useForReports") {
      setUseForReports(value);
    }

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loading,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>

        <Pressable
          onPress={() =>
            router.replace("/(tabs)/profile")
          }
        >
          <Text
            style={[
              styles.back,
              { color: colors.primary },
            ]}
          >
            ‹ Back
          </Text>
        </Pressable>

        <Text
          style={[
            styles.title,
            { color: colors.text },
          ]}
        >
          Location Preferences
        </Text>

        <Text
          style={[
            styles.subtitle,
            { color: colors.secondaryText },
          ]}
        >
          Manage how CityLens uses your location.
        </Text>

        <View
          style={[
            styles.permissionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.text },
              ]}
            >
              Location Permission
            </Text>

            <Text style={styles.status}>
              {permission}
            </Text>
          </View>

          {permission !== "Allowed" && (
            <Pressable onPress={requestLocation}>
              <Text
                style={[
                  styles.allow,
                  { color: colors.primary },
                ]}
              >
                ALLOW
              </Text>
            </Pressable>
          )}
        </View>

        <Text
          style={[
            styles.section,
            { color: colors.secondaryText },
          ]}
        >
          LOCATION USAGE
        </Text>

        <Setting
          title="Use Location for SOS"
          description="Attach your current location when sending an SOS"
          value={useForSOS}
          onValueChange={(value) =>
            save("useForSOS", value)
          }
          colors={colors}
        />

        <Setting
          title="Use Location for Reports"
          description="Attach your current location to incident reports"
          value={useForReports}
          onValueChange={(value) =>
            save("useForReports", value)
          }
          colors={colors}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

function Setting({
  title,
  description,
  value,
  onValueChange,
  colors,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.setting,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 15 }}>
        <Text
          style={[
            styles.settingTitle,
            { color: colors.text },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            { color: colors.secondaryText },
          ]}
        >
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.border,
          true: "#8E2929",
        }}
        thumbColor={
          value ? colors.primary : colors.secondaryText
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  back: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 7,
    marginBottom: 25,
    lineHeight: 20,
  },

  permissionCard: {
    borderRadius: 14,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  status: {
    color: "#55D68A",
    marginTop: 5,
    fontSize: 13,
    fontWeight: "600",
  },

  allow: {
    fontWeight: "800",
    fontSize: 12,
  },

  section: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 10,
    letterSpacing: 0.8,
  },

  setting: {
    borderRadius: 14,
    padding: 17,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },

  settingTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  description: {
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
  },
});