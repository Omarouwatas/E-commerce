import React, { useEffect, useLayoutEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ImageBackground, SafeAreaView, ActivityIndicator, Alert 
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '@/components/BackButton';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      const res = await axios.get(`${BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserName(res.data.nom || 'Utilisateur');
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les informations utilisateur.");
      console.error("Erreur chargement utilisateur :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>

      <ImageBackground 
        source={require('../../assets/images/logo.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      
        <View style={styles.container}>
          <Text style={styles.title}> {userName}</Text>
          <CustomButton text="Informations personnelles" onPress={() => router.push('/profile/info')} />
          <CustomButton text="Historique des ventes" onPress={() => router.push('/historiqueClient')} />
          <CustomButton text="Suivi des commandes" onPress={() => router.push('/ClientOrdersScreen')} />
          <CustomButton text="Se déconnecter" onPress={handleLogout} danger />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

type CustomButtonProps = {
  text: string;
  onPress: () => void;
  danger?: boolean;
};

function CustomButton({ text, onPress, danger = false }: CustomButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, danger && styles.logout]} 
      onPress={onPress}
    >
      <Text style={[styles.buttonText, danger && { color: '#fff' }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 24 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 32, 
    textAlign: 'center', 
    color: '#fff' 
  },
  button: {
    padding: 16,
    backgroundColor: 'rgba(110, 222, 59, 0.71)',
    borderRadius: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { fontSize: 16, fontWeight: '600',color: '#f7f4f4ff' },
  logout: { backgroundColor: '#ff44449a' },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
