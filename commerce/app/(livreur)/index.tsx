import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';

export default function LivreurDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  return (
    <ImageBackground
      source={require('../../assets/images/logo.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Tableau de Bord Livreur</Text>

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
