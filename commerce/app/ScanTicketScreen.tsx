import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert,Button ,TouchableOpacity} from 'react-native';
import { Camera ,CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
export default function BarcodeScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  const handleBarCodeScanned = ({ type, data }: any) => {
    setScanned(true);
    Alert.alert("Code scanné", `Type: ${type} - Data: ${data}`);
  };
  if (hasPermission === null) return <Text>Demande de permission...</Text>;
  if (hasPermission === false) return <Text>Accès à la caméra refusé.</Text>;
  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <Button title={"Tap to Scan Again"} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
