import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants';

export default function ScanScreen() {
  const { order_id } = useLocalSearchParams();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    const getPermission = async () => {
      const { status } = await Camera.getCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getPermission();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanning || scannedCodes.includes(data)) {
      Alert.alert(scannedCodes.includes(data) ? 'Produit déjà scanné' : 'Veuillez patienter...');
      return;
    }

    setScanning(true);
    setScannedCodes(prev => [...prev, data]);

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${BASE_URL}/api/delivery/scan-product`, {
        order_id,
        barcode: data
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Produit scanné avec succès');
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur lors de l'enregistrement du produit");
    }

    setTimeout(() => setScanning(false), 1500);
  };

  if (hasPermission === null) return <Text>Demande de permission caméra en cours...</Text>;
  if (hasPermission === false) return <Text>Permission caméra refusée</Text>;

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        type={Camera.Constants.Type.back}
        onBarCodeScanned={handleBarCodeScanned}
        barCodeScannerSettings={{ barCodeTypes: ["qr", "ean13", "code128"] }}
      />
      <View style={styles.overlay}>
        <Text style={styles.text}>Scannez un produit</Text>
        <Text style={styles.textSmall}>Produits scannés : {scannedCodes.length}</Text>
        <Button title="Retour" onPress={() => router.back()} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 6
  },
  textSmall: {
    color: '#fff',
    marginBottom: 10
  }
});
