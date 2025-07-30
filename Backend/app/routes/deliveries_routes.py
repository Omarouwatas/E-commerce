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

    if user["role"] != "LIVREUR":
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
from datetime import datetime
@delivery_bp.route('/status', methods=['PUT'])
@jwt_required()
def update_livreur_status():
    user_id = get_jwt_identity()
    data = request.get_json()
    nouveau_status = data.get("status")

    if nouveau_status not in ["disponible", "hors_ligne"]:
        return jsonify({"msg": "Statut invalide"}), 400

    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    if not user or user.get("role", "").lower() != "livreur":
        return jsonify({"msg": "Non autorisé"}), 403

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": nouveau_status}}
    )

    return jsonify({"msg": f"Statut mis à jour vers {nouveau_status}"}), 200
@delivery_bp.route('/assign/<order_id>', methods=['PUT'])
@jwt_required()
def assign_livreur(order_id):
    data = request.get_json()
    livreur_id = data.get("livreur_id")

    if not livreur_id:
        return jsonify({"msg": "Livreur ID manquant"}), 400

    order = mongo.db.commandes.find_one({"_id": ObjectId(order_id)})
    if not order or order.get("statut") != "confirmee":
        return jsonify({"msg": "Commande invalide ou non confirmée"}), 400

    mongo.db.commandes.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "statut": "en_attente_acceptation",
            "livreur_id": ObjectId(livreur_id)
        }}
    )

    return jsonify({"msg": "Commande assignée en attente d'acceptation"}), 200
@delivery_bp.route('/accept/<order_id>', methods=['PUT'])
@jwt_required()
def accept_order(order_id):
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})

    if not user or user.get('role', '').lower() != 'livreur':
        return jsonify({'msg': 'Accès non autorisé'}), 403

    order = mongo.db.commandes.find_one({'_id': ObjectId(order_id)})
    if not order:
        return jsonify({'msg': 'Commande introuvable'}), 404

    if order.get('statut') != 'confirmee':
        return jsonify({'msg': 'Commande déjà traitée ou non valide'}), 400

    # Créer un enregistrement livraison
    livraison = {
        'order_id': order_id,
        'livreur_id': str(user['_id']),
        'status': 'en_cours_de_livraison',
        'created_at': datetime.utcnow()
    }
    mongo.db.livraisons.insert_one(livraison)

    mongo.db.commandes.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'statut': 'en_cours_de_livraison'}}
    )

    return jsonify({'msg': 'Commande acceptée pour livraison'}), 200
@delivery_bp.route('/refuse/<order_id>', methods=['PUT'])
@jwt_required()
def refuse_order(order_id):
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})

    if not user or user.get('role', '').lower() != 'livreur':
        return jsonify({'msg': 'Accès non autorisé'}), 403

    mongo.db.livraisons.delete_one({
        'order_id': order_id,
        'livreur_id': str(user['_id'])
    })

    mongo.db.commandes.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'statut': 'confirmee'}}
    )

    return jsonify({'msg': 'Commande refusée'}), 200
@delivery_bp.route('/track/<order_id>', methods=['GET'])
@jwt_required()
def admin_track_livreur(order_id):
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    
    if not user or user['role'].lower() != 'admin':
        return jsonify({'msg': 'Non autorisé'}), 403

    livraison = mongo.db.Livraisons.find_one({'order_id': order_id})
    if not livraison:
        return jsonify({'msg': 'Livraison non trouvée'}), 404

    livreur = mongo.db.users.find_one({'_id': livraison['livreur_id']}, {'mot_de_passe': 0})

    return jsonify({
        'location': livraison.get('location'),
        'livreur': {
            'nom': livreur.get('nom'),
            'telephone': livreur.get('telephone')
        }
    }), 200
