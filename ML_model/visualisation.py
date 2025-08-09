import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("predictions_semaine_complete.csv")
for pid in df['product_id'].unique():
    produit_df = df[df['product_id'] == pid]
    plt.plot(produit_df['date_prediction'], produit_df['quantite_predite'], label=pid)

plt.xlabel("Date")
plt.ylabel("Quantité prédite")
plt.title("Prévision des ventes par produit (LSTM)")
plt.legend()
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
