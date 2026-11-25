import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Appearance,
  ColorSchemeName,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "dark" | "light" | "system";

type ThemeColors = {
  background: string;
  card: string;
  secondaryCard: string;
  text: string;
  secondaryText: string;
  border: string;
  primary: string;
  danger: string;
};

const darkColors: ThemeColors = {
  background: "#071A1D",
  card: "#10282C",
  secondaryCard: "#0D2226",
  text: "#FFFFFF",
  secondaryText: "#82979A",
  border: "#203D41",
  primary: "#E53935",
  danger: "#D62828",
};

const lightColors: ThemeColors = {
  background: "#F4F7F7",
  card: "#FFFFFF",
  secondaryCard: "#EAF0F0",
  text: "#172426",
  secondaryText: "#617174",
  border: "#D5DFE0",
  primary: "#E53935",
  danger: "#D62828",
};

type ThemeContextType = {
  theme: ThemeMode;
  colors: ThemeColors;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] =
    useState<ThemeMode>("dark");

  const [systemTheme, setSystemTheme] =
    useState<ColorSchemeName>(
      Appearance.getColorScheme() ?? "light"
    );

  useEffect(() => {
    loadTheme();

    const subscription = Appearance.addChangeListener(
      ({ colorScheme }) => {
        setSystemTheme(colorScheme);
      }
    );

    return () => subscription.remove();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(
        "citylens_theme"
      );

      if (
        saved === "dark" ||
        saved === "light" ||
        saved === "system"
      ) {
        setThemeState(saved);
      }
    } catch (error) {
      console.log("Theme loading error:", error);
    }
  };

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);

    try {
      await AsyncStorage.setItem(
        "citylens_theme",
        newTheme
      );
    } catch (error) {
      console.log("Theme saving error:", error);
    }
  };

  const activeTheme =
    theme === "system"
      ? systemTheme === "light"
        ? "light"
        : "dark"
      : theme;

  const colors =
    activeTheme === "light"
      ? lightColors
      : darkColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}