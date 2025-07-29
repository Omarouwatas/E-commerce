# deliveries_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from app import mongo
from app.models.delivery_model import Livraisons

delivery_bp = Blueprint('delivery_bp', __name__)
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



@delivery_bp.route('/accept', methods=['POST'])
@jwt_required()
def accept_delivery():
    data = request.get_json()
    order_id = data.get('order_id')
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    if not user or user['role'] != 'LIVREUR':
        return jsonify({'msg': 'Non autorisé'}), 403
    livraison = Livraisons(order_id=order_id, livreur_id=user['_id'])
    livraison.save()
    mongo.db.commandes.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'statut': 'en_cours_de_livraison'}}
    )
    return jsonify({'msg': 'Commande acceptée', 'livraison': livraison.to_dict()})
@delivery_bp.route('/update-location', methods=['POST'])
@jwt_required()
def update_location():
    data = request.get_json()
    order_id = data.get('order_id')
    location = data.get('location')  
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})

    mongo.db.Livraisons.update_one(
        {'order_id': order_id, 'livreur_id': user['_id']},
        {'$set': {'location': location}}
    )

    return jsonify({'msg': 'Position mise à jour'})
@delivery_bp.route('/cancel', methods=['POST'])
@jwt_required()
def cancel_delivery():
    data = request.get_json()
    order_id = data.get('order_id')

    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    if not user or user['role'].lower() != 'livreur':
        return jsonify({'msg': 'Non autorisé'}), 403
    mongo.db.Livraisons.delete_one({
        'order_id': order_id,
        'livreur_id': user['_id']
    })
    mongo.db.commandes.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'statut': 'confirmee'}}
    )

    return jsonify({'msg': 'Livraison annulée'}), 200
@delivery_bp.route('/client-track/<order_id>', methods=['GET'])
@jwt_required()
def client_track(order_id):
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})

    if not user or user['role'].lower() != 'client':
        return jsonify({'msg': 'Non autorisé'}), 403

    commande = mongo.db.commandes.find_one({'_id': ObjectId(order_id), 'client_id': str(user['_id'])})
    if not commande:
        return jsonify({'msg': 'Commande non trouvée'}), 404

    livraison = mongo.db.Livraisons.find_one({'order_id': order_id})

    result = {
        'statut_commande': commande['statut'],
        'adresse_livraison': commande.get('adresse_livraison', {}),
        'produits': commande.get('produits', []),
        'total': commande.get('total'),
        'date_commande': commande.get('date_commande')
    }

    if livraison:
        result['livreur_location'] = livraison.get('location', {})
        result['status_livraison'] = livraison.get('status', 'en_cours_de_livraison')
    else:
        result['livreur_location'] = None
        result['status_livraison'] = None

    return jsonify(result), 200
@delivery_bp.route('/client/commandes-actives', methods=['GET'])
@jwt_required()
def get_active_client_orders():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})

    if not user or user['role'].lower() != 'client':
        return jsonify({'msg': 'Non autorisé'}), 403

    commandes = list(mongo.db.commandes.find({
        'client_id': str(user['_id']),
        'statut': {'$in': ['confirmee', 'en_cours_de_livraison']}
    }))

    for c in commandes:
        c['_id'] = str(c['_id'])
        c['date_commande'] = c.get('date_commande').isoformat() if c.get('date_commande') else None

    return jsonify(commandes), 200

@delivery_bp.route('/livreurs', methods=['GET'])
@jwt_required()
def get_all_livreurs():
    current_user = mongo.db.users.find_one({'_id': ObjectId(get_jwt_identity())})
    if not current_user or current_user['role'].lower() != 'admin':
        return jsonify({'msg': 'Accès refusé'}), 403

    livreurs = list(mongo.db.users.find({"role": "LIVREUR"}))
    for l in livreurs:
        l['_id'] = str(l['_id'])
        l['status'] = l.get('status', 'inconnu')

    return jsonify(livreurs), 200
@delivery_bp.route('/livreurs/<livreur_id>/status', methods=['PUT'])
@jwt_required()
def update_livreur_status(livreur_id):
    user = mongo.db.users.find_one({"_id": ObjectId(get_jwt_identity())})
    if not user or user["role"] != "admin":
        return jsonify({"msg": "Accès refusé"}), 403

    data = request.get_json()
    new_status = data.get("status")
    if new_status not in ["actif", "occupé", "hors_ligne", "indisponible"]:
        return jsonify({"msg": "Statut invalide"}), 400

    result = mongo.db.users.update_one(
        {"_id": ObjectId(livreur_id), "role": "LIVREUR"},
        {"$set": {"status": new_status}}
    )
    if result.matched_count == 0:
        return jsonify({"msg": "Livreur non trouvé"}), 404

    return jsonify({"msg": "Statut mis à jour"}), 200
