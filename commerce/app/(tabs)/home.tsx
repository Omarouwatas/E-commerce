// app/(tabs)/home.tsx
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Alert, Dimensions,ImageBackground, SafeAreaView
} from 'react-native';
import debounce from 'lodash.debounce';

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRouter } from 'expo-router';
import { TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';



import { BASE_URL } from '../../constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  colors: string[];
  brand?: string;
  category?: string;
}

const categories = ['All', 'Phones', 'Accessories', 'Laptops', 'Shoes','Clothes','Jackets','T-Shirts'];

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchProducts = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/products/`, {
        params: {
          page: reset ? 1 : page,
          limit: 6,
          category: selectedCategory !== 'All' ? selectedCategory : ''
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const newProducts = res.data.products;
      setProducts(prev =>
        reset ? newProducts : [...prev, ...newProducts]
      );
      setHasMore(res.data.hasMore);
      setPage(reset ? 2 : page + 1);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les produits');
    }
    setLoading(false);
  };
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);
  useEffect(() => {
    fetchProducts(true);
  }, [selectedCategory]);
const searchProducts = async (text: string) => {
  setSearchQuery(text);
  if (text.trim() === '') {
    setIsSearching(false);
    setSearchResults([]);
    fetchProducts(true);
    return;
  }

  setIsSearching(true);
  try {
    const res = await axios.get(`${BASE_URL}/api/products/search?q=${encodeURIComponent(text)}`);
    setSearchResults(res.data);
  } catch {
    Alert.alert('Erreur', 'Échec de la recherche');
  }
  setIsSearching(false);
};

const debouncedSearch = useCallback(debounce(searchProducts, 300), []);

  
  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      onPress={() => router.push({ pathname: '/product-detail', params: { id: item._id } })}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.images?.[0] }} style={styles.image} />
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <View style={styles.bottomSection}>
          <Text style={styles.price}>{item.price} DA</Text>
          
          <View style={styles.colorRow}>
          {Array.isArray(item.colors) ? item.colors.slice(0, 4).map((color, i) => (
  <View 
    key={i} 
    style={[
      styles.colorDot, 
      { backgroundColor: color }
    ]} 
  />
)) : null}
            {Array.isArray(item.colors) && item.colors.length > 4 && (
  <Text style={styles.moreColors}>+{item.colors.length - 4}</Text>
)}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>

    <ImageBackground source={require('../../assets/images/logo.png')} 
    style={styles.backgroundImage}
    resizeMode="cover">
    
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Découvrir</Text>
        <Text style={styles.headerSubtitle}>Trouvez vos produits préférés</Text>
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <View style={{ marginTop: 10 }}>
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F0F0F0',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      marginBottom: 10,
    }}>
      <Icon name="search" size={16} color="#27eb15ff" style={{ marginRight: 8 }} />
      <TextInput
  placeholder="Rechercher un produit"
  value={searchQuery}
  style={{
    paddingVertical: 6,
paddingHorizontal: 12,
margin: 4,
fontSize: 14,
    backgroundColor: '#ecf2ebff',
    borderRadius: 10,
  }}
  onChangeText={debouncedSearch}
/>

    </View>

    {searchQuery.length > 0 && (
  <View style={{ backgroundColor: '#fff', borderRadius: 8, maxHeight: 200 }}>
    {isSearching ? (
      <ActivityIndicator size="small" color="#00C851" />
    ) : searchResults.length === 0 ? (
      <Text style={{ padding: 10, color: '#999' }}>Aucun résultat</Text>
    ) : (
      searchResults.map(item => (
        <TouchableOpacity
          key={item._id}
          onPress={() => {
            setSearchQuery('');
            setSearchResults([]);
            router.push({ pathname: '/product-detail', params: { id: item._id } });
          }}
          style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
        >
          <Text>{item.name}</Text>
        </TouchableOpacity>
      ))
    )}
  </View>
)}
  </View>
</TouchableWithoutFeedback>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterRow}
        contentContainerStyle={styles.filterContainer}
      >
        {categories.map((cat, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              setSelectedCategory(cat);
              setPage(1);
            }}
            style={[
              styles.filterBtn,
              selectedCategory === cat && styles.activeFilter
            ]}
          >
            <Text style={[
              styles.filterText,
              selectedCategory === cat && styles.activeText
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Spécial pour vous</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        onEndReached={() => {
          if (!isSearching) fetchProducts();
        }}        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00C851" />
            </View>
          ) : null
        }
      />
  
    </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: '4%', // 16px sur un écran de 400px
  },
  header: {
    paddingTop: screenHeight * 0.025, // ~20px sur un écran standard
    paddingBottom: screenHeight * 0.03, // ~24px
  },
  headerTitle: {
    fontSize: screenWidth * 0.07, // ~28px sur un écran de 400px
    fontWeight: 'bold',
    color: '#fdf9f9ff',
    alignContent: 'center',
    textAlign: 'center',
    marginBottom: screenHeight * 0.005, // ~4px
  },
  headerSubtitle: {
    fontSize: screenWidth * 0.05, // ~16px
    color: '#c2c2c2ff',
  },
  filterRow: {
    marginBottom: screenHeight * 0.025, 
    height: screenHeight * 0.08, 
  },
  filterContainer: {
    paddingRight: screenWidth * 0.025, // ~10px
    paddingHorizontal: '4%',
    alignItems: 'center',
  },
  filterBtn: {
    minWidth: '22%', 
paddingVertical: '2%',
paddingHorizontal: '4%',
    borderRadius: screenWidth * 0.05, // ~20px
    marginRight: screenWidth * 0.025, // ~10px
    backgroundColor: '#b0d348ff',
    borderWidth: 3,
    borderColor: '#c20e0eff',
    alignItems: 'center',
    justifyContent: 'center',
    height: screenHeight * 0.05, // Hauteur fixe pour uniformité
  },
  activeFilter: {
    backgroundColor: '#3a8558ff',
    borderColor: '#c82f00ff',
    elevation: 3,
    shadowColor: '#00C851',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  filterText: {
    fontSize: screenWidth * 0.035,
    fontWeight: '600',
    color: '#4c4b4bff',
  },
  activeText: {
    color: '#eeececff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: screenHeight * 0.012, // ~10px
    paddingHorizontal: '1%',
  },
  sectionTitle: {
    fontSize: screenWidth * 0.05, // ~20px
    fontWeight: 'bold',
    color: '#f8f6f5ff',
  },
  seeAllText: {
    fontSize: screenWidth * 0.035, // ~14px
    color: '#00C851',
    fontWeight: '600',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: screenHeight * 0.02, // ~16px
    paddingHorizontal: '1%',
  },
  card: {
    backgroundColor: '#71e67cff',
    borderRadius: screenWidth * 0.04, // ~16px
    width: '47%', 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
    minHeight: screenHeight * 0.28, 
    marginHorizontal: '1%',
  },
  imageContainer: {
    backgroundColor: '#faf6f6ff',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5', 
  },
  image: {
    width: '100%',
  height: '100%',
  resizeMode: 'contain',
  },

 
  productInfo: {
    padding: screenWidth * 0.03,
    flex: 1,
    justifyContent: 'space-between',
    height: '45%', 
  },
  name: {
    fontSize: screenWidth * 0.04, // ~16px
    fontWeight: '600',
    color: '#000000',
    marginBottom: screenHeight * 0.01,
    lineHeight: screenWidth * 0.045, 
    minHeight: screenHeight * 0.05, 
    flexShrink: 1,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingTop: screenHeight * 0.005,
  },
  price: {
    fontSize: screenWidth * 0.04, // ~16px
    fontWeight: 'bold',
    color: '#023717ff',
    marginBottom: screenHeight * 0.01, // ~8px
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  colorDot: {
    width: screenWidth * 0.04, // ~16px
    height: screenWidth * 0.04, // ~16px (carré)
    borderRadius: screenWidth * 0.02, // ~8px (cercle)
    marginRight: screenWidth * 0.015, // ~6px
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  moreColors: {
    fontSize: screenWidth * 0.03, // ~12px
    color: '#666666',
    marginLeft: screenWidth * 0.01, // ~4px
  },
  loadingContainer: {
    paddingVertical: screenHeight * 0.025, // ~20px
    alignItems: 'center',
  },
});