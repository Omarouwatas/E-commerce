import numpy as np
from tensorflow.keras.models import load_model
import pandas as pd

model = load_model("lstm_model.h5")
X = np.load("X_lstm.npy")  # Dernières séquences
y_true = np.load("y_lstm.npy")  # Pour comparaison (facultatif)

# Faire les prédictions
y_pred = model.predict(X)

for i in range(len(y_pred)):
    print(f"👉 Séquence {i+1} :")
    print(f"   🔹 Prédit : {y_pred[i][0]:.3f}")
    if i < len(y_true):
        print(f"   🔸 Réel   : {y_true[i]:.3f}")
df_results = pd.DataFrame({
    "quantite_predite": y_pred.flatten(),
    "quantite_reelle": y_true[:len(y_pred)] if len(y_true) == len(y_pred) else None
})
df_results.to_csv("resultats_predictions.csv", index=False)
print("✅ Résultats enregistrés dans resultats_predictions.csv")
