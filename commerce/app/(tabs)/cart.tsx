import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Button, ImageBackground, SafeAreaView } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import { getToken } from '@/utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useRouter } from 'expo-router';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

export default function CartScreen() {
  const navigation = useNavigation();

useLayoutEffect(() => {
  navigation.setOptions({ headerShown: false });
}, []);

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rawItems = res.data.elements;
      const enrichedItems = await Promise.all(
        rawItems.map(async (item: any) => {
          try {
            const productRes = await axios.get(`${BASE_URL}/api/products/${item.product_id}`);
            return {
              ...item,
              product: productRes.data
            };
          } catch {
            return { ...item, product: null };
          }
        })
      );

      setCart(enrichedItems);
    } catch (err) {
      console.error("Erreur lors du chargement du panier :", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (product_id: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${BASE_URL}/api/cart/remove`, { product_id }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCart();
    } catch (err) {
      console.error("Erreur suppression panier :", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const getTotal = () => {
    return cart.reduce((sum, item) => {
      if (!item.product || !item.product.price) return sum;
      return sum + item.product.price * item.quantite;
    }, 0);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.itemContainer}>
      <View style={styles.cardContent}>
        {item.product?.images?.[0] && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.product.images[0] }}
              style={styles.productImage}
            />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>
            {item.product ? item.product.name : "Produit inconnu"}
          </Text>
          
          <View style={styles.quantityPriceRow}>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Qté:</Text>
              <Text style={styles.quantityValue}>{item.quantite}</Text>
            </View>
            {item.product?.price && (
              <Text style={styles.priceText}>
                {(item.product.price * item.quantite).toFixed(2)} €
              </Text>
            )}
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.removeBtn} 
        onPress={() => removeFromCart(item.product_id)}
      >
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>

    <ImageBackground source={require('../../assets/images/logo.png')} 
    style={styles.backgroundImage}
    resizeMode="cover">
    <View style={styles.wrapper}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF7F" />
          <Text style={styles.loadingText}>Chargement du panier...</Text>
        </View>
      ) : cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Votre panier est vide</Text>
          <Text style={styles.emptySubtext}>Ajoutez des produits pour commencer</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mon Panier</Text>
            <Text style={styles.headerSubtitle}>{cart.length} article{cart.length > 1 ? 's' : ''}</Text>
          </View>

          <FlatList
            data={cart}
            keyExtractor={(item) => item.product_id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={fetchCart}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{getTotal().toFixed(2)} €</Text>
            </View>
            
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/selectAdresse')}>
              <Text style={styles.checkoutText}>Passer à la caisse</Text>
              <Text style={styles.checkoutIcon}>→</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
    </ImageBackground>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  wrapper: { 
    flex: 1, 
    backgroundColor: '#f9fafb', // fond clair
  },

  backgroundImage: { flex: 1, width: '100%', height: '100%' },

  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 14, fontWeight: '500', color: '#6b7280' },

  listContainer: { padding: 16, paddingBottom: 140 },

  itemContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },

  imageContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 6,
    marginRight: 14,
  },
  productImage: { width: 70, height: 70, borderRadius: 8 },

  productInfo: { flex: 1, paddingRight: 40 },
  productName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },

  quantityPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityLabel: { fontSize: 13, color: '#6b7280', marginRight: 6 },
  quantityValue: { fontSize: 15, fontWeight: '700', color: '#10b981' },

  priceText: { fontSize: 16, fontWeight: '700', color: '#10b981' },

  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  removeText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#10b981' },

  checkoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 6 },
  checkoutIcon: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  loadingText: { fontSize: 15, color: '#6b7280', marginTop: 10 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', padding: 24 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
