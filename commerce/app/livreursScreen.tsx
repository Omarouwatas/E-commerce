import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/constants';

interface Livreur {
  _id: string;
  nom: string;
  email?: string;
  telephone?: string;
  status?: 'disponible' | 'occupee' | 'hors_ligne' | string;
  order_id?: string;
}

export default function LivreursScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string | string[] }>();

  const [adminCity, setAdminCity] = useState<string>('');
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const normalizedOrderId = useMemo(() => {
    if (!orderId) return undefined;
    return Array.isArray(orderId) ? orderId[0] : orderId;
  }, [orderId]);

  const getToken = async () => {
    const t = await AsyncStorage.getItem('token');
    if (!t) throw new Error('Token manquant');
    return t;
  };

  const fetchAdminCity = useCallback(async () => {
    const token = await getToken();
    const res = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    const gov = res.data.gouvernorat || '';
    setAdminCity(gov);
    return gov;
  }, []);

  const fetchLivreurs = useCallback(async (city: string) => {
    const token = await getToken();
    const res = await axios.get(`${BASE_URL}/api/delivery/livreurs?city=${encodeURIComponent(city || '')}` ,{
      headers: { Authorization: `Bearer ${token}` },
      timeout: 12000,
    });
    setLivreurs(res.data as Livreur[]);
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      setLoading(true);
      const city = await fetchAdminCity();
      await fetchLivreurs(city);
    } catch (e:any) {
      console.error(e);
      Alert.alert('Erreur', e?.response?.data?.msg || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [fetchAdminCity, fetchLivreurs]);

  React.useEffect(() => { bootstrap(); }, [bootstrap]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const city = await fetchAdminCity();
      await fetchLivreurs(city);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAdminCity, fetchLivreurs]);

  const statusColor = (s?: string) => s === 'disponible' ? 'green' : s === 'occupée' ? 'orange' : '#777';

  const handleAssignLivreur = useCallback(async (livreurId: string) => {
    if (!normalizedOrderId) {
      Alert.alert('Info', "Aucune commande sélectionnée.");
      return;
    }
    try {
      setAssigningId(livreurId);
      const token = await getToken();
      await axios.put(`${BASE_URL}/api/delivery/assign/${normalizedOrderId}`, { livreur_id: livreurId }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 12000,
      });
      Alert.alert('Succès', 'Livreur affecté avec succès');
      router.back();
    } catch (err:any) {
      console.error(err);
      Alert.alert('Erreur', err?.response?.data?.msg || "Erreur lors de l'affectation");
    } finally {
      setAssigningId(null);
    }
  }, [normalizedOrderId, router]);

  const renderItem = ({ item }: { item: Livreur }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.nom}</Text>
      {item.email ? <Text>Email : {item.email}</Text> : null}
      {item.telephone ? <Text>Téléphone : {item.telephone}</Text> : null}
      <Text>
        Status : <Text style={{ fontWeight: 'bold', color: statusColor(item.status) }}>{item.status || 'inconnu'}</Text>
      </Text>

      {item.status === 'occupee' && item.order_id && (
        <TouchableOpacity style={styles.trackButton} onPress={() => router.push(`/adminTrack?order_id=${item.order_id}`)}>
          <Text style={styles.trackText}>Suivre le livreur</Text>
        </TouchableOpacity>
      )}

      {item.status === 'disponible' && normalizedOrderId && (
        <TouchableOpacity
          style={[styles.trackButton, assigningId === item._id && styles.disabled]}
          onPress={() => handleAssignLivreur(item._id)}
          disabled={assigningId === item._id}
        >
          {assigningId === item._id ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.trackText}>Affecter ce livreur</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Livreurs de {adminCity || '—'}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#00C851" />
      ) : (
        <FlatList
          data={livreurs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Aucun livreur trouvé.</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 16, marginBottom: 12, borderColor: '#eee', borderWidth: 1 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16, color: '#007AFF' },
  trackButton: { marginTop: 10, backgroundColor: '#2196F3', padding: 10, borderRadius: 6, alignItems: 'center' },
  trackText: { color: '#fff', fontWeight: 'bold' },
  disabled: { opacity: 0.6 },
});
