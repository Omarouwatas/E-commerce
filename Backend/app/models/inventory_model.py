from bson import ObjectId
from datetime import datetime

class Inventory:
    def __init__(self, product_id, quantite_disponible, emplacement, seuil_alerte=0, date_dernier_mouvement=None, _id=None):
        self._id = _id if _id else ObjectId()
        self.product_id = product_id
        self.quantite_disponible = int(quantite_disponible)
        self.emplacement = emplacement
        self.seuil_alerte = seuil_alerte
        self.date_dernier_mouvement = date_dernier_mouvement or datetime.utcnow()

    def to_dict(self):
        return {
            "_id": self._id,
            "product_id": self.product_id,
            "quantite_disponible": self.quantite_disponible,
            "emplacement": self.emplacement,
            "seuil_alerte": self.seuil_alerte,
            "date_dernier_mouvement": self.date_dernier_mouvement
        }

    @staticmethod
    def from_dict(data):
        return Inventory(
            product_id=data.get("product_id"),
            quantite_disponible=data.get("quantite_disponible"),
            emplacement=data.get("emplacement"),
            seuil_alerte=data.get("seuil_alerte", 0),
            date_dernier_mouvement=data.get("date_dernier_mouvement"),
            _id=data.get("_id")
        )
