# Kaizen Otel Rezervasyon Mail Kurulumu (Netlify + Brevo Free)

Bu projede rezervasyon talepleri Netlify Function ile alinir ve Brevo API ile e-posta gonderilir. SMTP gerekmez.

## 1) Ucretsiz altyapi

- Hosting: Netlify
- Mail API: Brevo Free plan (ucretsiz gunluk limitle)
- Akis:
  - Otele rezervasyon bildirimi gider.
  - Misafire "tesekkurler, rezervasyonunuz onay asamasina gecti" bilgilendirme maili gider.

## 2) Brevo ayari

1. Brevo hesabi acin.
2. Transactional API key olusturun.
3. Gonderici e-posta adresinizi (sender) Brevo panelinden dogrulayin.

## 3) Hostinge gondereceginiz proje ayari (panel gerektirmez)

Bu dosyayi duzenleyin:

- `netlify/functions/mail.config.json`

Alanlar:

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `MAIL_TO`

Fonksiyon once Netlify ortam degiskenlerini dener, yoksa otomatik olarak bu dosyayi kullanir. Bu sayede deploy eden kisiyle ek ayar iletisimi gerekmez.

## 4) Netlify fonksiyon endpointi

Bu projede rezervasyon endpointi:

- `/.netlify/functions/reservation`

Ayrica geriye donuk uyumluluk icin `netlify.toml` ile su redirect tanimlidir:

- `/api/reservations -> /.netlify/functions/reservation`

## 5) Lokal test

Netlify CLI ile calistirin:

```bash
netlify dev
```

Ardindan rezervasyon formunu test edin.

## 6) Notlar

- Fonksiyon dosyasi: `netlify/functions/reservation.mjs`
- Frontend istekleri: `assets/js/rezervasyon.js`
- Mail gonderimi icin artik SMTP ayari gerekmez.
