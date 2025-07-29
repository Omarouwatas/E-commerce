// components/BackButton.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BackButton({ label = "Retour" }) {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.button} onPress={() => router.back()}>
      <Ionicons name="arrow-back" size={20} color="#00C851" style={{ marginRight: 6 }} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    color: '#00C851',
    fontWeight: '600',
    fontSize: 16,
  },
});
