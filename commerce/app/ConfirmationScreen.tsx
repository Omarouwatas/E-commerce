import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
export default function ReceiptScreen() {
  const { commande } = useLocalSearchParams();
  const order = commande ? JSON.parse(decodeURIComponent(commande)) : null;
  const router = useRouter();
  const generatePdf = async () => {
    if (!order) return;
    const htmlContent = `
      <html>
        <body>
          <h1>🧾 Reçu de commande</h1>
          <p><strong>Commande ID:</strong> ${order._id}</p>
          <p><strong>Client:</strong> ${order.adresse_livraison.nom}</p>
          <p><strong>Adresse:</strong> ${order.adresse_livraison.rue}, ${order.adresse_livraison.ville} ${order.adresse_livraison.code_postal}, ${order.adresse_livraison.gouvernorat}</p>
          <p><strong>Méthode de paiement:</strong> ${order.mode_paiement === 'cod' ? 'Paiement à la livraison' : 'Carte Bancaire'}</p>
          <h3>Produits:</h3>
          <ul>
            ${order.produits.map(p => `<li>${p.nom} x ${p.quantite} — ${p.prix} €</li>`).join('')}
          </ul>
          <p><strong>Total TTC:</strong> ${order.total} €</p>
          <p><i>Date:</i> ${new Date(order.date_commande).toLocaleString()}</p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Partager le reçu',
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      console.error("Erreur génération PDF", err);
      Alert.alert("Erreur", "Impossible de générer le reçu PDF.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🧾 Reçu de commande</Text>

      {order ? (
        <>
          <Text style={styles.label}>Commande ID :</Text>
          <Text style={styles.value}>{order._id}</Text>

          <Text style={styles.label}>Client :</Text>
          <Text style={styles.value}>{order.adresse_livraison.nom}</Text>

          <Text style={styles.label}>Adresse :</Text>
          <Text style={styles.value}>
            {order.adresse_livraison.rue}, {order.adresse_livraison.ville} {order.adresse_livraison.code_postal}, {order.adresse_livraison.gouvernorat}
          </Text>

          <Text style={styles.label}>Méthode de paiement :</Text>
          <Text style={styles.value}>{order.mode_paiement === 'cod' ? 'Paiement à la livraison' : 'Carte Bancaire'}</Text>

          <Text style={styles.label}>Produits :</Text>
          {order.produits.map((p, idx) => (
            <Text key={idx}>• {p.nom} x {p.quantite} — {p.prix} €</Text>
          ))}

          <Text style={styles.total}>Total TTC : {order.total} €</Text>
          <Text style={styles.date}>Date : {new Date(order.date_commande).toLocaleString()}</Text>

          <TouchableOpacity style={styles.button} onPress={generatePdf}>
            <Text style={styles.buttonText}>📄 Télécharger le reçu (PDF)</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.button} onPress={() => router.push('/(tabs)/home')}>Retour</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text>Aucune commande à afficher.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontWeight: 'bold', marginTop: 10 },
  value: { marginBottom: 8 },
  total: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  date: { fontStyle: 'italic', marginTop: 10 },
  button: {
    marginTop: 30,
    backgroundColor: '#00c853',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
