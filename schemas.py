from pydantic import BaseModel, EmailStr
from typing import Optional

# Kullanıcı Kayıt Şeması (app.py içindeki kullanici_kaydet için)
class KullaniciOlustur(BaseModel):
    isim: str
    eposta: str
    sifre: str
    sifre_tekrar: str
    kullanici_adi: Optional[str] = None

# Kullanıcı Giriş Şeması (app.py içindeki giris_yap için)
class KullaniciGiris(BaseModel):
    eposta: str
    sifre: str

# Arkadaşlık İsteği Şeması
class FriendRequestSchema(BaseModel):
    kullanici_adi: str

# Grup Davet Linki / Kodu Şemaları
class GroupInviteSchema(BaseModel):
    grup_id: int

class JoinGroupSchema(BaseModel):
    davet_kodu: str

# Grup Oluşturma Şeması
class GrupOlusturSchema(BaseModel):
    grup_adi: str
    olusturan_id: int