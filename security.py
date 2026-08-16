import hashlib
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app_database import get_db
import models

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "varsayilan_gizli_anahtar_2026")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def sifreyi_hashle(sifre: str) -> str:
    """Şifreyi güvenli bcrypt algoritmasıyla tuzlayarak (salt) hashler."""
    return pwd_context.hash(sifre)


def sifre_dogrula(duz_sifre: str, hashlenmis_sifre: str) -> bool:
    """
    Girilen şifreyi doğrular.
    Bcrypt, SHA-256 veya eski düz metin formatlarını destekler.
    """
    if not hashlenmis_sifre:
        return False

    # 1. Bcrypt Kontrolü ($2b$, $2a$, $2y$ ile başlar)
    if hashlenmis_sifre.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            return pwd_context.verify(duz_sifre, hashlenmis_sifre)
        except Exception:
            return False

    # 2. Eski SHA-256 Hash Kontrolü
    sha256_hash = hashlib.sha256(duz_sifre.encode("utf-8")).hexdigest()
    if hashlenmis_sifre == sha256_hash:
        return True

    # 3. Eski Düz Metin Kontrolü
    if hashlenmis_sifre == duz_sifre:
        return True

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
    """
    Authorization: Bearer <token> başlığını okur ve doğrulanmış Kullanici modelini döner.
    """
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