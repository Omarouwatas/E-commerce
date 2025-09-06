import { View, Text, StyleSheet, ScrollView,TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import  {useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

interface Order {
  _id: string;
  client_id: string;
  total: number;
  statut: string;
  mode_paiement: string;
  date_commande?: string;
  adresse_livraison: {
    nom: string;
    rue: string;
    ville: string;
    code_postal: string;
    gouvernorat: string;
  };
}
const parseDate = (dateField: any) => {
  if (!dateField) return "Date inconnue";
  const dateStr = dateField.$date || dateField; 
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "Date inconnue" : d.toLocaleString();
};
export default function ReceiptScreen() {
  const [role , setRole] = useState('');
  const [accepted, setAccepted] = useState(false);
  const { commande } = useLocalSearchParams();
  const [watcher, setWatcher] = useState<Location.LocationSubscription | null>(null);
  const order = commande ? JSON.parse(decodeURIComponent(commande)) : null;
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('role');
        if (storedRole) {
          setRole(storedRole);
        }
      } catch (error) {
        console.error('Error fetching role:', error);
      }
    };
    fetchRole();
  }, []);
  const startLocationTracking = async (orderId: string) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission GPS refusée');
      return;
    }
  
    const token = await AsyncStorage.getItem('token');
  
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, 
        distanceInterval: 5, 
      },
      async (location) => {
        try {
          await axios.post(`${BASE_URL}/api/delivery/update-location`, {
            order_id: orderId,
            location: {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            }
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (error) {
          console.error('Erreur envoi position :', error);
        }
      }
    );
  
    setWatcher(subscription);
  };
  const handleCancelDelivery = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(`${BASE_URL}/api/delivery/cancel`, {
        order_id: order._id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (watcher) {
        watcher.remove();
        setWatcher(null);
      }
  
      Alert.alert('Livraison annulée');
      setAccepted(false);
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur lors de l’annulation');
    }
  };
  
  
  const handleAcceptDelivery = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(`${BASE_URL}/api/delivery/accept`, {
        order_id: order._id, 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccepted(true);
      startLocationTracking(order._id);
      Alert.alert('Commande acceptée pour livraison !');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur lors de l’acceptation');
    }
  };  
  

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🧾 Reçu de commande</Text>
      {order ? (
        <>
          <Text style={styles.label}>Commande ID :</Text>
          <Text style={styles.value}>{order._id}</Text>

          <Text style={styles.label}>Client :</Text>
          <Text style={styles.value}>{order.adresse_livraison.nom}</Text>

          <Text style={styles.label}>Adresse :</Text>
          <Text style={styles.value}>
            {order.adresse_livraison.rue}, {order.adresse_livraison.ville} {order.adresse_livraison.code_postal}, {order.adresse_livraison.gouvernorat}
          </Text>

          <Text style={styles.label}>Méthode de paiement :</Text>
          <Text style={styles.value}>{order.mode_paiement === 'cod' ? 'Paiement à la livraison' : 'Carte Bancaire'}</Text>

          <Text style={styles.label}>Produits :</Text>
          {order.produits.map((p, idx) => (
            <Text key={idx}>• {p.nom} x {p.quantite} — {p.prix} €</Text>
          ))}

          <Text style={styles.total}>Total TTC : {order.total} €</Text>
        </>
      ) : (
        <Text>Aucune commande à afficher.</Text>
      )}
    </ScrollView>
{role === 'LIVREUR' && !accepted && (
  <TouchableOpacity style={styles.backButton} onPress={handleAcceptDelivery}>
    <Text style={styles.backText}>Accepter la commande à livrer</Text>
  </TouchableOpacity>
)}
{
  role === 'LIVREUR' && accepted && watcher && (
    <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(livreur)/ScanTicketScreen')}>
    <Text style={styles.value}>Valider la livraison</Text>
  </TouchableOpacity>
  )
}
{role === 'LIVREUR' && accepted && (
  <TouchableOpacity style={[styles.backButton, { backgroundColor: '#FF5252' }]} onPress={handleCancelDelivery}>
    <Text style={styles.backText}>Annuler la livraison</Text>
  </TouchableOpacity>
)}
    </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontWeight: 'bold', marginTop: 10 },
  value: { marginBottom: 8 },
  total: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  date: { fontStyle: 'italic', marginTop: 10 },
  backButton: {
    marginTop: 10,
    backgroundColor: '#00c853',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
