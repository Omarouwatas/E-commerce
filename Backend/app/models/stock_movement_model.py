from bson import ObjectId
from datetime import datetime

class StockMovement:
    def __init__(self, product_id, type_mouvement, quantite, user_id, raison, emplacement, date_mouvement=None, _id=None):
        self._id = _id if _id else ObjectId()
        self.product_id = product_id
        self.type_mouvement = type_mouvement  
        self.quantite = int(quantite)
        self.user_id = user_id
        self.raison = raison
        self.emplacement = emplacement
        self.date_mouvement = date_mouvement or datetime.utcnow()

    def to_dict(self):
        return {
            "_id": self._id,
            "product_id": self.product_id,
            "type_mouvement": self.type_mouvement,
            "quantite": self.quantite,
            "user_id": self.user_id,
            "raison": self.raison,
            "emplacement": self.emplacement,
            "date_mouvement": self.date_mouvement
        }

    @staticmethod
    def from_dict(data):
        return StockMovement(
            product_id=data.get("product_id"),
            type_mouvement=data.get("type_mouvement"),
            quantite=data.get("quantite"),
            user_id=data.get("user_id"),
            raison=data.get("raison"),
            emplacement=data.get("emplacement"),
            date_mouvement=data.get("date_mouvement"),
            _id=data.get("_id")
        )
