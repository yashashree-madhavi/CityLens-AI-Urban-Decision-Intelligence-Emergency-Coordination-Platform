import React, { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getMyReports, Report } from "../../services/incidentService";
import { getHiddenIds, hideId } from "../../utils/hiddenItems";

const timelineSteps = [
  "Submitted",
  "Under Review",
  "Assigned",
  "Action in Progress",
  "Resolved",
];

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const loadReports = async () => {
    try {
      setLoadError("");

      const [serverReports, hidden] = await Promise.all([
        getMyReports(),
        getHiddenIds("reports"),
      ]);

      setReports(
        serverReports.filter((report) => !hidden.includes(report.id))
      );
    } catch (error: any) {
      setReports([]);
      setLoadError(error?.message ?? "Unable to load your reports.");
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

  const deleteReport = (reportId: string) => {
    Alert.alert(
      "Remove Report",
      "Remove this report from your list? It stays on record with the city administration.",
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
              await hideId("reports", reportId);

              setReports((current) =>
                current.filter((report) => report.id !== reportId)
              );
            } catch {
              Alert.alert(
                "Error",
                "Unable to remove the report."
              );
            }
          },
        },
      ]
    );
  };

  const getStepState = (
    step: string,
    currentStatus: string
  ) => {
    const currentIndex =
      timelineSteps.indexOf(currentStatus);

    const stepIndex = timelineSteps.indexOf(step);

    if (stepIndex < currentIndex) {
      return "completed";
    }

    if (stepIndex === currentIndex) {
      return "current";
    }

    return "pending";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Reports</Text>

        <Text style={styles.subtitle}>
          Report incidents and track your submissions.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/report")}
        >
          <Text style={styles.buttonText}>
            ＋ Report an Incident
          </Text>
        </Pressable>

        {/* YOUR REPORTS */}

        <Text style={styles.sectionTitle}>
          YOUR REPORTS
        </Text>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Loading your reports...
            </Text>
          </View>
        ) : loadError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Could not load reports
            </Text>

            <Text style={styles.emptyText}>{loadError}</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No reports yet
            </Text>

            <Text style={styles.emptyText}>
              Your submitted incidents will appear here.
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              {/* REPORT HEADER */}

              <View style={styles.reportHeader}>
                <View style={styles.reportHeaderText}>
                  <Text style={styles.reportType}>
                    {report.type}
                  </Text>

                  <Text style={styles.reportId}>
                    Report ID: {report.id}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {report.status}
                  </Text>
                </View>
              </View>

              {/* REPORT DETAILS */}

              <View style={styles.details}>
                <Text style={styles.detailText}>
                  Submitted:{" "}
                  {formatDate(report.createdAt)}
                </Text>

                <Text style={styles.detailText}>
                  Last updated:{" "}
                  {formatDate(
                    report.lastUpdated || report.createdAt
                  )}
                </Text>

                {report.latitude !== null &&
                  report.longitude !== null && (
                    <Text style={styles.detailText}>
                      📍 {report.latitude.toFixed(5)},{" "}
                      {report.longitude.toFixed(5)}
                    </Text>
                  )}
              </View>

              {/* TIMELINE */}

              <Text style={styles.timelineTitle}>
                REPORT TIMELINE
              </Text>

              <View style={styles.timeline}>
                {timelineSteps.map((step, index) => {
                  const state = getStepState(
                    step,
                    report.status
                  );

                  return (
                    <View
                      key={step}
                      style={styles.timelineRow}
                    >
                      <View style={styles.timelineLeft}>
                        <View
                          style={[
                            styles.timelineDot,
                            state === "completed" &&
                              styles.completedDot,
                            state === "current" &&
                              styles.currentDot,
                          ]}
                        >
                          {state === "completed" && (
                            <Text style={styles.check}>
                              ✓
                            </Text>
                          )}
                        </View>

                        {index <
                          timelineSteps.length - 1 && (
                          <View
                            style={[
                              styles.timelineLine,
                              state === "completed" &&
                                styles.completedLine,
                            ]}
                          />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.timelineText,
                          state === "completed" &&
                            styles.completedText,
                          state === "current" &&
                            styles.currentText,
                        ]}
                      >
                        {step}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* DELETE */}

              <Pressable
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  deleteReport(report.id)
                }
              >
                <Text style={styles.deleteText}>
                  Remove from my list
                </Text>
              </Pressable>
            </View>
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
    paddingBottom: 40,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    color: "#829497",
    marginTop: 7,
    marginBottom: 25,
  },

  primaryButton: {
    backgroundColor: "#E53935",
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.65,
  },

  sectionTitle: {
    color: "#829497",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 12,
  },

  emptyCard: {
    backgroundColor: "#10282C",
    borderRadius: 18,
    padding: 25,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  emptyText: {
    color: "#829497",
    marginTop: 7,
    lineHeight: 19,
  },

  reportCard: {
    backgroundColor: "#10282C",
    borderRadius: 18,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#203D41",
  },

  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  reportHeaderText: {
    flex: 1,
    marginRight: 10,
  },

  reportType: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  reportId: {
    color: "#829497",
    fontSize: 11,
    marginTop: 5,
  },

  statusBadge: {
    backgroundColor: "#173B31",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: "#62C98B",
    fontSize: 10,
    fontWeight: "800",
  },

  details: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#203D41",
  },

  detailText: {
    color: "#AEBFC1",
    fontSize: 11,
    marginBottom: 6,
  },

  timelineTitle: {
    color: "#829497",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 12,
  },

  timeline: {
    paddingLeft: 2,
  },

  timelineRow: {
    flexDirection: "row",
    minHeight: 36,
  },

  timelineLeft: {
    width: 22,
    alignItems: "center",
  },

  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#31484B",
    justifyContent: "center",
    alignItems: "center",
  },

  completedDot: {
    backgroundColor: "#62C98B",
  },

  currentDot: {
    backgroundColor: "#E53935",
  },

  check: {
    color: "#071A1D",
    fontSize: 8,
    fontWeight: "900",
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#31484B",
    marginVertical: 2,
  },

  completedLine: {
    backgroundColor: "#62C98B",
  },

  timelineText: {
    color: "#657A7D",
    fontSize: 12,
    marginLeft: 10,
    marginTop: -2,
  },

  completedText: {
    color: "#AEBFC1",
  },

  currentText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  deleteButton: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#633436",
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
  },

  deleteText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "700",
  },
});