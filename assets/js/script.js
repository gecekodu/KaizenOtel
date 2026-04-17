const ROUTES = {
  anasayfa: {
    file: "content/anasayfa.html",
    title: "Kaizen Otel | Erdemli Mersin Konaklama",
    description: "Kaizen Otel Erdemli Mersin'de denize yakın konum, modern odalar ve profesyonel hizmet sunar."
  },
  hakkimizda: {
    file: "content/hakkimizda.html",
    title: "Hakkımızda | Kaizen Otel",
    description: "Kaizen Otel'in hizmet yaklaşımı, kalite standardı ve misafir deneyimi odaklı yapısı."
  },
  odalar: {
    file: "content/odalar.html",
    title: "Odalar | Kaizen Otel",
    description: "Kaizen Otel oda kategorileri, kişi kapasitesi ve güncel fiyat bilgileri."
  },
  hizmetler: {
    file: "content/hakkimizda.html",
    title: "Hakkımızda | Kaizen Otel",
    description: "Kaizen Otel'in hizmet yaklaşımı ve konaklama boyunca sunduğu tüm servis detayları."
  },
  galeri: {
    file: "content/galeri.html",
    title: "Galeri | Kaizen Otel",
    description: "Kaizen Otel oda ve alan görsellerini galeride inceleyin."
  },
  iletisim: {
    file: "content/iletisim.html",
    title: "İletişim | Kaizen Otel",
    description: "Kaizen Otel iletişim bilgileri, telefon, e-posta ve konum detayları."
  }
};

const ALIASES = {
  home: "anasayfa",
  about: "hakkimizda",
  rooms: "odalar",
  services: "hizmetler",
  gallery: "galeri",
  contact: "iletisim"
};

const REVIEWS = [
  { name: "Meral İ.", text: "Odalar temiz, ekip ilgili ve konum olarak oldukça rahattı.", rating: 5 },
  { name: "Mahmut Ö.", text: "Karşılama çok iyiydi. Sorularımıza hızlıca çözüm bulduk.", rating: 5 },
  { name: "Sevil A.", text: "Ailece konakladık, düzen ve hizmet seviyesi beklentimizi karşıladı.", rating: 5 },
  { name: "Irmak T.", text: "Sahil erişimi kolay, odalar bakımlı. Tekrar tercih edeceğim.", rating: 5 },
  { name: "Hatice K.", text: "Fiyat-performans olarak güçlü bir seçenek, personel nazik.", rating: 5 },
  { name: "Erhan Ö.", text: "Kısa konaklama için tüm ihtiyaçlarımızı rahatça karşıladık.", rating: 5 }
];

const state = {
  route: "anasayfa",
  heroTimer: null,
  reviewTimer: null,
  keyHandler: null,
  scrollUiUpdate: null
};

function resolveRoute(hashText) {
  const cleaned = (hashText || "").replace(/^#/, "").trim().toLowerCase();
  if (!cleaned) return "anasayfa";
  if (ROUTES[cleaned]) return cleaned;
  if (ALIASES[cleaned]) return ALIASES[cleaned];
  return "anasayfa";
}

function setMeta(routeKey) {
  const route = ROUTES[routeKey];
  if (!route) return;

  document.title = route.title;

  const desc = document.querySelector('meta[name="description"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  const twDesc = document.querySelector('meta[name="twitter:description"]');
  const canonical = document.getElementById("canonicalLink");

  if (desc) desc.setAttribute("content", route.description);
  if (ogTitle) ogTitle.setAttribute("content", route.title);
  if (ogDesc) ogDesc.setAttribute("content", route.description);
  if (twTitle) twTitle.setAttribute("content", route.title);
  if (twDesc) twDesc.setAttribute("content", route.description);

  const href = `${window.location.origin}${window.location.pathname}#${routeKey}`;
  if (canonical) canonical.setAttribute("href", href);
}

function setActiveNav(routeKey) {
  document.querySelectorAll("[data-route]").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === routeKey);
  });
}

function cleanupRouteEffects() {
  if (state.heroTimer) {
    window.clearInterval(state.heroTimer);
    state.heroTimer = null;
  }
  if (state.reviewTimer) {
    window.clearInterval(state.reviewTimer);
    state.reviewTimer = null;
  }
  if (state.keyHandler) {
    document.removeEventListener("keydown", state.keyHandler);
    state.keyHandler = null;
  }
  document.body.style.overflow = "";
}

function mountReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  nodes.forEach((node) => observer.observe(node));
}

function initHero() {
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dots = Array.from(document.querySelectorAll(".hero-dot"));
  if (!slides.length) return;

  let current = 0;

  const show = (idx) => {
    current = idx;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === idx));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === idx));
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const idx = Number(dot.dataset.slide || "0");
      show(idx);
    });
  });

  state.heroTimer = window.setInterval(() => {
    const next = (current + 1) % slides.length;
    show(next);
  }, 5800);
}

