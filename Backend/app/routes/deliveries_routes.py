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
    user = mongo.db.users.find_one({"_id": ObjectId(get_jwt_identity())})
    if not user or user["role"].lower() != "livreur":
        return jsonify({"msg": "Accès refusé"}), 403

    updated = mongo.db.commandes.find_one_and_update(
        {
            "_id": ObjectId(order_id),
            "livreur_id": user["_id"],
            "statut": "en_cours_de_livraison"
        },
        {"$set": {"statut": "livree", "date_livraison": datetime.utcnow()}},
        return_document=ReturnDocument.AFTER
    )
    if not updated:
        return jsonify({"msg": "Commande introuvable ou mauvais statut"}), 409

    mongo.db.livraisons.update_one(
        {"order_id": ObjectId(order_id), "livreur_id": user["_id"]},
        {"$set": {"status": "livree", "updated_at": datetime.utcnow()}}
    )
    return jsonify({"msg": "Commande marquée comme livrée"}), 200



@delivery_bp.route('/update-location', methods=['POST'])
@jwt_required()
def update_location():
    user = mongo.db.users.find_one({'_id': ObjectId(get_jwt_identity())})
    if not user or user.get('role','').lower() != 'livreur':
        return jsonify({'msg': 'Non autorisé'}), 403

    data = request.get_json() or {}
    order_id = data.get('order_id')
    loc = data.get('location')
    if not order_id or not loc:
        return jsonify({'msg': 'order_id et location requis'}), 400

    order = mongo.db.commandes.find_one({
        '_id': ObjectId(order_id),
        'livreur_id': user['_id'],
        'statut': {'$in': ['assignee','en_cours_de_livraison']}
    })
    if not order:
        return jsonify({'msg': 'Non autorisé pour cette commande'}), 403

    mongo.db.livraisons.update_one(
        {'order_id': ObjectId(order_id), 'livreur_id': user['_id']},
        {'$set': {'location': loc, 'updated_at': datetime.utcnow()}},
        upsert=True
    )

    # socketio.emit('location_update', {...}) si tu as le temps réel
    return jsonify({'msg': 'Position mise à jour'}), 200


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
from datetime import datetime
from pymongo import ReturnDocument
@delivery_bp.route('/assign/<order_id>', methods=['PUT'])
@jwt_required()
def assign_livreur(order_id):
    current = mongo.db.users.find_one({'_id': ObjectId(get_jwt_identity())})
    if not current or current.get('role','').lower() != 'admin':
        return jsonify({'msg':'Accès refusé'}), 403

    data = request.get_json() or {}
    livreur_id = data.get("livreur_id")
    if not livreur_id:
        return jsonify({"msg": "Livreur ID manquant"}), 400

    updated = mongo.db.commandes.find_one_and_update(
        { "_id": ObjectId(order_id), "statut": "confirmée" },
        { "$set": {
            "livreur_id": ObjectId(livreur_id),
            "statut": "assignee",
            "assigned_at": datetime.utcnow()
        }},
        return_document=ReturnDocument.AFTER
    )
    if not updated:
        return jsonify({"msg":"Commande introuvable ou statut non 'confirmee'"}), 404
    return jsonify({"msg":"Commande assignée"}), 200
@delivery_bp.route('/accept/<order_id>', methods=['PUT'])
@jwt_required()
def accept_order(order_id):
    user = mongo.db.users.find_one({'_id': ObjectId(get_jwt_identity())})
    if not user or user.get('role','').lower() != 'livreur':
        return jsonify({'msg':'Accès non autorisé'}), 403

    updated = mongo.db.commandes.find_one_and_update(
        {
            '_id': ObjectId(order_id),
            'livreur_id': user['_id'],
            'statut': 'assignee'
        },
        { '$set': { 'statut': 'en_cours_de_livraison', 'accepted_at': datetime.utcnow() } },
        return_document=ReturnDocument.AFTER
    )
    if not updated:
        return jsonify({'msg': 'Commande non assignée à vous ou mauvais statut'}), 409

    # créer/mettre à jour livraisons (collection en minuscules)
    mongo.db.livraisons.update_one(
        {'order_id': ObjectId(order_id)},
        {'$setOnInsert': {
            'order_id': ObjectId(order_id),
            'livreur_id': user['_id'],
            'status': 'en_cours_de_livraison',
            'created_at': datetime.utcnow()
        }},
        upsert=True
    )
    return jsonify({'msg': 'Commande démarrée'}), 200

