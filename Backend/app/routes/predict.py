import os
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import mongo
from tensorflow.keras.models import load_model
from bson import ObjectId
import pandas as pd
from datetime import datetime
import numpy as np
predict_bp = Blueprint("predict_bp", __name__)
@predict_bp.route("/predict", methods=["GET"])
@jwt_required()
def predict_par_gouvernorat():
    try:


        current_user_id = get_jwt_identity()
        current_user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})

        if not current_user or current_user.get("role") != "ADMIN":
            return jsonify({"msg": "Non autorisé"}), 403

        admin_gouvernorat = current_user.get("gouvernorat")

        commandes = list(mongo.db.commandes.find({
            "adresse_livraison.gouvernorat": admin_gouvernorat
        }))
        inventaire = list(mongo.db.inventaires.find({
            "emplacement": admin_gouvernorat
        }))



        if not commandes:
            return jsonify([])

        data = []
        for cmd in commandes:
            date = cmd["date_commande"]
            gouvernorat = cmd["adresse_livraison"]["gouvernorat"]
            ville = cmd["adresse_livraison"]["ville"]
            jour_semaine = date.weekday()
            mois = date.month
            mode_paiement = cmd.get("mode_paiement", "cod")
            nb_total = sum(p["quantite"] for p in cmd["produits"])

            for produit in cmd["produits"]:
                data.append({
                    "product_id": produit["product_id"],
                    "nom_produit": produit["nom"],
                    "date_commande": date.date(),
                    "jour_semaine": jour_semaine,
                    "mois": mois,
                    "ville": ville,
                    "gouvernorat": gouvernorat,
                    "mode_paiement": mode_paiement,
                    "nb_produits_dans_commande": nb_total,
                    "quantite": produit["quantite"],
                    "prix_unitaire": produit["prix"],
                    "revenu": produit["prix"] * produit["quantite"]
                })

        df = pd.DataFrame(data)
        df_grouped = df.groupby([
            "product_id", "nom_produit", "date_commande", "jour_semaine", "mois",
            "ville", "gouvernorat", "mode_paiement"
        ]).agg({
            "quantite": "sum",
            "revenu": "sum",
            "nb_produits_dans_commande": "mean",
            "prix_unitaire": "mean"
        }).reset_index()

        stock_data = pd.DataFrame([
            {
                "product_id": inv["product_id"],
                "emplacement": inv["emplacement"],
                "date_ajout": inv["date_ajout"].date() if isinstance(inv["date_ajout"], datetime) else inv["date_ajout"],
                "quantite_disponible": inv["quantite_disponible"]
            }
            for inv in inventaire
        ])

        merged = pd.merge(
            df_grouped,
            stock_data,
            how="left",
            left_on=["product_id", "gouvernorat", "date_commande"],
            right_on=["product_id", "emplacement", "date_ajout"]
        )
        merged["quantite_disponible"] = merged["quantite_disponible"].fillna(0)
        merged.drop(columns=["emplacement", "date_ajout"], inplace=True)

        # Prédictions produit par produit
        predictions = []
        for produit in merged["nom_produit"].unique():
            prod_df = merged[merged["nom_produit"] == produit].sort_values("date_commande")
            if len(prod_df) < 4:
                continue

            features = ["quantite_disponible", "prix_unitaire", "jour_semaine", "mois", "quantite"]
            min_vals = prod_df[features].min()
            max_vals = prod_df[features].max()
            norm = (prod_df[features] - min_vals) / (max_vals - min_vals + 1e-6)

            if len(norm) < 4:
                continue

            last_seq = norm.iloc[-3:].values.reshape(1, 3, len(features))

            try:
                model = load_model("models/lstm_model.h5")
                y_pred = model.predict(last_seq)
                predictions.append({
                    "produit": produit,
                    "prediction": round(float(y_pred[0][0]), 2)
                })
            except Exception:
                continue

        return jsonify(predictions), 200

    except Exception as err:
        return jsonify({"error": str(err)}), 500
