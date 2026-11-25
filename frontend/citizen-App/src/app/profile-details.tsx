import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../ThemeContext";

const PROFILE_KEY = "citylens_profile";

export default function ProfileDetails() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [name, setName] = useState("CityLens Citizen");
  const [email, setEmail] = useState("citizen@example.com");
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);

      if (data) {
        const saved = JSON.parse(data);

        setName(saved.name ?? "CityLens Citizen");
        setEmail(saved.email ?? "citizen@example.com");
        setImage(saved.image ?? null);
      }
    } catch (error) {
      console.log("Profile loading error:", error);
    }
  };

  const changePhoto = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow photo library access to change your profile picture."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert(
        "Name Required",
        "Please enter your name."
      );
      return;
    }

    const profile = {
      name: name.trim(),
      email: email.trim(),
      image,
    };

    try {
      await AsyncStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(profile)
      );

      router.replace("/(tabs)/profile");
    } catch (error) {
      console.log("Profile save error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BACK */}
        <Pressable
          onPress={() =>
            router.replace("/(tabs)/profile")
          }
        >
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>
          Edit Profile
        </Text>

        <Text style={styles.subtitle}>
          Update your CityLens profile information.
        </Text>

        {/* PROFILE PHOTO */}
        <View style={styles.photoSection}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.photoButton,
              pressed && styles.pressed,
            ]}
            onPress={changePhoto}
          >
            <Text style={styles.photoButtonText}>
              📷  Change Profile Picture
            </Text>
          </Pressable>
        </View>

        {/* NAME */}
        <View style={styles.field}>
          <Text style={styles.label}>NAME</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        {/* EMAIL */}
        <View style={styles.field}>
          <Text style={styles.label}>EMAIL</Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={colors.secondaryText}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* SAVE */}
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
          ]}
          onPress={saveProfile}
        >
          <Text style={styles.saveText}>
            Save Changes
          </Text>
        </Pressable>
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
      paddingBottom: 40,
    },

    back: {
      color: colors.primary,
      fontSize: 16,
      marginTop: 10,
      marginBottom: 22,
    },

    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "800",
    },

    subtitle: {
      color: colors.secondaryText,
      fontSize: 13,
      marginTop: 6,
      marginBottom: 28,
    },

    photoSection: {
      alignItems: "center",
      marginBottom: 30,
    },

    avatar: {
      width: 105,
      height: 105,
      borderRadius: 53,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
    },

    avatarImage: {
      width: 105,
      height: 105,
      borderRadius: 53,
      marginBottom: 15,
    },

    avatarText: {
      color: "#FFFFFF",
      fontSize: 38,
      fontWeight: "800",
    },

    photoButton: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },

    photoButtonText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "700",
    },

    field: {
      marginBottom: 18,
    },

    label: {
      color: colors.secondaryText,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 8,
    },

    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      color: colors.text,
      fontSize: 14,
    },

    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 13,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 10,
    },

    saveText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },

    pressed: {
      opacity: 0.65,
    },
  });