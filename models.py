# models.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from app_database import Base


# models.py içindeki Kullanici sınıfını şu şekilde güncelle:
class Kullanici(Base):
    __tablename__ = "kullanicilar"

    id = Column(Integer, primary_key=True, index=True)
    isim = Column(String(50))
    kullanici_adi = Column(String(50), unique=True, index=True, nullable=True)
    eposta = Column(String(50), unique=True, index=True)
    sifre = Column(String(255), nullable=False)  # YENİ EKLENDİ

class Grup(Base):
    __tablename__ = "gruplar"  # Veritabanındaki tablo adınla birebir aynı olmalı

    id = Column(Integer, primary_key=True, index=True)
    grup_adi = Column(String(100), nullable=False)
    olusturan_kullanici_id = Column(Integer, ForeignKey("kullanicilar.id"))
    grup_tipi = Column(String(20), default="genel", nullable=False)


class GrupUye(Base):
    __tablename__ = "grup_uyeleri"

    id = Column(Integer, primary_key=True, index=True)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id"))
    grup_id = Column(Integer, ForeignKey("gruplar.id"))


class DavetLink(Base):
    __tablename__ = "davet_linkleri"

    id = Column(Integer, primary_key=True, index=True)
    grup_id = Column(Integer, ForeignKey("gruplar.id"))
    token = Column(String(100), unique=True, nullable=False)  # Benzersiz link kodu
    aktif_mi = Column(Boolean, default=True)


class TakvimEtkinlik(Base):
    __tablename__ = "takvim_etkinlikleri"

    id = Column(Integer, primary_key=True, index=True)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id"))
    baslik = Column(String(100), nullable=False)  # Örn: "İş Görüşmesi" veya "Grup Halı Saha"
    baslangic = Column(DateTime, nullable=False)
    bitis = Column(DateTime, nullable=False)

    # Öncelik Durumu:
    # 1 = Düşük (Esnetilebilir buluşma)
    # 2 = Orta (Normal plan)
    # 3 = Yüksek (Asla değiştirilemez, iş görüşmesi vb.)
    oncelik = Column(Integer, default=1)

    # Eğer bu etkinlik bir gruptan geldiyse hangi gruptan geldiğini bilelim
    grup_id = Column(Integer, ForeignKey("gruplar.id"), nullable=True)