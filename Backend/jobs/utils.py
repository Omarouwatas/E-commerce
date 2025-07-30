from pymongo import MongoClient
import pandas as pd
import numpy as np
from datetime import datetime
import pytz

def extract_sequences_from_mongo(window_size=3):
    client = MongoClient("mongodb://localhost:27017")  # 🔁 Adapter si besoin
    db = client["nom_de_ta_base"]  # 🔁 à remplacer
    commandes = db["commandes"]
    inventaire = db["inventaire"]

    # Extraction des commandes
    orders = list(commandes.find())
    enriched_data = []

    for order in orders:
        date = order["date_commande"]
        if isinstance(date, dict) and "$date" in date:
            date = datetime.fromisoformat(date["$date"].replace("Z", "+00:00"))
        date = date.astimezone(pytz.utc)

        gouvernorat = order["adresse_livraison"]["gouvernorat"]
        ville = order["adresse_livraison"]["ville"]
        jour_semaine = date.weekday()
        mois = date.month
        mode_paiement = order["mode_paiement"]
        nb_produits_dans_commande = sum(p["quantite"] for p in order["produits"])

        for produit in order["produits"]:
            enriched_data.append({
                "product_id": produit["product_id"],
                "nom_produit": produit["nom"],
                "date_commande": date.date(),
                "jour_semaine": jour_semaine,
                "mois": mois,
                "ville": ville,
                "gouvernorat": gouvernorat,
                "mode_paiement": mode_paiement,
                "nb_produits_dans_commande": nb_produits_dans_commande,
                "quantite": produit["quantite"],
                "prix_unitaire": produit["prix"],
                "revenu": produit["quantite"] * produit["prix"]
            })

    df = pd.DataFrame(enriched_data)
    if df.empty:
        return np.array([]), np.array([])

    grouped = df.groupby([
        "product_id", "nom_produit", "date_commande", "jour_semaine", "mois",
        "ville", "gouvernorat", "mode_paiement"
    ]).agg({
        "quantite": "sum",
        "revenu": "sum",
        "nb_produits_dans_commande": "mean",
        "prix_unitaire": "mean"
    }).reset_index()

    # Extraction du stock
    inventory_data = []
    for inv in inventaire.find():
        date_ajout = inv["date_ajout"]
        if isinstance(date_ajout, dict) and "$date" in date_ajout:
            date_ajout = datetime.fromisoformat(date_ajout["$date"].replace("Z", "+00:00"))
        inventory_data.append({
            "product_id": inv["product_id"],
            "emplacement": inv["emplacement"],
            "date_ajout": date_ajout.date(),
            "quantite_disponible": inv["quantite_disponible"]
        })

    inv_df = pd.DataFrame(inventory_data)
    merged = pd.merge(
        grouped,
        inv_df,
        how="left",
        left_on=["product_id", "gouvernorat", "date_commande"],
        right_on=["product_id", "emplacement", "date_ajout"]
    )
    merged["quantite_disponible"] = merged["quantite_disponible"].fillna(0)
    merged.drop(columns=["emplacement", "date_ajout"], inplace=True)

    # Préparation LSTM
    top_product = merged.groupby("nom_produit")["quantite"].sum().idxmax()
    product_df = merged[merged["nom_produit"] == top_product].sort_values("date_commande")

    features = ["quantite_disponible", "prix_unitaire", "jour_semaine", "mois", "quantite"]
    min_vals = product_df[features].min()
    max_vals = product_df[features].max()
    normalized = (product_df[features] - min_vals) / (max_vals - min_vals + 1e-6)

    X, y = [], []
    for i in range(len(normalized) - window_size):
        X.append(normalized.iloc[i:i+window_size].values)
        y.append(normalized.iloc[i+window_size]["quantite"])

    return np.array(X), np.array(y)
