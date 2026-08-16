import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# .env dosyasını yükle
load_dotenv()

# Bağlantı adresini .env dosyasından güvenli bir şekilde al
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(".env dosyasında 'DATABASE_URL' tanımlanmamış!")

engine = create_engine(
    DATABASE_URL,
    pool_recycle=3600,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Veritabanı oturumu için Dependency Injection fonksiyonu
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()