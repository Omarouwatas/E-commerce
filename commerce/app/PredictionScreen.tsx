import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants';
import BackButton from '@/components/BackButton';
import Markdown from 'react-native-markdown-display';

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
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [loadingComment, setLoadingComment] = useState(false);

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

  const selectedSeries = selectedProductId
    ? groupedPredictions[selectedProductId]
    : [];

  const generateSmartComment = () => {
    if (!selectedSeries.length) return "Pas assez de données pour l'analyse.";

    const values = selectedSeries.map(s => s.quantite_predite);
    const dates = selectedSeries.map(s => s.date_prediction);

    let comment = "";
    let suggestions = "";

    for (let i = 1; i < values.length; i++) {
      const diff = values[i] - values[i - 1];
      if (diff > values[i - 1] * 0.2) {
        comment += ` Hausse notable prévue le ${new Date(dates[i]).toLocaleDateString('fr-FR')}. `;
        suggestions += " Prévoir plus de stock et renforcer la disponibilité. ";
      }
      if (diff < -values[i - 1] * 0.2) {
        comment += ` Baisse prévue le ${new Date(dates[i]).toLocaleDateString('fr-FR')}. `;
        suggestions += " Lancer une promotion (ex: -10%) pour relancer la demande. ";
      }
    }

    if (!comment) {
      comment = "La demande reste globalement stable cette semaine.";
      suggestions = "Maintenir l'offre actuelle, sans besoin d'ajustements majeurs.";
    }

    return `${comment}\n${suggestions}`;
  };

  const fetchAIComment = async (preds: Prediction[]) => {
    try {
      setLoadingComment(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(
        `${BASE_URL}/api/ML/predict-comment`,
        { predictions: preds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiComment(res.data.commentaire);
    } catch (err) {
      console.error("Erreur commentaire IA:", err);
    } finally {
      setLoadingComment(false);
    }
  };

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
          await fetchAIComment(predRes.data.predictions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = {
    labels: selectedSeries.map(s => new Date(s.date_prediction).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
    datasets: [{
      data: selectedSeries.map(s => s.quantite_predite),
      strokeWidth: 2
    }]
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
            height={260}
            yAxisLabel=""
            yAxisSuffix=" u"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#f9f9f9',
              backgroundGradientTo: '#fff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 200, 81, ${opacity})`,
              labelColor: () => '#333',
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#00C851'
              }
            }}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      ) : (
        <Text style={styles.noData}> Aucune donnée pour ce produit.</Text>
      )}

      {loadingComment ? (
        <ActivityIndicator size="small" style={{ marginTop: 20 }} />
      ) : aiComment ? (
        <ScrollView style={styles.commentBox}>
          <Markdown style={markdownStyles}>{aiComment}</Markdown>
        </ScrollView>
      ) : (
        <Text style={styles.comment}>{generateSmartComment()}</Text>
      )}

      <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchAIComment(predictions)}>
        <Text style={styles.refreshText}>Régénérer </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f6f6f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#222' },
  picker: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 16 },
  chart: { borderRadius: 12, marginVertical: 8 },
  noData: { textAlign: 'center', color: '#888', marginTop: 20, fontSize: 16 },
  comment: {
    marginTop: 20,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#eef9f1',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#00C851',
    lineHeight: 22
  },
  commentBox: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    maxHeight: 250
  },
  refreshBtn: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#00C851',
    borderRadius: 8,
    alignItems: 'center'
  },
  refreshText: { color: '#fff', fontWeight: 'bold' }
});

const markdownStyles = {
  body: { color: '#222', fontSize: 14, lineHeight: 20 },
  heading1: { fontSize: 22, fontWeight: 'bold', color: '#00C851' },
  heading2: { fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  heading3: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  table: { borderWidth: 1, borderColor: '#ccc' },
  tableRow: { borderBottomWidth: 1, borderColor: '#ccc' },
  tableCell: { padding: 4, fontSize: 13 }
} as const;
