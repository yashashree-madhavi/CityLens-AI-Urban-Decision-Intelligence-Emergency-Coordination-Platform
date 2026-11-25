import React, { useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTheme } from "../ThemeContext";

const STORAGE_KEY = "citylens_notification_preferences";

export default function NotificationPreferences() {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  const [emergency, setEmergency] = useState(true);
  const [flood, setFlood] = useState(true);
  const [traffic, setTraffic] = useState(false);
  const [reports, setReports] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);

      if (data) {
        const saved = JSON.parse(data);

        setEmergency(saved.emergency ?? true);
        setFlood(saved.flood ?? true);
        setTraffic(saved.traffic ?? false);
        setReports(saved.reports ?? true);
      }
    } catch (error) {
      console.log("Notification preference error:", error);
    }
  };

  const savePreferences = async (updated: any) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.log("Save preference error:", error);
    }
  };

  const update = (
    key: "emergency" | "flood" | "traffic" | "reports",
    value: boolean
  ) => {
    const updated = {
      emergency,
      flood,
      traffic,
      reports,
      [key]: value,
    };

    if (key === "emergency") setEmergency(value);
    if (key === "flood") setFlood(value);
    if (key === "traffic") setTraffic(value);
    if (key === "reports") setReports(value);

    savePreferences(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* BACK */}
        <Pressable onPress={() => router.replace("/(tabs)/profile")}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>
          Notification Preferences
        </Text>

        <Text style={styles.subtitle}>
          Choose which CityLens alerts you want to receive.
        </Text>

        <Setting
          title="Emergency Alerts"
          description="Important emergency and SOS-related alerts"
          value={emergency}
          onValueChange={(value) =>
            update("emergency", value)
          }
          styles={styles}
        />

        <Setting
          title="Flood Risk Alerts"
          description="Warnings when flood risk increases in your area"
          value={flood}
          onValueChange={(value) =>
            update("flood", value)
          }
          styles={styles}
        />

        <Setting
          title="Traffic Alerts"
          description="Traffic disruptions and road-related alerts"
          value={traffic}
          onValueChange={(value) =>
            update("traffic", value)
          }
          styles={styles}
        />

        <Setting
          title="Report Updates"
          description="Updates about incidents you have reported"
          value={reports}
          onValueChange={(value) =>
            update("reports", value)
          }
          styles={styles}
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
  styles,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.setting}>
      <View style={styles.textContainer}>
        <Text style={styles.settingTitle}>{title}</Text>

        <Text style={styles.description}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: styles.switchOff.backgroundColor,
          true: styles.switchOn.backgroundColor,
        }}
        thumbColor={value ? "#E53935" : "#829497"}
      />
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      padding: 20,
      paddingBottom: 40,
    },

    back: {
      color: colors.primary,
      fontSize: 16,
      marginTop: 20,
      marginBottom: 20,
    },

    title: {
      color: colors.text,
      fontSize: 27,
      fontWeight: "800",
    },

    subtitle: {
      color: colors.secondaryText,
      marginTop: 7,
      marginBottom: 25,
      lineHeight: 20,
    },

    setting: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 17,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
    },

    textContainer: {
      flex: 1,
      paddingRight: 15,
    },

    settingTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },

    description: {
      color: colors.secondaryText,
      fontSize: 12,
      marginTop: 5,
      lineHeight: 17,
    },

    switchOff: {
      backgroundColor: "#304A4E",
    },

    switchOn: {
      backgroundColor: "#8E2929",
    },
  });