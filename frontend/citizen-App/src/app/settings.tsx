import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "../ThemeContext";

type Theme = "dark" | "light" | "system";

export default function Settings() {
  const { theme, colors, setTheme } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace("/(tabs)/profile")}>
          <Text
            style={[
              styles.back,
              { color: colors.primary },
            ]}
          >
            ‹ Back
          </Text>
        </Pressable>

        <Text
          style={[
            styles.title,
            { color: colors.text },
          ]}
        >
          Settings
        </Text>

        <Text
          style={[
            styles.subtitle,
            { color: colors.secondaryText },
          ]}
        >
          Customize your CityLens experience.
        </Text>

        <Text
          style={[
            styles.section,
            { color: colors.secondaryText },
          ]}
        >
          APPEARANCE
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text },
            ]}
          >
            App Theme
          </Text>

          <Text
            style={[
              styles.cardDescription,
              { color: colors.secondaryText },
            ]}
          >
            Choose how CityLens should appear.
          </Text>

          <ThemeOption
            title="Dark"
            description="Dark interface"
            selected={theme === "dark"}
            colors={colors}
            onPress={() => setTheme("dark")}
          />

          <ThemeOption
            title="Light"
            description="Light interface"
            selected={theme === "light"}
            colors={colors}
            onPress={() => setTheme("light")}
          />

          <ThemeOption
            title="System Default"
            description="Follow your phone's theme"
            selected={theme === "system"}
            colors={colors}
            onPress={() => setTheme("system")}
          />
        </View>

        <Text
          style={[
            styles.section,
            { color: colors.secondaryText },
          ]}
        >
          PRIVACY
        </Text>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card },
          ]}
        >
          <Text
            style={[
              styles.infoTitle,
              { color: colors.text },
            ]}
          >
            Your Data
          </Text>

          <Text
            style={[
              styles.infoText,
              { color: colors.secondaryText },
            ]}
          >
            CityLens currently stores preferences, reports,
            SOS records and emergency contacts locally on
            this device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeOption({
  title,
  description,
  selected,
  colors,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.themeOption,
        {
          borderColor: selected
            ? colors.primary
            : colors.border,
          backgroundColor: selected
            ? colors.secondaryCard
            : "transparent",
        },
      ]}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.optionTitle,
            { color: colors.text },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.optionDescription,
            { color: colors.secondaryText },
          ]}
        >
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.radio,
          {
            borderColor: selected
              ? colors.primary
              : colors.secondaryText,
          },
        ]}
      >
        {selected && (
          <View
            style={[
              styles.radioDot,
              { backgroundColor: colors.primary },
            ]}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  back: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 7,
  },

  section: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 10,
    letterSpacing: 0.8,
  },

  card: {
    borderRadius: 14,
    padding: 17,
    borderWidth: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  cardDescription: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 15,
  },

  themeOption: {
    borderWidth: 1,
    borderRadius: 11,
    padding: 14,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  optionTitle: {
    fontWeight: "700",
  },

  optionDescription: {
    fontSize: 11,
    marginTop: 4,
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  infoCard: {
    borderRadius: 14,
    padding: 17,
  },

  infoTitle: {
    fontWeight: "700",
    fontSize: 15,
  },

  infoText: {
    lineHeight: 19,
    marginTop: 7,
  },
});