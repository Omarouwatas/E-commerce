# deliveries_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
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
@delivery_bp.route("/<order_id>/valider-livraison", methods=["PUT"])
@jwt_required()
def valider_livraison(order_id):
    current_user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})

    if user["role"] != "livreur":
        return jsonify({"msg": "Accès refusé"}), 403

    order = mongo.db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        return jsonify({"msg": "Commande introuvable"}), 404

    if order["statut"] != "confirmee":
        return jsonify({"msg": "La commande n'est pas encore prête à être livrée"}), 400

    mongo.db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"statut": "livree", "date_livraison": datetime.utcnow()}}
    )

    return jsonify({"msg": "Commande marquée comme livrée"}), 200

