import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import { useRouter } from 'expo-router';
import BackButton from '@/components/BackButton';

export default function PaymentScreen() {
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('cod');
  const router = useRouter();

  useEffect(() => {
    const loadAddress = async () => {
      try {
        const stored = await AsyncStorage.getItem("selected_address");
        if (stored) {
          setSelectedAddress(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Erreur chargement adresse", err);
      }
    };
    loadAddress();
  }, []);
  const handleCreateOrder = async () => {
    if (!selectedAddress) {
      Alert.alert("Erreur", "Aucune adresse sélectionnée");
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(`${BASE_URL}/api/orders/`, {
        type_commande: 'livraison',
        frais_livraison: 5.0,
        adresse: selectedAddress,
        mode_paiement: paymentMethod,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const createdOrder = res.data.commande;

      router.push({
        pathname: "/ConfirmationScreen",
        params: {
          commande: encodeURIComponent(JSON.stringify(createdOrder))
        }
      });
    } catch (err) {
      console.error("Erreur API /api/orders", err);
      Alert.alert("Erreur", "Impossible de créer la commande");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <BackButton />
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Adresse de livraison</Text>
      {selectedAddress ? (
        <View style={styles.addressBox}>
          <Text>{selectedAddress.nom}</Text>
          <Text>{selectedAddress.rue}</Text>
          <Text>{selectedAddress.ville}, {selectedAddress.code_postal}</Text>
          <Text>{selectedAddress.gouvernorat}</Text>
          <Text>{selectedAddress.telephone}</Text>
        </View>
      ) : (
        <Text style={styles.warning}>Aucune adresse sélectionnée</Text>
      )}

      <Text style={styles.title}>Méthode de Paiement</Text>
      <TouchableOpacity
        style={[styles.paymentOption, paymentMethod === 'cod' && styles.selected]}
        onPress={() => setPaymentMethod('cod')}
      >
        <Text style={styles.optionText}>Paiement à la livraison</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.paymentOption, paymentMethod === 'card' && styles.selected]}
        onPress={() => setPaymentMethod('card')}
      >
        <Text style={styles.optionText}>Carte Bancaire</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.orderButton} onPress={handleCreateOrder}>
        <Text style={styles.orderText}>Créer la commande</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  addressBox: { backgroundColor: '#f1f1f1', padding: 15, borderRadius: 6, marginBottom: 20 },
  warning: { color: 'red', marginBottom: 20 },
  paymentOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    borderRadius: 6,
  },
  selected: {
    backgroundColor: '#00c853',
    borderColor: '#00c853',
  },
  optionText: {
    color: '#000',
    fontWeight: '500',
  },
  orderButton: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center'
  },
  orderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});