function reviewCard(review) {
  const stars = "★".repeat(review.rating) + "☆".repeat(Math.max(0, 5 - review.rating));
  return `
    <article class="testimonial">
      <div class="testimonial-head">
        <strong>${review.name}</strong>
        <span class="stars">${stars}</span>
      </div>
      <p>${review.text}</p>
    </article>
  `;
}

function initReviews() {
  const mount = document.getElementById("reviewMount");
  if (!mount) return;

  let offset = 0;

  const render = () => {
    const items = [
      REVIEWS[offset % REVIEWS.length],
      REVIEWS[(offset + 1) % REVIEWS.length],
      REVIEWS[(offset + 2) % REVIEWS.length]
    ];
    mount.innerHTML = items.map(reviewCard).join("");
  };

  render();
  state.reviewTimer = window.setInterval(() => {
    offset = (offset + 1) % REVIEWS.length;
    render();
  }, 5200);
}

function initGallery() {
  const modal = document.getElementById("galleryModal");
  const modalImg = document.getElementById("galleryModalImg");
  const closeBtn = document.getElementById("galleryClose");
  const prevBtn = document.getElementById("galleryPrev");
  const nextBtn = document.getElementById("galleryNext");
  const images = Array.from(document.querySelectorAll("[data-gallery-item] img"));

  if (!modal || !modalImg || !images.length) return;

  let currentIndex = 0;

  const showAt = (idx) => {
    currentIndex = (idx + images.length) % images.length;
    modalImg.src = images[currentIndex].src;
    modalImg.alt = images[currentIndex].alt || "Galeri görseli";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
  };

  images.forEach((img, i) => {
    const btn = img.closest("[data-gallery-item]");
    if (!btn) return;
    btn.addEventListener("click", () => showAt(i));
  });

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (prevBtn) prevBtn.addEventListener("click", () => showAt(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => showAt(currentIndex + 1));

  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  state.keyHandler = (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") showAt(currentIndex - 1);
    if (event.key === "ArrowRight") showAt(currentIndex + 1);
  };

  document.addEventListener("keydown", state.keyHandler);
}

function initPageFeatures(routeKey) {
  mountReveal();

  if (routeKey === "anasayfa") {
    initHero();
    initReviews();
    initHomeQuickReservation();
  }

  if (routeKey === "galeri") {
    initGallery();
  }
}

function initHomeQuickReservation() {
  const form = document.getElementById("homeQuickReservation");
  const checkIn = document.getElementById("quickCheckIn");
  const checkOut = document.getElementById("quickCheckOut");
  const adults = document.getElementById("quickAdults");
  const roomType = document.getElementById("quickRoomType");
  const note = document.getElementById("quickResNote");
  if (!form || !checkIn || !checkOut || !adults || !roomType || !note) return;

  const initFlatpickr = (input, minDate) => {
    if (!input || input.dataset.flatpickrBound === "1") return;
    if (typeof window.flatpickr !== "function") return;

    const locale =
      window.flatpickr.l10ns && window.flatpickr.l10ns.tr ? "tr" : "default";

    window.flatpickr(input, {
      locale,
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d.m.Y",
      disableMobile: true,
      allowInput: false,
      monthSelectorType: "static",
      minDate,
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
  };

  const today = new Date();
  const toIso = (d) => d.toISOString().slice(0, 10);
  const start = new Date(today);
  start.setDate(start.getDate() + 1);
  const end = new Date(today);
  end.setDate(end.getDate() + 2);

  checkIn.min = toIso(today);
  checkIn.value = checkIn.value || toIso(start);
  checkOut.min = toIso(end);
  checkOut.value = checkOut.value || toIso(end);
  initFlatpickr(checkIn, checkIn.min);
  initFlatpickr(checkOut, checkOut.min);

  checkIn.addEventListener("change", () => {
    if (!checkIn.value) return;
    const selected = new Date(`${checkIn.value}T00:00:00`);
    selected.setDate(selected.getDate() + 1);
    const minOut = toIso(selected);
    checkOut.min = minOut;

    if (checkOut._flatpickr) {
      checkOut._flatpickr.set("minDate", minOut);
    }

    if (!checkOut.value || checkOut.value <= checkIn.value) {
      if (checkOut._flatpickr) {
        checkOut._flatpickr.setDate(minOut, true, "Y-m-d");
      } else {
        checkOut.value = minOut;
      }
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!checkIn.value || !checkOut.value) {
      note.textContent = "Lütfen giriş ve çıkış tarihini seçin.";
      note.classList.remove("ok");
      return;
    }
    if (checkOut.value <= checkIn.value) {
      note.textContent = "Çıkış tarihi, giriş tarihinden sonra olmalıdır.";
      note.classList.remove("ok");
      return;
    }

    note.textContent = "";
    note.classList.remove("ok");

    const params = new URLSearchParams({
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      adults: adults.value,
      children: "0",
      roomCount: "1",
      roomType: roomType.value
    });
    window.location.href = `rezervasyon.html?${params.toString()}`;
  });
}

function closeMobileMenu() {
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("menuToggle");
  if (!nav || !toggle) return;
  nav.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
  nav.querySelectorAll(".nav-group[open]").forEach((group) => {
    group.removeAttribute("open");
  });
}

async function renderRoute() {
  cleanupRouteEffects();

  const routeKey = resolveRoute(window.location.hash);
  const route = ROUTES[routeKey];
  const root = document.getElementById("appRoot");
  const header = document.getElementById("siteHeader");

  if (!route || !root) return;
  if (header) {
    header.classList.toggle("route-solid", routeKey !== "anasayfa");
  }

  try {
    const response = await fetch(route.file, { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    const html = await response.text();
    root.innerHTML = html;

    state.route = routeKey;
    setMeta(routeKey);
    setActiveNav(routeKey);
    initPageFeatures(routeKey);
    closeMobileMenu();

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.focus();
    if (typeof state.scrollUiUpdate === "function") {
      state.scrollUiUpdate();
    }
  } catch (error) {
    root.innerHTML = `
      <div class="page-wrap">
        <section class="section-block">
          <div class="card">
            <h2>İçerik yüklenemedi</h2>
            <p>Bir sorun oluştu. Lütfen tekrar deneyin.</p>
            <a class="btn btn-light" href="#anasayfa" data-route="anasayfa">Ana sayfaya dön</a>
          </div>
        </section>
      </div>
    `;
    console.error("Route render error:", error);
    if (typeof state.scrollUiUpdate === "function") {
      state.scrollUiUpdate();
    }
  }
}

function setupNav() {
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("menuToggle");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  document.addEventListener("click", (event) => {
    const el = event.target instanceof Element ? event.target.closest("[data-route]") : null;
    if (!el) return;
    const route = el.getAttribute("data-route");
    if (!route) return;

    event.preventDefault();
    const next = resolveRoute(`#${route}`);
    if (state.route === next) {
      closeMobileMenu();
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }

    window.location.hash = next;
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest(".nav-group")) return;
    document.querySelectorAll(".nav-group[open]").forEach((group) => {
      group.removeAttribute("open");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 880) closeMobileMenu();
  });
}

function setupHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const update = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

function setupCookie() {
  const note = document.getElementById("cookieNote");
  const btn = document.getElementById("cookieBtn");
  if (!note || !btn) return;
  const body = document.body;
  const storageKey = "cookieAccepted";
  const cookieKey = "cookieAccepted=1";

  const getConsent = () => {
    if (document.cookie.includes(cookieKey)) return "1";
    try {
      if (window.sessionStorage.getItem(storageKey)) return "1";
    } catch (error) {
      // no-op
    }
    try {
      return window.localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  };

  const setConsent = () => {
    document.cookie = "cookieAccepted=1; path=/; max-age=31536000; SameSite=Lax";
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch (error) {
      // no-op
    }
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch (error) {
      // Storage erişimi engellense de kullanıcı tercihini UI'da uygula.
    }
  };

  if (!getConsent()) {
    note.hidden = false;
    body.classList.add("cookie-visible");
  } else {
    body.classList.remove("cookie-visible");
  }

  btn.addEventListener("click", () => {
    setConsent();
    note.hidden = true;
    body.classList.remove("cookie-visible");
    if (typeof state.scrollUiUpdate === "function") {
      state.scrollUiUpdate();
    }
  });
}

function setupSearch() {
  const trigger = document.getElementById("searchTrigger");
  const modal = document.getElementById("searchModal");
  const closeBtn = document.getElementById("searchClose");
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  if (!trigger || !modal || !closeBtn || !input || !results) return;

  const open = () => {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => input.focus(), 30);
  };

  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
    input.value = "";
    results.querySelectorAll("button,a").forEach((item) => {
      item.hidden = false;
    });
  };

  trigger.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  results.querySelectorAll("button[data-search-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const route = btn.dataset.searchRoute;
      if (route) {
        window.location.hash = route;
      }
      close();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) close();
  });

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    results.querySelectorAll("button,a").forEach((item) => {
      const txt = item.textContent ? item.textContent.toLowerCase() : "";
      item.hidden = Boolean(query) && !txt.includes(query);
    });
  });
}

function setupYear() {
  const year = document.getElementById("yearNow");
  if (year) year.textContent = String(new Date().getFullYear());
}

function setupScrollTopButton() {
  const btn = document.getElementById("scrollTopBtn");
  const progressCircle = document.getElementById("scrollProgressCircle");
  if (!btn || !progressCircle) return;

  const radius = Number(progressCircle.getAttribute("r")) || 24;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = `${circumference}`;

  const update = () => {
    const scrollHeight = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0
    );
    const progress = scrollHeight ? window.scrollY / scrollHeight : 0;
    const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
    progressCircle.style.strokeDashoffset = `${offset}`;
    btn.classList.toggle("visible", window.scrollY > 280);
  };

  state.scrollUiUpdate = update;
  update();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
}

function bootstrap() {
  if (!window.location.hash) {
    window.location.hash = "anasayfa";
  }

  setupYear();
  setupNav();
  setupHeader();
  setupCookie();
  setupSearch();
  setupScrollTopButton();
  renderRoute();
  window.addEventListener("hashchange", renderRoute);
}

document.addEventListener("DOMContentLoaded", bootstrap);
