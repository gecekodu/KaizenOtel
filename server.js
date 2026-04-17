const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const LOG_FILE = path.join(DATA_DIR, "reservations.jsonl");

const PORT = Number(process.env.PORT || 3000);

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true") === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

const MAIL_TO = process.env.MAIL_TO || "kaizenotel@gmail.com";
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || "kaizenotel@gmail.com";

const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxPerIp: 8
};

const ipStore = new Map();

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));

function normalizeText(value, max = 500) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.slice(0, max);
}

function parsePositiveInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff) return xff.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const old = ipStore.get(ip) || [];
  const fresh = old.filter((ts) => now - ts < RATE_LIMIT.windowMs);
  if (fresh.length >= RATE_LIMIT.maxPerIp) return false;
  fresh.push(now);
  ipStore.set(ip, fresh);
  return true;
}

function isValidDateRange(checkIn, checkOut) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    return false;
  }
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Number.isFinite(start.valueOf()) && Number.isFinite(end.valueOf()) && end > start;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("tr-TR").format(amount);
}

function buildReservationCode() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 9000) + 1000);
  return `KZN-${yyyy}${mm}${dd}-${random}`;
}

function createTransporter() {
  if (!SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function appendReservationLog(payload) {
  await ensureDataDir();
  await fs.appendFile(LOG_FILE, `${JSON.stringify(payload)}\n`, "utf8");
}

function buildReservationMail(data) {
  const summaryLines = [
    `Rezervasyon Kodu: ${data.reservationCode}`,
    `Ad Soyad: ${data.fullName}`,
    `Telefon: ${data.countryCode} ${data.phone}`,
    `E-posta: ${data.email}`,
    `Giris: ${data.checkIn}`,
    `Cikis: ${data.checkOut}`,
    `Gece: ${data.nights}`,
    `Yetiskin: ${data.adults}`,
    `Cocuk: ${data.children}`,
    `Oda Tipi: ${data.roomType}`,
    `Oda Sayisi: ${data.roomCount}`,
    `Tahmini Tutar: ${formatMoney(data.totalEstimate)} TL`,
    `Varis Saati: ${data.arrivalTime || "-"}`,
    `Not: ${data.note || "-"}`
  ];

  const text = `Yeni rezervasyon talebi alindi.\n\n${summaryLines.join("\n")}`;

  const html = `
    <h2>Yeni Rezervasyon Talebi</h2>
    <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;">
      <tr><td><b>Rezervasyon Kodu</b></td><td>${escapeHtml(data.reservationCode)}</td></tr>
      <tr><td><b>Ad Soyad</b></td><td>${escapeHtml(data.fullName)}</td></tr>
      <tr><td><b>Telefon</b></td><td>${escapeHtml(data.countryCode)} ${escapeHtml(data.phone)}</td></tr>
      <tr><td><b>E-posta</b></td><td>${escapeHtml(data.email)}</td></tr>
      <tr><td><b>Giris</b></td><td>${escapeHtml(data.checkIn)}</td></tr>
      <tr><td><b>Cikis</b></td><td>${escapeHtml(data.checkOut)}</td></tr>
      <tr><td><b>Gece</b></td><td>${escapeHtml(String(data.nights))}</td></tr>
      <tr><td><b>Yetiskin</b></td><td>${escapeHtml(String(data.adults))}</td></tr>
      <tr><td><b>Cocuk</b></td><td>${escapeHtml(String(data.children))}</td></tr>
      <tr><td><b>Oda Tipi</b></td><td>${escapeHtml(data.roomType)}</td></tr>
      <tr><td><b>Oda Sayisi</b></td><td>${escapeHtml(String(data.roomCount))}</td></tr>
      <tr><td><b>Tahmini Tutar</b></td><td>${escapeHtml(formatMoney(data.totalEstimate))} TL</td></tr>
      <tr><td><b>Varis Saati</b></td><td>${escapeHtml(data.arrivalTime || "-")}</td></tr>
      <tr><td><b>Not</b></td><td>${escapeHtml(data.note || "-")}</td></tr>
    </table>
  `;

  return { text, html };
}
function buildGuestConfirmationMail(data) {
  const text = [
    `Merhaba ${data.fullName},`,
    "",
    "Rezervasyon talebiniz icin tesekkur ederiz.",
    "Talebiniz sistemimize basariyla kaydedildi ve onay asamasina gecti.",
    "Onay birimimiz en kisa surede sizi arayarak veya e-posta ile bilgilendirecektir.",
    "",
    `Rezervasyon Kodu: ${data.reservationCode}`,
    "",
    `Giris: ${data.checkIn}`,
    `Cikis: ${data.checkOut}`,
    `Oda Tipi: ${data.roomType}`,
    `Oda Sayisi: ${data.roomCount}`,
    `Yetiskin / Cocuk: ${data.adults} / ${data.children}`,
    `Tahmini Tutar: ${formatMoney(data.totalEstimate)} TL`,
    "",
    "Not: Bu e-posta, rezervasyon talebinizin alindigina dair otomatik bilgilendirmedir.",
    "Kesin rezervasyon, otel onayi sonrasinda netlesir.",
    "",
    "Iletisim: +90 501 002 6633",
    "E-posta: kaizenotel@gmail.com",
    "",
    "Kaizen Otel"
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#12324b;">
      <h2 style="margin:0 0 12px;">Tesekkurler, rezervasyonunuz onay asamasina gecti</h2>
      <p>Merhaba ${escapeHtml(data.fullName)},</p>
      <p>Rezervasyon talebiniz icin tesekkur ederiz. Talebiniz sistemimize basariyla kaydedildi ve <b>onay asamasina</b> gecti.</p>
      <p>Onay birimimiz en kisa surede sizinle iletisime gececek ve kesin durum bilgisini paylasacaktir.</p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;">
        <tr><td><b>Rezervasyon Kodu</b></td><td>${escapeHtml(data.reservationCode)}</td></tr>
        <tr><td><b>Giris</b></td><td>${escapeHtml(data.checkIn)}</td></tr>
        <tr><td><b>Cikis</b></td><td>${escapeHtml(data.checkOut)}</td></tr>
        <tr><td><b>Oda Tipi</b></td><td>${escapeHtml(data.roomType)}</td></tr>
        <tr><td><b>Oda Sayisi</b></td><td>${escapeHtml(String(data.roomCount))}</td></tr>
        <tr><td><b>Yetiskin / Cocuk</b></td><td>${escapeHtml(String(data.adults))} / ${escapeHtml(String(data.children))}</td></tr>
        <tr><td><b>Tahmini Tutar</b></td><td>${escapeHtml(formatMoney(data.totalEstimate))} TL</td></tr>
      </table>
      <p style="margin-top:14px;">Bu e-posta otomatik bilgilendirmedir. Kesin rezervasyon, otel onayi sonrasinda netlesir.</p>
      <p style="margin-top:14px;">Iletisim: <b>+90 501 002 6633</b> | <b>kaizenotel@gmail.com</b></p>
      <p>Tesekkur ederiz,<br><b>Kaizen Otel</b></p>
    </div>
  `;

  return { text, html };
}
const transporter = createTransporter();

app.post("/api/reservations", async (req, res) => {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ ok: false, message: "Ã‡ok fazla istek gÃ¶nderildi. LÃ¼tfen daha sonra tekrar deneyin." });
    }

    const honeypot = normalizeText(req.body.company, 100);
    if (honeypot) {
      return res.status(400).json({ ok: false, message: "GeÃ§ersiz istek." });
    }

    const fullName = normalizeText(req.body.fullName, 120);
    const email = normalizeText(req.body.email, 120);
    const countryCode = normalizeText(req.body.countryCode, 12) || "+90";
    const phone = normalizeText(req.body.phone, 24);
    const checkIn = normalizeText(req.body.checkIn, 20);
    const checkOut = normalizeText(req.body.checkOut, 20);
    const roomType = normalizeText(req.body.roomType, 80);
    const arrivalTime = normalizeText(req.body.arrivalTime, 40);
    const note = normalizeText(req.body.note, 1200);

    const adults = parsePositiveInt(req.body.adults, 1);
    const children = parsePositiveInt(req.body.children, 0);
    const roomCount = parsePositiveInt(req.body.roomCount, 1);
    const nights = parsePositiveInt(req.body.nights, 1);
    const totalEstimate = parsePositiveInt(req.body.totalEstimate, 0);

    if (!fullName || !email || !phone || !roomType) {
      return res.status(400).json({ ok: false, message: "LÃ¼tfen zorunlu alanlarÄ± doldurun." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, message: "GeÃ§erli bir e-posta adresi girin." });
    }
    if (!isValidDateRange(checkIn, checkOut)) {
      return res.status(400).json({ ok: false, message: "GiriÅŸ/Ã§Ä±kÄ±ÅŸ tarihleri geÃ§ersiz." });
    }
    if (adults < 1 || adults > 8 || children > 6 || roomCount < 1 || roomCount > 5) {
      return res.status(400).json({ ok: false, message: "KiÅŸi veya oda sayÄ±sÄ± geÃ§ersiz." });
    }

    const payload = {
      fullName,
      email,
      countryCode,
      phone,
      checkIn,
      checkOut,
      adults,
      children,
      roomType,
      roomCount,
      nights,
      totalEstimate,
      reservationCode: buildReservationCode(),
      arrivalTime,
      note,
      ip,
      createdAt: new Date().toISOString()
    };

    let ownerMailSent = false;
    let guestMailSent = false;
    let mailError = "";

    if (transporter) {
      const ownerMail = buildReservationMail(payload);
      const guestMail = buildGuestConfirmationMail(payload);
      const [ownerResult, guestResult] = await Promise.allSettled([
        transporter.sendMail({
          from: MAIL_FROM,
          to: MAIL_TO,
          replyTo: email,
          subject: `Yeni Rezervasyon Talebi - ${fullName}`,
          text: ownerMail.text,
          html: ownerMail.html
        }),
        transporter.sendMail({
          from: MAIL_FROM,
          to: email,
          subject: `Kaizen Otel - Rezervasyonunuz Onay Asamasinda (${payload.reservationCode})`,
          text: guestMail.text,
          html: guestMail.html
        })
      ]);

      if (ownerResult.status === "fulfilled") {
        ownerMailSent = true;
      } else {
        const reason = ownerResult.reason instanceof Error ? ownerResult.reason.message : "Owner mail failed";
        mailError = reason;
        console.error("Owner reservation mail error:", ownerResult.reason);
      }

      if (guestResult.status === "fulfilled") {
        guestMailSent = true;
      } else {
        const reason = guestResult.reason instanceof Error ? guestResult.reason.message : "Guest mail failed";
        mailError = mailError ? `${mailError} | ${reason}` : reason;
        console.error("Guest confirmation mail error:", guestResult.reason);
      }
    } else {
      mailError = "SMTP not configured";
    }

    await appendReservationLog({
      ...payload,
      ownerMailSent,
      guestMailSent,
      mailError
    });

    if (ownerMailSent && guestMailSent) {
      return res.json({
        ok: true,
        message: "Rezervasyon talebiniz alindi. Tesekkurler, rezervasyonunuz onay asamasina gecti. Bilgilendirme e-postasi gonderildi."
      });
    }

    if (ownerMailSent && !guestMailSent) {
      return res.json({
        ok: true,
        message: "Rezervasyon talebiniz alindi. Otel ekibimize iletildi ancak size bilgilendirme e-postasi su an gonderilemedi."
      });
    }

    if (!ownerMailSent && guestMailSent) {
      return res.json({
        ok: true,
        message: "Rezervasyon talebiniz alindi ve size onay asamasi bilgilendirme e-postasi gonderildi."
      });
    }

    return res.json({
      ok: true,
      message: "Rezervasyon talebiniz alindi. E-posta servisi gecici olarak kullanilamiyor, ekibimiz manuel olarak donus yapacak."
    });
  } catch (error) {
    console.error("Reservation API error:", error);
    return res.status(500).json({ ok: false, message: "Sunucu hatasÄ± oluÅŸtu. LÃ¼tfen tekrar deneyin." });
  }
});

app.use(express.static(ROOT, { extensions: ["html"] }));

app.listen(PORT, async () => {
  console.log(`Kaizen site server running on http://localhost:${PORT}`);

  if (!transporter) {
    console.warn("SMTP tanÄ±mlÄ± deÄŸil. .env dosyasÄ±nda SMTP_USER ve SMTP_PASS ayarlarÄ±nÄ± yapÄ±n.");
    return;
  }

  try {
    await transporter.verify();
    console.log("SMTP baÄŸlantÄ±sÄ± doÄŸrulandÄ±.");
  } catch (error) {
    console.error("SMTP baÄŸlantÄ± doÄŸrulamasÄ± baÅŸarÄ±sÄ±z:", error.message);
  }
});


