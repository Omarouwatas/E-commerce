import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserName(res.data.nom || 'utilisateur');
    } catch (err) {
      console.error("Erreur chargement utilisateur :", err);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bonjour {userName} 👋</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/profile/info')}>
        <Text style={styles.buttonText}> Informations personnelles</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/profile/historique')}>
        <Text style={styles.buttonText}> Historique des ventes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/profile/notification')}>
        <Text style={styles.buttonText}> Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logout]} onPress={handleLogout}>
        <Text style={[styles.buttonText, { color: '#fff' }]}> Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  button: {
    padding: 16,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16 },
  logout: { backgroundColor: '#ff4444' },
});
