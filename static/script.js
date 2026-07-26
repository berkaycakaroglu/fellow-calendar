async function kayitOl() {
    const isim = document.getElementById('isim').value;
    const eposta = document.getElementById('eposta').value;
    const sifre = document.getElementById('sifre').value;
    const sifre_tekrar = document.getElementById('sifre_tekrar').value;
    const mesajKutusu = document.getElementById('mesaj');

    if (!isim || !eposta || !sifre || !sifre_tekrar) {
        mesajKutusu.style.color = "red";
        mesajKutusu.innerText = "Lütfen tüm alanları doldurun!";
        return;
    }

    try {
        const response = await fetch('/kullanicilar/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isim, eposta, sifre, sifre_tekrar })
        });

        const data = await response.json();

        if (response.ok) {
            mesajKutusu.style.color = "green";
            mesajKutusu.innerText = data.mesaj;
            setTimeout(() => ekraniDegistir('giris-formu', 'kayit-formu'), 2000);
        } else {
            mesajKutusu.style.color = "orange";
            if (data.detail === "Bu mail ile bir hesap bulunuyor.") {
                mesajKutusu.innerHTML = `Bu mail ile bir hesap bulunuyor. <a href="#" onclick="ekraniDegistir('giris-formu', 'kayit-formu')">Giriş yapmak ister misiniz?</a>`;
            } else {
                mesajKutusu.innerText = Array.isArray(data.detail) ? "Geçersiz veya eksik veri girdiniz." : data.detail;
            }
        }
    } catch (error) {
        mesajKutusu.style.color = "red";
        mesajKutusu.innerText = "Sunucuya bağlanılamadı.";
    }
}

async function girisYap() {
    const eposta = document.getElementById('giris-eposta').value;
    const sifre = document.getElementById('giris-sifre').value;
    const mesajKutusu = document.getElementById('mesaj');

    if (!eposta || !sifre) {
        mesajKutusu.style.color = "red";
        mesajKutusu.innerText = "Lütfen e-posta ve şifrenizi girin!";
        return;
    }

    try {
        const response = await fetch('/giris/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eposta, sifre })
        });

        const data = await response.json();

        if (response.ok) {
            ekraniDegistir("dashboard-screen", "auth-screen");
            document.getElementById('hosgeldin-yazisi').innerText = `Hoş Geldin, ${data.isim}!`;
            mesajKutusu.innerText = "";

            // TAKVİM BURADA YÜKLENİYOR
            setTimeout(takvimiYukle, 100);
        } else {
            mesajKutusu.style.color = "orange";
            if (data.detail === "Bu maile ait bir hesap bulunmamaktadır.") {
                mesajKutusu.innerHTML = `Bu maile ait bir hesap bulunmamaktadır. <a href="#" onclick="ekraniDegistir('kayit-formu', 'giris-formu')">Hesap oluşturmak ister misiniz?</a>`;
            } else {
                mesajKutusu.innerText = Array.isArray(data.detail) ? "Geçersiz veri." : data.detail;
            }
        }
    } catch (error) {
        mesajKutusu.style.color = "red";
        mesajKutusu.innerText = "Sunucuya bağlanılamadı.";
    }
}

function cikisYap() {
    ekraniDegistir("auth-screen", "dashboard-screen");
    document.getElementById('isim').value = "";
    document.getElementById('eposta').value = "";
    document.getElementById('sifre').value = "";
    document.getElementById('sifre_tekrar').value = "";
    document.getElementById('giris-eposta').value = "";
    document.getElementById('giris-sifre').value = "";
    ekraniDegistir('giris-formu', 'kayit-formu');

    // Çıkış yapıldığında takvimi temizleyelim ki bir sonraki girişte üst üste binmesin
    document.getElementById('calendar').innerHTML = "";
}

function ekraniDegistir(gosterilecekId, gizlenecekId) {
    document.getElementById(gizlenecekId).style.display = "none";
    document.getElementById(gosterilecekId).style.display = "block";
    document.getElementById('mesaj').innerText = "";
}

// --- FULLCALENDAR FONKSİYONU ---
function takvimiYukle() {
    const calendarEl = document.getElementById('calendar');

    // Güvenlik kilidi: HTML içindeki görünmez boşlukları temizle
    calendarEl.innerHTML = "";

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'tr',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Bugün',
            month: 'Ay',
            week: 'Hafta',
            day: 'Gün'
        },
        dateClick: function(info) {
            alert('Seçilen Tarih: ' + info.dateStr + '\nBurada etkinlik ekleme ekranı açılacak!');
        }
    });

    calendar.render();
}