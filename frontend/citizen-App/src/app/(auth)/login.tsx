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
import { login } from "../../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const emailError =
    emailTouched && email.trim() === ""
      ? "Email is required"
      : emailTouched && !isValidEmail(email)
      ? "Invalid email address"
      : "";

  const passwordError =
    passwordTouched && password === ""
      ? "Password is required"
      : passwordTouched && password.length < 8
      ? "Password must be at least 8 characters"
      : "";

  const handleLogin = async () => {
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isValidEmail(email) || password.length < 8 || loading) {
      return;
    }

    try {
      setLoading(true);

      const user = await login({ email, password });

      if (user.role === "admin") {
        // Admins use the admin website, not the citizen app.
        Alert.alert(
          "Admin account",
          "This is an admin account. Please use the CityLens admin dashboard website. You can still use the citizen app."
        );
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(
        "Login failed",
        error?.message ?? "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>CITYLENS</Text>
            <Text style={styles.tagline}>
              Smart City. Safer City.
            </Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>

          <Text style={styles.subtitle}>
            Login to access your CityLens account
          </Text>

          {/* EMAIL */}
          <Text style={styles.label}>Email</Text>

          <TextInput
            style={[
              styles.input,
              emailError
                ? styles.inputError
                : emailTouched && isValidEmail(email)
                ? styles.inputSuccess
                : null,
            ]}
            placeholder="Enter your email"
            placeholderTextColor="#718184"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailTouched(true);
            }}
            onBlur={() => setEmailTouched(true)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
          />

          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : emailTouched && isValidEmail(email) ? (
            <Text style={styles.successText}>Valid email address</Text>
          ) : null}

          {/* PASSWORD */}
          <Text style={styles.label}>Password</Text>

          <View
            style={[
              styles.passwordContainer,
              passwordError
                ? styles.inputError
                : passwordTouched && password.length >= 8
                ? styles.inputSuccess
                : null,
            ]}
          >
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#718184"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordTouched(true);
              }}
              onBlur={() => setPasswordTouched(true)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="done"
            />

            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.showButton}
            >
              <Text style={styles.showText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : passwordTouched && password.length >= 8 ? (
            <Text style={styles.successText}>Password looks good</Text>
          ) : null}

          {/* FORGOT PASSWORD */}
          <Pressable
            onPress={() =>
              Alert.alert(
                "Forgot Password",
                "Password reset will be connected to the backend later."
              )
            }
          >
            <Text style={styles.forgot}>Forgot Password?</Text>
          </Pressable>

          {/* LOGIN */}
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </Pressable>

          {/* REGISTER */}
          <View style={styles.registerRow}>
            <Text style={styles.registerQuestion}>
              Don't have an account?{" "}
            </Text>

            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.registerLink}>Register</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071A1D",
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  logoContainer: {
    marginBottom: 50,
  },

  logo: {
    color: "#E53935",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 3,
  },

  tagline: {
    color: "#8FA3A5",
    fontSize: 13,
    marginTop: 5,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    color: "#9FB0B2",
    fontSize: 14,
    marginBottom: 35,
  },

  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    height: 54,
    backgroundColor: "#10282C",
    borderWidth: 1,
    borderColor: "#294145",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 16,
  },

  inputError: {
    borderColor: "#E53935",
  },

  inputSuccess: {
    borderColor: "#35B56A",
  },

  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 6,
  },

  successText: {
    color: "#54C982",
    fontSize: 12,
    marginTop: 6,
  },

  passwordContainer: {
    height: 54,
    backgroundColor: "#10282C",
    borderWidth: 1,
    borderColor: "#294145",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 16,
  },

  showButton: {
    paddingHorizontal: 15,
  },

  showText: {
    color: "#E53935",
    fontWeight: "600",
  },

  forgot: {
    color: "#E53935",
    textAlign: "right",
    marginTop: 12,
    fontSize: 13,
  },

  loginButton: {
    height: 54,
    backgroundColor: "#E53935",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },

  registerQuestion: {
    color: "#9FB0B2",
    fontSize: 14,
  },

  registerLink: {
    color: "#E53935",
    fontSize: 14,
    fontWeight: "700",
  },
});