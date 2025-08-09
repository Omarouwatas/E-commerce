from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import mongo
from tensorflow.keras.models import load_model
from bson import ObjectId
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import pickle

predict_bp = Blueprint("predict_bp", __name__)

@predict_bp.route("/predict", methods=["GET"])
@jwt_required()
def predict_par_gouvernorat():
    try:
        current_user_id = get_jwt_identity()
        current_user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
        if not current_user or current_user.get("role") != "ADMIN":
            return jsonify({"msg": "Non autorisé"}), 403

        gouvernorat = current_user.get("gouvernorat")
        model = load_model("models/lstm_model.h5")
        with open("models/scalers.pkl", "rb") as f:
            scaler = pickle.load(f)

        commandes = list(mongo.db.commandes.find({
            "adresse_livraison.gouvernorat": gouvernorat,
            "date_commande": {"$gte": datetime.utcnow() - timedelta(days=7)}
        }))

        if not commandes:
            return jsonify({"msg": "Aucune commande trouvée"}), 404

        data = []
        for cmd in commandes:
            date = cmd["date_commande"]
            jour_semaine = date.weekday()
            mois = date.month
            for produit in cmd["produits"]:
                data.append({
                    "product_id": produit["product_id"],
                    "nom_produit": produit["nom"],
                    "date_commande": date.date(),
                    "jour_semaine": jour_semaine,
                    "mois": mois,
                    "quantite": produit["quantite"],
                    "prix_unitaire": produit["prix"],
                })

        df = pd.DataFrame(data)
        predictions = []
        date_execution = datetime.utcnow()
        next_7_days = [(date_execution + timedelta(days=i)).date() for i in range(1, 8)]

        for pid in df["product_id"].unique():
            prod_df = df[df["product_id"] == pid].sort_values("date_commande")
            if len(prod_df) < 7:
                continue

            prod_df["quantite_disponible"] = 100  # valeur fictive/stable
            features = ["quantite_disponible", "prix_unitaire", "jour_semaine", "mois", "quantite"]
            X = prod_df[features].values
            X_scaled = scaler.transform(X)

            last_seq = X_scaled[-3:].reshape(1, 3, len(features))
            y_pred = model.predict(last_seq)[0][0]

            for i, date_pred in enumerate(next_7_days):
                prediction_doc = {
                    "product_id": pid,
                    "nom_produit": prod_df["nom_produit"].iloc[0],
                    "date_prediction": date_pred.isoformat(),
                    "quantite_predite": round(float(y_pred), 2),
                    "gouvernorat": gouvernorat,
                    "date_execution": date_execution
                }
                predictions.append(prediction_doc)
                mongo.db.previsions.insert_one(prediction_doc)

        return jsonify(predictions), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
