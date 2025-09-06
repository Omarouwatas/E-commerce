// app/(admin)/ManageSalesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { BASE_URL } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';


const parseDate = (dateField: any) => {
  if (!dateField) return "Date inconnue";
  const dateStr = dateField.$date || dateField; 
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "Date inconnue" : d.toLocaleString();
};

interface Order {
  _id: string;
  adresse_livraison: {
    nom: string;
    rue: string;
    ville: string;
    code_postal: string;
    gouvernorat: string;
  };
  type_commande: string;
  total: number;
  statut: string;
  date_commande: string;
}

export default function ManageSalesScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/orders/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les ventes.");
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const check = await axios.get(`${BASE_URL}/api/orders/${orderId}/check-stock/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!check.data.ok) {
        Alert.alert("Stock insuffisant", check.data.message || "Impossible de confirmer la commande.");
        return;
      }
      await axios.put(`${BASE_URL}/api/orders/${orderId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("✅", "Commande confirmée.");
      fetchOrders();
    } catch (err) {
      Alert.alert("Erreur", "Stock insuffisant.");
    }
  };

  const goToAssignLivreur = (orderId: string) => {
    router.push({ pathname: '/livreursScreen', params: { orderId } });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <Text style={styles.title}>Commande</Text>
      {/* 🔹 Affichage du nom du client */}
      <Text>Client : {item.adresse_livraison?.nom || "Nom inconnu"}</Text>

      <Text>Type : {item.type_commande}</Text>
      <Text>Montant total : {item.total} DA</Text>
      <Text>Statut : {item.statut}</Text>
      <Text>Date : {parseDate(item.date_commande)}</Text>

      {/* Bouton confirmer */}
      {item.statut === "en_attente" && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => confirmOrder(item._id)}
        >
          <Text style={styles.confirmButtonText}>Confirmer</Text>
        </TouchableOpacity>
      )}

      {/* Bouton affecter */}
      {item.statut.toLowerCase() === "confirmée" && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => goToAssignLivreur(item._id)}
        >
          <Text style={styles.confirmButtonText}>Affecter à un livreur</Text>
        </TouchableOpacity>
      )}

      {/* Bouton suivre */}
      {item.statut === "en_cours_de_livraison" && (
        <TouchableOpacity
          style={[styles.assignButton, { backgroundColor: '#FF9800' }]}
          onPress={() => router.push({ pathname: '/adminTrack', params: { orderId: item._id } })}
        >
          <Text style={styles.confirmButtonText}>Suivre le livreur</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.assignButton, { backgroundColor: '#673AB7' }]}
        onPress={() => router.push({ pathname: '/order-detail', params: { orderId: item._id } })}
      >
        <Text style={styles.confirmButtonText}>Détails</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/ScanTicketScreen')} style={styles.scanButton}>
            <Text style={styles.scanText}>Scanner un Ticket</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Gérer les commandes</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#00C851" />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={item => item._id}
            renderItem={renderItem}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flex: 1 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  title: { fontWeight: 'bold', marginBottom: 6, fontSize: 16 },
  confirmButton: { marginTop: 10, backgroundColor: '#4CAF50', padding: 10, borderRadius: 6, alignItems: 'center' },
  assignButton: { marginTop: 10, backgroundColor: '#2196F3', padding: 10, borderRadius: 6, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: 'bold' },
  backButton: { marginBottom: 10, padding: 8, backgroundColor: '#eee', borderRadius: 6, alignSelf: 'flex-start' },
  backText: { color: '#333', fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  scanButton: { padding: 8, backgroundColor: '#2196F3', borderRadius: 6 },
  scanText: { color: '#fff', fontWeight: 'bold' }
});
