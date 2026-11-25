import { StyleSheet, TextInput, TextInputProps } from "react-native";

export default function AppInput(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={props.placeholderTextColor || "#6F8285"}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    backgroundColor: "#10282C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#203D41",
    paddingHorizontal: 15,
    color: "#fff",
  },
});