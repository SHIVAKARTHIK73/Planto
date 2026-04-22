from pydantic import BaseModel

class CartAdd(BaseModel):
    product_id: int
    quantity: int = 1