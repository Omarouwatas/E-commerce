import numpy as np
import pandas as pd
import pickle
from tensorflow.keras.models import load_model
from datetime import datetime, timedelta

# === Chargement du modèle et des scalers ===
model = load_model("lstm_model.keras")
with open("scalers.pkl", "rb") as f:
    scalers = pickle.load(f)

product_scalers = scalers["product_scalers"]
global_scaler = scalers["global_scaler"]

# === Charger les données de ventes récentes ===
df = pd.read_csv("ventes_synthetiques_600.csv")
df = df.dropna(subset=["product_id"])
df["product_id"] = df["product_id"].astype(str)
df["date_commande"] = pd.to_datetime(df["date_commande"])
df = df.sort_values(by=["product_id", "date_commande"])

# === Générer les prédictions par produit ===
sequence_length = 7
predictions = []

for pid, scaler in product_scalers.items():
    product_df = df[df["product_id"] == pid]

    if len(product_df) < sequence_length:
        continue  # pas assez de données

    # Utiliser les 7 derniers jours
    last_sequence = product_df[["quantite", "prix_unitaire", "quantite_disponible", "jour_semaine", "mois", "promo"]].values[-sequence_length:]
    last_scaled = scaler.transform(last_sequence)
    X_pred = np.array([last_scaled])  # shape: (1, 7, 6)

    y_scaled_pred = model.predict(X_pred, verbose=0)
    y_pred = global_scaler.inverse_transform(y_scaled_pred)[0][0]  # quantité prédite

    predictions.append({
        "product_id": pid,
        "date_prediction": (product_df["date_commande"].max() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "quantite_predite": round(y_pred, 2)
    })

# === Sauvegarder les prédictions dans un CSV ===
pred_df = pd.DataFrame(predictions)
pred_df.to_csv("predictions_semaine_suivante.csv", index=False)

print("Prédictions générées avec succès et sauvegardées dans 'predictions_semaine_suivante.csv'")
