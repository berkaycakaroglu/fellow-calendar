# schemas.py
from pydantic import BaseModel

class KullaniciOlustur(BaseModel):
    isim: str
    eposta: str
    sifre: str
    sifre_tekrar: str

class KullaniciGiris(BaseModel):
    eposta: str
    sifre: str