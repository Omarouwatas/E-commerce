import requests

BASE_URL = "http://localhost:5000"  # change si besoin
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1MzI2MTc1MiwianRpIjoiOGM3NTc4NmUtN2YzNC00ZWQ2LWJkMjEtMDZjZTQ3ZWY2YzJmIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjY4ODAwNWRkNGNjODZiZTAxM2MzNGM2OSIsIm5iZiI6MTc1MzI2MTc1MiwiY3NyZiI6Ijk0MjBlMWNkLTQ0ZDktNDg2ZS04YzcwLWE5M2RlMTZkZGYzYSIsImV4cCI6MTc1MzM0ODE1Mn0.BZBBDCEOE5R8y3ewODUdguMRN8Vel8Nv0v1YVrgejQU"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

payloads = [

    {
        "product_id": "687a3208d9cc94be00fd0a00",  # Remplace avec un ObjectId réel
        "quantite_disponible": 50,
        "emplacement": "Bizerte"
    },
    {
        "product_id": "687a32c3d9cc94be00fd0a01",  # Remplace avec un ObjectId réel
        "quantite_disponible": 20,
        "emplacement": "Bizerte"
    },
    {
        "product_id": "687a32dfd9cc94be00fd0a02",  # Remplace avec un ObjectId réel
        "quantite_disponible": 15,
        "emplacement": "Bizerte"
    },
    {
        "product_id": "687a36e5d9cc94be00fd0a03",  # Remplace avec un ObjectId réel
        "quantite_disponible": 30,
        "emplacement": "Bizerte"
    },
    {
        "product_id": "687a3741d9cc94be00fd0a04",  # Remplace avec un ObjectId réel
        "quantite_disponible": 20,
        "emplacement": "Bizerte"
    }
]

for payload in payloads:
    response = requests.post(f"{BASE_URL}/api/inventory/", headers=headers, json=payload)
