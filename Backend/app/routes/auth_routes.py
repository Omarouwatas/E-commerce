from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from datetime import timedelta, datetime
from app.extensions import mongo
from bson import ObjectId
auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    required_fields = ["email", "password", "nom"]
    if not all(field in data for field in required_fields):
        return jsonify({"msg": "Email, password and nom are required"}), 400

    email = data["email"]
    password = data["password"]
    nom = data["nom"]
    role = data.get("role", "client")  # par défaut = client
    adresse = data.get("adresse", "")
    telephone = data.get("telephone", "")
    gouvernorat = data.get("gouvernorat", "")  # 🆕 champs ville pour admin
    favorites = []
    adresses = []
    stock = []

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"msg": "User already exists"}), 409

    hashed_password = generate_password_hash(password)
    new_user = {
        "email": email,
        "password": hashed_password,
        "nom": nom,
        "role": role,
        "adresse": adresse,
        "telephone": telephone,
        "date_inscription": datetime.utcnow(),
        "gouvernorat": gouvernorat,
        "favorites": favorites,
        "adresses": adresses,
        "stock": stock
    }

    mongo.db.users.insert_one(new_user)
    return jsonify({"msg": "User registered successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data.get("email") or not data.get("password"):
        return jsonify({"msg": "Email and password are required"}), 400

    user = mongo.db.users.find_one({"email": data["email"]})
    if not user or not check_password_hash(user["password"], data["password"]):
        return jsonify({"msg": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user["_id"]), expires_delta=timedelta(hours=24))
    return jsonify({
        "access_token": access_token,
        "nom": user.get("nom"),
        "role": user.get("role")
    }), 200
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"msg": "Utilisateur non trouvé"}), 404

    user["_id"] = str(user["_id"])
    user["password"] = "🔒"
    return jsonify(user), 200
