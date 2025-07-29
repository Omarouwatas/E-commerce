import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity,ImageBackground, SafeAreaView } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function ProfileScreen() {
  const navigation = useNavigation();

useLayoutEffect(() => {
  navigation.setOptions({ headerShown: false });
}, []);

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
    <SafeAreaView style={{ flex: 1 }}>

    <ImageBackground source={require('../../assets/images/logo.png')} 
    style={styles.backgroundImage}
    resizeMode="cover">
    <View style={styles.container}>
      <Text style={styles.title}>Bonjour {userName} </Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/profile/info')}>
        <Text style={styles.buttonText}> Informations personnelles</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/historiqueClient')}>
        <Text style={styles.buttonText}> Historique des ventes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/ClientOrdersScreen')}>
        <Text style={styles.buttonText}> Suivi des Commandes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logout]} onPress={handleLogout}>
        <Text style={[styles.buttonText, { color: '#fff' }]}> Se déconnecter</Text>
      </TouchableOpacity>
    </View>
    </ImageBackground>
    </SafeAreaView>
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
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonText: { fontSize: 16 },
  logout: { backgroundColor: '#ff4444' },
});
