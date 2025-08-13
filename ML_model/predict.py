from flask import Flask, jsonify, request
import pandas as pd
import numpy as np
import pickle
import tensorflow as tf
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# Variables globales pour le modèle et les scalers
model = None
scalers = None
product_scalers = None
global_scaler = None

def load_model_and_scalers():
    """Charger le modèle et les scalers au démarrage"""
    global model, scalers, product_scalers, global_scaler
    
    try:
        model = tf.keras.models.load_model("lstm_model.keras")
        with open("scalers.pkl", "rb") as f:
            scalers = pickle.load(f)
        
        product_scalers = scalers["product_scalers"]
        global_scaler = scalers["global_scaler"]
        print("Modèle et scalers chargés avec succès")
        return True
    except Exception as e:
        print(f"Erreur lors du chargement: {e}")
        return False

def generate_predictions(product_id=None, days=7):
    """Générer les prédictions pour un ou tous les produits"""
    sequence_length = 7
    start_date = datetime.today().date() + timedelta(days=1)
    dates_to_predict = [start_date + timedelta(days=i) for i in range(days)]
    
    # Charger les données historiques
    if not os.path.exists("ventes_synthetiques_600.csv"):
        return {"error": "Fichier de données historiques non trouvé"}
    
    df = pd.read_csv("ventes_synthetiques_600.csv")
    df["date_commande"] = pd.to_datetime(df["date_commande"])
    df = df.sort_values(by="date_commande")
    
    results = []
    
    # Filtrer par product_id si spécifié
    if product_id:
        df = df[df["product_id"] == product_id]
        if df.empty:
            return {"error": f"Produit {product_id} non trouvé"}
    
    for pid, product_df in df.groupby("product_id"):
        if pid not in product_scalers:
            continue
            
        scaler = product_scalers[pid]
        product_df = product_df.sort_values("date_commande")
        
        if len(product_df) < sequence_length:
            continue
        
        # Prendre les 7 derniers jours
        last_seq = product_df[["quantite", "prix_unitaire", "quantite_disponible", 
                              "jour_semaine", "mois", "promo"]].values[-sequence_length:]
        last_seq = scaler.transform(last_seq)
        
        for i, date in enumerate(dates_to_predict):
            jour_semaine = date.weekday()
            mois = date.month
            promo = np.random.choice([0, 10, 20])
            
            # Utiliser les dernières valeurs connues
            prix_unitaire = product_df["prix_unitaire"].iloc[-1]
            quantite_disponible = product_df["quantite_disponible"].iloc[-1]
            
            next_input = np.array([[0, prix_unitaire, quantite_disponible, 
                                  jour_semaine, mois, promo]])
            next_input_scaled = scaler.transform(next_input)
            
            # Créer la nouvelle séquence
            seq_input = np.vstack([last_seq[1:], next_input_scaled])
            X = np.expand_dims(seq_input, axis=0)
            
            y_pred = model.predict(X, verbose=0)[0][0]
            y_pred_inverse = global_scaler.inverse_transform([[y_pred]])[0][0]
            
            results.append({
                "product_id": str(pid),
                "date_prediction": date.strftime("%Y-%m-%d"),
                "quantite_predite": round(float(y_pred_inverse), 2)
            })
            
            # Mettre à jour la séquence
            last_seq = np.vstack([last_seq[1:], next_input_scaled])
    
    return results

@app.route('/health', methods=['GET'])
def health_check():
    """Vérifier l'état de l'API"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "scalers_loaded": scalers is not None
    })

@app.route('/predictions', methods=['GET'])
def get_all_predictions():
    """Obtenir toutes les prédictions pour tous les produits"""
    try:
        days = request.args.get('days', 7, type=int)
        if days < 1 or days > 30:
            return jsonify({"error": "Le nombre de jours doit être entre 1 et 30"}), 400
            
        predictions = generate_predictions(days=days)
        
        if isinstance(predictions, dict) and "error" in predictions:
            return jsonify(predictions), 404
            
        return jsonify({
            "success": True,
            "count": len(predictions),
            "predictions": predictions
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predictions/<product_id>', methods=['GET'])
def get_product_predictions(product_id):
    """Obtenir les prédictions pour un produit spécifique"""
    try:
        days = request.args.get('days', 7, type=int)
        if days < 1 or days > 30:
            return jsonify({"error": "Le nombre de jours doit être entre 1 et 30"}), 400
            
        predictions = generate_predictions(product_id=product_id, days=days)
        
        if isinstance(predictions, dict) and "error" in predictions:
            return jsonify(predictions), 404
            
        return jsonify({
            "success": True,
            "product_id": product_id,
            "count": len(predictions),
            "predictions": predictions
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predictions/summary', methods=['GET'])
def get_predictions_summary():
    """Obtenir un résumé des prédictions par produit"""
    try:
        days = request.args.get('days', 7, type=int)
        predictions = generate_predictions(days=days)
        
        if isinstance(predictions, dict) and "error" in predictions:
            return jsonify(predictions), 404
            
        # Créer un résumé par produit
        df = pd.DataFrame(predictions)
        summary = df.groupby('product_id').agg({
            'quantite_predite': ['sum', 'mean', 'min', 'max']
        }).round(2)
        
        summary.columns = ['total_predicted', 'average_predicted', 'min_predicted', 'max_predicted']
        summary = summary.reset_index()
        
        return jsonify({
            "success": True,
            "period_days": days,
            "summary": summary.to_dict('records')
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/products', methods=['GET'])
def get_available_products():
    try:
        if not os.path.exists("ventes_synthetiques_600.csv"):
            return jsonify({"error": "Fichier de données non trouvé"}), 404
            
        df = pd.read_csv("ventes_synthetiques_600.csv")
        products = df['product_id'].unique().tolist()
        
        return jsonify({
            "success": True,
            "count": len(products),
            "products": [str(pid) for pid in products]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint non trouvé"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Erreur interne du serveur"}), 500

if __name__ == '__main__':
    if not load_model_and_scalers():
        print("Impossible de charger le modèle. Vérifiez que les fichiers existent.")
        exit(1)
    
    print("API Flask démarrée !")
    print("Endpoints disponibles:")
    print("- GET /health : État de l'API")
    print("- GET /predictions : Toutes les prédictions")
    print("- GET /predictions/<product_id> : Prédictions pour un produit")
    print("- GET /predictions/summary : Résumé des prédictions")
    print("- GET /products : Liste des produits disponibles")
    
    app.run(debug=True, host='0.0.0.0', port=5000)