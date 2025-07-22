

# === Configuration ===

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1MjgzODYzOSwianRpIjoiZmZkN2E3OTUtNDYzZi00YmYyLTg0MzgtNjE0NTYzODE0OGEwIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjY4NmZkNjlkNTAyODRiNGUyM2Y2MTQwYyIsIm5iZiI6MTc1MjgzODYzOSwiY3NyZiI6IjkyNGRhN2Q5LTNhMTgtNDlkMS1hMzMwLWVjZmM5YWU4OTk4ZCIsImV4cCI6MTc1MjkyNTAzOX0.nbrf-y_wbdjb5FZFbBQgo3a-6c_ztmwv9YXLQj2a-ks"  # Remplace par ton vrai JWT
import requests

BASE_URL = "http://127.0.0.1:5000/api/products/json"
headers = {"Content-Type": "application/json",
           "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1MjgzODYzOSwianRpIjoiZmZkN2E3OTUtNDYzZi00YmYyLTg0MzgtNjE0NTYzODE0OGEwIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjY4NmZkNjlkNTAyODRiNGUyM2Y2MTQwYyIsIm5iZiI6MTc1MjgzODYzOSwiY3NyZiI6IjkyNGRhN2Q5LTNhMTgtNDlkMS1hMzMwLWVjZmM5YWU4OTk4ZCIsImV4cCI6MTc1MjkyNTAzOX0.nbrf-y_wbdjb5FZFbBQgo3a-6c_ztmwv9YXLQj2a-ks "}

products = [
    {
        "name": "Winter Hoodie",
        "price": 59.99,
        "stock": 25,
        "description": "Sweat à capuche chaud et confortable, parfait pour les journées d'hiver.",
        "brand": "Zara",
        "category": "Clothes",
        "colors": ["Gris", "Noir"],
        "images": ["/assets/uploads/hoddies.jpg"]
    },
    {
        "name": "Leather Jacket",
        "price": 120.00,
        "stock": 10,
        "description": "Veste en cuir véritable pour un style urbain et élégant.",
        "brand": "Stradivarius",
        "category": "Clothes",
        "colors": ["Marron"],
        "images": ["/assets/uploads/jackets.jpg"]
    },
    {
        "name": "Running Joggers",
        "price": 39.99,
        "stock": 40,
        "description": "Pantalons joggers légers et flexibles, idéals pour le sport ou la détente.",
        "brand": "Nike",
        "category": "Clothes",
        "colors": ["Bleu", "Gris"],
        "images": ["/assets/uploads/joggers.jpg"]
    },
    {
        "name": "Work Laptop",
        "price": 899.00,
        "stock": 12,
        "description": "Ordinateur portable puissant avec processeur rapide et écran haute résolution.",
        "brand": "HP",
        "category": "Laptops",
        "colors": ["Gris"],
        "images": ["/assets/uploads/laptop.jpg"]
    },
    {
        "name": "Casual Pants",
        "price": 45.00,
        "stock": 22,
        "description": "Pantalon léger pour un usage quotidien avec une coupe moderne.",
        "brand": "Uniqlo",
        "category": "Clothes",
        "colors": ["Noir", "Beige"],
        "images": ["/assets/uploads/pants.jpg"]
    },
    {
        "name": "Slim Fit Pants",
        "price": 49.00,
        "stock": 18,
        "description": "Pantalon coupe slim avec finition élégante, idéal pour le bureau.",
        "brand": "H&M",
        "category": "Clothes",
        "colors": ["Bleu marine"],
        "images": ["/assets/uploads/pants2.jpg"]
    },
    {
        "name": "Casual T-shirt",
        "price": 25.00,
        "stock": 35,
        "description": "T-shirt confortable pour un look décontracté et stylé.",
        "brand": "Pull&Bear",
        "category": "Clothes",
        "colors": ["Blanc", "Vert"],
        "images": ["/assets/uploads/Tshirt.jpg"]
    },
    {
        "name": "Smart Watch",
        "price": 199.99,
        "stock": 20,
        "description": "Montre connectée avec suivi de santé, notifications, et GPS intégré.",
        "brand": "Samsung",
        "category": "Accessories",
        "colors": ["Noir"],
        "images": ["/assets/uploads/watches.jpg"]
    }
]

for product in products:
    response = requests.post(BASE_URL, json=product, headers=headers)

if response.status_code == 201:
    print("✅ Produit ajouté avec succès")
else:
    print(f"Erreur {response.status_code}: {response.text}")
