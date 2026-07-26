from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles  # Arayüz dosyaları için eklendi
from fastapi.responses import RedirectResponse  # Otomatik yönlendirme için eklendi
from typing import List
from sqlalchemy.orm import Session
import hashlib  # Şifreleri gizlemek (hash) için eklendi
import re  # Şifre kurallarını (özel karakter vb.) kontrol etmek için eklendi

# Kendi yazdığımız diğer dosyalardan gerekli araçları çekiyoruz
import models
import schemas
from app_database import engine, get_db

app = FastAPI()

# --- HTML VE ARAYÜZ (FRONTEND) AYARLARI ---
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def ana_sayfa_yonlendir():
    return RedirectResponse(url="/static/index.html")


# 🚀 SİHİRLİ SATIR: Tabloları MySQL'de otomatik oluşturur.
models.Base.metadata.create_all(bind=engine)


# --- ŞİFRE GİZLEME FONKSİYONU ---
def sifreyi_hashle(sifre: str):
    return hashlib.sha256(sifre.encode()).hexdigest()


# --- ESKİ STATİK TAKVİM MANTIĞI (Şimdilik duruyor) ---
kullanici_takvimleri = {
    "ahmet": [[10, 12], [15, 17]],
    "mehmet": [[11, 13], [16, 18]]
}


def ortak_bos_saatleri_bul(dolu_zamanlar: List[List[int]]) -> List[List[int]]:
    gunluk_saatler = [True] * 24
    for aralik in dolu_zamanlar:
        baslangic, bitis = aralik[0], aralik[1]
        for saat in range(baslangic, bitis):
            gunluk_saatler[saat] = False

    bos_araliklar = []
    baslangic_saat = None
    for saat in range(9, 22):
        if gunluk_saatler[saat] and baslangic_saat is None:
            baslangic_saat = saat
        elif not gunluk_saatler[saat] and baslangic_saat is not None:
            bos_araliklar.append([baslangic_saat, saat])
            baslangic_saat = None
    if baslangic_saat is not None:
        bos_araliklar.append([baslangic_saat, 22])
    return bos_araliklar


@app.get("/ortak-randevu")
def randevu_oner():
    tum_dolu_zamanlar = kullanici_takvimleri["ahmet"] + kullanici_takvimleri["mehmet"]
    uygun_saatler = ortak_bos_saatleri_bul(tum_dolu_zamanlar)
    return {
        "mesaj": "Ahmet ve Mehmet için uygun buluşma saatleri bulundu!",
        "uygun_araliklar": uygun_saatler
    }


# --- YENİ KAYIT OLMA (POST) ---
@app.post("/kullanicilar/")
def kullanici_kaydet(veri: schemas.KullaniciOlustur, db: Session = Depends(get_db)):
    # 1. Şifreler eşleşiyor mu?
    if veri.sifre != veri.sifre_tekrar:
        raise HTTPException(status_code=400, detail="Şifreler uyuşmuyor!")

    # 2. Şifre kuralları: En az 8 karakter, 1 Büyük harf, 1 Özel karakter
    if len(veri.sifre) < 8 or not any(c.isupper() for c in veri.sifre) or not re.search(r"[!@#$%^&*?_~+\-]",
                                                                                        veri.sifre):
        raise HTTPException(status_code=400,
                            detail="Şifre en az 8 karakter, 1 büyük harf ve 1 özel karakter (? ! vb.) içermelidir.")

    # 3. E-posta adresi daha önce alınmış mı kontrol edelim
    db_kullanici = db.query(models.Kullanici).filter(models.Kullanici.eposta == veri.eposta).first()
    if db_kullanici:
        # BURASI DEĞİŞTİ: JavaScript'in beklediği tam cümle
        raise HTTPException(status_code=400, detail="Bu mail ile bir hesap bulunuyor.")

    # 4. Yeni kullanıcı nesnesini oluşturalım (şifreyi şifreleyerek kaydediyoruz)
    yeni_kullanici = models.Kullanici(
        isim=veri.isim,
        eposta=veri.eposta,
        sifre=sifreyi_hashle(veri.sifre)
    )

    # 5. Veri tabanına ekleyip kaydedelim
    db.add(yeni_kullanici)
    db.commit()

    return {"mesaj": "Kayıt başarılı! Şimdi giriş yapabilirsiniz."}


# --- YENİ GİRİŞ YAPMA (POST) ---
@app.post("/giris/")
def giris_yap(veri: schemas.KullaniciGiris, db: Session = Depends(get_db)):
    kullanici = db.query(models.Kullanici).filter(models.Kullanici.eposta == veri.eposta).first()

    # BURASI DEĞİŞTİ: Hataları ikiye böldük ve JavaScript'in beklediği tam cümleleri yazdık
    if not kullanici:
        raise HTTPException(status_code=404, detail="Bu maile ait bir hesap bulunmamaktadır.")

    if kullanici.sifre != sifreyi_hashle(veri.sifre):
        raise HTTPException(status_code=400, detail="Şifre hatalı!")

    return {"mesaj": "Giriş başarılı", "isim": kullanici.isim}