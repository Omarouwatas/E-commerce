import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '@/constants';
import BackButton from '@/components/BackButton';

interface Location {
  lat: number;
  lng: number;
}

interface TrackingResponse {
  statut_commande: string;
  status_livraison?: string | null;
  livreur_location?: Location | null;
  produits?: Array<{ name: string; qty: number; price: number }>;
  total?: number;
  date_commande?: string;
}

export default function ClientTrackingScreen() {
  const { order_id } = useLocalSearchParams<{ order_id: string }>();
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let socket: Socket;

    const fetchInitialData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/api/delivery/client-track/${order_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (mounted) setData(res.data);
      } catch (err) {
        console.error("Erreur API tracking:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
    socket = io(BASE_URL, { transports: ['websocket'] });

    socket.on("connect", () => {
      socket.emit("join_order", { order_id });
    });

    socket.on("location_update", (payload: { order_id: string; location: Location }) => {
      if (!mounted) return;
      if (String(payload.order_id) === String(order_id)) {
        setData(prev => ({
          ...(prev ?? {} as TrackingResponse),
          livreur_location: payload.location,
          status_livraison: prev?.status_livraison ?? 'en_cours_de_livraison'
        }));
      }
    });

    socket.on("status_update", (payload: { order_id: string; status: string }) => {
      if (!mounted) return;
      if (String(payload.order_id) === String(order_id)) {
        setData(prev => ({
          ...(prev ?? {} as TrackingResponse),
          statut_commande: payload.status
        }));
      }
    });

    return () => {
      mounted = false;
      if (socket) socket.disconnect();
    };
  }, [order_id]);

  if (loading && !data) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  const htmlMap = data?.livreur_location ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <style>#map{height:100%;width:100%;margin:0;padding:0} body,html{height:100%;margin:0;padding:0}</style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${data.livreur_location.lat}, ${data.livreur_location.lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([${data.livreur_location.lat}, ${data.livreur_location.lng}])
          .addTo(map)
          .bindPopup('📦 Votre livreur est ici')
          .openPopup();
      </script>
    </body>
    </html>
  ` : null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Suivi de Commande</Text>
        <Text>Statut : {data?.statut_commande ?? '—'}</Text>
        <Text>Livraison : {data?.status_livraison || 'Non démarrée'}</Text>
        {typeof data?.total === 'number' && <Text>Total : {data?.total} €</Text>}

        {htmlMap ? (
          <View style={{ height: 320, marginTop: 20 }}>
            <WebView source={{ html: htmlMap }} />
          </View>
        ) : (
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <Text style={{ color: "#666" }}>En attente de la position du livreur…</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
});
