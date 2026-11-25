import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useTheme } from "../../ThemeContext";
import {
  analyzeRoute,
  type RouteAnalysis,
  type RoutePoint,
} from "../../services/routingService";

export default function Map() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const webViewRef = useRef<WebView>(null);
  const locationRef = useRef<Location.LocationObject | null>(null);

  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [routing, setRouting] = useState(false);
  const [routeAnalysis, setRouteAnalysis] =
    useState<RouteAnalysis | null>(null);
  const [selectedRouteId, setSelectedRouteId] =
    useState<number | null>(null);
  const [destination, setDestination] =
    useState<RoutePoint | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const sendToMap = useCallback((payload: unknown) => {
    const serialized = JSON.stringify(JSON.stringify(payload));

    webViewRef.current?.injectJavaScript(`
      if (window.handleNativeMessage) {
        window.handleNativeMessage(${serialized});
      }
      true;
    `);
  }, []);

  const getCurrentLocation = async (): Promise<RoutePoint | null> => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setErrorMessage(
          "Location permission is needed to calculate a route from your position."
        );
        return null;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      locationRef.current = currentLocation;
      setLocation(currentLocation);
      setErrorMessage("");

      sendToMap({
        type: "USER_LOCATION",
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
    } catch (error) {
      console.error("Location error:", error);
      setErrorMessage("Could not get your current location.");
      return null;
    }
  };

  useEffect(() => {
    getCurrentLocation().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!location) return;

    sendToMap({
      type: "USER_LOCATION",
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  }, [location, sendToMap]);

  useEffect(() => {
    if (!routeAnalysis || selectedRouteId === null) return;

    sendToMap({
      type: "ROUTE_SELECTION",
      selectedRouteId,
    });
  }, [routeAnalysis, selectedRouteId, sendToMap]);

  const calculateRoute = async (target: RoutePoint) => {
    const currentLocation = locationRef.current;

    if (!currentLocation) {
      setErrorMessage(
        "Your location is unavailable. Use the location button and try again."
      );
      return;
    }

    const origin: RoutePoint = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };

    setDestination(target);
    setRouting(true);
    setErrorMessage("");
    setRouteAnalysis(null);
    setSelectedRouteId(null);

    sendToMap({
      type: "DESTINATION",
      ...target,
    });

    try {
      const result = await analyzeRoute(origin, target);

      if (!result.routes || result.routes.length === 0) {
        setErrorMessage("No routes were returned. Try another destination.");
        return;
      }

      setRouteAnalysis(result);

      const recommendedId = result.recommended_route_id;
      const initialRouteId =
        recommendedId != null &&
        result.routes.some((route) => route.route_id === recommendedId)
          ? recommendedId
          : result.routes[0].route_id;

      setSelectedRouteId(initialRouteId);

      sendToMap({
        type: "ROUTE_ANALYSIS",
        routes: result.routes,
        recommendedRouteId: initialRouteId,
        destination: target,
      });
    } catch (error) {
      console.error("Route analysis error:", error);
      setErrorMessage(
        "Route analysis failed. Check your connection and try again."
      );
    } finally {
      setRouting(false);
    }
  };

  const centerOnUser = async () => {
    const current = await getCurrentLocation();

    if (current) {
      sendToMap({
        type: "CENTER_ON_USER",
        ...current,
      });
    }
  };

  const handleWebViewMessage = async (event: {
    nativeEvent: { data: string };
  }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "DESTINATION_SELECTED") {
        await calculateRoute({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error("Map message error:", error);
    }
  };

  const selectRoute = (routeId: number) => {
    setSelectedRouteId(routeId);
    sendToMap({
      type: "ROUTE_SELECTION",
      selectedRouteId: routeId,
    });
  };

  const clearRoute = () => {
    setRouteAnalysis(null);
    setSelectedRouteId(null);
    setDestination(null);
    setErrorMessage("");

    sendToMap({ type: "CLEAR_ROUTE" });
  };

  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html, body, #map {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  #map { background: #e5e5e5; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const defaultLocation = [19.0760, 72.8777];
  const map = L.map("map").setView(defaultLocation, 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  let userMarker = null;
  let destinationMarker = null;
  let routeLayers = {};
  let routeData = [];
  let recommendedRouteId = null;
  let selectedRouteId = null;

  function setUserLocation(latitude, longitude, shouldCenter) {
    const point = [latitude, longitude];

    if (userMarker) {
      userMarker.setLatLng(point);
    } else {
      userMarker = L.marker(point)
        .addTo(map)
        .bindPopup("Your current location");
    }

    if (shouldCenter) map.setView(point, 15);
  }

  function clearRoutes() {
    Object.values(routeLayers).forEach(layer => map.removeLayer(layer));
    routeLayers = {};
    routeData = [];
  }

  function drawRoutes(routes, recommendedId) {
    clearRoutes();
    recommendedRouteId = recommendedId;

    routes.forEach(route => {
      if (!route.route_geometry || route.route_geometry.length < 2) return;

      const coordinates = route.route_geometry.map(point => [
        point.latitude,
        point.longitude
      ]);

      const layer = L.polyline(coordinates, {
        color: route.route_id === selectedRouteId
          ? "#1976D2"
          : route.route_id === recommendedRouteId
            ? "#239B56"
            : "#7B8794",
        weight: route.route_id === selectedRouteId ? 7 : 5,
        opacity: route.route_id === selectedRouteId ? 1 : 0.8
      }).addTo(map);

      layer.bindPopup(
        "Route " + route.route_id +
        " · " + route.distance_km + " km" +
        " · " + route.travel_time_minutes + " min"
      );

      routeLayers[route.route_id] = layer;
    });

    const selectedLayer = routeLayers[selectedRouteId];
    const boundsLayers = Object.values(routeLayers);

    if (boundsLayers.length > 0) {
      const group = L.featureGroup(boundsLayers);
      map.fitBounds(group.getBounds(), { padding: [35, 35] });
    }

    if (selectedLayer) selectedLayer.bringToFront();
  }

  function updateSelection(routeId) {
    selectedRouteId = routeId;

    Object.entries(routeLayers).forEach(([id, layer]) => {
      const routeIdNumber = Number(id);
      const selected = routeIdNumber === selectedRouteId;

      layer.setStyle({
        color: selected
          ? "#1976D2"
          : routeIdNumber === recommendedRouteId
            ? "#239B56"
            : "#7B8794",
        weight: selected ? 7 : 5,
        opacity: selected ? 1 : 0.8
      });
    });

    if (routeLayers[routeId]) routeLayers[routeId].bringToFront();
  }

  map.on("click", function(event) {
    const latitude = event.latlng.lat;
    const longitude = event.latlng.lng;

    if (destinationMarker) map.removeLayer(destinationMarker);

    destinationMarker = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup("Selected destination")
      .openPopup();

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "DESTINATION_SELECTED",
      latitude,
      longitude
    }));
  });

  window.handleNativeMessage = function(raw) {
    try {
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;

      if (data.type === "USER_LOCATION") {
        setUserLocation(data.latitude, data.longitude, true);
      }

      if (data.type === "CENTER_ON_USER") {
        setUserLocation(data.latitude, data.longitude, true);
      }

      if (data.type === "DESTINATION") {
        const point = [data.latitude, data.longitude];

        if (destinationMarker) map.removeLayer(destinationMarker);

        destinationMarker = L.marker(point)
          .addTo(map)
          .bindPopup("Selected destination");
      }

      if (data.type === "ROUTE_ANALYSIS") {
        routeData = data.routes || [];
        selectedRouteId = data.recommendedRouteId;
        drawRoutes(routeData, data.recommendedRouteId);
      }

      if (data.type === "ROUTE_SELECTION") {
        updateSelection(data.selectedRouteId);
      }

      if (data.type === "CLEAR_ROUTE") {
        clearRoutes();

        if (destinationMarker) {
          map.removeLayer(destinationMarker);
          destinationMarker = null;
        }
      }
    } catch (error) {
      console.log("Map message error:", error);
    }
  };
