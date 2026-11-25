import { Pressable, StyleSheet, Text } from "react-native";

export default function SOSButton({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.sos}>SOS</Text>
      <Text style={styles.sub}>EMERGENCY</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#D62828",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },

  sos: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
  },

  sub: {
    color: "#FFD5D5",
    fontSize: 9,
    fontWeight: "700",
  },
});