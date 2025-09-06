
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from app.extensions import mongo
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from app.utils.auth_utils import get_current_user


UPLOAD_FOLDER = 'uploads/factures'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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
        return jsonify({"msg": "Hors zone"}), 403

    if str(commande["client_id"]) != str(current_user_id) and current_user.get("role") != "ADMIN":
        return jsonify({"msg": "Non autorisé à confirmer cette commande"}), 403
    for p in commande["produits"]:
        stock_result = mongo.db.inventaires.find_one({
            "product_id": p["product_id"],
            "emplacement": admin_city
        })
        if not stock_result or stock_result.get("quantite_disponible", 0) < p["quantite"]:
            return jsonify({"msg": f"Stock insuffisant pour le produit {p['nom']}"}), 400
        mongo.db.inventaires.update_one(
            {
                "product_id": p["product_id"],
                "emplacement": admin_city
            },
            {
                "$inc": {"quantite_disponible": -p["quantite"]}
            }
        )
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

@orders_bp.route("/<order_id>/check-stock/", methods=["GET"])
@jwt_required()
def check_stock(order_id):
    admin_id = get_jwt_identity()
    admin = mongo.db.users.find_one({"_id": ObjectId(admin_id)})
    gouvernorat = admin.get("gouvernorat")
    order = mongo.db.commandes.find_one({"_id": ObjectId(order_id)})
    if not order:
        return jsonify({"ok": False, "message": "Commande introuvable"}), 404

    for item in order.get("produits", []): 
        product_id = item["product_id"]
        quantity_needed = item["quantite"]

        inv = mongo.db.inventaires.find_one({
            "product_id": product_id,
            "emplacement": gouvernorat
        })

        if not inv or inv.get("quantite_disponible", 0) < quantity_needed:
            return jsonify({"ok": False, "message": f"Stock insuffisant pour {product_id}"}), 400

    return jsonify({"ok": True}), 200

@orders_bp.route("/upload-facture/<commande_id>", methods=["POST"])
@jwt_required()
def upload_facture(commande_id):
    if 'file' not in request.files:
        return jsonify({"msg": "Aucun fichier reçu"}), 400
    file = request.files['file']
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    mongo.db.commandes.update_one(
        {"_id": ObjectId(commande_id)},
        {"$set": {"facture_scan": filepath}}
    )
    return jsonify({"msg": "Facture uploadée"}), 200
@orders_bp.route('/to-deliver/<gouvernorat>', methods=['GET'])
@jwt_required()
def get_orders_to_deliver(gouvernorat):
    commandes = list(mongo.db.commandes.find({
        "statut": "confirmée",
        "adresse_livraison.gouvernorat": gouvernorat
    }))

    for commande in commandes:
        commande['_id'] = str(commande['_id']) 

    return jsonify(commandes), 200

@orders_bp.route("/<commande_id>", methods=["GET"])
@jwt_required()
def get_commande_by_id(commande_id):
    commande = mongo.db.commandes.find_one({"_id": ObjectId(commande_id)})
    if not commande:
        return jsonify({"msg": "Commande introuvable"}), 404

    commande["_id"] = str(commande["_id"])
    commande["client_id"] = str(commande["client_id"])
    return jsonify(commande), 200


@orders_bp.route("/assigned-to-me", methods=["GET"])
@jwt_required()
def orders_assigned_to_me():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})

    q = {
        "assigned_to": ObjectId(user["_id"]) if isinstance(user["_id"], str) else user["_id"],
        "statut": {"$in": ["assignee", "en_cours_de_livraison"]},
    }
    items = []
    for o in mongo.db.commandes.find(q).sort("date_commande", -1):
        o["_id"] = str(o["_id"])
        if isinstance(o.get("date_commande"), datetime):
            o["date_commande"] = o["date_commande"].isoformat()
        items.append(o)
    return jsonify(items), 200
@orders_bp.route("/<commande_id>", methods=["DELETE"])
@jwt_required()
def delete_commande(commande_id): 
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})

    if not user or user.get("role") != "ADMIN":
        return jsonify({"msg": "Non autorisé"}), 403

    commande = mongo.db.commandes.find_one({"_id": ObjectId(commande_id)})
    if not commande:
        return jsonify({"msg": "Commande introuvable"}), 404

    mongo.db.commandes.delete_one({"_id": ObjectId(commande_id)})
    return jsonify({"msg": "Commande supprimée avec succès"}), 200
