let basket = [];
const rooms = [
  {
    name: "Tek Kişilik Oda",
    price: 2000,
    images: [
  "assets/images/standartt.jpg",
  "assets/images/galeri/cifttek1.jpg",
  "assets/images/banyo.jpg",
  "assets/images/cifttek2.jpg",
  "assets/images/cifttek3.jpg",
  "assets/images/mutfakcekyat.jpg"
    ],
    desc: "Konforlu ve modern tasarım <ul><li>Çift kişilik yatak</li><li>Tek kişilik yatak</li><li>Klima</li><li>Ücretsiz Wi-Fi</li><li>TV</li></ul>"
  },
  {
    name: "2 Kişilik Oda",
    price: 3500,
    images: [
  "assets/images/standart.jpg",
  "assets/images/bosalan.jpg",
  "assets/images/banyo.jpg",
  "assets/images/cift.jpg",
  "assets/images/cift2.jpg",
  "assets/images/mutfakcekyat2.jpg"
    ],
    desc: "Geniş ve ferah oda, ekstra konfor. <ul><li>Çift kişilik yatak</li><li>Oturma grubu</li><li>Klima</li><li>Ücretsiz Wi-Fi</li><li>TV</li></ul>"
  },
  {
    name: "3 Kişilik Oda",
    price: 5000,
    images: [
  "assets/images/twinsuit.jpeg",
  "assets/images/bosalan.jpg",
  "assets/images/banyo.jpg"
    ],
    desc: "Geniş ve ferah oda, ekstra konfor. <ul><li>İki adet tek kişilik yatak</li><li>Oturma grubu</li><li>Klima</li><li>Ücretsiz Wi-Fi</li><li>TV</li></ul>"
  }
];

let checkin = "";
let checkout = "";
let nights = 1;

flatpickr("#dateRange", {
  mode: "range",
  minDate: "today",
  dateFormat: "d.m.Y",
  locale: "tr",
  onChange: function(selectedDates, dateStr, instance) {
    if (selectedDates.length === 2) {
      document.getElementById("dateRangeInfo").innerHTML =
        `<span class="selection-top">Seçilen:</span> <b class="start-day">${instance.formatDate(selectedDates[0], "d.m.Y")}</b>
        <span class="separator-day"> - </span>
        <b class="end-day">${instance.formatDate(selectedDates[1], "d.m.Y")}</b>
        <i class="selected-days">(${Math.round((selectedDates[1] - selectedDates[0]) / (1000 * 60 * 60 * 24))} Gece)</i>`;
      updateParams();
    } else {
      document.getElementById("dateRangeInfo").innerHTML =
        `<div class="default-top">Lütfen en az 2 gece seçiniz</div>`;
    }
  }
});

