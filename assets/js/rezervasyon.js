const ROOM_PRICE_MAP = {
  "Tek KiÅŸilik Oda": 2000,
  "2 KiÅŸilik Oda": 3500,
  "3 KiÅŸilik Oda": 5000
};

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.valueOf()) ? date : null;
}

function calcNights(checkIn, checkOut) {
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);
  if (!start || !end) return 1;
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

function formatNumber(value) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function getSelectedRoomInput() {
  return document.querySelector('input[name="roomType"]:checked');
}

function syncRoomTypeStyles() {
  document.querySelectorAll(".room-type").forEach((label) => {
    const input = label.querySelector('input[type="radio"]');
    label.classList.toggle("active", Boolean(input && input.checked));
  });
}

function computeSummary() {
  const checkIn = document.getElementById("checkIn").value;
  const checkOut = document.getElementById("checkOut").value;
  const adults = Number(document.getElementById("adults").value || 1);
  const children = Number(document.getElementById("children").value || 0);
  const roomCount = Number(document.getElementById("roomCount").value || 1);
  const roomInput = getSelectedRoomInput();
  const roomType = roomInput ? roomInput.value : "Tek KiÅŸilik Oda";
  const roomPrice = roomInput ? Number(roomInput.dataset.price || 0) : ROOM_PRICE_MAP[roomType] || 0;
  const nights = calcNights(checkIn, checkOut);
  const total = roomPrice * nights * Math.max(1, roomCount);

  return {
    checkIn,
    checkOut,
    adults: Math.max(1, adults),
    children: Math.max(0, children),
    roomCount: Math.max(1, roomCount),
    roomType,
    roomPrice,
    nights,
    total
  };
}

function renderSummary() {
  const summary = computeSummary();
  document.getElementById("sumCheckIn").textContent = summary.checkIn || "-";
  document.getElementById("sumCheckOut").textContent = summary.checkOut || "-";
  document.getElementById("sumNights").textContent = String(summary.nights);
  document.getElementById("sumGuests").textContent = `${summary.adults} / ${summary.children}`;
  document.getElementById("sumRoomType").textContent = summary.roomType;
  document.getElementById("sumRoomCount").textContent = String(summary.roomCount);
  document.getElementById("sumTotal").textContent = formatNumber(summary.total);
}

function setupDateInputs() {
  const checkInInput = document.getElementById("checkIn");
  const checkOutInput = document.getElementById("checkOut");
  if (!checkInInput || !checkOutInput) return;

  const today = new Date();
  const minCheckIn = toIsoDate(today);
  const defaultCheckIn = toIsoDate(addDays(today, 1));
  const defaultCheckOut = toIsoDate(addDays(today, 2));

  checkInInput.min = minCheckIn;
  if (!checkInInput.value) checkInInput.value = defaultCheckIn;

  const currentCheckIn = parseDate(checkInInput.value) || addDays(today, 1);
  const minCheckOut = toIsoDate(addDays(currentCheckIn, 1));
  checkOutInput.min = minCheckOut;
  if (!checkOutInput.value || checkOutInput.value <= checkInInput.value) {
    checkOutInput.value = defaultCheckOut > minCheckOut ? defaultCheckOut : minCheckOut;
  }

  if (!checkInInput.dataset.bound) {
    checkInInput.addEventListener("change", () => {
      const start = parseDate(checkInInput.value);
      if (!start) return;
      const minOut = toIsoDate(addDays(start, 1));
      checkOutInput.min = minOut;
      if (checkOutInput._flatpickr) {
        checkOutInput._flatpickr.set("minDate", minOut);
      }
      if (!checkOutInput.value || checkOutInput.value <= checkInInput.value) {
        if (checkOutInput._flatpickr) {
          checkOutInput._flatpickr.setDate(minOut, true, "Y-m-d");
        } else {
          checkOutInput.value = minOut;
        }
      }
      renderSummary();
    });

    checkOutInput.addEventListener("change", renderSummary);
    checkInInput.dataset.bound = "1";
  }
}

