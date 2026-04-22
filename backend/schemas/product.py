from pydantic import BaseModel

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    category: str
    stock: int