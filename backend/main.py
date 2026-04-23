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

app = FastAPI(title="PlantO API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
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
    return {"message": "PlantO API Running"}

# ── auth ──────────────────────────────────────────────────────────────────────

@app.post("/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
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

# ── products (public) ─────────────────────────────────────────────────────────

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
        "products": [_product_dict(p) for p in products]
    }

@app.get("/products/{product_id}")
def get_single_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product_dict(p)

# ── products (admin — own products only) ──────────────────────────────────────

@app.post("/products/")
def add_product(
    product: ProductCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    new_product = Product(
        name=product.name, description=product.description,
        price=product.price, image_url=product.image_url,
        category=product.category, stock=product.stock,
        owner_id=admin.id          # ← tag with admin's id
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
    # Only owner admin can update
    if product.owner_id != admin.id:
        raise HTTPException(status_code=403, detail="You can only edit your own products")
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
    # Only owner admin can delete
    if product.owner_id != admin.id:
        raise HTTPException(status_code=403, detail="You can only delete your own products")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}

# ── admin dashboard — own products + related orders only ──────────────────────

@app.get("/admin/my-products")
def admin_my_products(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Returns only products created by this admin."""
    products = db.query(Product).filter(Product.owner_id == admin.id).all()
    return [_product_dict(p) for p in products]

@app.get("/admin/orders")
def admin_get_orders(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns only orders that contain at least one product owned by this admin.
    Each order row also includes the specific items belonging to this admin.
    """
    # Get all product ids owned by this admin
    my_product_ids = {
        p.id for p in db.query(Product).filter(Product.owner_id == admin.id).all()
    }

    if not my_product_ids:
        return []

    # Find order_ids that have at least one of this admin's products
    relevant_order_items = (
        db.query(OrderItem)
        .filter(OrderItem.product_id.in_(my_product_ids))
        .all()
    )
    order_ids = list({oi.order_id for oi in relevant_order_items})

    result = []
    for order in db.query(Order).filter(Order.id.in_(order_ids)).order_by(Order.created_at.desc()).all():
        buyer = db.query(User).filter(User.id == order.user_id).first()

        # Only the items that belong to this admin
        my_items = [
            oi for oi in db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            if oi.product_id in my_product_ids
        ]
        my_total = sum(oi.price * oi.quantity for oi in my_items)

        items_detail = []
        for oi in my_items:
            product = db.query(Product).filter(Product.id == oi.product_id).first()
            items_detail.append({
                "product_name": product.name if product else "Deleted",
                "quantity": oi.quantity,
                "price": oi.price,
                "item_total": oi.price * oi.quantity
            })

        result.append({
            "order_id": order.id,
            "user_name": buyer.name if buyer else "Unknown",
            "user_email": buyer.email if buyer else "",
            "total_amount": round(my_total, 2),   # only this admin's portion
            "status": order.status,
            "created_at": order.created_at,
            "items": items_detail
        })

    return result

@app.put("/admin/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str = Query(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin can only update status of orders containing their products."""
    my_product_ids = {
        p.id for p in db.query(Product).filter(Product.owner_id == admin.id).all()
    }
    has_my_product = db.query(OrderItem).filter(
        OrderItem.order_id == order_id,
        OrderItem.product_id.in_(my_product_ids)
    ).first()

    if not has_my_product:
        raise HTTPException(status_code=403, detail="You can only update orders containing your products")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    db.commit()
    return {"message": "Status updated"}

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

    total_amount = sum(
        db.query(Product).filter(Product.id == item.product_id).first().price * item.quantity
        for item in cart_items
    )

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
            "product_name": product.name if product else "Deleted",
            "price": item.price, "quantity": item.quantity,
            "item_total": item.price * item.quantity
        })
    return {
        "order_id": order.id, "total_amount": order.total_amount,
        "status": order.status, "created_at": order.created_at,
        "items": items
    }

# ── helper ────────────────────────────────────────────────────────────────────

def _product_dict(p):
    return {
        "id": p.id, "name": p.name, "description": p.description,
        "price": p.price, "image_url": p.image_url,
        "category": p.category, "stock": p.stock,
        "owner_id": p.owner_id
    }