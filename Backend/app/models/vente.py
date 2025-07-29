from bson import ObjectId
from datetime import datetime

class Vente:
    def __init__(self, produits, total, utilisateur_id=None, mode_paiement="cash", _id=None, date_vente=None):
        self._id = _id or ObjectId()
        self.produits = produits
        self.total = float(total)
        self.mode_paiement = mode_paiement
        self.date_vente = date_vente or datetime.utcnow()
        self.utilisateur_id = utilisateur_id 

    def to_dict(self):
        return {
            "_id": self._id,
            "produits": self.produits,
            "total": self.total,
            "mode_paiement": self.mode_paiement,
            "date_vente": self.date_vente,
            "utilisateur_id": self.utilisateur_id
        }
