import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useState } from "react";
import { getCurrentLocation } from "../../services/locationService";
import {
  analyzeRoute,
  AnalyzedRoute,
  RouteAnalysis,
} from "../../services/routingService";

export default function SafeRouteScreen() {
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);

  const findRoute = async () => {
    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const origin = await getCurrentLocation();

      // Turn the typed place name into coordinates (biased to Mumbai)
      const results = await Location.geocodeAsync(
        `${destination.trim()}, Mumbai, Maharashtra, India`
      );

      if (results.length === 0) {
        throw new Error(
          "Could not find that place. Try a more specific name."
        );
      }

      const result = await analyzeRoute(origin, {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      });

      setAnalysis(result);
    } catch (e: any) {
      setError(e?.message ?? "Unable to analyse the route.");
    } finally {
      setLoading(false);
    }
  };

  const best: AnalyzedRoute | undefined = analysis
    ? analysis.routes.find(
        (route) => route.route_id === analysis.recommended_route_id
      ) ?? analysis.routes[0]
    : undefined;

  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Safe Route</Text>
      <Text style={styles.subtitle}>
        Find a route considering city safety conditions.
      </Text>

      <Text style={styles.label}>DESTINATION</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter destination"
        placeholderTextColor="#6F8285"
        value={destination}
        onChangeText={setDestination}
        onSubmitEditing={findRoute}
        returnKeyType="search"
      />

      <View style={styles.routeBox}>
        <Text style={styles.routeIcon}>→</Text>
        <Text style={styles.routeTitle}>Route Analysis</Text>

        {loading ? (
          <ActivityIndicator color="#F04444" style={{ marginTop: 12 }} />
        ) : best && analysis ? (
          <>
            <Text style={styles.resultTitle}>
              Recommended: Route {best.route_id}
            </Text>
            <Text style={styles.resultLine}>
              {best.distance_km} km • {best.travel_time_minutes} min
              {best.traffic_delay_minutes > 0
                ? ` (+${best.traffic_delay_minutes} min traffic)`
                : ""}
            </Text>
            <Text style={styles.resultLine}>
              Traffic: {best.traffic.congestion_level}
              {best.traffic.road_closure ? " • Road closure!" : ""}
            </Text>
            {best.route_intelligence?.overall_status ? (
              <Text style={styles.resultLine}>
                Risk: {String(best.route_intelligence.overall_status)}
              </Text>
            ) : null}
            {analysis.recommendation?.summary ? (
              <Text style={styles.resultLine}>
                {String(analysis.recommendation.summary)}
              </Text>
            ) : null}
            <Text style={styles.resultLine}>
              {analysis.routes.length} route
              {analysis.routes.length === 1 ? "" : "s"} analysed.
            </Text>
          </>
        ) : (
          <Text style={styles.routeText}>
            Traffic, flood risk and nearby incidents are checked for
            every route, and the safest one is recommended.
          </Text>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <Pressable
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={findRoute}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "ANALYSING..." : "FIND SAFE ROUTE"}
        </Text>
      </Pressable>
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
  },
  label: {
    color: "#82979A",
    fontSize: 10,
    marginTop: 35,
    marginBottom: 8,
  },
  input: {
    height: 54,
    backgroundColor: "#10282C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#203D41",
    color: "#fff",
    paddingHorizontal: 15,
  },
  routeBox: {
    backgroundColor: "#10282C",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  routeIcon: {
    color: "#F04444",
    fontSize: 30,
  },
  routeTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    marginTop: 8,
  },
  routeText: {
    color: "#82979A",
    lineHeight: 20,
    marginTop: 6,
  },
  resultTitle: {
    color: "#54B889",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 10,
  },
  resultLine: {
    color: "#C9D6D8",
    marginTop: 6,
    lineHeight: 20,
  },
  errorText: {
    color: "#F04444",
    marginTop: 12,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#D62828",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },
});