from sqlalchemy import (
    Column, Integer, String, ForeignKey,
    DateTime, Boolean, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app_database import Base


class Kullanici(Base):
    __tablename__ = "kullanicilar"

    id = Column(Integer, primary_key=True, index=True)
    isim = Column(String(50), nullable=False)
    kullanici_adi = Column(String(50), unique=True, index=True, nullable=True)
    eposta = Column(String(50), unique=True, index=True, nullable=False)
    sifre = Column(String(255), nullable=False)

    # İlişkiler
    etkinlikler = relationship("TakvimEtkinlik", back_populates="kullanici", cascade="all, delete-orphan")
    uye_olunan_gruplar = relationship("GrupUye", back_populates="kullanici", cascade="all, delete-orphan")
    olusturulan_gruplar = relationship("Grup", back_populates="olusturan_kullanici")


class Arkadaslik(Base):
    __tablename__ = "arkadasliklar"

    id = Column(Integer, primary_key=True, index=True)
    gonderen_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"), nullable=False)
    alan_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"), nullable=False)
    durum = Column(String(20), default="beklemede", nullable=False)

    __table_args__ = (
        UniqueConstraint("gonderen_id", "alan_id", name="uq_arkadaslik_gonderen_alan"),
    )


class Grup(Base):
    __tablename__ = "gruplar"

    id = Column(Integer, primary_key=True, index=True)
    grup_adi = Column(String(100), nullable=False)
    aciklama = Column(Text, nullable=True)
    grup_tipi = Column(String(20), default="genel", nullable=False)
    olusturan_kullanici_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="SET NULL"), nullable=True)

    # İlişkiler
    olusturan_kullanici = relationship("Kullanici", back_populates="olusturulan_gruplar")
    uyeler = relationship("GrupUye", back_populates="grup", cascade="all, delete-orphan")
    etkinlikler = relationship("TakvimEtkinlik", back_populates="grup")
    davet_linkleri = relationship("DavetLink", back_populates="grup", cascade="all, delete-orphan")
    teklifler = relationship("GrupTeklif", back_populates="grup", cascade="all, delete-orphan")


class GrupUye(Base):
    __tablename__ = "grup_uyeleri"

    id = Column(Integer, primary_key=True, index=True)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"), nullable=False)
    grup_id = Column(Integer, ForeignKey("gruplar.id", ondelete="CASCADE"), nullable=False)

    kullanici = relationship("Kullanici", back_populates="uye_olunan_gruplar")
    grup = relationship("Grup", back_populates="uyeler")

    __table_args__ = (
        UniqueConstraint("kullanici_id", "grup_id", name="uq_grup_kullanici"),
    )


class GrupDavet(Base):
    __tablename__ = "grup_davetleri"

    id = Column(Integer, primary_key=True, index=True)
    grup_id = Column(Integer, ForeignKey("gruplar.id", ondelete="CASCADE"), nullable=False)
    gonderen_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"), nullable=False)
    davet_edilen_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"), nullable=False)
    durum = Column(String(20), default="beklemede", nullable=False)

    __table_args__ = (
        UniqueConstraint("grup_id", "davet_edilen_id", name="uq_grup_davet"),
    )


class DavetLink(Base):
    __tablename__ = "davet_linkleri"

    id = Column(Integer, primary_key=True, index=True)
    grup_id = Column(Integer, ForeignKey("gruplar.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(100), unique=True, index=True, nullable=False)
    aktif_mi = Column(Boolean, default=True, nullable=False)

    grup = relationship("Grup", back_populates="davet_linkleri")


class TakvimEtkinlik(Base):
    __tablename__ = "takvim_etkinlikleri"

    id = Column(Integer, primary_key=True, index=True)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"), nullable=False)
    baslik = Column(String(100), nullable=False)
    baslangic = Column(DateTime, nullable=False, index=True)
    bitis = Column(DateTime, nullable=False, index=True)
    oncelik = Column(Integer, default=1, nullable=False)
    grup_id = Column(Integer, ForeignKey("gruplar.id", ondelete="SET NULL"), nullable=True)

    kullanici = relationship("Kullanici", back_populates="etkinlikler")
    grup = relationship("Grup", back_populates="etkinlikler")


class GrupTeklif(Base):
    __tablename__ = "grup_teklifleri"

    id = Column(Integer, primary_key=True, index=True)
    grup_id = Column(Integer, ForeignKey("gruplar.id", ondelete="CASCADE"), nullable=False)
    teklif_eden_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"), nullable=False)
    baslik = Column(String(100), nullable=False)
    tarih = Column(String(20), nullable=False)
    baslangic_saat = Column(String(10), nullable=False)
    bitis_saat = Column(String(10), nullable=False)
    olusturulma_tarihi = Column(DateTime, default=datetime.utcnow, nullable=False)

    grup = relationship("Grup", back_populates="teklifler")
    teklif_eden = relationship("Kullanici")
    yanitlar = relationship("GrupTeklifYanit", back_populates="teklif", cascade="all, delete-orphan")


class GrupTeklifYanit(Base):
    __tablename__ = "grup_teklif_yanitlari"

    id = Column(Integer, primary_key=True, index=True)
    teklif_id = Column(Integer, ForeignKey("grup_teklifleri.id", ondelete="CASCADE"), nullable=False)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id", ondelete="CASCADE"), nullable=False)
    kabul_mu = Column(Boolean, nullable=False)

    teklif = relationship("GrupTeklif", back_populates="yanitlar")
    kullanici = relationship("Kullanici")

    __table_args__ = (
        UniqueConstraint("teklif_id", "kullanici_id", name="uq_teklif_kullanici_yanit"),
    )