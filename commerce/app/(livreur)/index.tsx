import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Alert } from 'react-native';
import { BASE_URL } from '@/constants';
import axios from 'axios';

export default function LivreurDashboard() {
  const router = useRouter();
  const [status, setStatus] = useState('chargement...');

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };
  const fetchStatus = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStatus(res.data.status || 'hors_ligne');
  };
  const toggleStatus = async () => {
    const token = await AsyncStorage.getItem('token');
    const nouveauStatus = status === 'disponible' ? 'hors_ligne' : 'disponible';
    try {
      await axios.put(`${BASE_URL}/api/delivery/status`, { status: nouveauStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(nouveauStatus);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de changer le statut");
    }
  };
  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/images/logo.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
      <Text style={styles.title}>Mon Statut</Text>
      <Text style={styles.statusText}>{status}</Text>

      <TouchableOpacity style={styles.button} onPress={toggleStatus}>
        <Text style={styles.buttonText}>
          Passer en {status === 'disponible' ? 'hors ligne' : 'disponible'}
        </Text>
      </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(livreur)/OrdersToDeliver')}>
          <Text style={styles.buttonText}>Commandes à livrer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/(livreur)/ScanTicketScreen')}>
          <Text style={styles.buttonText}>Scanner un Ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.logout]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  statusText: { fontSize: 18, marginBottom: 40, textAlign: 'center' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 20,
    width: '80%',
  },
  logout: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
