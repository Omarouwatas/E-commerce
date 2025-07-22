import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { BASE_URL } from '../../constants';
interface Order {
  _id: string;
  client_id: string;
  type_commande: string;
  total: number;
  statut: string;
  date_commande: string;
}

export default function ManageSalesScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
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
    }
  };

  const confirmOrder = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BASE_URL}/api/orders/${orderId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("✅", "Commande confirmée.");
      fetchOrders();
    } catch (err) {
      Alert.alert("Erreur", "Confirmation échouée.");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.title}>Commande</Text>
      <Text>Client ID : {item.client_id}</Text>
      <Text>Type : {item.type_commande}</Text>
      <Text>Montant total : {item.total} DA</Text>
      <Text>Statut : {item.statut}</Text>
      <Text>Date : {new Date(item.date_commande).toLocaleString()}</Text>

      {item.statut === "en_attente" && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => confirmOrder(item._id)}
        >
          <Text style={styles.confirmButtonText}>✅ Confirmer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Gérer les ventes</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        renderItem={renderItem}
      />
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: '#fff',
      flex: 1,
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    card: {
      backgroundColor: '#f9f9f9',
      borderRadius: 10,
      padding: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#ddd',
    },
    title: {
      fontWeight: 'bold',
      marginBottom: 6,
      fontSize: 16,
    },
    confirmButton: {
      marginTop: 10,
      backgroundColor: '#4CAF50',
      padding: 10,
      borderRadius: 6,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    backButton: {
      marginBottom: 10,
      padding: 8,
      backgroundColor: '#eee',
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    backText: {
      color: '#333',
      fontWeight: 'bold',
    },
  });
  