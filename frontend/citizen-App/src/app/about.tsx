import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "../ThemeContext";

export default function About() {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  const foxPosition = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(foxPosition, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(foxPosition, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  const translateX = foxPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-25, 230],
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BACK */}
        <Pressable
          onPress={() => router.replace("/(tabs)/profile")}
        >
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        {/* BRAND */}
        <View style={styles.brandSection}>
          <Text style={styles.logo}>CITYLENS</Text>

          <Text style={styles.tagline}>
            See the risk. Know the way.{"\n"}
            Stay one step ahead.
          </Text>
        </View>

        {/* ABOUT */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ABOUT CITYLENS</Text>

          <Text style={styles.cardTitle}>
            A smarter way to stay safe in the city.
          </Text>

          <Text style={styles.body}>
            CityLens is an AI-powered urban safety
            companion designed to help citizens stay
            informed during unexpected situations.
          </Text>

          <Text style={styles.body}>
            From flood risks and traffic disruptions to
            emergency assistance and incident reporting,
            CityLens brings important safety information
            together in one simple place.
          </Text>
        </View>

        {/* OUR VISION */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            OUR VISION
          </Text>

          <Text style={styles.vision}>
            “Turn city data into decisions that
            help people move safer.”
          </Text>
        </View>

        {/* FEATURES */}
        <Text style={styles.sectionTitle}>
          WHAT CITYLENS BRINGS
        </Text>

        <View style={styles.feature}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>🌧️</Text>
          </View>

          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>
              Flood Awareness
            </Text>

            <Text style={styles.featureDescription}>
              Understand changing flood risks and stay
              prepared for emergencies.
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>🚨</Text>
          </View>

          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>
              Emergency Support
            </Text>

            <Text style={styles.featureDescription}>
              Quickly access SOS assistance and your
              emergency contacts when it matters.
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>📍</Text>
          </View>

          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>
              Citizen Reporting
            </Text>

            <Text style={styles.featureDescription}>
              Report incidents and help create a more
              connected picture of what's happening.
            </Text>
          </View>
        </View>

        {/* TEAM MESSAGE */}
        <View style={styles.teamCard}>
          <Text style={styles.cardLabel}>
            FROM OUR TEAM
          </Text>

          <Text style={styles.teamTitle}>
            Built with a simple idea.
          </Text>

          <Text style={styles.teamText}>
            Cities are constantly changing, and the
            information around us can change just as
            quickly.
          </Text>

          <Text style={styles.teamText}>
            We built CityLens to make that information
            easier to understand, easier to access, and
            more useful when people need it most.
          </Text>

          <Text style={styles.signature}>
            — Team CityLens
          </Text>
        </View>

        {/* PIXEL FOX AREA */}
        <View style={styles.foxSection}>
          <Text style={styles.foxMessage}>
            Stay alert. Stay curious. Stay safe. 🦊
          </Text>

          <View style={styles.foxTrack}>
            <Animated.Text
              style={[
                styles.fox,
                {
                  transform: [
                    {
                      translateX,
                    },
                  ],
                },
              ]}
            >
              🦊
            </Animated.Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>
            CITYLENS
          </Text>

          <Text style={styles.version}>
            Urban Safety • AI • Emergency Support
          </Text>

          <Text style={styles.copyright}>
            Built with purpose, curiosity & code.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
      paddingBottom: 45,
    },

    back: {
      color: colors.primary,
      fontSize: 16,
      marginTop: 10,
      marginBottom: 25,
    },

    brandSection: {
      marginBottom: 28,
    },

    logo: {
      color: colors.primary,
      fontSize: 30,
      fontWeight: "900",
      letterSpacing: 3,
    },

    tagline: {
      color: colors.text,
      fontSize: 21,
      fontWeight: "700",
      lineHeight: 29,
      marginTop: 12,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },

    cardLabel: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: 10,
    },

    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "800",
      lineHeight: 27,
      marginBottom: 12,
    },

    body: {
      color: colors.secondaryText,
      fontSize: 13,
      lineHeight: 21,
      marginTop: 5,
    },

    vision: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "600",
      lineHeight: 25,
      fontStyle: "italic",
    },

    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
      marginTop: 12,
      marginBottom: 13,
    },

    feature: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 15,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },

    iconBox: {
      width: 45,
      height: 45,
      borderRadius: 13,
      backgroundColor: colors.secondaryCard,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 13,
    },

    icon: {
      fontSize: 21,
    },

    featureText: {
      flex: 1,
    },

    featureTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },

    featureDescription: {
      color: colors.secondaryText,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
    },

    teamCard: {
      backgroundColor: colors.secondaryCard,
      borderRadius: 18,
      padding: 20,
      marginTop: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },

    teamTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 12,
    },

    teamText: {
      color: colors.secondaryText,
      fontSize: 13,
      lineHeight: 21,
      marginBottom: 8,
    },

    signature: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "800",
      marginTop: 5,
    },

    foxSection: {
      marginTop: 28,
      marginBottom: 10,
      overflow: "hidden",
    },

    foxMessage: {
      color: colors.secondaryText,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 10,
    },

    foxTrack: {
      height: 55,
      width: "100%",
      justifyContent: "flex-end",
      overflow: "hidden",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    fox: {
      fontSize: 34,
      position: "absolute",
      bottom: 3,
    },

    footer: {
      alignItems: "center",
      marginTop: 28,
    },

    footerLogo: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "900",
      letterSpacing: 2,
    },

    version: {
      color: colors.secondaryText,
      fontSize: 10,
      marginTop: 7,
    },

    copyright: {
      color: colors.secondaryText,
      fontSize: 10,
      marginTop: 4,
      opacity: 0.7,
    },
  });