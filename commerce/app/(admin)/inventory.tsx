import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/constants';

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  colors: string[];
  brand?: string;
  category?: string;
}
interface Inventaire{

}
export default function InventoryScreen() {
  const [ListProducts, setListProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'ajout' | 'retrait'>('ajout');
  const [adminCity, setAdminCity] = useState('');

  const fetchAdminCity = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setAdminCity(res.data.gouvernorat); 
  };

  const fetchProducts = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await axios.get(`${BASE_URL}/api/products/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListProducts(res.data.products);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
    }
  };
    const fetchInventory = async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const res = await axios.get(`${BASE_URL}/api/inventory/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        const stockMap: Record<string, number> = {};
        res.data.forEach((item: any) => {
          stockMap[item.product_id] = item.quantite_disponible;
        });
  
        setInventory(stockMap);
      } catch (err) {
        console.error('Erreur chargement inventaire:', err);
      }
    };
  

  const handleMovement = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!selectedProduct || !quantity || !reason) {
      Alert.alert("Erreur", "Tous les champs sont requis.");
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/inventory/movement`, {
        product_id: selectedProduct._id,
        quantite: Number(quantity),
        type_mouvement: type,
        raison: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("✅", "Mouvement enregistré.");
      setModalVisible(false);
      setQuantity('');
      setReason('');
      fetchInventory();
    } catch (e) {
      Alert.alert("Erreur", "Impossible d’enregistrer le mouvement.");
    }
  };

  useEffect(() => {
    fetchAdminCity();
    fetchProducts();
    fetchInventory();
  }, []);
  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>Quantité en stock : {inventory[item._id] ?? 0}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setSelectedProduct(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.buttonText}>Ajouter / Retirer</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Inventaire - {adminCity || '...'}</Text>
      <FlatList
  data={ListProducts}
  keyExtractor={(item) => item._id}
  renderItem={({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>Quantité en stock : {inventory[item._id] ?? 0}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setSelectedProduct(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.buttonText}>Ajouter / Retirer</Text>
      </TouchableOpacity>
    </View>
  )}
/>


      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{type === 'ajout' ? 'Ajouter' : 'Retirer'} - {selectedProduct?.name}</Text>
            <TextInput
              placeholder="Quantité"
              keyboardType="numeric"
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
            />
            <TextInput
              placeholder="Raison"
              style={styles.input}
              value={reason}
              onChangeText={setReason}
            />
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setType('ajout')} style={[styles.typeButton, type === 'ajout' && styles.activeType]}>
                <Text>Ajout</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setType('retrait')} style={[styles.typeButton, type === 'retrait' && styles.activeType]}>
                <Text>Retrait</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.confirm} onPress={handleMovement}>
              <Text style={styles.confirmText}>Valider</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: { padding: 16, backgroundColor: '#f1f1f1', borderRadius: 8, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: 'bold' },
  button: { marginTop: 10, backgroundColor: '#4CAF50', padding: 10, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '85%', backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 8, borderRadius: 6 },
  confirm: { backgroundColor: '#007BFF', padding: 12, borderRadius: 6, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  typeButton: { padding: 10, borderWidth: 1, borderRadius: 5 },
  activeType: { backgroundColor: '#d0f0c0' }
});
