import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Alert
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
const router = useRouter();
import { BASE_URL } from '../../constants';
interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    sales_count: number;
  }
  
export default function UserManagementScreen() {
    const [users, setUsers] = useState<User[]>([]);


  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.log(error);
      Alert.alert("Erreur", "Impossible de charger les utilisateurs.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${BASE_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Supprimé", "Utilisateur supprimé.");
      fetchUsers();
    } catch (err) {
      Alert.alert("Erreur", "Suppression échouée.");
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BASE_URL}/api/users/${id}`, {
        role: newRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      Alert.alert("Erreur", "Changement de rôle échoué.");
    }
  };

  return (
    
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
  <Text style={styles.backText}>← Retour</Text>
</TouchableOpacity>
      <Text style={styles.title}>Gestion des Utilisateurs</Text>
      <FlatList
        data={users}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>Email: {item.email}</Text>
            <Text>Rôle: {item.role}</Text>
            <Text>Ventes: {item.sales_count}</Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handleRoleChange(item._id, item.role === 'client' ? 'admin' : 'client')}>
                <Text style={styles.buttonText}>Changer Rôle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: 'red' }]}
                onPress={() => handleDelete(item._id)}>
                <Text style={styles.buttonText}>Supprimer</Text>
              </TouchableOpacity>
              
            </View>
            
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      padding: 20,
      flex: 1,
      backgroundColor: '#fff',
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    card: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 10,
      padding: 15,
      marginBottom: 12,
    },
    name: {
      fontWeight: 'bold',
      fontSize: 16,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    button: {
      backgroundColor: '#4CAF50',
      padding: 8,
      borderRadius: 6,
    },
    buttonText: {
      color: 'white',
    },
    backButton: {
      marginBottom: 10,
      padding: 8,
      backgroundColor: '#eee',
      borderRadius: 6,
    },
    backText: {
      color: '#333',
      fontWeight: 'bold',
    },
    
  });
  