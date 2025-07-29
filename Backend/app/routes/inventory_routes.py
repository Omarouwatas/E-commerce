from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity
from app.extensions import mongo
from bson import ObjectId
from datetime import datetime

inventory_bp = Blueprint("inventory", __name__)
@inventory_bp.route("/", methods=["POST"])
@jwt_required()
def add_or_update_inventory():
    admin_id = get_jwt_identity()
    data = request.get_json()
    required = ["product_id", "quantite_disponible", "emplacement"]
    if not all(data.get(k) for k in required):
        return jsonify({"msg": "Champs requis manquants"}), 400
    query = {
        "product_id": data["product_id"],
        "emplacement": data["emplacement"],
        "admin_id": admin_id
    }
    update = {
        "$set": {
            "quantite_disponible": int(data["quantite_disponible"]),
            "date_ajout": datetime.utcnow()
        }
    }
    mongo.db.inventaires.update_one(query, update, upsert=True)
    return jsonify({"msg": "inventaires mis à jour"}), 200

@inventory_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_inventory():
    inventaires = list(mongo.db.inventaires.find())
    for i in inventaires:
        i["_id"] = str(i["_id"])
    return jsonify(inventaires), 200

@inventory_bp.route("/produit/<product_id>", methods=["GET"])
@jwt_required()
def get_product_inventory(product_id):
    inv = list(mongo.db.inventaires.find({"product_id": product_id}))
    for i in inv:
        i["_id"] = str(i["_id"])
    return jsonify(inv), 200

@inventory_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_inventory():
    admin_id = get_jwt_identity()

    admin = mongo.db.users.find_one({"_id": ObjectId(admin_id)})
    if  admin.get("role") != "ADMIN":
        return jsonify({"msg": "Accès refusé"}), 403
    emplacement = admin.get("gouvernorat", "")
    if not emplacement:
        return jsonify({"msg": "Adresse (ville) de l'admin manquante"}), 400
    inventory = list(mongo.db.inventaires.find({"emplacement": emplacement}))
    for item in inventory:
        item["_id"] = str(item["_id"])
        item["product_id"] = str(item["product_id"])

    return jsonify(inventory), 200



@inventory_bp.route("/set",methods=["POST"])
@jwt_required()
def set_stock():
    admin_id = get_jwt_identity()
    items = request.get_json().get("items",[])
    mongo.db.inventaires.update_one(
        {"admin_id":admin_id},
        {"$set":{"items":items,"admin_id":admin_id}},
        upsert=True)
    return jsonify({"msg":"Stock mis à jour"}),200
@inventory_bp.route("/city/<city>", methods=["GET"])
@jwt_required()
def get_inventory_by_city(city):
    # Recherche tous les stocks dans la ville spécifiée
    stock = list(mongo.db.inventaires.find({"emplacement": city}))
    
    for item in stock:
        item["_id"] = str(item["_id"])
        item["product_id"] = str(item["product_id"])
    
    return jsonify(stock), 200
@inventory_bp.route("/move", methods=["POST"])
@jwt_required()
def stock_movement():
    data = request.get_json()
    user_id = get_jwt_identity()

    product_id = data.get("product_id")
    quantite = int(data.get("quantite", 0))
    type_mouvement = data.get("type")  # "in" ou "out"

    if not product_id or type_mouvement not in ["in", "out"]:
        return jsonify({"msg": "Invalid data"}), 400

    admin = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not admin or admin["role"] != "admin":
        return jsonify({"msg": "Access denied"}), 403

    gouvernorat = admin.get("adresse", "inconnu")
    inventory_entry = mongo.db.inventaires.find_one({
        "product_id": product_id,
        "emplacement": gouvernorat
    })

    if not inventory_entry:
        if type_mouvement == "out":
            return jsonify({"msg": "Stock insuffisant"}), 400
        inventory_entry = {
            "product_id": product_id,
            "quantite_disponible": quantite,
            "emplacement": gouvernorat,
            "date_ajout": datetime.utcnow()
        }
        mongo.db.inventaires.insert_one(inventory_entry)
    else:
        nouvelle_qte = inventory_entry["quantite_disponible"] + quantite if type_mouvement == "in" else inventory_entry["quantite_disponible"] - quantite
        if nouvelle_qte < 0:
            return jsonify({"msg": "Stock insuffisant"}), 400
        mongo.db.inventaires.update_one(
            {"_id": inventory_entry["_id"]},
            {"$set": {"quantite_disponible": nouvelle_qte}}
        )

    mouvement = {
        "product_id": product_id,
        "quantite": quantite,
        "type": type_mouvement,
        "admin_id": user_id,
        "emplacement": gouvernorat,
        "timestamp": datetime.utcnow()
    }
    mongo.db.mouvements_stock.insert_one(mouvement)

    total_stock = mongo.db.inventaires.aggregate([
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": "$product_id", "total": {"$sum": "$quantite_disponible"}}}
    ])
    total = next(total_stock, {}).get("total", 0)
    mongo.db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"quantity": total}}
    )

    return jsonify({"msg": "Mouvement enregistré", "stock_total": total}), 200
