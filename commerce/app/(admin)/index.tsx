import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
export default function AdminDashboard() {
  const router = useRouter();
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tableau de Bord Admin</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/add-product')}>
        <Text style={styles.buttonText}>Ajouter un produit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/inventory')}>
        <Text style={styles.buttonText}>Gérer l’inventaire</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/users')}>
        <Text style={styles.buttonText}>Gérer les utilisateurs</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={() => router.push('/ManageSalesScreen')}>
        <Text style={styles.buttonText}>Gérer les Commandes</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/pos')}
      >
        <Text style={styles.buttonText}>Interface de vente</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/livreursScreen')}
      >
        <Text style={styles.buttonText}>Gestion des livreurs</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/PredictionScreen')}
      >
        <Text style={styles.buttonText}>Prediction des ventes par l'IA </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button,  styles.logout]} onPress={handleLogout}>
      <Text style={[styles.buttonText, { color: '#fff' }]}> Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  logout: { backgroundColor: '#ff4444' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: '#315733ff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
