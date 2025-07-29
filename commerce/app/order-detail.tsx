// app/(tabs)/order-detail.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import BackButton from '@/components/BackButton';

export default function OrderDetail() {
    const { id, type } = useLocalSearchParams();
    const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchDetails = async () => {
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await axios.get(`${BASE_URL}/api/${type === 'vente' ? 'sales' : 'orders'}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch {
        alert("Erreur lors du chargement des détails");
      } finally {
        setLoading(false);
      }
    };
    if (id && type) fetchDetails();
  }, [id, type]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#00C851" />;
  if (!data) return <Text style={{ padding: 20 }}>Aucune donnée trouvée.</Text>;

  return (
    <View style={{ flex: 1 }}>
      <BackButton />
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Détails de la {type === 'vente' ? 'vente' : 'commande'}</Text>
      <Text>ID : {data._id}</Text>
      <Text>Total : {data.total} DA</Text>
      {type === 'commande' && <Text>Statut : {data.statut}</Text>}
      <Text style={styles.subtitle}>Produits :</Text>
      {data.produits.map((p: any, idx: number) => (
        <View key={idx} style={styles.productItem}>
          <Text>{p.nom} x{p.quantite}</Text>
          <Text>{p.prix * p.quantite} DA</Text>
        </View>
      ))}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#eee'
  }
});
