import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { hasToken } from "../utils/tokenStorage";

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    hasToken()
      .then((loggedIn) => setTarget(loggedIn ? "/(tabs)" : "/login"))
      .catch(() => setTarget("/login"));
  }, []);

  if (!target) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#071A1D",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#E53935" />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