@delivery_bp.route('/refuse/<order_id>', methods=['PUT'])
@jwt_required()
def refuse_order(order_id):
    user = mongo.db.users.find_one({'_id': ObjectId(get_jwt_identity())})
    if not user or user.get('role','').lower() != 'livreur':
        return jsonify({'msg':'Accès non autorisé'}), 403

    updated = mongo.db.commandes.find_one_and_update(
        { '_id': ObjectId(order_id), 'livreur_id': user['_id'], 'statut': 'assignee' },
        { '$unset': { 'livreur_id': "" }, '$set': { 'statut': 'confirmee' } },
        return_document=ReturnDocument.AFTER
    )
    if not updated:
        return jsonify({'msg':'Refus impossible (non assignée à vous ou déjà démarrée)'}), 409

    mongo.db.livraisons.delete_one({ 'order_id': ObjectId(order_id), 'livreur_id': user['_id'] })
    return jsonify({'msg': 'Commande refusée'}), 200

@delivery_bp.route('/track/<order_id>', methods=['GET'])
@jwt_required()
def admin_track_livreur(order_id):
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    


    livraison = mongo.db.livraisons.find_one({'order_id': ObjectId(order_id)})
    if not livraison:
        return jsonify({'msg': 'Livraison non trouvée'}), 404

    livreur = None
    if livraison.get('livreur_id'):
        livreur = mongo.db.users.find_one({'_id': livraison['livreur_id']}, {'mot_de_passe': 0})

    return jsonify({
        'location': livraison.get('location'),
        'livreur': {
            'nom': livreur.get('nom') if livreur else "Livreur supprimé",
            'telephone': livreur.get('telephone') if livreur else None
        }
    }), 200

@delivery_bp.route('/my-assigned', methods=['GET'])
@jwt_required()
def my_assigned_orders():
    user = mongo.db.users.find_one({'_id': ObjectId(get_jwt_identity())})
    if not user or user.get('role','').lower() != 'livreur':
        return jsonify({'msg':'Non autorisé'}), 403

    cursor = mongo.db.commandes.find({
        "livreur_id": user["_id"],
        "statut": {"$in": ["assignee","en_cours_de_livraison"]}
    }).sort("date_commande", -1)

    items = []
    for c in cursor:
        c["_id"] = str(c["_id"])
        c["livreur_id"] = str(c.get("livreur_id")) if c.get("livreur_id") else None
        if c.get("date_commande") and hasattr(c["date_commande"], "isoformat"):
            c["date_commande"] = c["date_commande"].isoformat()
        items.append(c)
    return jsonify(items), 200
@delivery_bp.route('/client-track/<order_id>', methods=['GET'])
@jwt_required()
def client_track(order_id):
    user = mongo.db.users.find_one({'_id': ObjectId(get_jwt_identity())})
    if not user or user.get('role','').lower() != 'client':
        return jsonify({'msg': 'Non autorisé'}), 403

    # stocke client_id en ObjectId en base, pas en str !
    commande = mongo.db.commandes.find_one({'_id': ObjectId(order_id), 'client_id': user['_id']})
    if not commande:
        return jsonify({'msg': 'Commande non trouvée'}), 404

    if commande.get('date_commande') and hasattr(commande['date_commande'], 'isoformat'):
        commande['date_commande'] = commande['date_commande'].isoformat()

    livraison = mongo.db.livraisons.find_one({'order_id': ObjectId(order_id)})

    result = {
        'statut_commande': commande['statut'],
        'adresse_livraison': commande.get('adresse_livraison', {}),
        'produits': commande.get('produits', []),
        'total': commande.get('total'),
        'date_commande': commande.get('date_commande')
    }
    if livraison:
        result['livreur_location'] = livraison.get('location')
        result['status_livraison'] = livraison.get('status', 'en_cours_de_livraison')
    else:
        result['livreur_location'] = None
        result['status_livraison'] = None
    return jsonify(result), 200
@delivery_bp.route('/assign', methods=['POST'])
@jwt_required()
def assign_livreur_post():
    data = request.get_json()
    order_id = data.get("order_id")
    livreur_id = data.get("livreur_id")

    if not order_id or not livreur_id:
        return jsonify({"msg": "order_id ou livreur_id manquant"}), 400

    return assign_livreur(order_id)
