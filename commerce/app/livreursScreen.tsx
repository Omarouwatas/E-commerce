// app/(admin)/LivreursScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView,
  TouchableOpacity, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import { useRouter } from 'expo-router';

interface Livreur {
  _id: string;
  nom: string;
  telephone: string;
  gouvernorat: string;
  status?: string;
}

export default function LivreursScreen() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [filtered, setFiltered] = useState<Livreur[]>([]);
  const [gouvernorat, setGouvernorat] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLivreurs = async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const res = await axios.get(`${BASE_URL}/api/livreurs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLivreurs(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error('Erreur lors du chargement des livreurs :', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLivreurs();
  }, []);

  const filterByGouvernorat = (value: string) => {
    setGouvernorat(value);
    setFiltered(
      livreurs.filter(l => l.gouvernorat.toLowerCase().includes(value.toLowerCase()))
    );
  };

  const renderItem = ({ item }: { item: Livreur }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.nom}</Text>
      <Text>Téléphone : {item.telephone}</Text>
      <Text>Gouvernorat : {item.gouvernorat}</Text>
      <Text>Statut : {item.status || 'inconnu'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>
      <Text style={styles.title}>📦 Livreurs par Gouvernorat</Text>

      <TextInput
        placeholder="Filtrer par gouvernorat"
        style={styles.input}
        value={gouvernorat}
        onChangeText={filterByGouvernorat}
      />

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  name: { fontSize: 18, fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  backText: { fontWeight: 'bold' }
});
