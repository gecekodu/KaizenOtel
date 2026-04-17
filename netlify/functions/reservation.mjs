import fs from "node:fs/promises";

const BREVO_API_URL = "https://api.brevo.com/v3/emailCampaigns";

const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxPerIp: 8
};

const ipStore = new Map();

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...CORS_HEADERS
    }
  });
}

async function readFileConfig() {
  try {
    const fileUrl = new URL("./mail.config.json", import.meta.url);
    const raw = await fs.readFile(fileUrl, "utf8");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

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

function getClientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
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

function buildReservationCode() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 9000) + 1000);
  return `KZN-${yyyy}${mm}${dd}-${random}`;
}

function buildOwnerMail(data) {
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

function buildGuestMail(data) {
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

async function sendBrevoMail({
  apiKey,
  senderEmail,
  senderName,
  toEmail,
  toName,
  subject,
  textContent,
  htmlContent,
  replyToEmail
}) {
  const payload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: toEmail, name: toName || undefined }],
    subject,
    textContent,
    htmlContent
  };

  if (replyToEmail) {
    payload.replyTo = { email: replyToEmail };
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo send failed (${response.status}): ${errorText.slice(0, 280)}`);
  }
}

async function reservationHandler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  if (req.method !== "POST") {
    return json({ ok: false, message: "Method not allowed." }, 405);
  }

  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return json({ ok: false, message: "Cok fazla istek gonderildi. Lutfen daha sonra tekrar deneyin." }, 429);
    }

    const body = await req.json();

    const honeypot = normalizeText(body.company, 100);
    if (honeypot) {
      return json({ ok: false, message: "Gecersiz istek." }, 400);
    }

    const fullName = normalizeText(body.fullName, 120);
    const email = normalizeText(body.email, 120);
    const countryCode = normalizeText(body.countryCode, 12) || "+90";
    const phone = normalizeText(body.phone, 24);
    const checkIn = normalizeText(body.checkIn, 20);
    const checkOut = normalizeText(body.checkOut, 20);
    const roomType = normalizeText(body.roomType, 80);
    const arrivalTime = normalizeText(body.arrivalTime, 40);
    const note = normalizeText(body.note, 1200);

    const adults = parsePositiveInt(body.adults, 1);
    const children = parsePositiveInt(body.children, 0);
    const roomCount = parsePositiveInt(body.roomCount, 1);
    const nights = parsePositiveInt(body.nights, 1);
    const totalEstimate = parsePositiveInt(body.totalEstimate, 0);

    if (!fullName || !email || !phone || !roomType) {
      return json({ ok: false, message: "Lutfen zorunlu alanlari doldurun." }, 400);
    }
    if (!isValidEmail(email)) {
      return json({ ok: false, message: "Gecerli bir e-posta adresi girin." }, 400);
    }
    if (!isValidDateRange(checkIn, checkOut)) {
      return json({ ok: false, message: "Giris/cikis tarihleri gecersiz." }, 400);
    }
    if (adults < 1 || adults > 8 || children > 6 || roomCount < 1 || roomCount > 5) {
      return json({ ok: false, message: "Kisi veya oda sayisi gecersiz." }, 400);
    }

    const fileConfig = await readFileConfig();
    const BREVO_API_KEY = process.env.BREVO_API_KEY || fileConfig.BREVO_API_KEY || "";
    const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || fileConfig.BREVO_SENDER_EMAIL || "";
    const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || fileConfig.BREVO_SENDER_NAME || "Kaizen Otel";
    const MAIL_TO = process.env.MAIL_TO || fileConfig.MAIL_TO || "kaizenotel@gmail.com";

    if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
      return json(
        {
          ok: false,
          message: "Mail servisi ayarlanamadi. netlify/functions/mail.config.json veya Netlify environment variables alanini kontrol edin."
        },
        500
      );
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
      note
    };

    const ownerMail = buildOwnerMail(payload);
    const guestMail = buildGuestMail(payload);

    const [ownerResult, guestResult] = await Promise.allSettled([
      sendBrevoMail({
        apiKey: BREVO_API_KEY,
        senderEmail: BREVO_SENDER_EMAIL,
        senderName: BREVO_SENDER_NAME,
        toEmail: MAIL_TO,
        toName: "Kaizen Otel",
        subject: `Yeni Rezervasyon Talebi - ${fullName}`,
        textContent: ownerMail.text,
        htmlContent: ownerMail.html,
        replyToEmail: email
      }),
      sendBrevoMail({
        apiKey: BREVO_API_KEY,
        senderEmail: BREVO_SENDER_EMAIL,
        senderName: BREVO_SENDER_NAME,
        toEmail: email,
        toName: fullName,
        subject: `Kaizen Otel - Rezervasyonunuz Onay Asamasinda (${payload.reservationCode})`,
        textContent: guestMail.text,
        htmlContent: guestMail.html
      })
    ]);

    if (ownerResult.status === "fulfilled" && guestResult.status === "fulfilled") {
      return json({
        ok: true,
        message: "Rezervasyon talebiniz alindi. Tesekkurler, rezervasyonunuz onay asamasina gecti. Bilgilendirme e-postasi gonderildi."
      });
    }

    if (ownerResult.status === "fulfilled") {
      return json({
        ok: true,
        message: "Rezervasyon talebiniz alindi. Otel ekibimize iletildi ancak size bilgilendirme e-postasi su an gonderilemedi."
      });
    }

    if (guestResult.status === "fulfilled") {
      return json({
        ok: true,
        message: "Rezervasyon talebiniz alindi ve size onay asamasi bilgilendirme e-postasi gonderildi."
      });
    }

    const ownerError = ownerResult.status === "rejected" ? ownerResult.reason : null;
    const guestError = guestResult.status === "rejected" ? guestResult.reason : null;
    console.error("Reservation mail failure:", { ownerError, guestError });

    return json(
      {
        ok: false,
        message: "Rezervasyon olusturuldu ancak e-posta servisi su an kullanilamiyor. Lutfen tekrar deneyin."
      },
      502
    );
  } catch (error) {
    console.error("Reservation function error:", error);
    return json({ ok: false, message: "Sunucu hatasi olustu. Lutfen tekrar deneyin." }, 500);
  }
}

function requestFromEvent(event = {}) {
  const method = event.httpMethod || "GET";
  const headers = new Headers(event.headers || {});
  const bodyText = event.body
    ? event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body
    : "";

  return {
    method,
    headers,
    async json() {
      return bodyText ? JSON.parse(bodyText) : {};
    }
  };
}

export const handler = async (event) => {
  const req = requestFromEvent(event);
  const res = await reservationHandler(req);
  const responseText = await res.text();
  const responseHeaders = Object.fromEntries(res.headers.entries());

  return {
    statusCode: res.status,
    headers: responseHeaders,
    body: responseText
  };
};

export default reservationHandler;
