# Backend/app/models/delivery_model.py
from datetime import datetime
from app import mongo

class Livraisons :
    def __init__(self, order_id, livreur_id, status='en_cours_de_livraison', location=None):
        self.order_id = order_id
        self.livreur_id = livreur_id
        self.status = status
        self.location = location or {'lat': 0.0, 'lng': 0.0}
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            'order_id': self.order_id,
            'livreur_id': self.livreur_id,
            'status': self.status,
            'location': self.location,
            'created_at': self.created_at
        }

    def save(self):
        return mongo.db.livraisons.insert_one(self.to_dict())
