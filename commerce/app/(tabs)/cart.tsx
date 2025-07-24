import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Button } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '@/constants';
import { getToken } from '@/utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useRouter } from 'expo-router';

export default function CartScreen() {
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
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    flex: 1, 
    backgroundColor: '#0A0A0A' 
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 32,
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  
  emptyText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  emptySubtext: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
  },

  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  
  headerSubtitle: {
    color: '#00FF7F',
    fontSize: 14,
    fontWeight: '500',
  },

  listContainer: { 
    padding: 20, 
    paddingBottom: 140 
  },
  
  itemContainer: {
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    shadowColor: '#00FF7F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  imageContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 8,
    marginRight: 16,
  },
  
  productImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 8,
    backgroundColor: '#3A3A3A',
  },
  
  productInfo: {
    flex: 1,
    paddingRight: 40,
  },
  
  productName: { 
    color: '#FFFFFF',
    fontWeight: 'bold', 
    fontSize: 18,
    marginBottom: 12,
    lineHeight: 24,
  },
  
  quantityPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  
  quantityLabel: {
    color: '#888888',
    fontSize: 14,
    marginRight: 8,
  },
  
  quantityValue: {
    color: '#00FF7F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  priceText: {
    color: '#00FF7F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  removeBtn: { 
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  removeText: { 
    color: '#FFFFFF', 
    fontSize: 16,
    fontWeight: 'bold',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderTopWidth: 2,
    borderTopColor: '#00FF7F',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  
  totalLabel: { 
    color: '#FFFFFF',
    fontSize: 18, 
    fontWeight: '600',
  },
  
  totalAmount: {
    color: '#00FF7F',
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  checkoutBtn: {
    backgroundColor: '#00FF7F',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FF7F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  checkoutText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  
  checkoutIcon: {
    color: '#000000',
    fontSize: 9,
    fontWeight: 'bold',
  }
});