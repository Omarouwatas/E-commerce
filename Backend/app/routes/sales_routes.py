from flask import Blueprint, jsonify,request
from flask_jwt_extended import jwt_required
from app.extensions import mongo
from app.utils.auth_utils import get_current_user
from bson import ObjectId
from datetime import datetime

sales_bp = Blueprint("sales", __name__)

@sales_bp.route("/admin/history", methods=["GET"])
@jwt_required()
def get_full_sales_history():
    user = get_current_user()
    if user.get("role") != "ADMIN":
        return jsonify({"msg": "Access denied"}), 403
    ventes = list(mongo.db.ventes.find())
    resultats = []
    for vente in ventes:
        vente["_id"] = str(vente["_id"])
        vente["commande_id"] = str(vente["commande_id"])
        vente["utilisateur_id"] = str(vente["utilisateur_id"])
        commande = mongo.db.commandes.find_one({"_id": ObjectId(vente["commande_id"])})
        if commande:
            commande["_id"] = str(commande["_id"])
            vente["commande"] = commande
        paiement = mongo.db.paiements.find_one({"vente_id": str(vente["_id"])})
        if paiement:
            paiement["_id"] = str(paiement["_id"])
            vente["paiement"] = paiement
        client = mongo.db.users.find_one({"_id": ObjectId(vente["utilisateur_id"])})
        if client:
            client["_id"] = str(client["_id"])
            vente["client"] = {
                "nom": client.get("nom"),
                "email": client.get("email"),
                "telephone": client.get("telephone", ""),
                "role": client.get("role")
            }

        resultats.append(vente)

    return jsonify(resultats), 200
@sales_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_sales():
    user = get_current_user()
    ventes = list(mongo.db.ventes.find({"utilisateur_id": str(user["_id"])}))
    resultats = []
    for vente in ventes:
        vente["_id"] = str(vente["_id"])
        vente["commande_id"] = str(vente["commande_id"])
        vente["utilisateur_id"] = str(vente["utilisateur_id"])
        commande = mongo.db.commandes.find_one({"_id": ObjectId(vente["commande_id"])})
        if commande:
            commande["_id"] = str(commande["_id"])
            vente["commande"] = commande
        paiement = mongo.db.paiements.find_one({"vente_id": str(vente["_id"])})
        if paiement:
            paiement["_id"] = str(paiement["_id"])
            vente["paiement"] = paiement
        resultats.append(vente)

    return jsonify(resultats), 200



@sales_bp.route("", methods=["POST"])
@jwt_required()
def enregistrer_vente_locale():
    user = get_current_user()
    if user.get("role") != "ADMIN":
        return jsonify({"msg": "Accès refusé"}), 403

    data = request.get_json()
    produits = data.get("produits", [])
    mode_paiement = data.get("mode_paiement", "cash")
    total = data.get("total")

    if not produits or total is None:
        return jsonify({"msg": "Données incomplètes"}), 400

    vente = {
        "produits": produits,
        "total": float(total),
        "mode_paiement": mode_paiement,
        "date_vente": datetime.utcnow(),
        "utilisateur_id": str(user["_id"])  # juste pour savoir qui a vendu, facultatif
    }

    # 🔄 Mise à jour du stock
    for p in produits:
        mongo.db.inventaires.update_one(
            {
                "product_id": p["product_id"],
                "emplacement": user.get("gouvernorat")
            },
            {
                "$inc": {"quantite_disponible": -p["quantite"]}
            }
        )

    inserted = mongo.db.ventes.insert_one(vente)
    vente["_id"] = str(inserted.inserted_id)
    return jsonify({"msg": "Vente enregistrée", "vente": vente}), 201
