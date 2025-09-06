import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { BASE_URL } from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Backbutton from "@/components/BackButton";
import BackButton from "@/components/BackButton";

type Adresse = {
  nom: string;
  rue: string;
  ville: string;
  code_postal: string;
  gouvernorat: string;
  telephone: string;
  label: string;
};

type UserMe = {
  _id: string;
  email: string;
  nom: string;
  role?: string;
  telephone?: string;
  adresses?: Adresse[];
};

export default function InfoScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const loadMe = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }
      const res = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data as UserMe;
      if (!Array.isArray(data.adresses)) data.adresses = [];
      if (data.telephone === undefined || data.telephone === null) data.telephone = "";

      setUser(data);
    } catch (e) {
      console.error("GET /api/auth/me error:", e);
      Alert.alert("Erreur", "Impossible de charger vos informations.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const onChangeField = (key: keyof UserMe, value: any) => {
    if (!user) return;
    setUser({ ...user, [key]: value });
  };

  const onChangeAdresse = (index: number, key: keyof Adresse, value: string) => {
    if (!user) return;
    const arr = Array.isArray(user.adresses) ? [...user.adresses] : [];
    arr[index] = { ...arr[index], [key]: value };
    setUser({ ...user, adresses: arr });
  };

  const addAdresse = () => {
    if (!user) return;
    const arr = Array.isArray(user.adresses) ? [...user.adresses] : [];
    arr.push({
      nom: "",
      rue: "",
      ville: "",
      code_postal: "",
      gouvernorat: "",
      telephone: "",
      label: "Maison",
    });
    setUser({ ...user, adresses: arr });
  };

  const removeAdresse = (index: number) => {
    if (!user) return;
    const arr = Array.isArray(user.adresses) ? [...user.adresses] : [];
    arr.splice(index, 1);
    setUser({ ...user, adresses: arr });
  };

  const handleSave = async () => {


    try {
      const token = await AsyncStorage.getItem("token");
      await axios.put(`${BASE_URL}/api/auth/me`, {
        nom: user?.nom,
        telephone: user?.telephone,
        adresses: user?.adresses ?? [],
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Succès", "Informations mises à jour.");
      setEditing(false);
      await loadMe();
    } catch (e) {
      console.error("PUT /api/auth/me error:", e);
      Alert.alert("Erreur", "Sauvegarde impossible.");
    }
  
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <BackButton label="Profil" />

        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Mes informations</Text>
            <Text style={styles.headerSubtitle}>Profil & adresses</Text>
          </View>

          <TouchableOpacity
            onPress={() => setEditing((e) => !e)}
            style={[styles.editBtn, editing ? styles.editBtnActive : undefined]}
          >
            <Text style={[styles.editBtnText, editing ? styles.editBtnTextActive : undefined]}>
              {editing ? "Annuler" : "Éditer"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Carte Identité */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identité</Text>

          <LabeledInput
            label="Nom"
            value={user.nom}
            editable={editing}
            onChangeText={(t) => onChangeField("nom", t)}
          />

          <LabeledInput
            label="Email"
            value={user.email}
            editable={false}
          />

          <LabeledInput
            label="Téléphone"
            value={user.telephone ?? ""}
            editable={editing}
            keyboardType="phone-pad"
            onChangeText={(t) => onChangeField("telephone", t)}
          />
        </View>

        {/* Carte Adresses */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Adresses</Text>

          {(!user.adresses || user.adresses.length === 0) && (
            <Text style={styles.muted}>Aucune adresse enregistrée.</Text>
          )}

          {user.adresses?.map((addr, idx) => (
            <View key={idx} style={styles.addressBlock}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressTitle}>{addr.label || "Adresse"}</Text>
                {editing && (
                  <TouchableOpacity onPress={() => removeAdresse(idx)}>
                    <Text style={styles.deleteLink}>Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>

              <LabeledInput
                label="Nom"
                value={addr.nom}
                editable={editing}
                onChangeText={(t) => onChangeAdresse(idx, "nom", t)}
              />
              <LabeledInput
                label="Rue"
                value={addr.rue}
                editable={editing}
                onChangeText={(t) => onChangeAdresse(idx, "rue", t)}
              />
              <LabeledInput
                label="Ville"
                value={addr.ville}
                editable={editing}
                onChangeText={(t) => onChangeAdresse(idx, "ville", t)}
              />
              <LabeledInput
                label="Code postal"
                value={addr.code_postal}
                editable={editing}
                onChangeText={(t) => onChangeAdresse(idx, "code_postal", t)}
                keyboardType="number-pad"
              />
              <LabeledInput
                label="Gouvernorat"
                value={addr.gouvernorat}
                editable={editing}
                onChangeText={(t) => onChangeAdresse(idx, "gouvernorat", t)}
              />
              <LabeledInput
                label="Téléphone"
                value={addr.telephone}
                editable={editing}
                onChangeText={(t) => onChangeAdresse(idx, "telephone", t)}
                keyboardType="phone-pad"
              />
              <LabeledInput
                label="Label"
                value={addr.label}
                editable={editing}
                onChangeText={(t) => onChangeAdresse(idx, "label", t)}
                placeholder="Maison / Appartement…"
              />
            </View>
          ))}

          {editing && (
            <TouchableOpacity style={styles.addBtn} onPress={addAdresse}>
              <Text style={styles.addBtnText}>+ Ajouter une adresse</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action */}
        <TouchableOpacity
          style={[styles.saveBtn, !editing && { opacity: 0.5 }]}
          disabled={!editing}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Sauvegarder</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Petit composant label + input */
function LabeledInput({
  label,
  value,
  editable,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "phone-pad" | "email-address";
}) {
  return (

    <View style={{ marginBottom: 12 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value ?? ""}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor="#9aa1a9"
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f9fb" },
  scroll: { padding: 16, paddingBottom: 32 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f2ea",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1b4332" },
  headerSubtitle: { marginTop: 4, color: "#2d6a4f" },

  editBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2d6a4f",
    marginLeft: 12,
  },
  editBtnActive: { backgroundColor: "#2d6a4f" },
  editBtnText: { color: "#2d6a4f", fontWeight: "700" },
  editBtnTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, color: "#0b3d2e" },

  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, color: "#5b6b79" },
  input: {
    borderWidth: 1,
    borderColor: "#dde3ea",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  inputDisabled: { backgroundColor: "#f2f4f6", color: "#6b7280" },

  muted: { color: "#6b7280", marginTop: 4 },

  addressBlock: {
    borderWidth: 1,
    borderColor: "#eef2f5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fcfdfd",
  },
  addressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  addressTitle: { fontWeight: "700", color: "#0b3d2e" },
  deleteLink: { color: "#b00020", fontWeight: "700" },

  addBtn: {
    borderWidth: 1,
    borderColor: "#2d6a4f",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  addBtnText: { color: "#2d6a4f", fontWeight: "700" },

  saveBtn: {
    backgroundColor: "#2d6a4f",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
