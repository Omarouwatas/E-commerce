import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/constants';
 
export default function LivreursScreen() {
  const [adminCity, setAdminCity] = useState('');
  const [livreurs, setLivreurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { orderId } = useLocalSearchParams();


  const fetchAdminCity = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setAdminCity(res.data.gouvernorat);
    return res.data.gouvernorat;
  };

  const fetchLivreurs = async (city: string) => {
    const token = await AsyncStorage.getItem("token");
    try {
      const res = await axios.get(`${BASE_URL}/api/delivery/livreurs?city=${city}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLivreurs(res.data);
    } catch {
      alert("Erreur lors du chargement des livreurs");
    } finally {
      setLoading(false);
    }
  };
  const handleAssignLivreur = async (livreurId: string) => {
    const token = await AsyncStorage.getItem('token');  
    if (!orderId) {
      alert("Aucune commande sélectionnée.");
      return;
    }
    try {
      await axios.post(`${BASE_URL}/api/delivery/assign`, {
        livreur_id: livreurId,
        order_id: orderId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      alert("Livreurr affecté avec succès !");
      router.back();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'affectation.");
    }
  };
  
  useEffect(() => {
    fetchAdminCity().then(city => fetchLivreurs(city));
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.nom}</Text>
      <Text>Email : {item.email}</Text>
      <Text>Téléphone : {item.telephone}</Text>
      <Text>Status : <Text style={{ fontWeight: 'bold', color: item.status === 'disponible' ? 'green' : item.status === 'occupee' ? 'orange' : 'gray' }}>{item.status}</Text></Text>

      {item.status === 'occupee' && item.order_id && (
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => router.push(`/adminTrack?order_id=${item.order_id}`)}
        >
          <Text style={styles.trackText}>Suivre le livreur</Text>
        </TouchableOpacity>
      )}
      {item.status === 'disponible' && orderId && (
  <TouchableOpacity
    style={styles.trackButton}
    onPress={() => handleAssignLivreur(item._id)} 
  >
    <Text style={styles.trackText}>Affecter ce livreur</Text>
  </TouchableOpacity>
)}

    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Livreurs de {adminCity}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#00C851" />
      ) : (
        <FlatList
          data={livreurs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Aucun livreur trouvé.</Text>}
        />
      )}
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
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  backButton: {
    marginBottom: 10
  },
  backText: {
    fontSize: 16,
    color: '#007AFF'
  },
  trackButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  trackText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
