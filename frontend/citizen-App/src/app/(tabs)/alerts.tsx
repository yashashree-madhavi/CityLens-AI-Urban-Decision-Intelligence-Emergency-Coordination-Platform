import React, { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  Alert as CityAlert,
  getAlerts,
  markAlertAsRead,
} from "../../services/alertsService";

const SEVERITY_COLORS: Record<string, string> = {
  info: "#4DA3FF",
  warning: "#F5A623",
  high: "#E53935",
  critical: "#E53935",
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<CityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setAlerts(await getAlerts());
    } catch (e: any) {
      setError(e?.message ?? "Unable to load alerts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openAlert = async (alert: CityAlert) => {
    if (alert.isRead || alert.isBroadcast) {
      return;
    }

    try {
      await markAlertAsRead(alert.id);
      setAlerts((current) =>
        current.map((item) =>
          item.id === alert.id ? { ...item, isRead: true } : item
        )
      );
    } catch {
      // ignore - will retry next time
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#FFFFFF"
          />
        }
      >
        <Text style={styles.title}>Safety Alerts</Text>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Loading alerts...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Could not load alerts</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : alerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.icon}>✓</Text>
            <Text style={styles.emptyTitle}>You're all clear</Text>
            <Text style={styles.emptyText}>
              No active safety alerts at the moment.
            </Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <Pressable
              key={alert.id}
              onPress={() => openAlert(alert)}
              style={[
                styles.alertCard,
                {
                  borderLeftColor:
                    SEVERITY_COLORS[alert.severity] ?? "#4DA3FF",
                  opacity: alert.isRead ? 0.6 : 1,
                },
              ]}
            >
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertDate}>
                {new Date(alert.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {alert.isRead ? "  •  Read" : ""}
              </Text>
            </Pressable>
          ))
        )}
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
    padding: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: "#10282C",
    borderRadius: 20,
    padding: 30,
    marginTop: 25,
    alignItems: "center",
  },
  icon: {
    color: "#54B889",
    fontSize: 30,
    fontWeight: "800",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  alertCard: {
    backgroundColor: "#10282C",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderLeftWidth: 4,
  },
  alertTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  alertMessage: {
    color: "#B6C4C6",
    marginTop: 6,
    fontSize: 14,
  },
  alertDate: {
    color: "#829497",
    marginTop: 8,
    fontSize: 12,
  },
  emptyText: {
    color: "#829497",
    textAlign: "center",
    marginTop: 7,
  },
});