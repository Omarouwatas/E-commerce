from bson import ObjectId
from datetime import datetime

class Product:
    def __init__(self, name, price, description="", quantity=0, category="", brand="", colors=None, images=None,
        rating=None, reviews_count=0, _id=None, date_added=None):
        self._id = _id if _id else ObjectId()
        self.name = name
        self.price = float(price)
        self.description = description
        self.quantity = int(quantity)
        self.category = category
        self.brand = brand
        self.colors = colors if colors else []
        self.images = images if images else []
        self.rating = float(rating) if rating is not None else None
        self.reviews_count = int(reviews_count)
        self.date_added = date_added if date_added else datetime.utcnow()

    def to_dict(self):
        return {
            "_id": self._id,
            "name": self.name,
            "price": self.price,
            "description": self.description,
            "quantity": self.quantity,
            "category": self.category,
            "brand": self.brand,
            "colors": self.colors,
            "images": self.images,
            "rating": self.rating,
            "reviews_count": self.reviews_count,
            "date_added": self.date_added,
        }

    @staticmethod
    def from_dict(data):
        return Product(
            name=data.get("name"),
            price=data.get("price"),
            description=data.get("description", ""),
            quantity=data.get("quantity", 0),
            category=data.get("category", ""),
            brand=data.get("brand", ""),
            colors=data.get("colors", []),
            images=data.get("images", []),
            rating=data.get("rating"),
            reviews_count=data.get("reviews_count", 0),
            _id=data.get("_id"),
            date_added=data.get("date_added")
        )
