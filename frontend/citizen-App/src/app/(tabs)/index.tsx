
import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../ThemeContext";
import { getHomeSummary, HomeSummary } from "../../services/homeService";
import { getAlerts, Alert as CityAlert } from "../../services/alertsService";
import { getCurrentLocation } from "../../services/locationService";
import {
  getRainfallForecast,
  type RainfallForecastResponse,
} from "../../services/api";

// Used when location permission is denied or location cannot be fetched.
const DEFAULT_COORDS = { latitude: 19.076, longitude: 72.8777 };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function formatTimestamp(value?: string | null) {
  if (!value) return "Timestamp unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function Home() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [alerts, setAlerts] = useState<CityAlert[]>([]);
  const [usingGps, setUsingGps] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [rainfall, setRainfall] =
    useState<RainfallForecastResponse | null>(null);
  const [rainfallLoading, setRainfallLoading] = useState(false);
  const [rainfallError, setRainfallError] = useState("");

  const loadHome = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      let coords = DEFAULT_COORDS;
      try {
        coords = await getCurrentLocation();
        setUsingGps(true);
      } catch {
        setUsingGps(false);
      }

      try {
        setLoadError("");
        const result = await getHomeSummary(coords.latitude, coords.longitude);
        setSummary(result);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unable to load city data.";
        setLoadError(message);
      }

      try {
        const all = await getAlerts();
        setAlerts(all.filter((alert) => !alert.isRead).slice(0, 3));
      } catch {
        setAlerts([]);
      }
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  const loadRainfall = useCallback(async () => {
    setRainfallLoading(true);
    setRainfallError("");

    try {
      let coords = DEFAULT_COORDS;
      let locationName = "Mumbai city centre";

      try {
        coords = await getCurrentLocation();
        locationName = "Your current area";
      } catch {
        // Use Mumbai city centre if location is unavailable.
      }

      const result = await getRainfallForecast(
        coords.latitude,
        coords.longitude,
        locationName
      );

      setRainfall(result);
    } catch (error) {
      setRainfallError(
        "Rainfall forecast is temporarily unavailable."
      );
    } finally {
      setRainfallLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHome();
      void loadRainfall();
    }, [loadHome, loadRainfall])
  );

  const flood = summary?.flood_risk;
  const traffic = summary?.traffic;
  const weather = summary?.weather;
  const aqi = summary?.aqi;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadHome(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.smallText}>{getGreeting()}</Text>
            <Text style={styles.title}>CityLens</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View notifications"
            style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
            onPress={() => router.push("/(tabs)/alerts")}
          >
            <Ionicons name="notifications-outline" size={23} color={colors.primary} />
          </Pressable>
        </View>

        {/* CURRENT LOCATION */}
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
          <Text style={styles.locationText}>Mumbai, Maharashtra</Text>
          <Text style={styles.locationSubtext}>
            {loadError
              ? loadError
              : usingGps
                ? "Using your live location"
                : "Location permission off — showing city centre"}
          </Text>
        </View>

        {/* SAFETY OVERVIEW */}
        <Text style={styles.sectionTitle}>City Safety Overview</Text>
        <View style={styles.grid}>
          <View style={styles.infoCard}>
            <Text style={styles.cardIcon}>🌧️</Text>
            <Text style={styles.cardTitle}>Flood Risk</Text>
            <Text style={styles.cardValue}>{flood?.risk_level ?? "UNAVAILABLE"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.cardIcon}>🚦</Text>
            <Text style={styles.cardTitle}>Traffic</Text>
            <Text style={styles.cardValue}>{traffic?.congestion_level ?? "No data"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="cloud-outline" size={24} color={colors.primary} style={styles.iconCard} />
            <Text style={styles.cardTitle}>Weather</Text>
            <Text style={styles.cardValue}>
              {weather ? `${Math.round(weather.temperature)}°C` : "No data"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.aqiIcon}>AQI</Text>
            <Text style={styles.cardTitle}>Air Quality</Text>
            <Text style={styles.cardValue} numberOfLines={2}>
              {aqi ? `${aqi.us_aqi} • ${aqi.label}` : "No data"}
            </Text>
          </View>
        </View>

        {/* WEATHER INTELLIGENCE */}
        <View style={styles.intelligenceCard}>
          <View style={styles.intelligenceHeader}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.intelligenceTitle}>Weather Conditions</Text>
              <Text style={styles.intelligenceSubtitle}>For your selected coordinates</Text>
            </View>
            <Ionicons name="partly-sunny-outline" size={27} color={colors.primary} />
          </View>

          {weather ? (
            <>
              <View style={styles.weatherHero}>
                <View style={styles.temperatureBlock}>
                  <Text style={styles.metricLabel}>TEMPERATURE</Text>
                  <Text style={styles.temperatureValue}>{Math.round(weather.temperature)}°C</Text>
                  <Text style={styles.metricCaption}>
                    Feels like {Math.round(weather.apparent_temperature)}°C
                  </Text>
                </View>
                <Ionicons name="sunny-outline" size={43} color={colors.primary} />
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricTile}>
                  <Ionicons name="water-outline" size={20} color={colors.primary} />
                  <Text style={styles.metricLabel}>Humidity</Text>
                  <Text style={styles.metricValue}>{weather.humidity}%</Text>
                </View>
                <View style={styles.metricTile}>
                  <Ionicons name="flag-outline" size={20} color={colors.primary} />
                  <Text style={styles.metricLabel}>Wind</Text>
                  <Text style={styles.metricValue}>{weather.wind_speed} km/h</Text>
                </View>
                <View style={styles.metricTile}>
                  <Ionicons name="rainy-outline" size={20} color={colors.primary} />
                  <Text style={styles.metricLabel}>Rainfall</Text>
                  <Text style={styles.metricValue}>{weather.rain} mm</Text>
                </View>
              </View>
              <Text style={styles.dataSource}>Source: {weather.source ?? "Open-Meteo"}</Text>
              <Text style={styles.dataTimestamp}>Updated: {formatTimestamp(weather.timestamp)}</Text>
            </>
          ) : (
            <Text style={styles.metricCaption}>Weather data is currently unavailable.</Text>
          )}
        </View>

        {/* UPCOMING RAINFALL */}
        <View style={styles.intelligenceCard}>
          <View style={styles.intelligenceHeader}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.intelligenceTitle}>Upcoming Rainfall</Text>
              <Text style={styles.intelligenceSubtitle}>
                Hourly outlook for your area
              </Text>
            </View>
            <Ionicons name="rainy-outline" size={27} color={colors.primary} />
          </View>

          {rainfallLoading ? (
            <Text style={styles.metricCaption}>Loading rainfall forecast...</Text>
          ) : rainfallError ? (
            <Text style={styles.metricCaption}>{rainfallError}</Text>
          ) : rainfall?.next_rain ? (
            <>
              <Text style={styles.temperatureValue}>
                {new Date(rainfall.next_rain.forecast_time).toLocaleTimeString(
                  "en-IN",
                  { hour: "numeric", minute: "2-digit" }
                )}
              </Text>
              <Text style={styles.metricCaption}>
                Expected rainfall outlook · {rainfall.next_rain.location}
              </Text>
              <Text style={styles.metricValue}>
                {rainfall.next_rain.precipitation_probability}% chance of precipitation
              </Text>
              <Text style={styles.metricCaption}>
                Forecast precipitation: {rainfall.next_rain.precipitation_mm} mm
              </Text>
            </>
          ) : (
            <Text style={styles.metricCaption}>
              No qualifying rainfall period in the next six hours.
            </Text>
          )}

          <Text style={styles.dataSource}>Source: Open-Meteo</Text>
        </View>

        {/* AIR QUALITY INTELLIGENCE */}
        <View style={styles.intelligenceCard}>
          <View style={styles.intelligenceHeader}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.intelligenceTitle}>Air Quality</Text>
              <Text style={styles.intelligenceSubtitle}>Air pollution indicators</Text>
            </View>
            <Ionicons name="leaf-outline" size={27} color={colors.primary} />
          </View>

          {aqi ? (
            <>
              <View style={styles.aqiHero}>
                <View style={styles.aqiTextBlock}>
                  <Text style={styles.metricLabel}>US AIR QUALITY INDEX</Text>
                  <Text style={styles.aqiValue}>{aqi.us_aqi}</Text>
                  <Text style={styles.aqiLabel}>{aqi.label}</Text>
                </View>
                <Ionicons name="alert-circle-outline" size={34} color={colors.primary} />
              </View>

              <View style={styles.pollutantRow}>
                <View style={styles.pollutantTile}>
                  <Text style={styles.metricLabel}>PM2.5</Text>
                  <Text style={styles.metricValue}>{aqi.pm2_5} µg/m³</Text>
                </View>
                <View style={styles.pollutantTile}>
                  <Text style={styles.metricLabel}>PM10</Text>
                  <Text style={styles.metricValue}>{aqi.pm10} µg/m³</Text>
                </View>
              </View>
              <Text style={styles.dataSource}>Source: {aqi.source ?? "Open-Meteo Air Quality"}</Text>
              <Text style={styles.dataTimestamp}>Updated: {formatTimestamp(aqi.timestamp)}</Text>
            </>
          ) : (
            <Text style={styles.metricCaption}>Air quality data is currently unavailable.</Text>
          )}
        </View>

        {/* SAFETY ALERTS */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>Safety Alerts</Text>
            <Pressable onPress={() => router.push("/(tabs)/alerts")} hitSlop={8}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>
          {alerts.length === 0 ? (
            <Text style={styles.noAlert}>No active alerts</Text>
          ) : (
            alerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <Text style={styles.alertItemTitle}>{alert.title}</Text>
                <Text style={styles.noAlert}>{alert.message}</Text>
              </View>
            ))
          )}
        </View>

        {/* SOS */}
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.sosButton, pressed && styles.pressed]}
          onPress={() => router.push("/sos")}
        >
          <Ionicons name="alert-circle" size={30} color="#FFFFFF" />
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSubtext}>Emergency Assistance</Text>
        </Pressable>

        {/* REPORT INCIDENT */}
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}
          onPress={() => router.push("/(tabs)/reports")}
        >
          <Ionicons name="document-text-outline" size={19} color={colors.text} />
          <Text style={styles.reportText}>Report an Incident</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 32 },
    header: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22,
    },
    smallText: { color: colors.secondaryText, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
    title: { color: colors.text, fontSize: 30, fontWeight: "800", marginTop: 3 },
    notificationButton: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card,
      alignItems: "center", justifyContent: "center",
    },
    locationCard: {
      backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 25,
      borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border ?? "#244247",
    },
    locationLabel: { color: colors.secondaryText, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
    locationText: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 5 },
    locationSubtext: { color: colors.secondaryText, fontSize: 12, marginTop: 5, lineHeight: 18 },
    sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "700", marginBottom: 13 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    infoCard: {
      width: "48%", minHeight: 126, backgroundColor: colors.card, borderRadius: 17,
      padding: 16, marginBottom: 12,
    },
    cardIcon: { fontSize: 22, marginBottom: 12 },
    iconCard: { marginBottom: 12 },
    aqiIcon: { color: colors.primary, fontSize: 22, fontWeight: "800", marginBottom: 12 },
    cardTitle: { color: colors.text, fontSize: 14, fontWeight: "600" },
    cardValue: { color: colors.secondaryText, fontSize: 12, marginTop: 6, lineHeight: 17 },

    intelligenceCard: {
      backgroundColor: colors.card, borderRadius: 20, padding: 16, marginTop: 7, marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border ?? "#244247",
    },
    intelligenceHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 17,
    },
    headerTextWrap: { flex: 1, paddingRight: 12 },
    intelligenceTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
    intelligenceSubtitle: { color: colors.secondaryText, fontSize: 12, lineHeight: 17, marginTop: 4 },
    weatherHero: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: colors.background, borderRadius: 16, padding: 16, marginBottom: 12,
    },
    temperatureBlock: { flex: 1 },
    metricLabel: { color: colors.secondaryText, fontSize: 11, fontWeight: "600", marginTop: 5 },
    temperatureValue: { color: colors.text, fontSize: 38, fontWeight: "800", marginTop: 3 },
    metricCaption: { color: colors.secondaryText, fontSize: 12, lineHeight: 18, marginTop: 5 },
    metricRow: { flexDirection: "row", gap: 9, marginBottom: 12 },
    metricTile: {
      flex: 1, minWidth: 0, backgroundColor: colors.background, borderRadius: 13, padding: 11,
    },
    metricValue: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 5 },
    aqiHero: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: colors.background, borderRadius: 16, padding: 16, marginBottom: 12,
    },
    aqiTextBlock: { flex: 1 },
    aqiValue: { color: colors.primary, fontSize: 38, fontWeight: "900", marginTop: 3 },
    aqiLabel: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 2 },
    pollutantRow: { flexDirection: "row", gap: 10, marginTop: 2 },
    pollutantTile: { flex: 1, minWidth: 0, backgroundColor: colors.background, borderRadius: 13, padding: 13 },
    dataSource: { color: colors.secondaryText, fontSize: 11, marginTop: 12 },
    dataTimestamp: { color: colors.secondaryText, fontSize: 11, marginTop: 4, lineHeight: 16 },

    alertCard: {
      backgroundColor: colors.card, borderRadius: 18, padding: 17, marginTop: 8, marginBottom: 20,
    },
    alertHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    alertTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    viewAll: { color: colors.primary, fontSize: 12, fontWeight: "700" },
    noAlert: { color: colors.secondaryText, marginTop: 8, fontSize: 13, lineHeight: 19 },
    alertItem: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border ?? "#244247" },
    alertItemTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
    sosButton: {
      backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 20, alignItems: "center", marginBottom: 12,
    },
    sosText: { color: "#FFFFFF", fontSize: 27, fontWeight: "900", marginTop: 3 },
    sosSubtext: { color: "#FFFFFF", fontSize: 13, marginTop: 3 },
    reportButton: {
      borderWidth: 1, borderColor: colors.primary, borderRadius: 16, paddingVertical: 16,
      alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
    },
    reportText: { color: colors.text, fontSize: 15, fontWeight: "600" },
    pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  });
