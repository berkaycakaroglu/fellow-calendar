# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# NOT: 'root' yazan yere kendi MySQL kullanıcı adını, 'sifre' yazan yere MySQL şifreni yazmalısın.
# Sondaki 'fellow_calendar_db' ise MySQL'de oluşturacağımız veri tabanının adı olacak.
DATABASE_URL = "mysql+pymysql://root:Dameisabuck0!@localhost:3306/fellow_calendar_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Veri tabanı oturumu açıp kapatmak için yardımcı fonksiyon
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()