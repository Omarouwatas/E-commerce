# app/routes/favorites_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import mongo

favorites_bp = Blueprint("favorites", __name__)

@favorites_bp.route("/toggle", methods=["POST"])
@jwt_required()
def toggle_favorite():
    user_id = get_jwt_identity()
    data = request.get_json()
    product_id = data.get("product_id")

    if not product_id:
        return jsonify({"msg": "product_id is required"}), 400

    fav = mongo.db.favorites.find_one({"user_id": user_id})
    if not fav:
        mongo.db.favorites.insert_one({
            "user_id": user_id,
            "product_ids": [product_id]
        })
        return jsonify({"msg": "Produit ajouté aux favoris"}), 200

    if product_id in fav["product_ids"]:
        fav["product_ids"].remove(product_id)
        msg = "Produit retiré des favoris"
    else:
        fav["product_ids"].append(product_id)
        msg = "Produit ajouté aux favoris"

    mongo.db.favorites.update_one(
        {"_id": fav["_id"]},
        {"$set": {"product_ids": fav["product_ids"]}}
    )
    return jsonify({"msg": msg}), 200
