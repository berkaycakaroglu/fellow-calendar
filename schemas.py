from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class KullaniciOlustur(BaseModel):
    isim: str
    eposta: str
    sifre: str
    sifre_tekrar: Optional[str] = None
    kullanici_adi: Optional[str] = None


class KullaniciGuncelle(BaseModel):
    isim: str
    eposta: str
    sifre: Optional[str] = None


class KullaniciGiris(BaseModel):
    eposta: str
    sifre: str


# Arkadaşlık Şemaları
class FriendRequestSchema(BaseModel):
    gonderen_id: int
    hedef_kullanici_adi: str


class FriendResponseSchema(BaseModel):
    istek_id: int
    kabul_mu: bool


# Grup Şemaları
class GrupOlusturSchema(BaseModel):
    grup_adi: str
    aciklama: Optional[str] = ""
    olusturan_id: int
    grup_tipi: Optional[str] = "genel"


class GrupGuncelleSchema(BaseModel):
    grup_adi: str
    aciklama: Optional[str] = ""
    kullanici_id: int


class DirectGroupInviteSchema(BaseModel):
    grup_id: int
    gonderen_id: int
    davet_edilen_id: int


class GroupInviteResponseSchema(BaseModel):
    davet_id: int
    kabul_mu: bool


class JoinGroupSchema(BaseModel):
    kullanici_id: int
    token: str


# Takvim
class EtkinlikEkleSchema(BaseModel):
    kullanici_id: int
    baslik: str
    baslangic: datetime
    bitis: datetime
    oncelik: Optional[int] = 1
    grup_id: Optional[int] = None