import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getMySOS, SOSRecord } from "../../services/sosService";
import { getHiddenIds, hideId } from "../../utils/hiddenItems";

const timelineSteps = [
  "SOS Sent",
  "Received",
  "Dispatched",
  "Resolved",
];

export default function EmergencyStatusScreen() {
  const [records, setRecords] = useState<SOSRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSOS = async () => {
    try {
      setLoading(true);

      const [serverRecords, hidden] = await Promise.all([
        getMySOS(),
        getHiddenIds("sos"),
      ]);

      setRecords(
        serverRecords.filter((item) => !hidden.includes(item.id))
      );
    } catch (error) {
      console.log("SOS history error:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSOS();
    }, [])
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const deleteSOS = (id: string) => {
    Alert.alert(
      "Remove SOS Record",
      "Remove this SOS from your list? It stays on record with the control room.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await hideId("sos", id);

              setRecords((current) =>
                current.filter((item) => item.id !== id)
              );
            } catch (error) {
              console.log("Remove error:", error);
            }
          },
        },
      ]
    );
  };

  const renderTimeline = (status: string) => {
    const currentIndex = timelineSteps.indexOf(status);

    return (
      <View style={styles.timeline}>
        {timelineSteps.map((step, index) => {
          const completed = index <= currentIndex;

          return (
            <View key={step} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    completed && styles.timelineDotCompleted,
                  ]}
                >
                  {completed && (
                    <Text style={styles.tick}>✓</Text>
                  )}
                </View>

                {index < timelineSteps.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      index < currentIndex &&
                        styles.timelineLineCompleted,
                    ]}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.timelineText,
                  completed && styles.timelineTextCompleted,
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Pressable onPress={() => router.replace("/(tabs)")}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Emergency Status</Text>

      <Text style={styles.subtitle}>
        Track your SOS requests and emergency status.
      </Text>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#F04444" size="large" />

          <Text style={styles.loadingText}>
            Loading SOS history...
          </Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>✓</Text>

          <Text style={styles.emptyTitle}>
            No SOS requests
          </Text>

          <Text style={styles.emptyText}>
            Your emergency SOS requests will appear
            here after you send one.
          </Text>

          <Pressable
            style={styles.sosButton}
            onPress={() => router.push("/sos")}
          >
            <Text style={styles.sosButtonText}>
              SEND SOS
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.section}>
            SOS HISTORY
          </Text>

          {records.map((record) => (
            <View key={record.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.emergencyType}>
                    {record.type}
                  </Text>

                  <Text style={styles.recordId}>
                    {record.id}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {record.status}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Submitted
                </Text>

                <Text style={styles.value}>
                  {formatDate(record.createdAt)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Location
                </Text>

                {record.latitude !== null &&
                record.longitude !== null ? (
                  <Text style={styles.value}>
                    {record.latitude.toFixed(5)},{" "}
                    {record.longitude.toFixed(5)}
                  </Text>
                ) : (
                  <Text style={styles.locationUnavailable}>
                    Location unavailable
                  </Text>
                )}
              </View>

              <Text style={styles.timelineTitle}>
                Emergency Timeline
              </Text>

              {renderTimeline(record.status)}

              <Pressable
                style={styles.deleteButton}
                onPress={() => deleteSOS(record.id)}
              >
                <Text style={styles.deleteText}>
                  DELETE RECORD
                </Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      {!loading && records.length > 0 && (
        <Pressable
          style={styles.newSOSButton}
          onPress={() => router.push("/sos")}
        >
          <Text style={styles.newSOSText}>
            + NEW SOS REQUEST
          </Text>
        </Pressable>
      )}
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
    paddingBottom: 45,
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

  section: {
    color: "#82979A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 32,
    marginBottom: 10,
  },

  loading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },

  loadingText: {
    color: "#82979A",
    marginTop: 12,
  },

  emptyBox: {
    backgroundColor: "#10282C",
    borderRadius: 16,
    padding: 25,
    marginTop: 35,
    alignItems: "center",
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#18363A",
    color: "#55D68A",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    paddingTop: 12,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 18,
  },

  emptyText: {
    color: "#82979A",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },

  sosButton: {
    backgroundColor: "#D62828",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
  },

  sosButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#10282C",
    borderRadius: 15,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#203D41",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  emergencyType: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  recordId: {
    color: "#60777A",
    fontSize: 11,
    marginTop: 4,
  },

  statusBadge: {
    backgroundColor: "#3A2425",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusText: {
    color: "#F04444",
    fontSize: 10,
    fontWeight: "800",
  },

  infoRow: {
    marginTop: 17,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1D383C",
  },

  label: {
    color: "#718184",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },

  value: {
    color: "#D6E0E1",
    fontSize: 13,
  },

  locationUnavailable: {
    color: "#F04444",
    fontSize: 13,
  },

  timelineTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 15,
  },

  timeline: {
    marginLeft: 3,
  },

  timelineRow: {
    flexDirection: "row",
    minHeight: 43,
  },

  timelineLeft: {
    width: 28,
    alignItems: "center",
  },

  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#496064",
    backgroundColor: "#10282C",
    justifyContent: "center",
    alignItems: "center",
  },

  timelineDotCompleted: {
    backgroundColor: "#D62828",
    borderColor: "#D62828",
  },

  tick: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: "#304A4E",
  },

  timelineLineCompleted: {
    backgroundColor: "#D62828",
  },

  timelineText: {
    color: "#60777A",
    fontSize: 13,
    marginLeft: 10,
    marginTop: 2,
  },

  timelineTextCompleted: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#4A292B",
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 18,
  },

  deleteText: {
    color: "#F04444",
    fontSize: 11,
    fontWeight: "800",
  },

  newSOSButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#D62828",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },

  newSOSText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});