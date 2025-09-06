// components/BackButton.tsx
import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function BackButton({ label = "Retour" }) {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
      <Ionicons name="arrow-back" size={18} color="#2d6a4f" style={{ marginRight: 6 }} />
      <Text style={styles.backBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2d6a4f",
    alignSelf: "flex-start", 
    marginBottom: 12,
  },
  backBtnText: {
    color: "#2d6a4f",
    fontWeight: "700",
    fontSize: 14,
  },
});
