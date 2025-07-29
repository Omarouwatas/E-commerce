import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, SafeAreaView, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const handleAddToCart = async () => {
    const token = await AsyncStorage.getItem('token');

    try {
      await axios.post(`${BASE_URL}/api/cart/add`, {
        product_id: product._id,
        quantite: quantity
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      Alert.alert("Succès", "Produit ajouté au panier !");
    } catch (err) {
      console.log("Erreur panier :", err);
    }
  };
  

  
  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/products/${id}`);
      setProduct(res.data);
      if (res.data.colors && res.data.colors.length > 0) {
        setSelectedColor(res.data.colors[0]);
      }
    } catch (err) {
      console.log("Erreur produit :", err);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C851" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.icon}>⤴</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Galerie images */}
        <View style={styles.imageContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.imageGallery}
          >
            {product.images.map((img: string, idx: number) => (
              <View key={idx} style={styles.imageWrapper}>
                <Image source={{ uri: img }} style={styles.image} />
              </View>
            ))}
          </ScrollView>
          
          {/* Indicateurs de pages */}
          <View style={styles.pageIndicators}>
            {product.images.map((_: any, idx: number) => (
              <View key={idx} style={[styles.indicator, idx === 0 && styles.activeIndicator]} />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {/* Nom et prix */}
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>${product.price}</Text>
          
          {/* Vendeur et rating */}
          <View style={styles.sellerRow}>
            <Text style={styles.sellerLabel}>Seller: </Text>
            <Text style={styles.sellerName}>{product.brand || 'Vendeur officiel'}</Text>
          </View>
          
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {product.rating}</Text>
            </View>
            <Text style={styles.reviewCount}>({product.reviews_count || 320} Reviews)</Text>
          </View>

          {/* Couleurs */}
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.colorRow}>
            {product.colors.map((color: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedDot
                ]}
              />
            ))}
          </View>

          {/* Onglets */}
          <View style={styles.tabRow}>
            {['description', 'specifications', 'reviews'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  activeTab === tab && styles.activeTab
                ]}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText
                ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contenu des onglets */}
          <View style={styles.tabContent}>
            {activeTab === 'description' && (
              <Text style={styles.desc}>
                {product.description || 'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting.'}
              </Text>
            )}
            {activeTab === 'specifications' && (
              <View>
                <Text style={styles.desc}>Spécifications techniques du produit</Text>
                <Text style={styles.desc}>• Marque: {product.brand || 'N/A'}</Text>
                <Text style={styles.desc}>• Catégorie: {product.category || 'N/A'}</Text>
                <Text style={styles.desc}>• Couleurs disponibles: {product.colors.length}</Text>
              </View>
            )}
            {activeTab === 'reviews' && (
              <Text style={styles.desc}>
                Avis clients à venir...
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            onPress={() => setQuantity(q => Math.max(1, q - 1))}
            style={styles.qtyBtn}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{quantity}</Text>
          <TouchableOpacity 
            onPress={() => setQuantity(q => q + 1)}
            style={styles.qtyBtn}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <Text style={styles.cartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: screenHeight * 0.02, // ~16px
    fontSize: screenWidth * 0.04, // ~16px
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.04, // ~16px
    paddingVertical: screenHeight * 0.015, // ~12px
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    height: screenHeight * 0.08, // Hauteur fixe pour le header
  },
  backBtn: {
    width: screenWidth * 0.1, // ~40px
    height: screenWidth * 0.1, // ~40px (carré)
    borderRadius: screenWidth * 0.05, // ~20px (cercle)
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: screenWidth * 0.05, // ~20px
    color: '#000000',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: screenWidth * 0.03, // ~12px
  },
  iconBtn: {
    width: screenWidth * 0.1, // ~40px
    height: screenWidth * 0.1, // ~40px
    borderRadius: screenWidth * 0.05, // ~20px
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: screenWidth * 0.045, // ~18px
    color: '#000000',
  },
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#F8F8F8',
    position: 'relative',
    height: screenHeight * 0.45, // ~45% de l'écran pour les images
  },
  imageGallery: {
    height: screenHeight * 0.4, // ~40% pour la galerie
  },
  imageWrapper: {
    width: screenWidth,
    height: screenHeight * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.1, // ~40px
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: screenHeight * 0.02, // ~16px
    gap: screenWidth * 0.02, // ~8px
    height: screenHeight * 0.05, // ~5% pour les indicateurs
  },
  indicator: {
    width: screenWidth * 0.02, // ~8px
    height: screenWidth * 0.02, // ~8px
    borderRadius: screenWidth * 0.01, // ~4px
    backgroundColor: '#E0E0E0',
  },
  activeIndicator: {
    backgroundColor: '#00C851',
  },
  content: {
    padding: screenWidth * 0.05, // ~20px
    paddingBottom: screenHeight * 0.15, // Espace pour la bottom bar
  },
  name: {
    fontSize: screenWidth * 0.06, // ~24px
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: screenHeight * 0.01, // ~8px
    lineHeight: screenWidth * 0.07, // ~28px
  },
  price: {
    fontSize: screenWidth * 0.055, // ~22px
    fontWeight: 'bold',
    color: '#00C851',
    marginBottom: screenHeight * 0.015, // ~12px
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenHeight * 0.015, // ~12px
  },
  sellerLabel: {
    fontSize: screenWidth * 0.035, // ~14px
    color: '#666666',
  },
  sellerName: {
    fontSize: screenWidth * 0.035, // ~14px
    fontWeight: '600',
    color: '#000000',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenHeight * 0.03, // ~24px
    gap: screenWidth * 0.02, // ~8px
  },
  ratingBadge: {
    backgroundColor: '#00C851',
    paddingHorizontal: screenWidth * 0.02, // ~8px
    paddingVertical: screenHeight * 0.005, // ~4px
    borderRadius: screenWidth * 0.03, // ~12px
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.03, // ~12px
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: screenWidth * 0.035, // ~14px
    color: '#666666',
  },
  sectionTitle: {
    fontSize: screenWidth * 0.045, // ~18px
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: screenHeight * 0.015, // ~12px
  },
  colorRow: {
    flexDirection: 'row',
    gap: screenWidth * 0.03, // ~12px
    marginBottom: screenHeight * 0.03, // ~24px
    flexWrap: 'wrap',
  },
  colorDot: {
    width: screenWidth * 0.08, // ~32px
    height: screenWidth * 0.08, // ~32px
    borderRadius: screenWidth * 0.04, // ~16px
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedDot: {
    borderColor: '#000000',
    borderWidth: 3,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: screenHeight * 0.02, // ~16px
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: screenHeight * 0.015, // ~12px
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00C851',
  },
  tabText: {
    fontSize: screenWidth * 0.035, // ~14px
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#00C851',
    fontWeight: '600',
  },
  tabContent: {
    marginBottom: screenHeight * 0.05, // ~40px (réduit de 100px)
  },
  desc: {
    fontSize: screenWidth * 0.035, // ~14px
    color: '#666666',
    lineHeight: screenWidth * 0.055, // ~22px
    marginBottom: screenHeight * 0.01, // ~8px
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.05, // ~20px
    paddingVertical: screenHeight * 0.02, // ~16px
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    gap: screenWidth * 0.04, // ~16px
    height: screenHeight * 0.1, // ~10% de l'écran
    paddingBottom: screenHeight * 0.02, // Safe area pour les iPhones
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: screenWidth * 0.0625, // ~25px
    paddingHorizontal: screenWidth * 0.01, // ~4px
    height: screenHeight * 0.06, // ~48px
  },
  qtyBtn: {
    width: screenWidth * 0.1, // ~40px
    height: screenHeight * 0.05, // ~40px
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: screenWidth * 0.05, // ~20px
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  qty: {
    fontSize: screenWidth * 0.04, // ~16px
    color: '#FFFFFF',
    fontWeight: '600',
    marginHorizontal: screenWidth * 0.04, // ~16px
    minWidth: screenWidth * 0.08, // Largeur minimale pour éviter le saut
    textAlign: 'center',
  },
  cartBtn: {
    flex: 1,
    backgroundColor: '#00C851',
    paddingVertical: screenHeight * 0.02, // ~16px
    borderRadius: screenWidth * 0.0625, // ~25px
    alignItems: 'center',
    height: screenHeight * 0.06, // Même hauteur que quantity container
    justifyContent: 'center',
  },
  cartText: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.04, 
    fontWeight: 'bold',
  },
});