</script>
</body>
</html>
`;

  const selectedRoute = routeAnalysis?.routes.find(
    (route) => route.route_id === selectedRouteId
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live City Map</Text>
        <Text style={styles.subtitle}>
          Tap the map to choose a destination and compare route options.
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          geolocationEnabled
          onMessage={handleWebViewMessage}
          onLoadEnd={() => {
            const current = locationRef.current;

            if (current) {
              sendToMap({
                type: "USER_LOCATION",
                latitude: current.coords.latitude,
                longitude: current.coords.longitude,
              });
            }
          }}
        />

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>MAP LEGEND</Text>

          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: "#2196F3" }]} />
            <Text style={styles.legendText}>Flood Risk</Text>
          </View>

          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: "#E53935" }]} />
            <Text style={styles.legendText}>Incident</Text>
          </View>

          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: "#FFB300" }]} />
            <Text style={styles.legendText}>Traffic</Text>
          </View>

          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: "#62C98B" }]} />
            <Text style={styles.legendText}>Emergency</Text>
          </View>

          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: "#1976D2" }]} />
            <Text style={styles.legendText}>Selected Route</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.locationButton,
            pressed && styles.pressed,
          ]}
          onPress={centerOnUser}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={styles.locationIcon}>⌖</Text>
          )}
        </Pressable>

        {routing && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.text} />
            <Text style={styles.cardText}>Analyzing route options…</Text>
          </View>
        )}

        {!!errorMessage && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => setErrorMessage("")}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
          </View>
        )}

        {routeAnalysis && (
          <View style={styles.routePanel}>
            <View style={styles.panelHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.panelTitle}>Route options</Text>
                <Text style={styles.panelSubtitle}>
                  {routeAnalysis.routes.length} option(s) returned by the backend
                </Text>
              </View>

              <Pressable onPress={clearRoute} hitSlop={10}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.routeList}
            >
              {routeAnalysis.routes.map((route) => {
                const selected = route.route_id === selectedRouteId;
                const recommended =
                  route.route_id === routeAnalysis.recommended_route_id;

                return (
                  <Pressable
                    key={route.route_id}
                    onPress={() => selectRoute(route.route_id)}
                    style={[
                      styles.routeOption,
                      selected && styles.routeOptionSelected,
                    ]}
                  >
                    <Text style={styles.routeOptionTitle}>
                      Route {route.route_id}
                      {recommended ? " · Recommended" : ""}
                    </Text>
                    <Text style={styles.routeMetric}>
                      {route.distance_km} km
                    </Text>
                    <Text style={styles.routeMetric}>
                      {route.travel_time_minutes} min
                    </Text>
                    <Text style={styles.routeRisk}>
                      {route.route_intelligence?.overall_status ??
                        "Risk status unavailable"}
                    </Text>
                    {route.traffic?.congestion_level && (
                      <Text style={styles.routeMetric}>
                        Traffic: {route.traffic.congestion_level}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedRoute && (
              <Text style={styles.recommendationText}>
                {routeAnalysis.recommendation?.route_id === selectedRouteId
                  ? routeAnalysis.recommendation.reason ??
                    "Recommended by CityLens route analysis."
                  : `Route ${selectedRouteId} selected for comparison. Review its risk flags and traffic conditions before travelling.`}
              </Text>
            )}

            <Text style={styles.disclaimer}>
              Route risk is an estimate based on available data, not a guarantee
              that a road is safe or clear.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 15,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "800",
    },
    subtitle: {
      color: colors.secondaryText,
      marginTop: 7,
      lineHeight: 19,
    },
    mapContainer: {
      flex: 1,
      marginHorizontal: 12,
      marginBottom: 12,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    map: {
      flex: 1,
    },
    legend: {
      position: "absolute",
      top: 15,
      left: 15,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    legendTitle: {
      color: colors.text,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 8,
    },
    legendRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    dot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      marginRight: 7,
    },
    legendText: {
      color: colors.text,
      fontSize: 11,
    },
    locationButton: {
      position: "absolute",
      right: 15,
      top: 15,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    locationIcon: {
      color: colors.text,
      fontSize: 25,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.65,
    },
    loadingCard: {
      position: "absolute",
      top: 75,
      right: 12,
      left: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    cardText: {
      color: colors.text,
      fontSize: 13,
    },
    errorCard: {
      position: "absolute",
      top: 75,
      left: 12,
      right: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: "#E53935",
    },
    errorText: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 19,
    },
    dismissText: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 8,
      textAlign: "right",
    },
    routePanel: {
      position: "absolute",
      bottom: 10,
      left: 10,
      right: 10,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    panelHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    panelTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
    },
    panelSubtitle: {
      color: colors.secondaryText,
      fontSize: 11,
      marginTop: 3,
    },
    clearText: {
      color: colors.secondaryText,
      fontWeight: "700",
      padding: 6,
    },
    routeList: {
      gap: 8,
      paddingBottom: 4,
    },
    routeOption: {
      width: 160,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    routeOptionSelected: {
      borderColor: "#1976D2",
      borderWidth: 2,
    },
    routeOptionTitle: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 5,
    },
    routeMetric: {
      color: colors.secondaryText,
      fontSize: 11,
      marginTop: 3,
    },
    routeRisk: {
      color: colors.text,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 5,
    },
    recommendationText: {
      color: colors.text,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 8,
    },
    disclaimer: {
      color: colors.secondaryText,
      fontSize: 10,
      lineHeight: 14,
      marginTop: 6,
    },
  });
