import os
import secrets
from datetime import datetime, timedelta
from dotenv import load_dotenv

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from app_database import engine, get_db
import models
import schemas
from security import (
    sifreyi_hashle,
    sifre_dogrula,
    create_access_token,
    get_current_user
)

load_dotenv()

app = FastAPI(title="LetsMeet API")

# --- CORS AYARLARI (.env + GitHub Pages tam uyumlu) ---
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "https://berkaycakaroglu.github.io"
]

env_origins = os.getenv("CORS_ORIGINS")
if env_origins:
    ALLOWED_ORIGINS.extend([o.strip() for o in env_origins.split(",") if o.strip()])

ALLOWED_ORIGINS = list(set(ALLOWED_ORIGINS))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Hesaplanan liste middleware'e aktarıldı
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tabloları veritabanında oluştur
models.Base.metadata.create_all(bind=engine)


# ==========================================
# 1. KULLANICI İŞLEMLERİ (AUTH & PROFİL)
# ==========================================

@app.post("/api/users/register", status_code=status.HTTP_201_CREATED)
def kullanici_kaydet(veri: schemas.KullaniciOlustur, db: Session = Depends(get_db)):
    if veri.sifre_tekrar and veri.sifre != veri.sifre_tekrar:
        raise HTTPException(status_code=400, detail="Şifreler uyuşmuyor!")

    if db.query(models.Kullanici).filter_by(eposta=veri.eposta).first():
        raise HTTPException(status_code=400, detail="Bu mail adresi ile zaten bir hesap var.")

    kullanici_adi = veri.kullanici_adi or veri.eposta.split("@")[0]
    if db.query(models.Kullanici).filter_by(kullanici_adi=kullanici_adi).first():
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kullanılıyor.")

    yeni_kullanici = models.Kullanici(
        isim=veri.isim,
        kullanici_adi=kullanici_adi,
        eposta=veri.eposta,
        sifre=sifreyi_hashle(veri.sifre)
    )
    db.add(yeni_kullanici)
    db.commit()
    return {"message": "Kayıt başarılı! Şimdi giriş yapabilirsiniz."}


