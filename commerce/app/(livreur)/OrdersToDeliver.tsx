import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';

interface Order {
  _id: string;
  client_id: string;
  total: number;
  statut: string;
  mode_paiement: string;
  date_commande: string;
  adresse_livraison: {
    nom: string;
    rue: string;
    ville: string;
    code_postal: string;
    gouvernorat: string;
  };
}

export default function OrdersToDeliver() {
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const profile = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const gouvernorat = profile.data.gouvernorat;

      const res = await axios.get(`${BASE_URL}/api/orders/to-deliver/${gouvernorat}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de charger les commandes.");
    }
  };

  const handleAccept = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BASE_URL}/api/delivery/accept/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("✅", "Commande acceptée avec succès");
      fetchOrders();
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Échec de l'acceptation de la commande");
    }
  };

  const handleRefuse = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BASE_URL}/api/delivery/refuse/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("❌", "Commande refusée");
      fetchOrders();
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Échec du refus de la commande");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <Text style={styles.title}>Commande {item._id}</Text>
      <Text>Client : {item.adresse_livraison.nom}</Text>
      <Text>Adresse : {item.adresse_livraison.rue}, {item.adresse_livraison.ville}</Text>
      <Text>Total : {item.total} €</Text>
      <Text>Commande passée le : {new Date(item.date_commande).toLocaleString()}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const encoded = encodeURIComponent(JSON.stringify(item));
          router.push(`/receipt?commande=${encoded}`);
        }}
      >
        <Text style={styles.buttonText}>Voir reçu</Text>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item._id)}>
          <Text style={styles.buttonText}>✅ Accepter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refuseButton} onPress={() => handleRefuse(item._id)}>
          <Text style={styles.buttonText}>❌ Refuser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BackButton />

      <View style={styles.container}>
        <Text style={styles.header}>Commandes à livrer</Text>
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ textAlign: 'center' }}>Aucune commande disponible</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1
  },
  title: { fontWeight: 'bold', marginBottom: 6 },
  button: {
    marginTop: 10,
    backgroundColor: '#00c853',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  refuseButton: {
    flex: 1,
    backgroundColor: '#d32f2f',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
