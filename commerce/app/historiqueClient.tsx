// app/(tabs)/historique.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BackButton from '@/components/BackButton';
export default function HistoriqueClient() {
  const [ventes, setVentes] = useState<any[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistorique = async () => {
      const { clientId } = useLocalSearchParams();

      const token = await AsyncStorage.getItem("token");
      try {
        const [resVentes, resCommandes] = await Promise.all([
          axios.get(`${BASE_URL}/api/sales/my`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/api/orders/historique`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setVentes(resVentes.data);
        setCommandes(resCommandes.data);
      } catch {
        alert("Erreur lors du chargement des ventes/commandes");
      } finally {
        setLoading(false);
      }
    };

    fetchHistorique();
  }, []);

  const renderCard = (item: any, type: 'vente' | 'commande') => (
    <TouchableOpacity style={styles.card} onPress={() => {
      router.push({
        pathname: "/order-detail",
        params: { id: item._id, type }
      });
    }}>
      <Text style={styles.title}>{type === 'vente' ? 'Vente locale' : 'Commande en ligne'}</Text>
      <Text>ID : {item._id}</Text>
      <Text>Total : {item.total} DA</Text>
      {type === 'commande' && <Text>Statut : {item.statut}</Text>}
      <Text style={styles.link}>Voir détails ➔</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>

    <View style={styles.container}>
        <BackButton />

      <Text style={styles.header}>🧾 Historique de mes achats</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#00C851" />
      ) : (
        <FlatList
          data={[...ventes.map(v => ({ ...v, type: 'vente' })), ...commandes.map(c => ({ ...c, type: 'commande' }))]}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => renderCard(item, item.type)}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Aucun achat trouvé.</Text>}
        />
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  link: {
    marginTop: 10,
    color: '#00C851',
    fontWeight: '600'
  }
});
