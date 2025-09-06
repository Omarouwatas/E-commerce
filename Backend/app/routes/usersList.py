from flask import Blueprint, request, jsonify
from datetime import timedelta, datetime
from app.extensions import mongo
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth_utils import get_current_user
from bson import ObjectId

users_bp =Blueprint("users_bp", __name__)

@users_bp.route("/", methods=["GET"])
@jwt_required()
def get_users():
    user_id = get_jwt_identity()
    current_user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if current_user["role"] != "ADMIN":
        return jsonify({"msg": "Non autorisé"}), 403
    users = list(mongo.db.users.find({}, {"password": 0}))  
    for user in users:
        user["_id"] = str(user["_id"])
        user["sales_count"] = mongo.db.orders.count_documents({"user_id": user["_id"]})
    return jsonify(users), 200
@users_bp.route("/<user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    user_id = get_jwt_identity()
    current_user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if current_user["role"] != "ADMIN":
        return jsonify({"msg": "Non autorisé"}), 403
    data = request.json
    update_fields = {key: data[key] for key in ["name", "email", "role"] if key in data}
    mongo.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
    return jsonify({"msg": "Utilisateur mis à jour"}), 200
@users_bp.route("/<user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
    if current_user["role"] != "ADMIN":
        return jsonify({"msg": "Non autorisé"}), 403

    user = mongo.db.users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if not user:
        return jsonify({"msg": "Utilisateur introuvable"}), 404

    user["_id"] = str(user["_id"])
    return jsonify(user), 200
@users_bp.route("/<user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    user_id = get_jwt_identity()
    current_user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if current_user["role"] != "ADMIN":
        return jsonify({"msg": "Non autorisé"}), 403
    mongo.db.users.delete_one({"_id": ObjectId(user_id)})
    return jsonify({"msg": "Utilisateur supprimé"}), 200
@users_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"msg": "Utilisateur introuvable"}), 404

        user["_id"] = str(user["_id"])  
        return jsonify({
            "nom": user.get("nom"),
            "email": user.get("email"),
            "role": user.get("role")
        }), 200

    except Exception as e:
        return jsonify({"msg": "Erreur serveur", "error": str(e)}), 500