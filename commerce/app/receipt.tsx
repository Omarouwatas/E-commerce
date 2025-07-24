import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';

export default function ReceiptScreen() {
  const { commande } = useLocalSearchParams();
  const order = commande ? JSON.parse(decodeURIComponent(commande)) : null;

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
});
