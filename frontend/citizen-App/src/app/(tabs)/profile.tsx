import React, { useEffect, useState } from "react";
import { getSavedUser, logout } from "../../services/authService";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../ThemeContext";

const PROFILE_KEY = "citylens_profile";

type ProfileData = {
  name: string;
  email: string;
  image: string | null;
};

export default function Profile() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [profile, setProfile] = useState<ProfileData>({
    name: "CityLens Citizen",
    email: "citizen@example.com",
    image: null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);

      if (data) {
        setProfile(JSON.parse(data));
      } else {
        // First time: show the logged-in account's details
        const user = await getSavedUser();

        if (user) {
          setProfile({
            name: user.name,
            email: user.email,
            image: null,
          });
        }
      }
    } catch (error) {
      console.log("Profile loading error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {/* PROFILE CARD */}
        <Pressable
          style={({ pressed }) => [
            styles.profileCard,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/profile-details")}
        >
          {profile.image ? (
            <Image
              source={{ uri: profile.image }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {profile.name}
            </Text>

            <Text style={styles.email}>
              {profile.email}
            </Text>

            <Text style={styles.editProfile}>
              Edit profile
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        {/* PREFERENCES */}
        <Text style={styles.section}>Preferences</Text>

        <Pressable
          style={({ pressed }) => [
            styles.setting,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push("/notification-preferences")
          }
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>
              Notification Preferences
            </Text>

            <Text style={styles.settingSubtext}>
              Manage emergency and city alerts
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.setting,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push("/location-preferences")
          }
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>
              Location Preferences
            </Text>

            <Text style={styles.settingSubtext}>
              Manage location access and usage
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.setting,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push("/emergency-contacts")
          }
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>
              Emergency Contacts
            </Text>

            <Text style={styles.settingSubtext}>
              People to contact during emergencies
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        {/* APP */}
        <Text style={styles.section}>App</Text>

        <Pressable
          style={({ pressed }) => [
            styles.setting,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/settings")}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>
              Settings
            </Text>

            <Text style={styles.settingSubtext}>
              Appearance, privacy and app preferences
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.setting,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/about")}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>
              About CityLens
            </Text>

            <Text style={styles.settingSubtext}>
              App information and project details
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        {/* LOGOUT */}
        <Pressable
          style={({ pressed }) => [
            styles.logout,
            pressed && styles.pressed,
          ]}
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={styles.version}>
          CityLens • Citizen App
        </Text>
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
      paddingBottom: 35,
    },

    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "800",
      marginBottom: 25,
    },

    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
    },

    avatar: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 15,
    },

    avatarImage: {
      width: 62,
      height: 62,
      borderRadius: 31,
      marginRight: 15,
    },

    avatarText: {
      color: "#FFFFFF",
      fontSize: 23,
      fontWeight: "800",
    },

    profileInfo: {
      flex: 1,
    },

    name: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },

    email: {
      color: colors.secondaryText,
      marginTop: 4,
      fontSize: 13,
    },

    editProfile: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 6,
    },

    section: {
      color: colors.secondaryText,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 30,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },

    setting: {
      backgroundColor: colors.card,
      borderRadius: 13,
      padding: 17,
      marginBottom: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    settingInfo: {
      flex: 1,
    },

    settingText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },

    settingSubtext: {
      color: colors.secondaryText,
      fontSize: 12,
      marginTop: 4,
    },

    arrow: {
      color: colors.secondaryText,
      fontSize: 25,
      marginLeft: 10,
    },

    logout: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 13,
      padding: 16,
      alignItems: "center",
      marginTop: 25,
    },

    logoutText: {
      color: colors.primary,
      fontWeight: "700",
    },

    pressed: {
      opacity: 0.65,
    },

    version: {
      color: colors.secondaryText,
      textAlign: "center",
      fontSize: 11,
      marginTop: 20,
      opacity: 0.7,
    },
  });