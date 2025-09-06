import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import BackButton from '@/components/BackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
const parseDate = (dateField: any) => {
  if (!dateField) return "Date inconnue";
  const dateStr = dateField.$date || dateField; 
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "Date inconnue" : d.toLocaleString();
};

export default function OrderDetail() {
  const { orderId } = useLocalSearchParams(); 
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await axios.get(`${BASE_URL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch {
        alert("Erreur lors du chargement des détails");
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchDetails();
  }, [orderId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#00C851" />;
  if (!data) return <Text style={{ padding: 20 }}>Aucune donnée trouvée.</Text>;
  const deleteOrder = async () => {
    const token = await AsyncStorage.getItem("token");
    try {
      await axios.delete(`${BASE_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Commande supprimée avec succès");
    } catch {
      alert("Erreur lors de la suppression de la commande");
    } 
  };
  return (

    <SafeAreaView style={{ flex: 1 }}>
      <BackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Détails de la commande</Text>

        <Text style={styles.label}>Client :</Text>
        <Text style={styles.value}>{data.adresse_livraison?.nom || "Nom inconnu"}</Text>

        <Text style={styles.label}>Adresse :</Text>
        <Text style={styles.value}>
          {data.adresse_livraison?.rue}, {data.adresse_livraison?.ville}{"\n"}
          {data.adresse_livraison?.gouvernorat} - {data.adresse_livraison?.code_postal}
        </Text>

        <Text style={styles.label}>Date :</Text>
        <Text>{parseDate(data.date_commande)}</Text>


        <Text style={styles.label}>Statut :</Text>
        <Text style={[styles.value, { fontWeight: 'bold', color: '#00796B' }]}>
          {data.statut}
        </Text>

        <Text style={styles.label}>Montant total :</Text>
        <Text style={[styles.value, { fontSize: 16, fontWeight: '600' }]}>
          {data.total} DA
        </Text>

        {/* 🔹 Produits */}
        <Text style={styles.subtitle}>Produits :</Text>
        {data.produits?.map((p: any, idx: number) => (
          <View key={idx} style={styles.productItem}>
            <View>
              <Text style={styles.productName}>{p.nom}</Text>
              <Text style={styles.productQty}>Quantité : {p.quantite}</Text>
            </View>
            <Text style={styles.productPrice}>{p.prix * p.quantite} DA</Text>
          </View>
        ))}
      </ScrollView>
      {/* 🔹 Bouton de suppression */
      <View style={{ padding: 16, borderTopWidth: 1, borderColor: '#eee' }}>
        <Text
          style={{
            color: '#D32F2F', textAlign: 'center', fontWeight: 'bold'
          }}
          onPress={deleteOrder}
        > Supprimer la commande
        </Text>
      </View>
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 10 },
  value: { fontSize: 14, color: '#333' },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee'
  },
  productName: { fontSize: 14, fontWeight: '600' },
  productQty: { fontSize: 12, color: '#666' },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#000' }
});
