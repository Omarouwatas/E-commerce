import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function AdminDashboard() {
  const router = useRouter();
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tableau de Bord Admin</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(admin)/add-product')}>
        <Text style={styles.buttonText}>➕ Ajouter un produit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(admin)/inventory')}>
        <Text style={styles.buttonText}>📦 Suivre l’inventaire</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(admin)/users')}>
        <Text style={styles.buttonText}>👤 Gérer les utilisateurs</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(admin)/ManageSalesScreen')}>
        <Text style={styles.buttonText}>Gérer Les Commandes</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push('/(admin)/pos')}
      >
        <Text style={styles.btnText}>Interface de vente</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push('livreursScreen')}
      >
        <Text style={styles.btnText}>Gestion des livreurs</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button,  styles.logout]} onPress={handleLogout}>
      <Text style={[styles.buttonText, { color: '#fff' }]}> Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  btn: { backgroundColor: '#00C851', padding: 16, borderRadius: 8, marginVertical: 8 },
  btnText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  logout: { backgroundColor: '#ff4444' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
