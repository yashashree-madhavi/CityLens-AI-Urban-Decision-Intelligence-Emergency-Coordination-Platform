import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { register } from "../../services/authService";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Missing Password", "Please enter a password.");
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Invalid Password",
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords Don't Match",
        "Please make sure both passwords are the same."
      );
      return;
    }

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      await register({ name, email, password });

      Alert.alert(
        "Account created",
        "Your account is ready. Please login.",
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Registration failed",
        error?.message ?? "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>C</Text>
            </View>

            <Text style={styles.appName}>CITYLENS</Text>
            <Text style={styles.tagline}>URBAN SAFETY INTELLIGENCE</Text>
          </View>

          {/* Heading */}
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join CityLens and stay safe.
            </Text>
          </View>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>FULL NAME</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#777"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMAIL</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#777"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>PASSWORD</Text>

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create a password"
                placeholderTextColor="#777"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.showButton}
              >
                <Text style={styles.showText}>
                  {showPassword ? "HIDE" : "SHOW"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your password"
                placeholderTextColor="#777"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />

              <Pressable
                onPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                style={styles.showButton}
              >
                <Text style={styles.showText}>
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Register */}
          <Pressable
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.registerButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.registerButtonText}>
              {loading ? "CREATING..." : "CREATE ACCOUNT"}
            </Text>
          </Pressable>

          {/* Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?{" "}
            </Text>

            <Pressable onPress={() => router.replace("/login")}>
              <Text style={styles.loginLink}>Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#071A1D",
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 40,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 38,
  },

  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
  },

  appName: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: 3,
  },

  tagline: {
    color: "#8EA3A6",
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 4,
  },

  headingContainer: {
    marginBottom: 28,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "700",
    marginBottom: 7,
  },

  subtitle: {
    color: "#8EA3A6",
    fontSize: 14,
  },

  inputContainer: {
    marginBottom: 17,
  },

  label: {
    color: "#AFC0C2",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#10282C",
    borderWidth: 1,
    borderColor: "#244146",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 15,
  },

  passwordWrapper: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#10282C",
    borderWidth: 1,
    borderColor: "#244146",
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 15,
  },

  showButton: {
    paddingHorizontal: 14,
  },

  showText: {
    color: "#E53935",
    fontSize: 11,
    fontWeight: "700",
  },

  registerButton: {
    height: 55,
    borderRadius: 12,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },

  loginText: {
    color: "#8EA3A6",
    fontSize: 14,
  },

  loginLink: {
    color: "#E53935",
    fontSize: 14,
    fontWeight: "700",
  },
});