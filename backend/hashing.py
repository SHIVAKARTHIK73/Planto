from passlib.context import CryptContext

# Use bcrypt with truncation error fixed, or fallback to sha256_crypt
pwd_context = CryptContext(
    schemes=["bcrypt", "sha256_crypt"],
    deprecated="auto",
    bcrypt__truncate_error=False  # This handles the 72 byte limit automatically
)

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)