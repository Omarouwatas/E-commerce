import pandas as pd
import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()
from datetime import datetime

start_date = datetime.strptime("2025-05-01", "%Y-%m-%d").date()
end_date = datetime.strptime("2025-08-31", "%Y-%m-%d").date()

# Liste des vrais IDs produit que tu as donnés
product_ids = [
    "687a36e5d9cc94be00fd0a03",  # AirPods Pro
    "687a3741d9cc94be00fd0a0b",  # Smart Watch
    "687a3741d9cc94be00fd0a07",  # Work Laptop
    "687a32dfd9cc94be00fd0a02"   # CloudStep Urban
]

# Prix de base par produit
base_prices = {
    "687a36e5d9cc94be00fd0a03": 249.99,
    "687a3741d9cc94be00fd0a0b": 199.99,
    "687a3741d9cc94be00fd0a07": 899.0,
    "687a32dfd9cc94be00fd0a02": 89.99
}

# Générer 600 lignes de données
data = []

for _ in range(600):
    product_id = random.choice(product_ids)
    base_price = base_prices[product_id]
    date_commande = fake.date_between(start_date=start_date, end_date=end_date)
    quantite = random.randint(1, 10)
    prix_unitaire = round(base_price * random.uniform(0.85, 1.1), 2)
    quantite_disponible = random.randint(5, 100)
    jour_semaine = date_commande.weekday()  # 0 = lundi, 6 = dimanche
    mois = date_commande.month
    promo = random.choice([0, 10, 20])
    
    data.append([
        product_id,
        quantite,
        prix_unitaire,
        quantite_disponible,
        jour_semaine,
        mois,
        promo,
        date_commande.strftime("%Y-%m-%d")
    ])
df = pd.DataFrame(data, columns=[
    "product_id",
    "quantite",
    "prix_unitaire",
    "quantite_disponible",
    "jour_semaine",
    "mois",
    "promo",
    "date_commande"
])

df.to_csv("ventes_synthetiques_600.csv", index=False)
print("Fichier ventes_synthetiques_600.csv généré avec succès.")
