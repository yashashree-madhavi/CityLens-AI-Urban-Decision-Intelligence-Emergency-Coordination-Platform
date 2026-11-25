import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTheme } from "../ThemeContext";

const STORAGE_KEY = "citylens_emergency_contacts";

type Contact = {
  id: string;
  name: string;
  phone: string;
};

export default function EmergencyContacts() {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);

    if (data) {
      setContacts(JSON.parse(data));
    }
  };

  const addContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both name and phone number."
      );
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
    };

    const updated = [...contacts, newContact];

    setContacts(updated);

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    setName("");
    setPhone("");
  };

  const deleteContact = async (id: string) => {
    const updated = contacts.filter(
      (contact) => contact.id !== id
    );

    setContacts(updated);

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* BACK */}
        <Pressable
          onPress={() => router.replace("/(tabs)/profile")}
        >
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>
          Emergency Contacts
        </Text>

        <Text style={styles.subtitle}>
          Add people you may want to contact during an emergency.
        </Text>

        {/* ADD CONTACT FORM */}
        <View style={styles.form}>
          <Text style={styles.label}>NAME</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Mom"
            placeholderTextColor={colors.secondaryText}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>PHONE NUMBER</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 9876543210"
            placeholderTextColor={colors.secondaryText}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Pressable
            style={styles.addButton}
            onPress={addContact}
          >
            <Text style={styles.addText}>
              + ADD CONTACT
            </Text>
          </Pressable>
        </View>

        {/* SAVED CONTACTS */}
        <Text style={styles.section}>
          SAVED CONTACTS
        </Text>

        {contacts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              No emergency contacts
            </Text>

            <Text style={styles.emptyText}>
              Add a trusted person above.
            </Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View
              key={contact.id}
              style={styles.contact}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {contact.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                  {contact.name}
                </Text>

                <Text style={styles.contactPhone}>
                  {contact.phone}
                </Text>
              </View>

              <Pressable
                onPress={() => deleteContact(contact.id)}
              >
                <Text style={styles.delete}>
                  Delete
                </Text>
              </Pressable>
            </View>
          ))
        )}
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
      marginTop: 20,
      marginBottom: 20,
    },

    title: {
      color: colors.text,
      fontSize: 27,
      fontWeight: "800",
    },

    subtitle: {
      color: colors.secondaryText,
      marginTop: 7,
      lineHeight: 20,
      marginBottom: 25,
    },

    form: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 17,
    },

    label: {
      color: colors.secondaryText,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.8,
      marginBottom: 8,
    },

    input: {
      backgroundColor: colors.secondaryCard,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      padding: 13,
      marginBottom: 15,
    },

    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      padding: 14,
      alignItems: "center",
    },

    addText: {
      color: "#FFFFFF",
      fontWeight: "800",
    },

    section: {
      color: colors.secondaryText,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 30,
      marginBottom: 10,
    },

    empty: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 25,
      alignItems: "center",
    },

    emptyTitle: {
      color: colors.text,
      fontWeight: "700",
    },

    emptyText: {
      color: colors.secondaryText,
      marginTop: 5,
    },

    contact: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 15,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
    },

    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    avatarText: {
      color: "#FFFFFF",
      fontWeight: "800",
    },

    contactInfo: {
      flex: 1,
    },

    contactName: {
      color: colors.text,
      fontWeight: "700",
    },

    contactPhone: {
      color: colors.secondaryText,
      marginTop: 4,
    },

    delete: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "700",
    },
  });