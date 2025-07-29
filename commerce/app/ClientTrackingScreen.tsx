import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import BackButton from '@/components/BackButton';
interface Location {
    lat: number;
    lng: number;
  }
  
export default function ClientTrackingScreen() {
  const { order_id } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
  
    const fetchTrackingData = async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const res = await axios.get(`${BASE_URL}/api/delivery/client-track/${order_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
  
    fetchTrackingData(); 
  
    intervalId = setInterval(fetchTrackingData, 15000);
  
    return () => clearInterval(intervalId);
  }, [order_id]);
  

  if (!data) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  const { statut_commande, status_livraison, livreur_location, produits, total, date_commande } = data;

  const htmlMap = livreur_location ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <style> #map { height: 100%; width: 100%; margin:0; padding:0; } body, html {margin:0;padding:0;height:100%;} </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${livreur_location.lat}, ${livreur_location.lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([${livreur_location.lat}, ${livreur_location.lng}])
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
      <Text>Statut : {statut_commande}</Text>
      <Text>Livraison : {status_livraison || 'Non démarrée'}</Text>
      <Text>Total : {total} €</Text>



      {htmlMap && (
        <View style={{ height: 300, marginTop: 20 }}>
          <WebView source={{ html: htmlMap }} />
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15
  }
});
