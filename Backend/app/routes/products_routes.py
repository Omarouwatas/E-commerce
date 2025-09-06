from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity
from app.extensions import mongo
from bson import ObjectId
from datetime import datetime
from app.utils.auth_utils import get_current_user
from app.models.product_model import Product
from rapidfuzz import process,fuzz
from app.extensions import mongo
import os
from werkzeug.utils import secure_filename
from flask import current_app, send_from_directory
UPLOAD_FOLDER = os.path.join("assets", "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
BASE_URL = "http://192.168.1.7:5000"
def serialize_product(product):
    product["_id"] = str(product["_id"])
    product["images"] = [
        f"{BASE_URL}{path}" for path in product.get("images", [])
    ]
    return product

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

products_bp = Blueprint("products", __name__)

def admin_only():
    user = get_current_user()
    if not user or user.get("role") != "ADMIN":
        return False
    return True


@products_bp.route("/", methods=["GET"])
@jwt_required(optional=True)
def get_products():
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        skip = (page - 1) * limit
        query = {}
        category = request.args.get("category")
        brand = request.args.get("brand")

        if category:
            query["category"] = category
        if brand:
            query["brand"] = brand
        total_count = mongo.db.products.count_documents(query)
        cursor = mongo.db.products.find(query).skip(skip).limit(limit)
        products = [serialize_product(p) for p in cursor]
        for prod in cursor:
            prod["_id"] = str(prod["_id"])
            products.append(prod)
        has_more = (skip + limit) < total_count
        return jsonify({
            "products": products,
            "hasMore": has_more
        }), 200
    except Exception as e:
        print("Erreur get_products:", e)
        return jsonify({"msg": "Erreur serveur"}), 500


@products_bp.route('/', methods=['POST'])
def add_product():
    try:
        name = request.form.get("name")
        price = request.form.get("price")
        stock = request.form.get("stock")
        description = request.form.get("description", "")
        brand = request.form.get("brand")
        category = request.form.get("category")
        colors = request.form.getlist("colors") or []  # plusieurs ou 1 couleur
        images = request.files.getlist("images") 
        if not all([name, price, stock, brand, category]):
            return jsonify({"msg": "Champs obligatoires manquants"}), 400

        saved_image_paths = []
        upload_dir = os.path.join("assets", "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        for img in images:
            filename = img.filename
            path = os.path.join(upload_dir, filename)
            img.save(path)
            saved_image_paths.append(f"/assets/uploads/{filename}")

        product = Product(
            name=name,
            price=price,
            quantity=stock,
            description=description,
            brand=brand,
            category=category,
            colors=colors,
            images=saved_image_paths,
            rating=None,
            reviews_count=0
        )

        mongo.db.products.insert_one(product.to_dict())
        return jsonify({"msg": "Produit ajouté"}), 201

    except Exception as e:
        print("❌ Erreur :", e)
        return jsonify({"msg": "Erreur serveur"}), 500
@products_bp.route('/assets/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory('assets/uploads', filename)

@products_bp.route('/json', methods=['POST'])
@jwt_required()
def add_product_from_json():
    try:
        data = request.get_json()

        required_fields = ["name", "price", "stock", "brand", "category"]
        if not all(field in data and data[field] for field in required_fields):
            return jsonify({"msg": "Champs obligatoires manquants"}), 400

        # Initialisation des valeurs
        name = data["name"]
        price = data["price"]
        stock = data["stock"]
        description = data.get("description", "")
        brand = data["brand"]
        category = data["category"]
        colors = data.get("colors", [])
        images = data.get("images", [])

        # Création du produit
        product = Product(
            name=name,
            price=price,
            quantity=stock,
            description=description,
            brand=brand,
            category=category,
            colors=colors,
            images=images,
            rating=None,
            reviews_count=0
        )

        mongo.db.products.insert_one(product.to_dict())
        return jsonify({"msg": "Produit ajouté (JSON)"}), 201

    except Exception as e:
        print("❌ Erreur JSON:", e)
        return jsonify({"msg": "Erreur serveur"}), 500

@products_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_products():
    products = list(mongo.db.products.find())
    for p in products:
        p["_id"] = str(p["_id"])
    return jsonify(products), 200

@products_bp.route("/<product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    if not admin_only():
        return jsonify({"msg": "Admins only"}), 403

    data = request.get_json()
    update_fields = {}

    if "name" in data:
        update_fields["name"] = data["name"]
    if "price" in data:
        update_fields["price"] = float(data["price"])
    if "stock" in data:
        update_fields["stock"] = int(data["stock"])

    result = mongo.db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        return jsonify({"msg": "Product not found"}), 404

    return jsonify({"msg": "Product updated successfully"}), 200

@products_bp.route("/<product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    if not admin_only():
        return jsonify({"msg": "Admins only"}), 403

    result = mongo.db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        return jsonify({"msg": "Product not found"}), 404
    return jsonify({"msg": "Product deleted successfully"}), 200
@products_bp.route("/by-category/<categorie>", methods=["GET"])
@jwt_required()
def get_products_by_category(categorie):
    produits = list(mongo.db.products.find({"categorie": categorie}))
    for p in produits:
        p["_id"] = str(p["_id"])
    return jsonify(produits), 200
@products_bp.route("/<product_id>", methods=["GET"])
@jwt_required(optional=True)
def get_product(product_id):
    product = mongo.db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({"msg": "Produit introuvable"}), 404

    return jsonify(serialize_product(product)), 200



@products_bp.route("/search")
def search_products():
    query = request.args.get("q", "").lower()
    if not query:
        return jsonify([])

    all_products = list(mongo.db.products.find())
    name_to_product = {p["name"].lower(): p for p in all_products}
    product_names = list(name_to_product.keys())

    results = process.extract(
        query,
        product_names,
        scorer=fuzz.WRatio,
        limit=5,
        score_cutoff=45
    )

    final_products = [name_to_product[name] for name, score,_ in results]
    return jsonify(final_products)