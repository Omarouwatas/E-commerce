# deliveries_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson.objectid import ObjectId
from app import mongo

delivery_bp = Blueprint('delivery', __name__)
@delivery_bp.route("/orders", methods=["GET"])
@jwt_required()
def get_orders():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"msg": "User ID is required"}), 400

    orders = list(mongo.db.commandes.find({"user_id": ObjectId(user_id)}))
    for order in orders:
        order["_id"] = str(order["_id"])
    return jsonify(orders), 200
@delivery_bp.route("/scan", methods=["POST"])
@jwt_required()
def valider_livraison():
    data = request.get_json()
    order_id = data.get("order_id")
    code_produit = data.get("code_barre")

    order = mongo.db.commandes.find_one({"_id": ObjectId(order_id)})
    if not order:
        return jsonify({"msg": "Commande introuvable"}), 404

    produits = [p["product_id"] for p in order["produits"]]
    if code_produit not in produits:
        return jsonify({"msg": "Produit non reconnu dans cette commande"}), 400

    mongo.db.commandes.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"livraison_statut": "livré"}}
    )
    return jsonify({"msg": "Livraison confirmée"}), 200
