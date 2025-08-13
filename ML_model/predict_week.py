import pandas as pd
import numpy as np
import pickle
import tensorflow as tf
from datetime import datetime, timedelta

model = tf.keras.models.load_model("lstm_model.keras")
with open("scalers.pkl", "rb") as f:
    scalers = pickle.load(f)

product_scalers = scalers["product_scalers"]
global_scaler = scalers["global_scaler"]

# Paramètres
sequence_length = 7
start_date = datetime.today().date() + timedelta(days=1)
dates_to_predict = [start_date + timedelta(days=i) for i in range(7)]

# Charger les anciennes ventes
df = pd.read_csv("ventes_synthetiques_600.csv")
df["date_commande"] = pd.to_datetime(df["date_commande"])
df = df.sort_values(by="date_commande")

results = []

for pid, product_df in df.groupby("product_id"):
    if pid not in product_scalers:
        print(f"Pas de scaler pour produit {pid}")
        continue

    scaler = product_scalers[pid]
    product_df = product_df.sort_values("date_commande")

    if len(product_df) < sequence_length:
        print(f"Pas assez d'historique pour {pid}")
        continue

    # Prendre les 7 derniers jours
    last_seq = product_df[["quantite", "prix_unitaire", "quantite_disponible", "jour_semaine", "mois", "promo"]].values[-sequence_length:]
    last_seq = scaler.transform(last_seq)

    for i, date in enumerate(dates_to_predict):
        jour_semaine = date.weekday()
        mois = date.month
        promo = np.random.choice([0, 10, 20])  

        # Dummy valeurs (tu peux améliorer ici)
        prix_unitaire = product_df["prix_unitaire"].iloc[-1]
        quantite_disponible = product_df["quantite_disponible"].iloc[-1]

        next_input = np.array([[0, prix_unitaire, quantite_disponible, jour_semaine, mois, promo]])
        next_input_scaled = scaler.transform(next_input)

        # Créer la nouvelle séquence
        seq_input = np.vstack([last_seq[1:], next_input_scaled])
        X = np.expand_dims(seq_input, axis=0)

        y_pred = model.predict(X, verbose=0)[0][0]
        y_pred_inverse = global_scaler.inverse_transform([[y_pred]])[0][0]

        results.append({
            "product_id": pid,
            "date_prediction": date.strftime("%Y-%m-%d"),
            "quantite_predite": round(float(y_pred_inverse), 2)
        })

        last_seq = np.vstack([last_seq[1:], next_input_scaled])  # mise à jour

# Exporter
df_result = pd.DataFrame(results)
df_result.to_csv("predictions_semaine_complete.csv", index=False)
print("Prédictions générées sur 7 jours et sauvegardées dans 'predictions_semaine_complete.csv'")
