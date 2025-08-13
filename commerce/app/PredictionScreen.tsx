// DashboardScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants';
import BackButton from '@/components/BackButton';



const { width } = Dimensions.get('window');
interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  colors: string[];
  brand?: string;
  category?: string;
}

interface Prediction {
  product_id: string;
  date_prediction: string;
  quantite_predite: number;
}

export default function DashboardScreen() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const productMap = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach((p) => {
      map[p._id] = p.name;
    });
    return map;
  }, [products]);

  const groupedPredictions = useMemo(() => {
    const grouped: Record<string, Prediction[]> = {};
    predictions.forEach((p) => {
      if (!grouped[p.product_id]) grouped[p.product_id] = [];
      grouped[p.product_id].push(p);
    });
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort(
        (a, b) => new Date(a.date_prediction).getTime() - new Date(b.date_prediction).getTime()
      );
    });
    return grouped;
  }, [predictions]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const [prodRes, predRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/products/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${BASE_URL}/api/ML/predict?days=7`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setProducts(prodRes.data.products || []);
        setPredictions(predRes.data.predictions || []);
        if (predRes.data.predictions?.length) {
          setSelectedProductId(predRes.data.predictions[0].product_id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);



  const selectedSeries = selectedProductId
  ? groupedPredictions[selectedProductId]
  : [];
  const chartData = {
    labels: selectedSeries.map(s => s.date_prediction),
    datasets: [{ data: selectedSeries.map(s => s.quantite_predite) }]
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Dashboard des Prédictions</Text>
      <Picker
        selectedValue={selectedProductId}
        onValueChange={v => setSelectedProductId(v)}
        style={styles.picker}
      >
        {Object.keys(groupedPredictions).map(id => (
          <Picker.Item key={id} label={productMap[id] || id} value={id} />
        ))}
      </Picker>
      {selectedSeries.length > 0 ? (
        <ScrollView horizontal>
          <LineChart
            data={chartData}
            width={Math.max(width, selectedSeries.length * 80)}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 2,
              color: () => '#00C851',
              labelColor: () => '#000'
            }}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      ) : (
        <Text>Aucune donnée pour ce produit.</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f6f6f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  picker: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 },
  chart: { borderRadius: 8 }
});
