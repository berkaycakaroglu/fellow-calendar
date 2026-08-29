import os
import bcrypt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app_database import get_db
import models

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("KRİTİK HATA: JWT_SECRET_KEY ortam değişkeni tanımlanmamış!")

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def sifreyi_hashle(sifre: str) -> str:
    """Şifreyi doğrudan standart bcrypt kütüphanesi ile güvenle hashler."""
    # Bcrypt maksimum 72 byte kabul eder
    sifre_bytes = sifre.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(sifre_bytes, salt).decode('utf-8')


def sifre_dogrula(duz_sifre: str, hashlenmis_sifre: str) -> bool:
    """Doğrudan bcrypt checkpw kullanarak şifreyi doğrular."""
    if not hashlenmis_sifre or not duz_sifre:
        return False
    try:
        duz_sifre_bytes = duz_sifre.encode('utf-8')[:72]
        hash_bytes = hashlenmis_sifre.encode('utf-8')
        return bcrypt.checkpw(duz_sifre_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Kullanıcı için geçerlilik süresi olan bir JWT token üretir."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.Kullanici:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Oturum süreniz dolmuş veya geçersiz kimlik bilgisi. Lütfen tekrar giriş yapın.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    kullanici = db.query(models.Kullanici).filter(models.Kullanici.id == user_id).first()
    if kullanici is None:
        raise credentials_exception
    return kullanici