function updateParams() {
  const dateRangeInput = document.getElementById("dateRange");
  let val = dateRangeInput.value.includes(" - ")
    ? dateRangeInput.value.split(" - ")
    : ["", ""];
  checkin = val[0] || "";
  checkout = val[1] || "";
  nights = dateDiff(checkin, checkout);
  renderSummary();
  // Sepete Ekle'den sonra sepet/özet bölümüne otomatik yukarı çık
  var summarySection = document.getElementById('rez-summary');
  if (summarySection) {
    summarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  renderRooms();
}

function dateDiff(start, end) {
  if (!start || !end) return 1;
  const [d1, m1, y1] = start.split(".");
  const [d2, m2, y2] = end.split(".");
  const date1 = new Date(`${y1}-${m1}-${d1}`);
  const date2 = new Date(`${y2}-${m2}-${d2}`);
  const diff = Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

function renderSummary() {
  const rezSummary = document.getElementById("rez-summary");
  let summaryHtml = "";
  // Tarihlerin gerçekten seçildiğinden emin ol
  if (checkin && checkout && checkin !== '' && checkout !== '' && checkin !== undefined && checkout !== undefined) {
    summaryHtml += `<strong>Giriş:</strong> ${checkin} &nbsp; <strong>Çıkış:</strong> ${checkout} &nbsp; <strong>Gece:</strong> ${nights}`;
  } else {
    summaryHtml += `<span style='color:#c00;'>Lütfen giriş-çıkış tarihi seçiniz.</span>`;
  }
  summaryHtml += `<div id='basketArea' style='margin-top:18px;'>`;
  if (basket.length > 0) {
    summaryHtml += `<h4>Sepetiniz:</h4><ul>`;
    basket.forEach((item, i) => {
      summaryHtml += `<li>
        <b>${item.name}</b> - ${item.qty} oda, ${item.adults} yetişkin, ${item.children} çocuk<br>
        Toplam: ${item.totalPrice * nights} TL
        <button onclick='removeFromBasket(${i})' style='margin-left:12px;background:#b00;color:#fff;border:none;border-radius:6px;padding:2px 10px;cursor:pointer;'>Sil</button>
      </li>`;
    });
    summaryHtml += `</ul>
      <button id="openFormBtn" style="margin-top:16px;background:#0077b6;color:#fff;border:none;border-radius:8px;padding:10px 24px;cursor:pointer;">Rezervasyonu Tamamla</button>`;
  } else {
    summaryHtml += `<span style='color:#888;'>Henüz oda eklenmedi.</span>`;
  }
  summaryHtml += `</div>`;
  rezSummary.innerHTML = summaryHtml;

  const openFormBtn = document.getElementById("openFormBtn");
  if (openFormBtn) {
    openFormBtn.onclick = function() {
      document.getElementById("guestFormContainer").style.display = "block";
      document.getElementById("summaryInput").value = getSummaryText();
      var formSection = document.getElementById('guestFormContainer');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
  }
}

function renderRooms() {
  const roomOptions = document.getElementById("roomOptions");
  roomOptions.innerHTML = "";
  rooms.forEach((room, idx) => {
      const div = document.createElement("div");
      div.className = "room-card room-card-modern";
      div.innerHTML = `
        <div class="room-card-imgwrap" style="position:relative;min-height:180px;">
          <img src="${room.images[0]}" class="slider-img" style="width:100%;height:180px;object-fit:cover;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <img src="${room.images[1]}" class="slider-img" style="width:100%;height:180px;object-fit:cover;border-radius:16px;position:absolute;left:0;top:0;opacity:0;transition:opacity .7s;">
          <img src="${room.images[2]}" class="slider-img" style="width:100%;height:180px;object-fit:cover;border-radius:16px;position:absolute;left:0;top:0;opacity:0;transition:opacity .7s;">
        </div>
        <div class="room-card-header">
          <h3 class="room-card-title">${room.name}</h3>
        </div>
        <span class="room-card-badge" id="roomPrice${idx}" style="align-self:flex-end;margin-bottom:8px;">${room.price} TL/gece</span>
        <ul class="room-card-features">
          ${idx === 0 ? `
            <li><span class="feature-icon">🛏️</span> Çift kişilik yatak</li>
            <li><span class="feature-icon">🛏️</span> Tek kişilik yatak</li>
            <li><span class="feature-icon">🛋️</span> Kanepe</li>
          ` : ''}
          ${idx === 1 ? `
            <li><span class="feature-icon">🛏️</span> Çift kişilik yatak</li>
            <li><span class="feature-icon">🛋️</span> Kanepe</li>
          ` : ''}
          ${idx === 2 ? `
            <li><span class="feature-icon">🛏️</span> 2 Tek kişilik yatak</li>
            <li><span class="feature-icon">🛋️</span> Kanepe</li>
          ` : ''}
        
          <li><span class="feature-icon">❄️</span> Klima</li>
          <li><span class="feature-icon">📺</span> TV</li>
          <li><span class="feature-icon">📶</span> Ücretsiz Wi-Fi</li>
        </ul>
        <div class="room-card-controls">
          <div class="room-card-control-group">
            <label>Yetişkin</label>
            <div class="counter-modern">
              <button type="button" class="counter-modern-btn" onclick="changeCounter(${idx},'adults',-1)">−</button>
              <span class="counter-modern-value" id="adultsCount${idx}">1</span>
              <button type="button" class="counter-modern-btn" onclick="changeCounter(${idx},'adults',1)">+</button>
            </div>
          </div>
          <div class="room-card-control-group">
            <label>Çocuk (0-12)</label>
            <div class="counter-modern">
              <button type="button" class="counter-modern-btn" onclick="changeCounter(${idx},'children',-1)">−</button>
              <span class="counter-modern-value" id="childrenCount${idx}">0</span>
              <button type="button" class="counter-modern-btn" onclick="changeCounter(${idx},'children',1)">+</button>
            </div>
          </div>
          <div class="room-card-control-group">
            <label for="roomQty${idx}">Oda Adedi</label>
            <div class="counter-modern" style="margin-bottom:10px;">
              <button type="button" class="counter-modern-btn" onclick="changeCounter(${idx},'qty',-1)">−</button>
              <span class="counter-modern-value" id="roomQtyCount${idx}">1</span>
              <button type="button" class="counter-modern-btn" onclick="changeCounter(${idx},'qty',1)">+</button>
            </div>
          </div>
        </div>
        <button class="btn room-card-btn" type="button" onclick="addRoomToSelection(${idx})">Sepete Ekle</button>
      `;
      roomOptions.appendChild(div);
      startSlider(div.querySelectorAll('.slider-img'));
    });
    window.roomCounters = window.roomCounters || {};
    rooms.forEach((_, idx) => {
      if (!window.roomCounters[idx]) window.roomCounters[idx] = { adults: 1, children: 0, qty: 1 };
      updateRoomPrice(idx);
    });
}

// Otomatik slider fonksiyonu
function startSlider(imgs) {
  let current = 0;
  setInterval(() => {
    imgs.forEach((img, i) => img.style.opacity = i === current ? "1" : "0");
    current = (current + 1) % imgs.length;
  }, 2500);
}

// Sayaç değiştirici
window.changeCounter = function(idx, type, delta) {
  if (!window.roomCounters) window.roomCounters = {};
  if (!window.roomCounters[idx]) window.roomCounters[idx] = { adults: 1, children: 0, qty: 1 };
  let val = window.roomCounters[idx][type] + delta;
  if (type === "adults") val = Math.max(1, Math.min(val, 6));
  if (type === "children") val = Math.max(0, Math.min(val, 6));
  if (type === "qty") val = Math.max(1, Math.min(val, 10));
  window.roomCounters[idx][type] = val;
  if (type === "qty") {
    document.getElementById("roomQtyCount" + idx).textContent = val;
  } else {
    document.getElementById(type + "Count" + idx).textContent = val;
  }
  updateRoomPrice(idx);
};

// Fiyat güncelleme
function updateRoomPrice(idx) {
  const { adults } = window.roomCounters[idx];
  let price = 2000;
  if (adults === 2) price = 3500;
  else if (adults === 3) price = 5000;
  else if (adults > 3) price = 5000 + (adults - 3) * 1500;
  document.getElementById("roomPrice" + idx).textContent = price + ' TL';
}

// Sepete ekleme
window.addRoomToSelection = function(idx) {
  const c = window.roomCounters[idx];
  if (!c || c.qty < 1) {
    alert("Lütfen oda adedini seçiniz.");
    return;
  }
  let price = 2000;
  if (c.adults === 2) price = 3500;
  else if (c.adults === 3) price = 5000;
  else if (c.adults > 3) price = 5000 + (c.adults - 3) * 1500;
  basket.push({
    name: rooms[idx].name,
    qty: c.qty,
    adults: c.adults,
    children: c.children,
    price: price,
    totalPrice: price * c.qty
  });
  renderSummary();
  renderRooms();
  document.getElementById("formResult").innerHTML = "";
  // Scroll to basket/summary section after adding
  setTimeout(function() {
    var summarySection = document.getElementById('rez-summary');
    if (summarySection) summarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
};

// Sepetten silme
window.removeFromBasket = function(i) {
  basket.splice(i, 1);
  renderSummary();
  renderRooms();
};

// Sepet ve tarih özetini metin olarak hazırla
function getSummaryText() {
  let txt = `Giriş: ${checkin}, Çıkış: ${checkout}, Gece: ${nights}\n`;
  basket.forEach(item => {
    txt += `${item.name} - ${item.qty} oda, ${item.adults} yetişkin, ${item.children} çocuk, Toplam: ${item.totalPrice * nights} TL\n`;
  });
  return txt;
}

// TC Kimlik No algoritması
function isValidTC(tc) {
  if (!/^[1-9][0-9]{10}$/.test(tc)) return false;
  const digits = tc.split('').map(Number);
  const oddTotal = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenTotal = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = ((oddTotal * 7) - evenTotal) % 10;
  const digit11 = digits.slice(0, 10).reduce((sum, d) => sum + d, 0) % 10;
  return digit10 === digits[9] && digit11 === digits[10];
}

// Form gönderimi (Formspree)
const guestForm = document.getElementById("guestForm");
if (guestForm) {
  guestForm.onsubmit = function(e) {
    e.preventDefault();
    const result = document.getElementById("formResult");
    const tcInput = document.getElementById("tc");
    const tc = tcInput ? tcInput.value.trim() : "";

    if (!isValidTC(tc)) {
      result.textContent = "Geçerli bir T.C. Kimlik Numarası giriniz.";
      result.style.color = "red";
      return;
    }

    const data = new FormData(this);
    fetch("https://formspree.io/f/myzpdqqj", {
      method: "POST",
      body: data,
      headers: { 'Accept': 'application/json' }
    })
    .then(res => res.json())
    .then(res => {
      result.style.color = "#0077b6";
      result.innerHTML = "<b>Rezervasyonunuz alınmıştır. Teşekkürler!</b>";
      guestForm.reset();
      setTimeout(() => {
        document.getElementById("guestFormContainer").style.display = "none";
      }, 2500);
      basket = [];
      renderSummary();
    })
    .catch(() => {
      result.style.color = "red";
      result.innerHTML = "<b>Bir hata oluştu. Lütfen tekrar deneyin.</b>";
    });
  };
}

// Telefon formatlama
var phoneInput = document.getElementById('phone');
if (phoneInput) {
  var countryCodeDisplay = document.getElementById('countryCodeDisplay');
  phoneInput.addEventListener('input', function(e) {
    let val = e.target.value.replace(/\D/g, '');
    let country = '';
    if (val.startsWith('90')) country = 'TR';
    else if (val.startsWith('1')) country = 'US';
    else if (val.startsWith('44')) country = 'UK';
    else if (val.startsWith('49')) country = 'DE';
    else if (val.startsWith('33')) country = 'FR';
    else if (val.startsWith('7')) country = 'RU';
    else if (val.startsWith('39')) country = 'IT';
    else if (val.startsWith('81')) country = 'JP';
    else if (val.startsWith('86')) country = 'CN';
    else country = '';
    countryCodeDisplay.textContent = country;

    let formatted = '';
    if (country === 'TR') {
      // Format as (90) 5xx xxx xx xx
      if (val.length >= 2) {
        formatted = '(90) ';
        let rest = val.slice(2);
        if (rest.length > 0) formatted += rest.slice(0,3);
        if (rest.length > 3) formatted += ' ' + rest.slice(3,6);
        if (rest.length > 6) formatted += ' ' + rest.slice(6,8);
        if (rest.length > 8) formatted += ' ' + rest.slice(8,10);
      } else {
        formatted = val;
      }
    } else {
      // Generic formatting for other countries
      if (val.length > 0) formatted = '+' + val.slice(0,3);
      if (val.length > 3) formatted += ' ' + val.slice(3,6);
      if (val.length > 6) formatted += ' ' + val.slice(6,10);
      if (val.length > 10) formatted += ' ' + val.slice(10,14);
    }
    e.target.value = formatted;
  });
}
