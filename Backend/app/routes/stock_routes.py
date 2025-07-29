from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import mongo
from bson import ObjectId
from datetime import datetime

stock_bp = Blueprint("stock", __name__)

@stock_bp.route("/movement", methods=["POST"])
@jwt_required()
def enregistrer_mouvement_stock():
    data = request.get_json()
    user_id = get_jwt_identity()

    required_fields = ["product_id", "type_mouvement", "quantite", "raison", "emplacement"]
    if not all(data.get(field) for field in required_fields):
        return jsonify({"msg": "Champs requis manquants"}), 400

    product_id = str(data["product_id"]) 
    type_mouvement = data["type_mouvement"]
    quantite = int(data["quantite"])
    raison = data["raison"]
    emplacement = data["emplacement"]

    try:
        produit = mongo.db.products.find_one({"_id": ObjectId(product_id)})
    except:
        return jsonify({"msg": "ID produit invalide"}), 400

    if not produit:
        return jsonify({"msg": "Produit introuvable"}), 404

    inventory = mongo.db.inventaires.find_one({
        "product_id": product_id,
        "emplacement": emplacement
    })

    if type_mouvement == "entree":
        new_quantity = (inventory["quantite_disponible"] if inventory else 0) + quantite
    elif type_mouvement == "sortie":
        if not inventory or inventory["quantite_disponible"] < quantite:
            return jsonify({"msg": "Quantité insuffisante en stock"}), 400
        new_quantity = inventory["quantite_disponible"] - quantite
    else:
        return jsonify({"msg": "Type de mouvement invalide"}), 400

    if inventory:
        mongo.db.inventaires.update_one(
            {"_id": inventory["_id"]},
            {"$set": {
                "quantite_disponible": new_quantity,
                "date_dernier_mouvement": datetime.utcnow()
            }}
        )
    else:
        mongo.db.inventaires.insert_one({
            "product_id": product_id,
            "quantite_disponible": quantite,
            "emplacement": emplacement,
            "date_dernier_mouvement": datetime.utcnow()
        })

    # Historique des mouvements
    mouvement = {
        "product_id": product_id,
        "type_mouvement": type_mouvement,
        "quantite": quantite,
        "user_id": user_id,
        "raison": raison,
        "emplacement": emplacement,
        "date_mouvement": datetime.utcnow()
    }
    mongo.db.stock_mouvements.insert_one(mouvement)

    total_stock = mongo.db.inventaires.aggregate([
        {"$match": {"product_id": product_id}},  # match sur string
        {"$group": {"_id": "$product_id", "total": {"$sum": "$quantite_disponible"}}}
    ])
    stock_total = next(total_stock, {}).get("total", 0)

    mongo.db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"quantity": stock_total}}
    )

    return jsonify({"msg": "Mouvement enregistré avec succès", "stock_total": stock_total}), 201

    data = request.get_json()
    user_id = get_jwt_identity()

    required_fields = ["product_id", "type_mouvement", "quantite", "raison", "emplacement"]
    if not all(data.get(field) for field in required_fields):
        return jsonify({"msg": "Champs requis manquants"}), 400

    product_id = data["product_id"]
    type_mouvement = data["type_mouvement"]
    quantite = int(data["quantite"])
    raison = data["raison"]
    emplacement = data["emplacement"]

    produit = mongo.db.products.find_one({"_id": ObjectId(product_id)})
    if not produit:
        return jsonify({"msg": "Produit introuvable"}), 404

    # Vérifier ou créer l’inventaire pour cet emplacement
    inventory = mongo.db.inventaires.find_one({
        "product_id": product_id,
        "emplacement": emplacement
    })
    if type_mouvement == "entree":
        new_quantity = (inventory["quantite_disponible"] if inventory else 0) + quantite
    elif type_mouvement == "sortie":
        if not inventory or inventory["quantite_disponible"] < quantite:
            return jsonify({"msg": "Quantité insuffisante en stock"}), 400
        new_quantity = inventory["quantite_disponible"] - quantite
    else:
        return jsonify({"msg": "Type de mouvement invalide"}), 400

    if inventory:
        mongo.db.inventaires.update_one(
            {"_id": inventory["_id"]},
            {"$set": {
                "quantite_disponible": new_quantity,
                "date_dernier_mouvement": datetime.utcnow()
            }}
        )
    else:
        mongo.db.inventaires.insert_one({
            "product_id": product_id,
            "quantite_disponible": quantite,
            "emplacement": emplacement,
            "date_dernier_mouvement": datetime.utcnow()
        })
        


    mouvement = {
        "product_id": product_id,
        "type_mouvement": type_mouvement,
        "quantite": quantite,
        "user_id": user_id,
        "raison": raison,
        "emplacement": emplacement,
        "date_mouvement": datetime.utcnow()
    }
    mongo.db.stock_mouvements.insert_one(mouvement)
    total_stock = mongo.db.inventaires.aggregate([
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": "$product_id", "total": {"$sum": "$quantite_disponible"}}}
    ])
    stock_total = next(total_stock, {}).get("total", 0)
    mongo.db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"quantity": stock_total}}
    )
    return jsonify({
        "msg": "Mouvement enregistré avec succès",
        "stock_total": stock_total
    }), 201
@stock_bp.route('/resync-all-quantities', methods=['POST','OPTIONS'])
@jwt_required()
def resynchroniser_quantites_globales():
    pipeline = [
        {
            "$group": {
                "_id": "$product_id",
                "total": {"$sum": "$quantite_disponible"}
            }
        }
    ]
    aggregations = list(mongo.db.inventaires.aggregate(pipeline))

    updated = 0
    for item in aggregations:
        product_id = item["_id"]
        total = item["total"]
        try:
            mongo.db.products.update_one(
                {"_id": ObjectId(product_id)},
                {"$set": {"quantity": total}}
            )
            updated += 1
        except:
            continue 

    return jsonify({
        "msg": f"{updated} produits mis à jour avec leur stock total."
    }), 200

@stock_bp.route("/movements", methods=["GET"])
@jwt_required()
def lister_mouvements_stock():
    product_id = request.args.get("product_id")
    emplacement = request.args.get("emplacement")

    query = {}
    if product_id:
        query["product_id"] = product_id
    if emplacement:
        query["emplacement"] = emplacement

    mouvements = list(mongo.db.stock_mouvements.find(query).sort("date_mouvement", -1))
    for mouvement in mouvements:
        mouvement["_id"] = str(mouvement["_id"])
        mouvement["product_id"] = str(mouvement["product_id"])
        mouvement["user_id"] = str(mouvement["user_id"])
        mouvement["date_mouvement"] = mouvement["date_mouvement"].isoformat()

    return jsonify(mouvements), 200