function setupDatePickerUi() {
  if (typeof window.flatpickr !== "function") return;

  const locale =
    window.flatpickr.l10ns && window.flatpickr.l10ns.tr ? "tr" : "default";

  ["checkIn", "checkOut"].forEach((id) => {
    const input = document.getElementById(id);
    if (!input || input.dataset.flatpickrBound === "1") return;

    window.flatpickr(input, {
      locale,
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d.m.Y",
      disableMobile: true,
      allowInput: false,
      monthSelectorType: "static",
      minDate: input.min || "today",
      prevArrow: "<span class='fp-nav-arrow' aria-hidden='true'>&lsaquo;</span>",
      nextArrow: "<span class='fp-nav-arrow' aria-hidden='true'>&rsaquo;</span>",
      onReady: (_selectedDates, _dateStr, instance) => {
        if (!instance.altInput) return;
        instance.altInput.classList.add("kaizen-date-input");
      },
      onChange: () => {
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    input.dataset.flatpickrBound = "1";
  });
}

function applyQueryPrefill() {
  const params = new URLSearchParams(window.location.search);
  if (!params.toString()) return;

  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  const adults = params.get("adults");
  const children = params.get("children");
  const roomCount = params.get("roomCount");
  const roomType = params.get("roomType");

  if (checkIn && parseDate(checkIn)) {
    document.getElementById("checkIn").value = checkIn;
  }
  if (checkOut && parseDate(checkOut)) {
    document.getElementById("checkOut").value = checkOut;
  }
  if (adults && /^\d+$/.test(adults)) {
    document.getElementById("adults").value = adults;
  }
  if (children && /^\d+$/.test(children)) {
    document.getElementById("children").value = children;
  }
  if (roomCount && /^\d+$/.test(roomCount)) {
    document.getElementById("roomCount").value = roomCount;
  }
  if (roomType) {
    const radio = document.querySelector(`input[name="roomType"][value="${roomType}"]`);
    if (radio) radio.checked = true;
  }
}

function bindRoomShowcaseButtons() {
  document.querySelectorAll("[data-select-room]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const roomName = btn.getAttribute("data-select-room");
      if (!roomName) return;
      const radio = document.querySelector(`input[name="roomType"][value="${roomName}"]`);
      if (!radio) return;
      radio.checked = true;
      syncRoomTypeStyles();
      renderSummary();
      const formTitle = document.querySelector(".rez-card h2");
      if (formTitle) formTitle.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function setStatus(message, type = "") {
  const status = document.getElementById("formStatus");
  if (!status) return;
  status.textContent = message;
  status.className = "rez-status";
  if (type) status.classList.add(type);
}

const FORMSUBMIT_AJAX_URL = "https://formsubmit.co/ajax/kaizenotel@gmail.com";



function buildReservationApiUrls() {
  const urls = ["/.netlify/functions/reservation", "/api/reservations"];
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (isLocal && window.location.port !== "8888") {
    urls.push("http://localhost:8888/.netlify/functions/reservation");
    urls.push("http://127.0.0.1:8888/.netlify/functions/reservation");
  }
  if (isLocal && window.location.port !== "3000") {
    urls.push("http://localhost:3000/api/reservations");
    urls.push("http://127.0.0.1:3000/api/reservations");
  }
  return [...new Set(urls)];
}
function isNetworkError(error) {
  const message = error && error.message ? error.message.toLowerCase() : "";
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed")
  );
}
async function postReservation(payload) {
  const endpoints = buildReservationApiUrls();
  let lastError = null;
  for (let i = 0; i < endpoints.length; i += 1) {
    const endpoint = endpoints[i];
    const hasNext = i < endpoints.length - 1;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) {
        return data;
      }
      const fallbackMessage =
        response.status === 404
          ? "Rezervasyon servisine ulasilamadi. Netlify Function baglantisini kontrol edin."
          : response.status === 405
            ? "Rezervasyon servisi bu endpointte POST kabul etmedi."
          : `Sunucu hatasi olustu (HTTP ${response.status}).`;
      const err = new Error(data.message || fallbackMessage);
      err.status = response.status;
      lastError = err;
      if ((response.status === 404 || response.status === 405) && hasNext) {
        continue;
      }
      throw err;
    } catch (error) {
      lastError = error;
      if (isNetworkError(error) && hasNext) {
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error("Rezervasyon gonderilemedi.");
}

function buildFormSubmitPayload(payload) {
  return {
    _subject: `Yeni Rezervasyon Talebi - ${payload.fullName}`,
    _template: "table",
    _captcha: "false",
    fullName: payload.fullName,
    email: payload.email,
    countryCode: payload.countryCode,
    phone: payload.phone,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    nights: payload.nights,
    adults: payload.adults,
    children: payload.children,
    roomType: payload.roomType,
    roomCount: payload.roomCount,
    totalEstimate: payload.totalEstimate,
    arrivalTime: payload.arrivalTime || "-",
    note: payload.note || "-",
    source: window.location.href
  };
}

async function postReservationViaFormSubmit(payload) {
  const response = await fetch(FORMSUBMIT_AJAX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(buildFormSubmitPayload(payload))
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `FormSubmit hatasi (HTTP ${response.status}).`);
  }

  return data;
}

function resetReservationForm(form) {
  form.reset();
  setupDateInputs();
  syncRoomTypeStyles();
  renderSummary();
}

async function submitReservation(event) {
  event.preventDefault();
  const form = document.getElementById("reservationForm");
  const submitBtn = document.getElementById("submitBtn");
  const summary = computeSummary();
  if (!form || !submitBtn) return;
  if (!form.reportValidity()) return;
  if (!summary.checkIn || !summary.checkOut) {
    setStatus("Lutfen giris ve cikis tarihini secin.", "error");
    return;
  }
  const payload = {
    checkIn: summary.checkIn,
    checkOut: summary.checkOut,
    adults: summary.adults,
    children: summary.children,
    roomType: summary.roomType,
    roomCount: summary.roomCount,
    nights: summary.nights,
    totalEstimate: summary.total,
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    countryCode: form.countryCode.value,
    phone: form.phone.value.trim(),
    arrivalTime: form.arrivalTime.value,
    note: form.note.value.trim(),
    company: form.company.value.trim()
  };
  if (window.location.protocol === "file:") {
    setStatus("Rezervasyon gonderimi icin siteyi sunucu uzerinden calistirin (netlify dev).", "error");
    return;
  }
  try {
    submitBtn.disabled = true;
    setStatus("Rezervasyon gonderiliyor...", "");
    const data = await postReservation(payload);
    setStatus(data.message || "Rezervasyon talebiniz alindi. En kisa surede donus yapilacaktir.", "success");
    resetReservationForm(form);
  } catch (error) {
    try {
      await postReservationViaFormSubmit(payload);
      setStatus(
        "Rezervasyon talebiniz alindi. Ana servis gecici olarak ulasilamaz oldugu icin yedek kanal kullanildi.",
        "success"
      );
      resetReservationForm(form);
      return;
    } catch (fallbackError) {
      const msg = error && error.message ? error.message : "";
      if (isNetworkError(error)) {
        setStatus("Sunucuya ulasilamadi. Siteyi netlify dev ile baslatip tekrar deneyin.", "error");
        return;
      }
      const fallbackMsg = fallbackError && fallbackError.message ? ` Yedek kanal: ${fallbackError.message}` : "";
      setStatus((msg || "Bir hata olustu. Lutfen tekrar deneyin.") + fallbackMsg, "error");
    }
  } finally {
    submitBtn.disabled = false;
  }
}

function setupEvents() {
  const form = document.getElementById("reservationForm");
  if (!form) return;

  form.addEventListener("submit", submitReservation);

  ["adults", "children", "roomCount", "checkIn", "checkOut", "arrivalTime"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderSummary);
    if (el) el.addEventListener("change", renderSummary);
  });

  document.querySelectorAll('input[name="roomType"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      syncRoomTypeStyles();
      renderSummary();
    });
  });
}

function setupYear() {
  const year = document.getElementById("yearNow");
  if (year) year.textContent = String(new Date().getFullYear());
}

document.addEventListener("DOMContentLoaded", () => {
  setupYear();
  applyQueryPrefill();
  setupDateInputs();
  setupDatePickerUi();
  setupEvents();
  bindRoomShowcaseButtons();
  syncRoomTypeStyles();
  renderSummary();
});

