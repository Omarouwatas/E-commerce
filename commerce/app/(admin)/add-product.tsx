import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '../../constants';
const categoriesList = [
  "Phones", "Accessories", "Laptops", "Clothes", "Chargers", "Watches", "Covers", "Headphones"
];

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [colors, setColors] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [category, setCategory] = useState('');

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages(result.assets);
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || !brand) {
      Alert.alert('Erreur', 'Les champs nom, prix et vendeur sont requis.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('stock', stock || '0');
    formData.append('description', description);
    formData.append('brand', brand);
    formData.append('category', category);
    colors.split(',').forEach(color => {
      formData.append('colors', color.trim());
    });

    images.forEach((img, index) => {
      formData.append('images', {
        uri: img.uri,
        name: `photo${index}.jpg`,
        type: 'image/jpeg',
      } as any);
    });

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${BASE_URL}/api/products/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      Alert.alert('Succès', 'Produit ajouté avec succès.');
      setName(''); setPrice(''); setStock(''); setDescription('');
      setBrand(''); setColors(''); setImages([]);
    } catch (error) {
      console.log(error);
      Alert.alert('Erreur', 'Impossible d’ajouter le produit.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ajouter un Produit</Text>

      <TextInput style={styles.input} placeholder="Nom" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Prix" value={price} onChangeText={setPrice} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />
      <TextInput style={styles.input} placeholder="Marque" value={brand} onChangeText={setBrand} />
      <TextInput style={styles.input} placeholder="Couleurs (ex: #000,#f04)" value={colors} onChangeText={setColors} />
      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Catégorie</Text>
<View style={styles.chipContainer}>
  {categoriesList.map((cat, index) => (
    <TouchableOpacity
      key={index}
      onPress={() => setCategory(cat)}
      style={[
        styles.chip,
        category === cat && styles.chipSelected
      ]}
    >
      <Text style={[
        styles.chipText,
        category === cat && styles.chipTextSelected
      ]}>
        {cat}
      </Text>
    </TouchableOpacity>
  ))}
</View>

      <TouchableOpacity onPress={pickImages} style={styles.imagePicker}>
        <Text style={styles.imagePickerText}>📷 Choisir des images</Text>
      </TouchableOpacity>

      <ScrollView horizontal>
        {images.map((img, idx) => (
          <Image key={idx} source={{ uri: img.uri }} style={styles.previewImage} />
        ))}
      </ScrollView>

      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitText}>Ajouter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagePicker: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#333',
  },
  previewImage: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#aaa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  chipText: {
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
  
});
