import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import { useRouter } from 'expo-router';

export default function AddressScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [newAddress, setNewAddress] = useState({
    nom: '',
    rue: '',
    ville: '',
    code_postal: '',
    gouvernorat: '',
    telephone: '',
    label: '',
  });

  const handleSelectAddress = async (address: any) => {
    try {
      await AsyncStorage.setItem('selected_address', JSON.stringify(address));
      router.push('/payment');
    } catch (error) {
      console.error("Failed to save selected address:", error);
    }
  };

  const getAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/orders/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(response.data);
    } catch (e) {
      console.error("Failed to fetch addresses:", e);
    }
  };

  const addAddress = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${BASE_URL}/api/orders/addresses`, newAddress, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewAddress({ nom: '', rue: '', ville: '', code_postal: '', gouvernorat: '', telephone: '', label: '' });
      getAddresses();
    } catch (e) {
      console.error("Failed to add address:", e);
    }
  };

  useEffect(() => {
    getAddresses();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mes Adresses</Text>
      {addresses.map((address, index) => (
        <TouchableOpacity
          key={index}
          style={styles.addressCard}
          onPress={() => handleSelectAddress(address)} 
        >
          <Text style={styles.label}>{address.label}</Text>
          <Text>{address.nom}</Text>
          <Text>{address.rue}</Text>
          <Text>{address.ville}, {address.code_postal}</Text>
          <Text>{address.gouvernorat}</Text>
          <Text>{address.telephone}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.title}>Ajouter une Adresse</Text>
      <View style={styles.addressCard}>
        <TextInput
          style={styles.input}
          placeholder="Nom complet"
          value={newAddress.nom}
          onChangeText={(text) => setNewAddress({ ...newAddress, nom: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Rue"
          value={newAddress.rue}
          onChangeText={(text) => setNewAddress({ ...newAddress, rue: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Ville"
          value={newAddress.ville}
          onChangeText={(text) => setNewAddress({ ...newAddress, ville: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Code Postal"
          value={newAddress.code_postal}
          onChangeText={(text) => setNewAddress({ ...newAddress, code_postal: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Gouvernorat"
          value={newAddress.gouvernorat}
          onChangeText={(text) => setNewAddress({ ...newAddress, gouvernorat: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Téléphone"
          keyboardType="phone-pad"
          value={newAddress.telephone}
          onChangeText={(text) => setNewAddress({ ...newAddress, telephone: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Label (Maison, Travail...)"
          value={newAddress.label}
          onChangeText={(text) => setNewAddress({ ...newAddress, label: text })}
        />

        <TouchableOpacity style={styles.button} onPress={addAddress}>
          <Text style={styles.buttonText}>Ajouter l'adresse</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addressCard: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#00c853',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
