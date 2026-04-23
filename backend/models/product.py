from sqlalchemy import Column, Integer, String, Float, ForeignKey
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    image_url = Column(String)
    category = Column(String)
    stock = Column(Integer)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)