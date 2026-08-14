from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from app_database import Base


class Kullanici(Base):
    __tablename__ = "kullanicilar"

    id = Column(Integer, primary_key=True, index=True)
    isim = Column(String(50), nullable=False)
    kullanici_adi = Column(String(50), unique=True, index=True, nullable=True)
    eposta = Column(String(50), unique=True, index=True, nullable=False)
    sifre = Column(String(255), nullable=False)


class Arkadaslik(Base):
    __tablename__ = "arkadasliklar"

    id = Column(Integer, primary_key=True, index=True)
    gonderen_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"))
    alan_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"))
    durum = Column(String(20), default="beklemede", nullable=False)


class Grup(Base):
    __tablename__ = "gruplar"

    id = Column(Integer, primary_key=True, index=True)
    grup_adi = Column(String(100), nullable=False)
    aciklama = Column(Text, nullable=True)  # YENİ: Grup Açıklaması
    grup_tipi = Column(String(20), default="genel", nullable=False)
    olusturan_kullanici_id = Column(Integer, ForeignKey("kullanicilar.id"))


class GrupUye(Base):
    __tablename__ = "grup_uyeleri"

    id = Column(Integer, primary_key=True, index=True)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"))
    grup_id = Column(Integer, ForeignKey("gruplar.id", ondelete="CASCADE"))


class GrupDavet(Base):
    __tablename__ = "grup_davetleri"

    id = Column(Integer, primary_key=True, index=True)
    grup_id = Column(Integer, ForeignKey("gruplar.id", ondelete="CASCADE"))
    gonderen_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"))
    davet_edilen_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"))
    durum = Column(String(20), default="beklemede")  # 'beklemede', 'kabul_edildi', 'reddedildi'


class DavetLink(Base):
    __tablename__ = "davet_linkleri"

    id = Column(Integer, primary_key=True, index=True)
    grup_id = Column(Integer, ForeignKey("gruplar.id", ondelete="CASCADE"))
    token = Column(String(100), unique=True, nullable=False)
    aktif_mi = Column(Boolean, default=True)


class TakvimEtkinlik(Base):
    __tablename__ = "takvim_etkinlikleri"

    id = Column(Integer, primary_key=True, index=True)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"))
    baslik = Column(String(100), nullable=False)
    baslangic = Column(DateTime, nullable=False)
    bitis = Column(DateTime, nullable=False)
    oncelik = Column(Integer, default=1)
    grup_id = Column(Integer, ForeignKey("gruplar.id", ondelete="SET NULL"), nullable=True)