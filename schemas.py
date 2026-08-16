import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator


# ==========================================
# 1. KULLANICI / AUTH ŞEMALARI
# ==========================================

class KullaniciOlustur(BaseModel):
    isim: str
    eposta: str
    sifre: str
    sifre_tekrar: Optional[str] = None
    kullanici_adi: Optional[str] = None

    @field_validator('sifre')
    @classmethod
    def sifre_guvenlik_kontrolu(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Şifre en az 8 karakter uzunluğunda olmalıdır.")
        if not any(c.isupper() for c in v):
            raise ValueError("Şifre en az 1 büyük harf içermelidir.")
        if not re.search(r"[!@#$%^&*?_~+\-]", v):
            raise ValueError("Şifre en az 1 özel karakter (!@#$%^&*?_~+-) içermelidir.")
        return v


class KullaniciGuncelle(BaseModel):
    isim: str
    eposta: str
    sifre: Optional[str] = None

    @field_validator('sifre')
    @classmethod
    def opsiyonel_sifre_kontrolu(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            if len(v) < 8:
                raise ValueError("Yeni şifre en az 8 karakter uzunluğunda olmalıdır.")
            if not any(c.isupper() for c in v):
                raise ValueError("Yeni şifre en az 1 büyük harf içermelidir.")
            if not re.search(r"[!@#$%^&*?_~+\-]", v):
                raise ValueError("Yeni şifre en az 1 özel karakter içermelidir.")
        return v


class KullaniciGiris(BaseModel):
    eposta: str
    sifre: str


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ==========================================
# 2. ARKADAŞLIK ŞEMALARI
# ==========================================

class FriendRequestSchema(BaseModel):
    hedef_kullanici_adi: str


class FriendResponseSchema(BaseModel):
    istek_id: int
    kabul_mu: bool


# ==========================================
# 3. GRUP & DAVET ŞEMALARI
# ==========================================

class GrupOlusturSchema(BaseModel):
    grup_adi: str
    aciklama: Optional[str] = ""
    grup_tipi: Optional[str] = "genel"


class GrupGuncelleSchema(BaseModel):
    grup_adi: str
    aciklama: Optional[str] = ""


class DirectGroupInviteSchema(BaseModel):
    grup_id: int
    davet_edilen_id: int


class GroupInviteResponseSchema(BaseModel):
    davet_id: int
    kabul_mu: bool


class JoinGroupSchema(BaseModel):
    token: str


# ==========================================
# 4. TAKVİM & ETKİNLİK ŞEMALARI
# ==========================================

class EtkinlikEkleSchema(BaseModel):
    baslik: str
    baslangic: datetime
    bitis: datetime
    oncelik: Optional[int] = 1
    grup_id: Optional[int] = None

    @model_validator(mode='after')
    def zaman_tutarlilik_kontrolu(self):
        if self.bitis <= self.baslangic:
            raise ValueError("Bitiş zamanı, başlangıç zamanından sonra olmalıdır.")
        return self


# ==========================================
# 5. BULUŞMA TEKLİFİ ŞEMALARI
# ==========================================

class GrupTeklifOlusturSchema(BaseModel):
    grup_id: int
    baslik: str
    tarih: str
    baslangic_saat: str
    bitis_saat: str


class GrupTeklifYanitSchema(BaseModel):
    teklif_id: int
    kabul_mu: bool