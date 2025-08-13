import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
let MapView: any;
let Marker: any;
if (Platform.OS !== 'web') {
  MapView = require('react-native-maps').default;
  Marker = require('react-native-maps').Marker;
}
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';
import { BASE_URL } from '@/constants';

export default function AdminTrackScreen() {
  const { order_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [livreurInfo, setLivreurInfo] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchTrackingInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/delivery/track/${order_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLivreurInfo(res.data.livreur);
      setLocation(res.data.location);
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Impossible de récupérer les infos du livreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingInfo();
    const interval = setInterval(fetchTrackingInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BackButton />
      <View style={styles.container}>
        <Text style={styles.title}>Suivi de livraison</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#00c853" />
        ) : location ? (
          Platform.OS !== 'web' ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{ latitude: location.lat, longitude: location.lng }}
                title={livreurInfo?.nom}
                description={livreurInfo?.telephone}
              />
            </MapView>
          ) : (
            <Text style={{ textAlign: 'center' }}>Carte non disponible sur le Web</Text>
          )
        ) : (
          <Text style={{ textAlign: 'center' }}>Position du livreur non disponible.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12
  },
  map: {
    flex: 1,
    borderRadius: 10
  }
});