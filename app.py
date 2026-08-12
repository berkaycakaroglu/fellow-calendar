import hashlib
import re
import secrets
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app_database import engine, get_db
import models
import schemas

app = FastAPI()

# --- CORS AYARLARI (TEK VE TEMİZ TANIMLAMA) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme aşamasında tüm origin'lere izin verir
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, OPTIONS vb. tüm methodlara izin verir
    allow_headers=["*"],
)

# Tabloları MySQL'de otomatik oluşturur
models.Base.metadata.create_all(bind=engine)


# --- ŞİFRE GİZLEME FONKSİYONU ---
def sifreyi_hashle(sifre: str):
    return hashlib.sha256(sifre.encode()).hexdigest()


# --- KULLANICI KAYIT OLMA (POST) ---
@app.post("/kullanicilar/")
def kullanici_kaydet(veri: schemas.KullaniciOlustur, db: Session = Depends(get_db)):
    if veri.sifre != veri.sifre_tekrar:
        raise HTTPException(status_code=400, detail="Şifreler uyuşmuyor!")

    if len(veri.sifre) < 8 or not any(c.isupper() for c in veri.sifre) or not re.search(r"[!@#$%^&*?_~+\-]", veri.sifre):
        raise HTTPException(
            status_code=400,
            detail="Şifre en az 8 karakter, 1 büyük harf ve 1 özel karakter (? ! vb.) içermelidir."
        )

    db_kullanici = db.query(models.Kullanici).filter(models.Kullanici.eposta == veri.eposta).first()
    if db_kullanici:
        raise HTTPException(status_code=400, detail="Bu mail ile bir hesap bulunuyor.")

    yeni_kullanici = models.Kullanici(
        isim=veri.isim,
        kullanici_adi=getattr(veri, 'kullanici_adi', None),
        eposta=veri.eposta,
        sifre=sifreyi_hashle(veri.sifre)
    )

    db.add(yeni_kullanici)
    db.commit()

    return {"mesaj": "Kayıt başarılı! Şimdi giriş yapabilirsiniz."}


# --- KULLANICI GİRİŞ YAPMA (POST) ---
@app.post("/giris/")
def giris_yap(veri: schemas.KullaniciGiris, db: Session = Depends(get_db)):
    kullanici = db.query(models.Kullanici).filter(models.Kullanici.eposta == veri.eposta).first()

    if not kullanici:
        raise HTTPException(status_code=404, detail="Bu maile ait bir hesap bulunmamaktadır.")

    if kullanici.sifre != sifreyi_hashle(veri.sifre):
        raise HTTPException(status_code=400, detail="Şifre hatalı!")

    return {
        "mesaj": "Giriş başarılı",
        "isim": kullanici.isim,
        "kullanici_adi": getattr(kullanici, 'kullanici_adi', None),
        "id": kullanici.id
    }


# --- GRUP VE ARKADAŞLIK ENDPOINT'LERİ ---

@app.post("/api/groups/create")
def create_group(req: schemas.GrupOlusturSchema, db: Session = Depends(get_db)):
    # 1. Yeni grubu oluştur (grup_tipi varsayılan olarak 'genel' atanır)
    yeni_grup = models.Grup(
        grup_adi=req.grup_adi,
        grup_tipi="genel",
        olusturan_kullanici_id=req.olusturan_id
    )
    db.add(yeni_grup)
    db.commit()
    db.refresh(yeni_grup)

    # 2. Grubu oluşturan kullanıcıyı otomatik üye yap (GrupUye sınıfı kullanılıyor)
    yeni_uye = models.GrupUye(
        grup_id=yeni_grup.id,
        kullanici_id=req.olusturan_id
    )
    db.add(yeni_uye)
    db.commit()

    return {"message": "Grup başarıyla oluşturuldu!", "grup_id": yeni_grup.id}


@app.post("/api/friends/request")
def send_friend_request(req: schemas.FriendRequestSchema, db: Session = Depends(get_db)):
    hedef_kullanici = db.query(models.Kullanici).filter(models.Kullanici.kullanici_adi == req.kullanici_adi).first()
    if not hedef_kullanici:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    return {"message": f"@{req.kullanici_adi} kullanıcısına istek gönderildi."}


@app.post("/api/groups/{grup_id}/generate-invite")
def generate_group_invite(grup_id: int, db: Session = Depends(get_db)):
    davet_kodu = f"FLW-{secrets.token_hex(3).upper()}"
    return {
        "grup_id": grup_id,
        "davet_kodu": davet_kodu,
        "davet_linki": f"http://localhost:5173/join/{davet_kodu}"
    }


@app.post("/api/groups/join")
def join_group_by_code(req: schemas.JoinGroupSchema, db: Session = Depends(get_db)):
    return {"message": "Gruba başarıyla katıldınız!"}


# --- ORTAK RANDEVU HESAPLAMA ---
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