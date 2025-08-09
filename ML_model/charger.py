import pandas as pd
import numpy as np
import json
from datetime import datetime
import os
print("Contenu du dossier courant :")
print(os.listdir("."))



with open("ML_model/data.json", "r", encoding="utf-8") as f:
    commandes = json.load(f)

data = []
for cmd in commandes:
    date = cmd["date_commande"]["$date"]
    date = datetime.fromisoformat(date.replace("Z", "+00:00"))

    gouvernorat = cmd["adresse_livraison"]["gouvernorat"]
    ville = cmd["adresse_livraison"]["ville"]
    jour_semaine = date.weekday()
    mois = date.month

    nb_total = sum(p["quantite"] for p in cmd["produits"])

    for produit in cmd["produits"]:
        data.append({
            "date_commande": date.date(),
            "jour_semaine": jour_semaine,
            "mois": mois,
            "gouvernorat": gouvernorat,
            "ville": ville,
            "product_id": produit["product_id"],
            "nom_produit": produit["nom"],
            "quantite": produit["quantite"],
            "prix_unitaire": produit["prix"],
            "nb_produits_dans_commande": nb_total
        })

df = pd.DataFrame(data)

# -------------------------------
# 2. Grouper par produit et date
# -------------------------------
df_grouped = df.groupby([
    "product_id", "nom_produit", "date_commande", "jour_semaine", "mois", "ville", "gouvernorat"
]).agg({
    "quantite": "sum",
    "prix_unitaire": "mean",
    "nb_produits_dans_commande": "mean"
}).reset_index()

# -------------------------------
# 3. Créer séquences LSTM
# -------------------------------
window_size = 3
features = ["quantite", "prix_unitaire", "jour_semaine", "mois"]
X_list, y_list = [], []

# Créer une séquence par produit
for product_name in df_grouped["nom_produit"].unique():
    prod_df = df_grouped[df_grouped["nom_produit"] == product_name].sort_values("date_commande")
    if len(prod_df) < window_size + 1:
        continue

    # Normalisation min-max
    min_vals = prod_df[features].min()
    max_vals = prod_df[features].max()
    norm = (prod_df[features] - min_vals) / (max_vals - min_vals + 1e-6)

    for i in range(len(norm) - window_size):
        X_list.append(norm.iloc[i:i+window_size].values)
        y_list.append(norm.iloc[i+window_size]["quantite"])

X = np.array(X_list)
y = np.array(y_list)

# -------------------------------
# 4. Sauvegarder pour entraînement LSTM
# -------------------------------
np.save("X_lstm.npy", X)
np.save("y_lstm.npy", y)

print(f" Séquences générées : X.shape = {X.shape}, y.shape = {y.shape}")
print("Fichiers sauvegardés : X_lstm.npy et y_lstm.npy")
