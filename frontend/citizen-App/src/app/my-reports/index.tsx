import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getMyReports, Report } from "../../services/incidentService";
import { getHiddenIds } from "../../utils/hiddenItems";

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      const [serverReports, hidden] = await Promise.all([
        getMyReports(),
        getHiddenIds("reports"),
      ]);

      setReports(
        serverReports.filter((report) => !hidden.includes(report.id))
      );
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReports();
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>My Reports</Text>

      <Text style={styles.subtitle}>
        Track incidents you have reported.
      </Text>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#F04444" />
          <Text style={styles.loadingText}>
            Loading your reports...
          </Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.icon}>+</Text>

          <Text style={styles.emptyTitle}>No reports yet</Text>

          <Text style={styles.emptyText}>
            Your submitted incident reports will appear here.
          </Text>

          <Pressable
            style={styles.reportButton}
            onPress={() => router.push("/report")}
          >
            <Text style={styles.reportButtonText}>
              REPORT AN INCIDENT
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.section}>
            YOUR REPORTS ({reports.length})
          </Text>

          {reports.map((report) => (
            <View key={report.id} style={styles.card}>
              {report.imageUri && (
                <Image
                  source={{ uri: report.imageUri }}
                  style={styles.image}
                />
              )}

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.reportType}>
                    {report.type}
                  </Text>

                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {report.status}
                      </Text>
                    </View>
                    {report.verificationStatus && report.verificationStatus !== "unverified" && (
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              report.verificationStatus === "verified"
                                ? "#059669"
                                : "#D97706",
                          },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {report.verificationStatus === "verified"
                            ? "Verified"
                            : "Under Review"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.description}>
                  {report.description}
                </Text>

                <Text style={styles.date}>
                  {formatDate(report.createdAt)}
                </Text>

                {report.latitude !== null &&
                  report.longitude !== null && (
                    <Text style={styles.location}>
                      📍 {report.latitude.toFixed(5)},{" "}
                      {report.longitude.toFixed(5)}
                    </Text>
                  )}
              </View>
            </View>
          ))}
        </>
      )}

      {reports.length > 0 && (
        <>
          <Text style={styles.section}>REPORT STATUS</Text>

          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Submitted</Text>

            <Text style={styles.statusText}>
              Your reports have been submitted and are waiting
              for backend processing.
            </Text>
          </View>
        </>
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

  loading: {
    alignItems: "center",
    paddingVertical: 60,
  },

  loadingText: {
    color: "#82979A",
    marginTop: 12,
  },

  empty: {
    backgroundColor: "#10282C",
    padding: 25,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 25,
  },

  icon: {
    color: "#F04444",
    fontSize: 30,
  },

  emptyTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    marginTop: 8,
  },

  emptyText: {
    color: "#82979A",
    textAlign: "center",
    marginTop: 5,
    lineHeight: 19,
  },

  reportButton: {
    backgroundColor: "#D62828",
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 9,
    justifyContent: "center",
    marginTop: 18,
  },

  reportButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },

  section: {
    color: "#82979A",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#10282C",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#203D41",
  },

  image: {
    width: "100%",
    height: 180,
  },

  cardContent: {
    padding: 16,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  reportType: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
  },

  statusBadge: {
    backgroundColor: "#173B31",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusBadgeText: {
    color: "#62C98B",
    fontSize: 10,
    fontWeight: "800",
  },

  description: {
    color: "#D5DFE0",
    lineHeight: 20,
    marginTop: 12,
  },

  date: {
    color: "#82979A",
    fontSize: 11,
    marginTop: 12,
  },

  location: {
    color: "#82979A",
    fontSize: 11,
    marginTop: 6,
  },

  statusInfo: {
    backgroundColor: "#10282C",
    borderRadius: 14,
    padding: 17,
    borderWidth: 1,
    borderColor: "#203D41",
  },

  statusTitle: {
    color: "#fff",
    fontWeight: "700",
  },

  statusText: {
    color: "#82979A",
    marginTop: 6,
    lineHeight: 19,
  },
});