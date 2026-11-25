import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  getRainfallForecast,
  type RainfallForecastResponse,
} from "../services/api";

const MUMBAI = {
  latitude: 19.076,
  longitude: 72.8777,
  name: "Mumbai",
};

function formatForecastTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [forecast, setForecast] =
    useState<RainfallForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecastError, setForecastError] = useState("");

  const loadForecast = useCallback(async () => {
    try {
      const result = await getRainfallForecast(
        MUMBAI.latitude,
        MUMBAI.longitude,
        MUMBAI.name
      );

      setForecast(result);
      setForecastError("");
    } catch {
      setForecastError("Unable to refresh the weather outlook.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForecast();

    const interval = setInterval(loadForecast, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadForecast]);

  useFocusEffect(
    useCallback(() => {
      loadForecast();
    }, [loadForecast])
  );

  const nextRain = forecast?.next_rain;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logo}>CITYLENS</Text>

        <Text style={styles.title}>Welcome to CityLens</Text>

        <Text style={styles.subtitle}>
          Mumbai Safety & Emergency Support
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>City Safety Overview</Text>

          <Text style={styles.info}>🌧️ Flood Risk</Text>
          <Text style={styles.status}>Monitoring</Text>

          <Text style={styles.info}>🌦️ Upcoming Rainfall</Text>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#70D6C3" />
              <Text style={styles.status}>Loading weather outlook...</Text>
            </View>
          ) : nextRain ? (
            <View style={styles.forecastBox}>
              <Text style={styles.forecastTitle}>
                Rain possible around{" "}
                {formatForecastTime(nextRain.forecast_time)}
              </Text>

              <Text style={styles.forecastDetail}>
                {nextRain.location}
              </Text>

              <Text style={styles.forecastProbability}>
                {nextRain.precipitation_probability}% chance of precipitation
              </Text>

              <Text style={styles.forecastDetail}>
                Forecast precipitation: {nextRain.precipitation_mm} mm
              </Text>
            </View>
          ) : forecastError ? (
            <Text style={styles.status}>{forecastError}</Text>
          ) : (
            <Text style={styles.status}>
              No qualifying rainfall period in the next six hours.
            </Text>
          )}

          <Text style={styles.info}>🚦 Traffic</Text>
          <Text style={styles.status}>Live data coming soon</Text>

          <Text style={styles.info}>⚠️ Alerts</Text>
          <Text style={styles.status}>Check the alerts section for updates</Text>
        </View>

        <Pressable
          style={styles.sosButton}
          onPress={() => router.push("/sos")}
        >
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSubtext}>Emergency Assistance</Text>
        </Pressable>

        <Pressable
          style={styles.reportButton}
          onPress={() => router.push("/(tabs)/reports")}
        >
          <Text style={styles.reportText}>Report an Incident</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071A1D",
  },

  content: {
    flexGrow: 1,
    padding: 24,
  },

  logo: {
    color: "#E53935",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 30,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    color: "#A9B8BA",
    fontSize: 15,
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#10282C",
    borderRadius: 18,
    padding: 20,
    marginBottom: 25,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 18,
  },

  info: {
    color: "#FFFFFF",
    fontSize: 15,
    marginTop: 12,
  },

  status: {
    color: "#9FB0B2",
    fontSize: 13,
    marginTop: 5,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },

  forecastBox: {
    backgroundColor: "#15383B",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },

  forecastTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },

  forecastDetail: {
    color: "#B7CDCF",
    fontSize: 13,
    marginTop: 7,
  },

  forecastProbability: {
    color: "#70D6C3",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
  },

  sosButton: {
    backgroundColor: "#E53935",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 15,
  },

  sosText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },

  sosSubtext: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 3,
  },

  reportButton: {
    borderWidth: 1,
    borderColor: "#E53935",
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: "center",
  },

  reportText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});