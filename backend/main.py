from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional

from hashing import hash_password, verify_password
from auth import create_access_token, verify_token
from database import engine, Base, get_db
from models.user import User
from models.product import Product
from models.cart import Cart
from models.order import Order, OrderItem
from schemas.user import UserCreate
from schemas.product import ProductCreate
from schemas.cart import CartAdd

app = FastAPI(title="LuxeMart API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# ── helpers ───────────────────────────────────────────────────────────────────

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = verify_token(token)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ── root ──────────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "LuxeMart API Running"}

# ── auth ──────────────────────────────────────────────────────────────────────

@app.post("/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

# ── products ──────────────────────────────────────────────────────────────────

@app.get("/products/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Product.category).distinct().all()
    return [c[0] for c in cats if c[0]]

@app.get("/products/")
def get_products(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    q = db.query(Product)
    if category:
        q = q.filter(Product.category == category)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    total = q.count()
    products = q.offset(skip).limit(limit).all()
    return {
        "total": total,
        "products": [
            {
                "id": p.id, "name": p.name, "description": p.description,
                "price": p.price, "image_url": p.image_url,
                "category": p.category, "stock": p.stock
            } for p in products
        ]
    }

@app.get("/products/{product_id}")
def get_single_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id, "name": product.name, "description": product.description,
        "price": product.price, "image_url": product.image_url,
        "category": product.category, "stock": product.stock
    }

@app.post("/products/")
def add_product(
    product: ProductCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    new_product = Product(
        name=product.name, description=product.description,
        price=product.price, image_url=product.image_url,
        category=product.category, stock=product.stock
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return {"message": "Product added successfully", "id": new_product.id}

@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    updated: ProductCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.name = updated.name
    product.description = updated.description
    product.price = updated.price
    product.image_url = updated.image_url
    product.category = updated.category
    product.stock = updated.stock
    db.commit()
    return {"message": "Product updated"}

@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}

# ── cart ──────────────────────────────────────────────────────────────────────

@app.post("/cart/add")
def add_to_cart(
    item: CartAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < item.quantity:
        raise HTTPException(status_code=400, detail=f"Only {product.stock} items in stock")

    cart_item = db.query(Cart).filter(
        Cart.user_id == current_user.id,
        Cart.product_id == item.product_id
    ).first()

    if cart_item:
        new_qty = cart_item.quantity + item.quantity
        if new_qty > product.stock:
            raise HTTPException(status_code=400, detail=f"Only {product.stock} items in stock")
        cart_item.quantity = new_qty
    else:
        cart_item = Cart(user_id=current_user.id, product_id=item.product_id, quantity=item.quantity)
        db.add(cart_item)
    db.commit()
    return {"message": "Added to cart"}

@app.get("/cart/")
def view_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
    result = []
    total_price = 0
    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        item_total = product.price * item.quantity
        total_price += item_total
        result.append({
            "product_id": product.id, "name": product.name,
            "price": product.price, "image_url": product.image_url,
            "quantity": item.quantity, "item_total": item_total,
            "stock": product.stock
        })
    return {"cart_items": result, "total_price": round(total_price, 2)}

@app.put("/cart/update")
def update_cart(
    item: CartAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_item = db.query(Cart).filter(
        Cart.user_id == current_user.id,
        Cart.product_id == item.product_id
    ).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not in cart")
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if item.quantity > product.stock:
        raise HTTPException(status_code=400, detail=f"Only {product.stock} in stock")
    if item.quantity <= 0:
        db.delete(cart_item)
    else:
        cart_item.quantity = item.quantity
    db.commit()
    return {"message": "Cart updated"}

@app.delete("/cart/remove/{product_id}")
def remove_from_cart(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_item = db.query(Cart).filter(
        Cart.user_id == current_user.id,
        Cart.product_id == product_id
    ).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not in cart")
    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed from cart"}

# ── orders ────────────────────────────────────────────────────────────────────

@app.post("/orders/")
def place_order(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

    total_amount = 0
    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        total_amount += product.price * item.quantity

    new_order = Order(user_id=current_user.id, total_amount=round(total_amount, 2), status="Pending")
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        db.add(OrderItem(
            order_id=new_order.id, product_id=product.id,
            quantity=item.quantity, price=product.price
        ))
        product.stock -= item.quantity
        db.delete(item)

    db.commit()
    return {"message": "Order placed successfully", "order_id": new_order.id, "total_amount": total_amount}

@app.get("/orders/")
def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return [
        {"order_id": o.id, "total_amount": o.total_amount, "status": o.status, "created_at": o.created_at}
        for o in orders
    ]

@app.get("/orders/{order_id}")
def get_single_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    items = []
    for item in order_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        items.append({
            "product_name": product.name, "price": item.price,
            "quantity": item.quantity, "item_total": item.price * item.quantity
        })
    return {
        "order_id": order.id, "total_amount": order.total_amount,
        "status": order.status, "created_at": order.created_at,
        "items": items
    }

# ── admin ─────────────────────────────────────────────────────────────────────

@app.get("/admin/orders")
def admin_get_all_orders(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        user = db.query(User).filter(User.id == o.user_id).first()
        result.append({
            "order_id": o.id, "user_name": user.name, "user_email": user.email,
            "total_amount": o.total_amount, "status": o.status, "created_at": o.created_at
        })
    return result

@app.put("/admin/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str = Query(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.commit()
    return {"message": "Status updated"}