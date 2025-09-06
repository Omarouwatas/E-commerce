import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/constants';
import BackButton from '@/components/BackButton';
import * as Location from "expo-location";

interface AdresseLivraison {
  nom: string;
  rue: string;
  ville: string;
  code_postal?: string;
  gouvernorat?: string;
}

interface Commande {
  _id: string;
  client_id: string;
  total: number;
  statut: 'assignee' | 'en_cours_de_livraison' | 'livree' | 'confirmee' | string;
  mode_paiement?: string;
  date_commande?: string; 
  adresse_livraison: AdresseLivraison;
  livreur_id?: string;
}

let subscriber: Location.LocationSubscription | null = null;

export default function LivreurScreen() {
  const [orders, setOrders] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const dateToText = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  };

  const fetchOrders = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/delivery/my-assigned`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 12000,
      });
      setOrders(res.data as Commande[]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', "Impossible de charger mes commandes assignées.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const setBusy = (id: string, v: boolean) => setBusyById(prev => ({ ...prev, [id]: v }));

  const startDelivery = async (id: string) => {
    try {
      setBusy(id, true);
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BASE_URL}/api/delivery/accept/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchOrders();
      Alert.alert('', 'Livraison démarrée');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erreur', e?.response?.data?.msg || "Impossible de démarrer la livraison");
    } finally {
      setBusy(id, false);
    }
  };

  const markDelivered = async (id: string) => {
    try {
      setBusy(id, true);
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BASE_URL}/api/delivery/${id}/valider-livraison`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchOrders();
      Alert.alert('✅', 'Commande marquée livrée');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erreur', e?.response?.data?.msg || "Échec de la validation");
    } finally {
      setBusy(id, false);
    }
  };

  const refuseOrder = async (id: string) => {
    try {
      setBusy(id, true);
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BASE_URL}/api/delivery/refuse/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchOrders();
      Alert.alert('', 'Commande renvoyée à l\'état assignée');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erreur', e?.response?.data?.msg || "Impossible de refuser la commande");
    } finally {
      setBusy(id, false);
    }
  };

  const startSharingLocation = async (orderId: string) => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission refusée", "Activez la localisation.");
      return;
    }

    if (subscriber) {
      subscriber.remove();
      subscriber = null;
    }

    subscriber = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
      },
      async (loc) => {
        try {
          const token = await AsyncStorage.getItem("token");
          await axios.post(`${BASE_URL}/api/delivery/update-location`, {
            order_id: orderId,
            location: {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            },
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (e) {
          console.error("Erreur update-location:", e);
        }
      }
    );

    Alert.alert("", "Partage de localisation activé !");
  };

  const stopSharingLocation = () => {
    if (subscriber) {
      subscriber.remove();
      subscriber = null;
      Alert.alert("ℹ️", "Partage de localisation arrêté.");
    }
  };

  const renderItem = useCallback(({ item }: { item: Commande }) => {
    const isStarting = busyById[item._id] && item.statut === 'assignee';
    const isFinishing = busyById[item._id] && item.statut === 'en_cours_de_livraison';

    return (
      <View style={styles.card}>
        <Text style={styles.title}>Commande {item._id}</Text>
        <Text>Client : {item.adresse_livraison?.nom || '—'}</Text>
        <Text>Adresse : {item.adresse_livraison?.rue}, {item.adresse_livraison?.ville}</Text>
        <Text>Total : {Number(item.total).toFixed(2)} €</Text>
        <Text>Passée le : {dateToText(item.date_commande)}</Text>
        <Text style={styles.badge}>Statut : {item.statut}</Text>

        <View style={{ height: 8 }} />
        <TouchableOpacity
          style={[styles.button, styles.primary]}
          onPress={() => {
            const encoded = encodeURIComponent(JSON.stringify(item));
            router.push(`/receipt?commande=${encoded}`);
          }}
        >
          <Text style={styles.buttonText}>Voir reçu</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          {item.statut === 'assignee' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn, isStarting && styles.disabled]}
              onPress={() => startDelivery(item._id)}
              disabled={!!isStarting}
            >
              {isStarting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Démarrer</Text>}
            </TouchableOpacity>
          )}

          {item.statut === 'en_cours_de_livraison' && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.finishBtn, isFinishing && styles.disabled]}
                onPress={() => markDelivered(item._id)}
                disabled={!!isFinishing}
              >
                {isFinishing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Livrée</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}
                onPress={() => startSharingLocation(item._id)}
              >
                <Text style={styles.buttonText}>Partager localisation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#9E9E9E' }]}
                onPress={stopSharingLocation}
              >
                <Text style={styles.buttonText}>Stop localisation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#E53935' }]}
                onPress={() => refuseOrder(item._id)}
              >
                <Text style={styles.buttonText}>Refuser</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }, [busyById]);

  const empty = useMemo(() => (
    <View style={{ padding: 24, alignItems: 'center' }}>
      {loading ? <ActivityIndicator size="large" /> : <Text>Aucune commande assignée</Text>}
    </View>
  ), [loading]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BackButton />
      <View style={styles.container}>
        <Text style={styles.header}>Mes commandes assignées</Text>
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={empty}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
    marginBottom: 12,
    borderColor: '#ddd',
    borderWidth: 1
  },
  title: { fontWeight: 'bold', marginBottom: 6 },
  badge: { marginTop: 6, fontWeight: '600' },
  button: {
    marginTop: 10,
    backgroundColor: '#00c853',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  primary: { backgroundColor: '#00c853' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  actionBtn: { flex: 1, padding: 12, borderRadius: 6, alignItems: 'center', marginVertical: 4 },
  acceptBtn: { backgroundColor: '#4CAF50' },
  finishBtn: { backgroundColor: '#2196F3' },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' }
});