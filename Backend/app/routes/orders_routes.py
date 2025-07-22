
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from app.extensions import mongo
from datetime import datetime

orders_bp = Blueprint("orders_bp", __name__)

@orders_bp.route("/", methods=["POST"])
@jwt_required()
def passer_commande():
    user_id = get_jwt_identity()
    data = request.get_json()
    type_commande = data.get("type_commande", "sur_place")
    frais_livraison = float(data.get("frais_livraison", 0.0))

    panier = mongo.db.paniers.find_one({"utilisateur_id": user_id})
    if not panier or not panier.get("elements"):
        return jsonify({"msg": "Panier vide"}), 400

    produits_commande = []
    for element in panier["elements"]:
        product = mongo.db.products.find_one({"_id": ObjectId(element["product_id"])})
        if product:
            produits_commande.append({
                "product_id": str(product["_id"]),
                "nom": product["name"],
                "prix": product["price"],
                "quantite": element["quantite"]
            })

    # Création de la commande
    commande = {
        "client_id": user_id,
        "type_commande": type_commande,
        "frais_livraison": frais_livraison,
        "produits": produits_commande,
        "date_commande": datetime.utcnow(),
        "statut": "en_attente"
    }

    total = sum(p["prix"] * p["quantite"] for p in produits_commande) + frais_livraison
    commande["total"] = round(total, 2)

    mongo.db.commandes.insert_one(commande)
    mongo.db.paniers.update_one({"utilisateur_id": user_id}, {"$set": {"elements": []}})

    return jsonify({"msg": "Commande passée avec succès", "total": total}), 201
@orders_bp.route("/", methods=["GET"])
@jwt_required()
def lister_commandes():
    current_user_id = get_jwt_identity()
    current_user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})

    if not current_user or current_user.get("role") != "ADMIN":
        return jsonify({"msg": "Non autorisé"}), 403

    commandes = list(mongo.db.commandes.find())
    for c in commandes:
        c["_id"] = str(c["_id"])
        c["client_id"] = str(c["client_id"])
    return jsonify(commandes), 200
@orders_bp.route("/<commande_id>/confirm", methods=["PUT"])
@jwt_required()
def confirmer_commande(commande_id):
    current_user_id = get_jwt_identity()
    current_user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})

    if not current_user or current_user.get("role") != "ADMIN":
        return jsonify({"msg": "Non autorisé"}), 403

    commande = mongo.db.commandes.find_one({"_id": ObjectId(commande_id)})

    if not commande or commande.get("statut") == "confirmée":
        return jsonify({"msg": "Commande introuvable ou déjà confirmée"}), 404

    mongo.db.commandes.update_one(
        {"_id": ObjectId(commande_id)},
        {"$set": {
            "statut": "confirmée",
            "date_confirmation": datetime.utcnow()
        }}
    )

    return jsonify({"msg": "Commande confirmée avec succès"}), 200
@orders_bp.route("/historique", methods=["GET"])
@jwt_required()
def historique_commandes():
    current_user_id = get_jwt_identity()
    current_user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})

    if not current_user or current_user.get("role") != "ADMIN":
        return jsonify({"msg": "Non autorisé"}), 403

    commandes = list(mongo.db.commandes.find({"statut": "confirmée"}))
    for c in commandes:
        c["_id"] = str(c["_id"])
        c["client_id"] = str(c["client_id"])
    return jsonify(commandes), 200
