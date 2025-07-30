import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';

interface Prediction {
  produit: string;
  prediction: number;
}

export default function PredictionScreen() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/orders/predict`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPredictions(res.data);
    } catch (err) {
      console.error("Erreur lors du fetch des prédictions :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <BackButton />
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔮 Prédiction des ventes</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : predictions.length === 0 ? (
        <Text style={styles.empty}>Aucune prédiction disponible</Text>
      ) : (
        predictions.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.label}>{item.produit}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { width: `${Math.min(item.prediction * 20, 100)}%` }]} />
              <Text style={styles.value}>{item.prediction.toFixed(2)} ventes</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 10 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  barContainer: { flexDirection: 'row', alignItems: 'center' },
  bar: { height: 8, backgroundColor: '#4a90e2', borderRadius: 4 },
  value: { marginLeft: 8, fontSize: 14, color: '#444' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 }
});