@app.post("/api/auth/login", response_model=schemas.TokenSchema)
def giris_yap(veri: schemas.KullaniciGiris, db: Session = Depends(get_db)):
    kullanici = db.query(models.Kullanici).filter_by(eposta=veri.eposta).first()

    if not kullanici or not sifre_dogrula(veri.sifre, kullanici.sifre):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı!"
        )

    access_token = create_access_token(data={"sub": str(kullanici.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": kullanici.id,
            "name": kullanici.isim,
            "email": kullanici.eposta,
            "kullanici_adi": kullanici.kullanici_adi
        }
    }


@app.get("/api/auth/verify-session")
def verify_session(current_user: models.Kullanici = Depends(get_current_user)):
    return {
        "status": "valid",
        "user": {
            "id": current_user.id,
            "name": current_user.isim,
            "email": current_user.eposta,
            "kullanici_adi": current_user.kullanici_adi
        }
    }


@app.put("/api/users/update")
def update_user_info(
        veri: schemas.KullaniciGuncelle,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    current_user.isim = veri.isim
    current_user.eposta = veri.eposta
    if veri.sifre and veri.sifre.strip():
        current_user.sifre = sifreyi_hashle(veri.sifre)

    db.commit()
    return {"message": "Profil başarıyla güncellendi!"}


# ==========================================
# 2. GRUP YÖNETİMİ & DAVET İŞLEMLERİ
# ==========================================

@app.post("/api/groups/create")
def create_group(
        req: schemas.GrupOlusturSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    yeni_grup = models.Grup(
        grup_adi=req.grup_adi,
        aciklama=req.aciklama,
        grup_tipi=req.grup_tipi or "genel",
        olusturan_kullanici_id=current_user.id
    )
    db.add(yeni_grup)
    db.commit()
    db.refresh(yeni_grup)

    yeni_uye = models.GrupUye(grup_id=yeni_grup.id, kullanici_id=current_user.id)
    db.add(yeni_uye)

    davet_token = f"LM-{secrets.token_hex(3).upper()}"
    yeni_davet = models.DavetLink(grup_id=yeni_grup.id, token=davet_token, aktif_mi=True)
    db.add(yeni_davet)
    db.commit()

    return {"message": "Grup başarıyla oluşturuldu!", "grup_id": yeni_grup.id, "davet_kodu": davet_token}


@app.get("/api/users/groups")
def get_user_groups(
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    uyelikler = db.query(models.GrupUye).filter_by(kullanici_id=current_user.id).all()
    grup_idleri = [u.grup_id for u in uyelikler]
    gruplar = db.query(models.Grup).filter(models.Grup.id.in_(grup_idleri)).all()

    sonuc = []
    for g in gruplar:
        davet = db.query(models.DavetLink).filter_by(grup_id=g.id, aktif_mi=True).first()
        uye_sayisi = db.query(models.GrupUye).filter_by(grup_id=g.id).count()
        sonuc.append({
            "id": g.id,
            "grup_adi": g.grup_adi,
            "aciklama": g.aciklama,
            "grup_tipi": g.grup_tipi,
            "olusturan_id": g.olusturan_kullanici_id,
            "uye_sayisi": uye_sayisi,
            "davet_kodu": davet.token if davet else f"FLW-{g.id}"
        })
    return sonuc


@app.post("/api/groups/join")
def join_group(
        req: schemas.JoinGroupSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    davet = db.query(models.DavetLink).filter_by(token=req.token, aktif_mi=True).first()
    if not davet:
        raise HTTPException(status_code=404, detail="Geçersiz veya süresi dolmuş davet kodu!")

    var_mi = db.query(models.GrupUye).filter_by(grup_id=davet.grup_id, kullanici_id=current_user.id).first()
    if var_mi:
        return {"message": "Zaten bu grubun üyesisiniz.", "grup_id": davet.grup_id}

    yeni_uye = models.GrupUye(grup_id=davet.grup_id, kullanici_id=current_user.id)
    db.add(yeni_uye)
    db.commit()
    return {"message": "Gruba başarıyla katıldınız!", "grup_id": davet.grup_id}


@app.put("/api/groups/{grup_id}")
def update_group(
        grup_id: int,
        req: schemas.GrupGuncelleSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    grup = db.query(models.Grup).filter_by(id=grup_id).first()
    if not grup:
        raise HTTPException(status_code=404, detail="Grup bulunamadı.")

    if grup.olusturan_kullanici_id != current_user.id:
        raise HTTPException(status_code=403, detail="Yalnızca grup kurucusu grubu düzenleyebilir.")

    grup.grup_adi = req.grup_adi
    grup.aciklama = req.aciklama
    db.commit()
    return {"message": "Grup bilgileri güncellendi!"}

@app.delete("/api/users/me")
def delete_user_account(
    current_user: models.Kullanici = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id

    # 1. Arkadaşlık ve istek kayıtlarını temizle
    db.query(models.Arkadaslik).filter(
        or_(models.Arkadaslik.gonderen_id == user_id, models.Arkadaslik.alan_id == user_id)
    ).delete(synchronize_session=False)

    # 2. Grup davetlerini temizle
    db.query(models.GrupDavet).filter(
        or_(models.GrupDavet.gonderen_id == user_id, models.GrupDavet.davet_edilen_id == user_id)
    ).delete(synchronize_session=False)

    # 3. Grup üyeliklerini temizle
    db.query(models.GrupUye).filter_by(kullanici_id=user_id).delete(synchronize_session=False)

    # 4. Teklif yanıtlarını ve oluşturduğu teklifleri temizle
    db.query(models.GrupTeklifYanit).filter_by(kullanici_id=user_id).delete(synchronize_session=False)
    db.query(models.GrupTeklif).filter_by(teklif_eden_id=user_id).delete(synchronize_session=False)

    # 5. Takvim etkinliklerini temizle
    db.query(models.TakvimEtkinlik).filter_by(kullanici_id=user_id).delete(synchronize_session=False)

    # 6. Kurucusu olduğu grupların kurucu ID'sini boşa çıkar (veya grubu sil)
    kurulan_gruplar = db.query(models.Grup).filter_by(olusturan_kullanici_id=user_id).all()
    for g in kurulan_gruplar:
        g.olusturan_kullanici_id = None

    # 7. Kullanıcıyı sil
    db.delete(current_user)
    db.commit()

    return {"message": "Hesabınız ve tüm ilişkili veriler başarıyla silindi."}

@app.delete("/api/groups/{grup_id}")
def delete_group(
        grup_id: int,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    grup = db.query(models.Grup).filter_by(id=grup_id).first()
    if not grup:
        raise HTTPException(status_code=404, detail="Grup bulunamadı.")

    if grup.olusturan_kullanici_id != current_user.id:
        raise HTTPException(status_code=403, detail="Yalnızca grup kurucusu grubu silebilir.")

    etkinlikler = db.query(models.TakvimEtkinlik).filter_by(grup_id=grup_id).all()
    for e in etkinlikler:
        e.grup_id = None

    db.delete(grup)
    db.commit()
    return {"message": "Grup silindi; grup etkinlikleri kişisel etkinliğe dönüştürüldü."}


@app.post("/api/groups/invite-friend")
def invite_friend_to_group(
        req: schemas.DirectGroupInviteSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    sender_in_group = db.query(models.GrupUye).filter_by(grup_id=req.grup_id, kullanici_id=current_user.id).first()
    if not sender_in_group:
        raise HTTPException(status_code=403, detail="Üyesi olmadığınız bir gruba davet gönderemezsiniz.")

    uye_mi = db.query(models.GrupUye).filter_by(grup_id=req.grup_id, kullanici_id=req.davet_edilen_id).first()
    if uye_mi:
        raise HTTPException(status_code=400, detail="Bu arkadaşınız zaten gruba üye.")

    mevcut_davet = db.query(models.GrupDavet).filter_by(
        grup_id=req.grup_id,
        davet_edilen_id=req.davet_edilen_id,
        durum="beklemede"
    ).first()
    if mevcut_davet:
        raise HTTPException(status_code=400, detail="Zaten gönderilmiş bekleyen bir davet var.")

    yeni_davet = models.GrupDavet(
        grup_id=req.grup_id,
        gonderen_id=current_user.id,
        davet_edilen_id=req.davet_edilen_id,
        durum="beklemede"
    )
    db.add(yeni_davet)
    db.commit()
    return {"message": "Grup daveti arkadaşınıza iletildi!"}


@app.post("/api/groups/respond-invite")
def respond_group_invite(
        req: schemas.GroupInviteResponseSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    davet = db.query(models.GrupDavet).filter_by(id=req.davet_id, davet_edilen_id=current_user.id).first()
    if not davet:
        raise HTTPException(status_code=404, detail="Grup daveti bulunamadı veya size ait değil.")

    if req.kabul_mu:
        davet.durum = "kabul_edildi"
        yeni_uye = models.GrupUye(grup_id=davet.grup_id, kullanici_id=current_user.id)
        db.add(yeni_uye)
        db.commit()
        return {"message": "Grup daveti kabul edildi!"}
    else:
        davet.durum = "reddedildi"
        db.delete(davet)
        db.commit()
        return {"message": "Grup daveti reddedildi."}


# ==========================================
# 3. KİŞİSEL TAKVİM ETKİNLİK YÖNETİMİ
# ==========================================

@app.get("/api/users/events")
def get_user_events(
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    etkinlikler = db.query(models.TakvimEtkinlik).filter_by(kullanici_id=current_user.id).all()
    return [
        {
            "id": e.id,
            "baslik": e.baslik,
            "baslangic": e.baslangic.isoformat(),
            "bitis": e.bitis.isoformat(),
            "oncelik": e.oncelik,
            "grup_id": e.grup_id
        }
        for e in etkinlikler
    ]


@app.post("/api/events")
def add_event(
        req: schemas.EtkinlikEkleSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    simdi = datetime.now()
    if req.bitis < simdi:
        raise HTTPException(status_code=400, detail="Geçmiş bir tarihe/saate yeni plan eklenemez!")

    yeni_etkinlik = models.TakvimEtkinlik(
        kullanici_id=current_user.id,
        baslik=req.baslik,
        baslangic=req.baslangic,
        bitis=req.bitis,
        oncelik=req.oncelik,
        grup_id=req.grup_id
    )
    db.add(yeni_etkinlik)
    db.commit()
    return {"message": "Etkinlik takvime eklendi!", "id": yeni_etkinlik.id}


@app.put("/api/events/{event_id}")
def update_event(
        event_id: int,
        req: schemas.EtkinlikEkleSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    etkinlik = db.query(models.TakvimEtkinlik).filter_by(id=event_id, kullanici_id=current_user.id).first()
    if not etkinlik:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı veya size ait değil.")

    simdi = datetime.now()
    if req.bitis < simdi:
        raise HTTPException(status_code=400, detail="Geçmiş bir tarihe/saate etkinlik güncellenemez!")

    etkinlik.baslik = req.baslik
    etkinlik.baslangic = req.baslangic
    etkinlik.bitis = req.bitis
    etkinlik.oncelik = req.oncelik
    db.commit()
    return {"message": "Etkinlik başarıyla güncellendi!"}


@app.delete("/api/events/{event_id}")
def delete_event(
        event_id: int,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    etkinlik = db.query(models.TakvimEtkinlik).filter_by(id=event_id, kullanici_id=current_user.id).first()
    if not etkinlik:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı veya size ait değil.")

    db.delete(etkinlik)
    db.commit()
    return {"message": "Etkinlik silindi."}


# ==========================================
# 4. AKILLI ORTAK RANDEVU ANALİZİ (24 SAAT)
# ==========================================

@app.get("/api/groups/{grup_id}/common-slots")
def get_group_common_slots(
        grup_id: int,
        tarih: str,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    is_member = db.query(models.GrupUye).filter_by(grup_id=grup_id, kullanici_id=current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Bu grubun verilerini görüntüleme yetkiniz yok.")

    uyeler = db.query(models.GrupUye).filter_by(grup_id=grup_id).all()
    uye_idleri = [u.kullanici_id for u in uyeler]

    # Toplu sorgu ile tüm üyelerin etkinliklerini tek seferde çekiyoruz (N+1 engellendi)
    etkinlikler = db.query(models.TakvimEtkinlik).filter(
        models.TakvimEtkinlik.kullanici_id.in_(uye_idleri)
    ).all()

    saatler = [True] * 24

    for e in etkinlikler:
        if e.baslangic.strftime("%Y-%m-%d") == tarih:
            basla_saat = e.baslangic.hour
            bitis_saat = e.bitis.hour if e.bitis.hour > basla_saat else basla_saat + 1
            for s in range(basla_saat, min(bitis_saat, 24)):
                saatler[s] = False

    bos_araliklar = []
    baslangic = None
    for saat in range(0, 24):
        if saatler[saat] and baslangic is None:
            baslangic = saat
        elif not saatler[saat] and baslangic is not None:
            bos_araliklar.append(f"{baslangic:02d}:00 - {saat:02d}:00")
            baslangic = None
    if baslangic is not None:
        bos_araliklar.append(f"{baslangic:02d}:00 - 24:00")

    return {
        "tarih": tarih,
        "uye_sayisi": len(uye_idleri),
        "uygun_saat_araliklari": bos_araliklar or ["Bu tarihte herkes için ortak boş saat bulunamadı."]
    }


# ==========================================
# 5. ARKADAŞLIK & İSTEK SİSTEMİ (Toplu Sorgu Optimize)
# ==========================================

@app.post("/api/friends/request")
def send_friend_request(
        req: schemas.FriendRequestSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    hedef = db.query(models.Kullanici).filter_by(kullanici_adi=req.hedef_kullanici_adi).first()
    if not hedef:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı!")

    if hedef.id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinize arkadaşlık isteği gönderemezsiniz.")

    mevcut = db.query(models.Arkadaslik).filter(
        or_(
            and_(models.Arkadaslik.gonderen_id == current_user.id, models.Arkadaslik.alan_id == hedef.id),
            and_(models.Arkadaslik.gonderen_id == hedef.id, models.Arkadaslik.alan_id == current_user.id)
        )
    ).first()

    if mevcut:
        if mevcut.durum == "kabul_edildi":
            raise HTTPException(status_code=400, detail="Bu kullanıcıyla zaten arkadaşsınız.")
        elif mevcut.durum == "beklemede":
            raise HTTPException(status_code=400, detail="Zaten bekleyen bir arkadaşlık isteği var.")

    yeni_istek = models.Arkadaslik(
        gonderen_id=current_user.id,
        alan_id=hedef.id,
        durum="beklemede"
    )
    db.add(yeni_istek)
    db.commit()
    return {"message": f"@{req.hedef_kullanici_adi} kullanıcısına arkadaşlık isteği gönderildi!"}


@app.get("/api/users/friends")
def get_friends_and_requests(
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # 1. Onaylı Arkadaşlar (Toplu sorgu)
    onaylilar = db.query(models.Arkadaslik).filter(
        or_(models.Arkadaslik.gonderen_id == current_user.id, models.Arkadaslik.alan_id == current_user.id),
        models.Arkadaslik.durum == "kabul_edildi"
    ).all()

    arkadas_idleri = [
        rel.alan_id if rel.gonderen_id == current_user.id else rel.gonderen_id
        for rel in onaylilar
    ]
    arkadaslar_db = db.query(models.Kullanici).filter(models.Kullanici.id.in_(arkadas_idleri)).all()
    arkadas_listesi = [{"id": a.id, "isim": a.isim, "kullanici_adi": a.kullanici_adi} for a in arkadaslar_db]

    # 2. Arkadaşlık İstekleri (Toplu sorgu)
    arkadas_istekleri = db.query(models.Arkadaslik).filter_by(
        alan_id=current_user.id,
        durum="beklemede"
    ).all()
    gonderen_idleri = [req.gonderen_id for req in arkadas_istekleri]
    gonderenler_db = {u.id: u for u in db.query(models.Kullanici).filter(models.Kullanici.id.in_(gonderen_idleri)).all()}

    istek_listesi = [
        {
            "istek_id": req.id,
            "gonderen_id": req.gonderen_id,
            "isim": gonderenler_db[req.gonderen_id].isim if req.gonderen_id in gonderenler_db else "Kullanıcı",
            "kullanici_adi": gonderenler_db[req.gonderen_id].kullanici_adi if req.gonderen_id in gonderenler_db else ""
        }
        for req in arkadas_istekleri
    ]

    # 3. Grup Davetleri (Toplu sorgu)
    grup_istekleri = db.query(models.GrupDavet).filter_by(
        davet_edilen_id=current_user.id,
        durum="beklemede"
    ).all()
    grup_idleri = [gd.grup_id for gd in grup_istekleri]
    davet_gonderen_idleri = [gd.gonderen_id for gd in grup_istekleri]

    gruplar_db = {g.id: g for g in db.query(models.Grup).filter(models.Grup.id.in_(grup_idleri)).all()}
    kullanicilar_db = {u.id: u for u in db.query(models.Kullanici).filter(models.Kullanici.id.in_(davet_gonderen_idleri)).all()}

    grup_davet_listesi = [
        {
            "davet_id": gd.id,
            "grup_id": gd.grup_id,
            "grup_adi": gruplar_db[gd.grup_id].grup_adi if gd.grup_id in gruplar_db else f"Grup #{gd.grup_id}",
            "gonderen_isim": kullanicilar_db[gd.gonderen_id].isim if gd.gonderen_id in kullanicilar_db else "Bir arkadaşın"
        }
        for gd in grup_istekleri
    ]

    return {
        "arkadaslar": arkadas_listesi,
        "istekler": istek_listesi,
        "grup_istekleri": grup_davet_listesi
    }


@app.post("/api/friends/respond")
def respond_friend_request(
        res_data: schemas.FriendResponseSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    istek = db.query(models.Arkadaslik).filter_by(id=res_data.istek_id, alan_id=current_user.id).first()
    if not istek:
        raise HTTPException(status_code=404, detail="İstek bulunamadı veya size ait değil.")

    if res_data.kabul_mu:
        istek.durum = "kabul_edildi"
        db.commit()
        return {"message": "Arkadaşlık isteği kabul edildi!"}
    else:
        db.delete(istek)
        db.commit()
        return {"message": "Arkadaşlık isteği reddedildi."}


# ==========================================
# 6. GRUP TAKVİMİ, ZAMAN ÇİZELGESİ & DB TEKLİF SİSTEMİ
# ==========================================

@app.get("/api/groups/{grup_id}/timeline")
def get_group_timeline(
        grup_id: int,
        tarih: str,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    is_member = db.query(models.GrupUye).filter_by(grup_id=grup_id, kullanici_id=current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Bu grubun zaman çizelgesini görüntüleme yetkiniz yok.")

    uyelikler = db.query(models.GrupUye).filter_by(grup_id=grup_id).all()
    uye_idleri = [u.kullanici_id for u in uyelikler]
    uyeler = db.query(models.Kullanici).filter(models.Kullanici.id.in_(uye_idleri)).all()

    # Tüm üyelerin etkinliklerini tek seferde getiriyoruz
    tum_etkinlikler = db.query(models.TakvimEtkinlik).filter(
        models.TakvimEtkinlik.kullanici_id.in_(uye_idleri)
    ).all()

    uye_etkinlik_haritasi = {u.id: [] for u in uyeler}
    for e in tum_etkinlikler:
        if e.baslangic.strftime("%Y-%m-%d") == tarih:
            uye_etkinlik_haritasi[e.kullanici_id].append({
                "id": e.id,
                "baslangic": e.baslangic.strftime("%H:%M"),
                "bitis": e.bitis.strftime("%H:%M"),
                "dolu_mu": True
            })

    uye_verileri = [
        {
            "kullanici_id": u.id,
            "isim": u.isim,
            "kullanici_adi": u.kullanici_adi,
            "etkinlikler": uye_etkinlik_haritasi.get(u.id, [])
        }
        for u in uyeler
    ]

    return {
        "tarih": tarih,
        "uyeler": uye_verileri
    }


@app.post("/api/groups/propose-plan")
def propose_group_plan(
        req: schemas.GrupTeklifOlusturSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    is_member = db.query(models.GrupUye).filter_by(grup_id=req.grup_id, kullanici_id=current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Üyesi olmadığınız bir gruba buluşma teklifi edemezsiniz.")

    yeni_teklif = models.GrupTeklif(
        grup_id=req.grup_id,
        teklif_eden_id=current_user.id,
        baslik=req.baslik,
        tarih=req.tarih,
        baslangic_saat=req.baslangic_saat,
        bitis_saat=req.bitis_saat
    )
    db.add(yeni_teklif)
    db.commit()
    db.refresh(yeni_teklif)

    # Teklifi açan kullanıcı varsayılan olarak kabul etmiş sayılır
    kurucu_yanit = models.GrupTeklifYanit(
        teklif_id=yeni_teklif.id,
        kullanici_id=current_user.id,
        kabul_mu=True
    )
    db.add(kurucu_yanit)
    db.commit()

    return {"message": "Buluşma teklifi DB'ye kaydedildi ve gruba iletildi!", "id": yeni_teklif.id}


@app.get("/api/users/group-proposals")
def get_user_group_proposals(
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    uyelikler = db.query(models.GrupUye).filter_by(kullanici_id=current_user.id).all()
    grup_idleri = [u.grup_id for u in uyelikler]

    # Kullanıcının üye olduğu gruplardaki teklifler
    teklifler = db.query(models.GrupTeklif).options(
        joinedload(models.GrupTeklif.grup),
        joinedload(models.GrupTeklif.teklif_eden),
        joinedload(models.GrupTeklif.yanitlar)
    ).filter(models.GrupTeklif.grup_id.in_(grup_idleri)).all()

    bekleyenler = []
    for t in teklifler:
        # Kullanıcı bu teklife daha önce yanıt verdi mi kontrol et
        kullanici_yaniti = next((y for y in t.yanitlar if y.kullanici_id == current_user.id), None)
        if not kullanici_yaniti:
            bekleyenler.append({
                "id": t.id,
                "grup_id": t.grup_id,
                "grup_adi": t.grup.grup_adi if t.grup else "Grup",
                "teklif_eden_id": t.teklif_eden_id,
                "teklif_eden_isim": t.teklif_eden.isim if t.teklif_eden else "Üye",
                "baslik": t.baslik,
                "tarih": t.tarih,
                "baslangic_saat": t.baslangic_saat,
                "bitis_saat": t.bitis_saat
            })

    return bekleyenler


@app.post("/api/groups/respond-proposal")
def respond_group_proposal(
        req: schemas.GrupTeklifYanitSchema,
        current_user: models.Kullanici = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    teklif = db.query(models.GrupTeklif).options(
        joinedload(models.GrupTeklif.grup)
    ).filter_by(id=req.teklif_id).first()

    if not teklif:
        raise HTTPException(status_code=404, detail="Teklif bulunamadı.")

    is_member = db.query(models.GrupUye).filter_by(grup_id=teklif.grup_id, kullanici_id=current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Bu teklifin ait olduğu grubun üyesi değilsiniz.")

    # Yanıtı DB'ye kaydet
    mevcut_yanit = db.query(models.GrupTeklifYanit).filter_by(
        teklif_id=req.teklif_id,
        kullanici_id=current_user.id
    ).first()

    if mevcut_yanit:
        mevcut_yanit.kabul_mu = req.kabul_mu
    else:
        yeni_yanit = models.GrupTeklifYanit(
            teklif_id=req.teklif_id,
            kullanici_id=current_user.id,
            kabul_mu=req.kabul_mu
        )
        db.add(yeni_yanit)

    # Kabul edildiyse takvime etkinlik olarak işle
    if req.kabul_mu:
        baslangic_dt = datetime.strptime(f"{teklif.tarih} {teklif.baslangic_saat}", "%Y-%m-%d %H:%M")
        bitis_dt = datetime.strptime(f"{teklif.tarih} {teklif.bitis_saat}", "%Y-%m-%d %H:%M")

        yeni_etk = models.TakvimEtkinlik(
            kullanici_id=current_user.id,
            baslik=f"Grup: {teklif.baslik} ({teklif.grup.grup_adi if teklif.grup else 'Grup'})",
            baslangic=baslangic_dt,
            bitis=bitis_dt,
            oncelik=2,
            grup_id=teklif.grup_id
        )
        db.add(yeni_etk)

    db.commit()
    return {
        "message": "Teklifi kabul ettiniz ve takviminize eklendi!" if req.kabul_mu else "Teklifi reddettiniz."
    }