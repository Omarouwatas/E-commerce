
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
    adresse = data.get("adresse") 
    mode_paiement = data.get("mode_paiement", "cod") 

    if not adresse or not mode_paiement:
        return jsonify({"msg": "Adresse de livraison et méthode de paiement requises"}), 400

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

    total = sum(p["prix"] * p["quantite"] for p in produits_commande) + frais_livraison

    commande = {
        "client_id": user_id,
        "type_commande": type_commande,
        "frais_livraison": frais_livraison,
        "produits": produits_commande,
        "adresse_livraison": adresse,           
        "mode_paiement": mode_paiement,         
        "date_commande": datetime.utcnow(),
        "statut": "en_attente",
        "total": round(total, 2)
    }

    result = mongo.db.commandes.insert_one(commande)
    mongo.db.paniers.update_one({"utilisateur_id": user_id}, {"$set": {"elements": []}})
    commande["_id"] = str(result.inserted_id)
    return jsonify({
        "msg": "Commande créée",
        "commande": commande
    }), 201
@orders_bp.route("/", methods=["GET"])
@jwt_required()
def lister_commandes():
    current_user_id = get_jwt_identity()
    current_user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
    if not current_user or current_user.get("role") != "ADMIN":
        return jsonify({"msg": "Non autorisé"}), 403

    admin_city = current_user.get("gouvernorat")             
    commandes = list(mongo.db.commandes.find(
        {"adresse_livraison.gouvernorat": admin_city}))       
    for c in commandes:
        c["_id"] = str(c["_id"]); c["client_id"] = str(c["client_id"])
    return jsonify(commandes), 200


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
@orders_bp.route("/addresses", methods=["GET"])
@jwt_required()
def get_addresses():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        return jsonify({"msg": "Utilisateur non trouvé"}), 404

    adresses = user.get("adresses", [])
    return jsonify(adresses), 200

@orders_bp.route("/addresses", methods=["POST"])
@jwt_required()
def save_address():
    user_id = get_jwt_identity()
    nouvelle_adresse = request.get_json()

    if not nouvelle_adresse:
        return jsonify({"msg": "Aucune adresse fournie"}), 400

    result = mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"adresses": nouvelle_adresse}}
    )

    if result.modified_count == 1:
        return jsonify({"msg": "Adresse ajoutée avec succès"}), 201
    else:
        return jsonify({"msg": "Échec de l'ajout de l'adresse"}), 500
@orders_bp.route("/<commande_id>/confirm", methods=["PUT"])
@jwt_required()
def confirmer_commande(commande_id):
    current_user_id = get_jwt_identity()
    current_user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})

    if not current_user:
        return jsonify({"msg": "Utilisateur non trouvé"}), 404

    commande = mongo.db.commandes.find_one({"_id": ObjectId(commande_id)})

    if not commande:
        return jsonify({"msg": "Commande introuvable"}), 404

    if commande.get("statut") == "confirmée":
        return jsonify({"msg": "Commande déjà confirmée"}), 400
    admin_city = current_user.get("gouvernorat")             
    if commande["adresse_livraison"]["gouvernorat"] != admin_city:
        return jsonify({"msg":"Hors zone"}),403
    if str(commande["client_id"]) != str(current_user_id) and current_user.get("role") != "ADMIN":
        return jsonify({"msg": "Non autorisé à confirmer cette commande"}), 403
    for p in commande["produits"]:                                         # + bloc
        ok = mongo.db.inventaires.update_one(
            {"admin_id":current_user_id,"items.product_id":p["product_id"],
             "items.stock":{"$gte":p["quantite"]}},
            {"$inc":{"items.$.stock":-p["quantite"]}}
        )
        if ok.modified_count==0:
            return jsonify({"msg":"Stock insuffisant"}),400
    mongo.db.commandes.update_one(
        {"_id": ObjectId(commande_id)},
        {"$set": {
            "statut": "confirmée",
            "date_confirmation": datetime.utcnow()
        }}
    )

    mongo.db.paniers.update_one(
        {"utilisateur_id": str(current_user_id)},
        {"$set": {"elements": []}}
    )

    return jsonify({"msg": "Commande confirmée avec succès"}), 200
