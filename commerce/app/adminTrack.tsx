import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import BackButton from '@/components/BackButton';
import { useLocalSearchParams } from 'expo-router';

interface Coords { latitude: number; longitude: number; }

export default function AdminTrackScreen() {
  const { orderId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [livreurLoc, setLivreurLoc] = useState<Coords | null>(null);
  const [livreurInfo, setLivreurInfo] = useState<{ nom?: string; telephone?: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const mapRef = useRef<MapView>(null);

  const fetchTrack = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/delivery/track/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.location) {
        const next = res.data.location as Coords;
        setLivreurLoc(next);
        setLastUpdate(new Date()); // si ton API expose updated_at, utilise-le ici
        // recadrer en douceur
        mapRef.current?.animateCamera({
          center: { latitude: next.latitude, longitude: next.longitude },
          zoom: 16,
        }, { duration: 700 });
      }
      if (res.data?.livreur) setLivreurInfo(res.data.livreur);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    fetchTrack();
    const id = setInterval(fetchTrack, 5000);
    return () => clearInterval(id);
  }, [orderId]);

  const lastUpdateText = useMemo(() => {
    if (!lastUpdate) return '—';
    return lastUpdate.toLocaleTimeString();
  }, [lastUpdate]);

 

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Carte plein écran */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={
          livreurLoc
            ? { latitude: livreurLoc.latitude, longitude: livreurLoc.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
            : undefined
        }
      >
        {livreurLoc && (
          <Marker
            coordinate={livreurLoc}
            title={`Livreur : ${livreurInfo?.nom ?? ''}`}
            description={livreurInfo?.telephone ?? ''}
            pinColor="green"
          />
        )}
      </MapView>

      {/* Carte : overlay d’info + back */}
      <View style={styles.infoBox}>
        <BackButton />
        <Text style={styles.header}>Suivi de la commande</Text>
        <Text style={styles.info}> Livreur : {livreurInfo?.nom || '—'}</Text>
        <Text style={styles.info}>Téléphone : {livreurInfo?.telephone || '—'}</Text>
      </View>

      {/* Boutons flottants */}
      <View style={styles.fabs}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#2563eb' }]}
          onPress={() => {
            if (!livreurLoc) return;
            mapRef.current?.animateCamera(
              { center: livreurLoc, zoom: 16 },
              { duration: 500 }
            );
          }}
        >
          <Text style={styles.fabText}>Recentrer</Text>
        </TouchableOpacity>


      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoBox: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 999,
  },
  header: { fontSize: 18, fontWeight: '700', marginTop: 6, marginBottom: 6 },
  info: { fontSize: 14, color: '#111827', marginBottom: 2 },
  fabs: {
    position: 'absolute',
    right: 16,
    bottom: 28,
    gap: 10,
  },
  fab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '700' },
});
