// app/(admin)/pos.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Button, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/constants';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';

interface Product {
  _id: string;
  name: string;
  price: number;
}

interface VenteItem {
  product_id: string;
  nom: string;
  prix: number;
  quantite: number;
}

export default function POSScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [venteItems, setVenteItems] = useState<VenteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [modePaiement, setModePaiement] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const router = useRouter();

  const fetchProducts = async () => {
    const token = await AsyncStorage.getItem("token");
    try {
      const res = await axios.get(`${BASE_URL}/api/products/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.products || []);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les produits");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const sum = venteItems.reduce((acc, item) => acc + item.prix * item.quantite, 0);
    setTotal(sum);
  }, [venteItems]);

  const addToSale = (product: Product) => {
    setVenteItems(prev => {
      const existing = prev.find(p => p.product_id === product._id);
      if (existing) {
        return prev.map(p => p.product_id === product._id
          ? { ...p, quantite: p.quantite + 1 }
          : p);
      }
      return [...prev, {
        product_id: product._id,
        nom: product.name,
        prix: product.price,
        quantite: 1
      }];
    });
  };

  const validerVente = async () => {
    const token = await AsyncStorage.getItem("token");
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/api/sales`, {
        produits: venteItems,
        total,
        mode_paiement: modePaiement
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLastReceipt(response.data.vente);
      setShowReceipt(true);
      setVenteItems([]);
    } catch {
      Alert.alert("Erreur", "Échec de l'enregistrement de la vente");
    }
    setLoading(false);
  };

  const imprimerRecu = async () => {
    if (!lastReceipt) return;
    const html = `
      <html>
        <body>
          <h2>Reçu de Vente</h2>
          <p><strong>ID :</strong> ${lastReceipt._id}</p>
          <p><strong>Date :</strong> ${new Date(lastReceipt.date_vente).toLocaleString()}</p>
          <p><strong>Mode de paiement :</strong> ${lastReceipt.mode_paiement}</p>
          <h3>Produits :</h3>
          <ul>
            ${lastReceipt.produits.map((p: any) => `<li>${p.nom} x${p.quantite} → ${p.prix * p.quantite} DA</li>`).join('')}
          </ul>
          <p><strong>Total :</strong> ${lastReceipt.total} DA</p>
        </body>
      </html>`;

    await Print.printAsync({ html });
  };

  return (
    <SafeAreaView style = {{flex : 1}}>
      <BackButton></BackButton>
    <View style={styles.container}>
      <Text style={styles.title}>🧾 Interface de Vente</Text>
      <FlatList
        data={products}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productItem} onPress={() => addToSale(item)}>
            <Text>{item.name} - {item.price} DA</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>Aucun produit trouvé</Text>}
      />

      <View style={styles.venteSection}>
        <Text style={styles.subtitle}>🛒 Panier</Text>
        {venteItems.map((item, index) => (
          <Text key={index}>- {item.nom} x{item.quantite} ({item.prix * item.quantite} DA)</Text>
        ))}
        <Text style={styles.total}>Total : {total} DA</Text>
        <TextInput
          placeholder="Mode de paiement (ex: cash, carte)"
          value={modePaiement}
          onChangeText={setModePaiement}
          style={styles.input}
        />
        <Button title="Valider la vente" onPress={validerVente} disabled={loading || venteItems.length === 0} />
        {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
      </View>

      {showReceipt && lastReceipt && (
        <View style={styles.receiptModal}>
          <Text style={styles.receiptTitle}>🧾 Reçu</Text>
          <Text>ID : {lastReceipt._id}</Text>
          <Text>Date : {new Date(lastReceipt.date_vente).toLocaleString()}</Text>
          <Text>Mode de paiement : {lastReceipt.mode_paiement}</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Produits :</Text>
          {lastReceipt.produits.map((p: any, idx: number) => (
            <Text key={idx}>
              {p.nom} x{p.quantite} → {p.prix * p.quantite} DA
            </Text>
          ))}
          <Text style={styles.total}>Total : {lastReceipt.total} DA</Text>
          <Button title="🖨 Imprimer" onPress={imprimerRecu} />
          <Button title="Fermer" onPress={() => setShowReceipt(false)} />
        </View>
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  subtitle: { fontSize: 18, fontWeight: "600", marginVertical: 10 },
  productItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ccc"
  },
  venteSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#888'
  },
  total: {
    marginVertical: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: '#00C851'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12
  },
  receiptModal: {
    position: 'absolute',
    top: '20%',
    left: '5%',
    right: '5%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    zIndex: 999
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  }
});
