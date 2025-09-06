import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import BackButton from '@/components/BackButton';

interface Commande {
  _id: string;
  statut: string;
  date_commande: string;
  total: number;
}

export default function ClientOrdersScreen() {
  const [orders, setOrders] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const res = await axios.get(`${BASE_URL}/api/delivery/client/commandes-actives`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  if (orders.length === 0) {
    return <Text style={{ padding: 20 }}>Aucune commande en attente ou en cours de livraison.</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <BackButton />
    <View style={styles.container}>
      <Text style={styles.title}>Mes commandes en attente</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Commande #{item._id}</Text>
            <Text>Date : {new Date(item.date_commande).toLocaleString()}</Text>
            <Text>Statut : {item.statut}</Text>
            <Text>Total : {item.total} €</Text>
            {item.statut === 'en_cours_de_livraison' && (
              <TouchableOpacity
                style={styles.trackButton}
                onPress={() => router.push(`/adminTrack?order_id=${item._id}`)}
              >
                <Text style={styles.trackText}>Suivre</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  card: { backgroundColor: '#f2f2f2', padding: 15, marginBottom: 15, borderRadius: 8 },
  trackButton: { backgroundColor: '#007bff', marginTop: 10, padding: 10, borderRadius: 6 },
  trackText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});
