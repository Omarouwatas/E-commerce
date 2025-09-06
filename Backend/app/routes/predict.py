from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
import tensorflow as tf
import pickle
from datetime import datetime, timedelta
import requests
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

predict_bp = Blueprint("predict_bp", __name__)

@predict_bp.route("/predict", methods=["GET"])
def predict_sales():
    try:
        # Charger modèle et scalers
        model = tf.keras.models.load_model("models/lstm_model1.keras")
        with open("models/scalers.pkl", "rb") as f:
            scalers = pickle.load(f)

        product_scalers = scalers["product_scalers"]
        global_scaler = scalers["global_scaler"]

        sequence_length = 7
        days = request.args.get('days', 7, type=int)
        start_date = datetime.today().date() + timedelta(days=1)
        dates_to_predict = [start_date + timedelta(days=i) for i in range(days)]

        df = pd.read_csv("../ventes_synthetiques_600.csv")
        df["date_commande"] = pd.to_datetime(df["date_commande"])
        df = df.sort_values(by="date_commande")

        predictions_results = []

        for pid, product_df in df.groupby("product_id"):
            if pid not in product_scalers:
                continue

            scaler = product_scalers[pid]
            product_df = product_df.sort_values("date_commande")

            if len(product_df) < sequence_length:
                continue

            last_seq = product_df[["quantite", "prix_unitaire", "quantite_disponible",
                                   "jour_semaine", "mois", "promo"]].values[-sequence_length:]
            last_seq = scaler.transform(last_seq)

            for date in dates_to_predict:
                jour_semaine = date.weekday()
                mois = date.month
                promo = np.random.choice([0, 10, 20])
                prix_unitaire = product_df["prix_unitaire"].iloc[-1]
                quantite_disponible = product_df["quantite_disponible"].iloc[-1]

                next_input = np.array([[0, prix_unitaire, quantite_disponible, jour_semaine, mois, promo]])
                next_input_scaled = scaler.transform(next_input)
                seq_input = np.vstack([last_seq[1:], next_input_scaled])
                X = np.expand_dims(seq_input, axis=0)

                y_pred = model.predict(X, verbose=0)[0][0]
                y_pred_inverse = global_scaler.inverse_transform([[y_pred]])[0][0]

                predictions_results.append({
                    "product_id": pid,
                    "date_prediction": date.strftime("%Y-%m-%d"),
                    "quantite_predite": round(float(y_pred_inverse), 2)
                })

                last_seq = np.vstack([last_seq[1:], next_input_scaled])

        return jsonify({
            "success": True,
            "count": len(predictions_results),
            "predictions": predictions_results
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



from flask import Blueprint, jsonify, request
from groq import Groq
import os


client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

@predict_bp.route("/predict-comment", methods=["POST"])
def predict_comment():
    try:
        data = request.json
        predictions = data.get("predictions", [])

        if not predictions:
            return jsonify({"msg": "Aucune prédiction fournie"}), 400

        prompt = f"""
        Voici des prédictions de ventes quotidiennes : {predictions}.
        Analyse les tendances (hausse ou baisse), propose une explication possible
        et recommande une stratégie de promotion pour optimiser les ventes.n'inclut pas
        de tableau dans ta réponse, juste un texte explicatif clair et concis.
        """

        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="openai/gpt-oss-20b",  
            stream=False,
        )

        commentaire = chat_completion.choices[0].message.content

        return jsonify({"commentaire": commentaire}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

