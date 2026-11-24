/* ==========================================================================
   APP.JS — Pengendali UI, Tema, Navigasi & Pemeriksaan Domain Online
   ========================================================================== */

// 0. Terms and Conditions Gate
const termsOverlay = document.getElementById("termsOverlay");
const termsCheckbox = document.getElementById("termsCheckbox");
const termsAcceptBtn = document.getElementById("termsAcceptBtn");
if (termsOverlay && termsCheckbox && termsAcceptBtn) {
  let termsAccepted = false;
  try {
    termsAccepted = localStorage.getItem("shacurity-terms-v2") === "accepted";
  } catch (_) {}

  if (termsAccepted) {
    termsOverlay.classList.add("hidden");
    termsOverlay.setAttribute("aria-hidden", "true");
  } else {
    document.body.style.overflow = "hidden";
    termsOverlay.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => termsCheckbox.focus());
  }

  termsCheckbox.addEventListener("change", () => {
    termsAcceptBtn.disabled = !termsCheckbox.checked;
  });

  termsAcceptBtn.addEventListener("click", () => {
    if (!termsCheckbox.checked) return;
    try {
      localStorage.setItem("shacurity-terms-v2", "accepted");
    } catch (_) {}
    termsOverlay.classList.add("hidden");
    termsOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  });

  termsOverlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") event.preventDefault();
  });
}

// 1. Navbar Scroll & Mobile Sheet
const navbarWrapper = document.getElementById("navbarWrapper");
window.addEventListener("scroll", () => {
  if (navbarWrapper) navbarWrapper.classList.toggle("scrolled", window.scrollY > 18);
}, { passive: true });

const primaryNav = document.querySelector(".nav-center");
const primaryNavLinks = primaryNav ? primaryNav.querySelectorAll(".nav-link") : [];
const mobileNavLinks = document.querySelectorAll(".mobile-nav-list a");
const setActiveNavLink = (href) => {
  let activeLink = null;
  primaryNavLinks.forEach((link) => {
    if (link.getAttribute("href") === href) {
      link.setAttribute("aria-current", "page");
      activeLink = link;
    } else {
      link.removeAttribute("aria-current");
    }
  });
  mobileNavLinks.forEach((link) => {
    if (link.getAttribute("href") === href) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  if (primaryNav && activeLink) {
    const navRect = primaryNav.getBoundingClientRect();
    const activeLinkRect = activeLink.getBoundingClientRect();
    primaryNav.style.setProperty("--active-nav-x", `${activeLinkRect.left - navRect.left}px`);
    primaryNav.style.setProperty("--active-nav-y", `${activeLinkRect.top - navRect.top}px`);
    primaryNav.style.setProperty("--active-nav-width", `${activeLinkRect.width}px`);
    primaryNav.style.setProperty("--active-nav-height", `${activeLinkRect.height}px`);
    primaryNav.classList.add("has-active");
  } else if (primaryNav) {
    primaryNav.style.removeProperty("--active-nav-x");
    primaryNav.style.removeProperty("--active-nav-y");
    primaryNav.style.removeProperty("--active-nav-width");
    primaryNav.style.removeProperty("--active-nav-height");
    primaryNav.classList.remove("has-active");
  }
};

const navSections = Array.from(primaryNavLinks)
  .map((link) => ({
    href: link.getAttribute("href"),
    section: document.querySelector(link.getAttribute("href"))
  }))
  .filter((item) => item.section);
let pendingNavHref = "";
let navScrollSettleTimer = null;
let navScrollUpdatePending = false;
const finishPendingNavScroll = () => {
  if (!pendingNavHref) return;
  pendingNavHref = "";
  if (navScrollSettleTimer !== null) {
    window.clearTimeout(navScrollSettleTimer);
    navScrollSettleTimer = null;
  }
  updateActiveNavFromScroll();
};
const schedulePendingNavScrollFinish = (delay) => {
  if (navScrollSettleTimer !== null) window.clearTimeout(navScrollSettleTimer);
  navScrollSettleTimer = window.setTimeout(finishPendingNavScroll, delay);
};
const updateActiveNavFromScroll = () => {
  if (pendingNavHref) {
    schedulePendingNavScrollFinish(180);
    return;
  }
  if (navScrollUpdatePending) return;
  navScrollUpdatePending = true;

  window.requestAnimationFrame(() => {
    navScrollUpdatePending = false;
    if (pendingNavHref) {
      schedulePendingNavScrollFinish(180);
      return;
    }
    const activationPoint = Math.min(180, window.innerHeight * 0.3);
    let activeHref = "";

    navSections.forEach(({ href, section }) => {
      if (section.getBoundingClientRect().top <= activationPoint) activeHref = href;
    });

    const reachedPageBottom =
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    if (reachedPageBottom && navSections.length > 0) {
      activeHref = navSections[navSections.length - 1].href;
    }

    setActiveNavLink(activeHref);
  });
};

if (window.location.hash) setActiveNavLink(window.location.hash);
primaryNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    pendingNavHref = link.getAttribute("href");
    setActiveNavLink(pendingNavHref);
    schedulePendingNavScrollFinish(1200);
  });
});
window.addEventListener("hashchange", () => setActiveNavLink(window.location.hash));
window.addEventListener("scroll", updateActiveNavFromScroll, { passive: true });
window.addEventListener("resize", updateActiveNavFromScroll, { passive: true });
updateActiveNavFromScroll();

const navRailToggle = document.getElementById("navRailToggle");
if (navbarWrapper && navRailToggle) {
  navRailToggle.addEventListener("click", () => {
    const isHidden = navbarWrapper.classList.toggle("nav-hidden");
    document.body.classList.toggle("nav-rail-hidden", isHidden);
    const label = isHidden ? "Tampilkan navigasi samping" : "Sembunyikan navigasi samping";
    navRailToggle.setAttribute("aria-expanded", String(!isHidden));
    navRailToggle.setAttribute("aria-label", label);
    navRailToggle.setAttribute("title", label);
  });
}

const mobileMenuTrigger = document.getElementById("mobileMenuTrigger");
const mobileSheet = document.getElementById("mobileSheet");
if (mobileMenuTrigger && mobileSheet) {
  function tutupMobileSheet() {
    if (!mobileSheet.classList.contains("open")) return;
    mobileSheet.classList.remove("open");
    mobileSheet.classList.add("closing");
    mobileMenuTrigger.classList.remove("open");
    mobileMenuTrigger.setAttribute("aria-expanded", "false");
    mobileMenuTrigger.setAttribute("aria-label", "Buka menu");
    window.setTimeout(() => {
      mobileSheet.classList.remove("closing");
    }, 280);
  }

  mobileMenuTrigger.addEventListener("click", () => {
    const isOpen = !mobileSheet.classList.contains("open");
    if (!isOpen) {
      tutupMobileSheet();
      return;
    }
    mobileSheet.classList.remove("closing");
    mobileSheet.classList.add("open");
    const mobileCtas = mobileSheet.querySelector(".mobile-sheet-ctas");
    if (mobileCtas && mobileCtas.dataset.userSelected !== "true") {
      mobileCtas.classList.add("no-selection");
      mobileCtas.querySelectorAll("[data-mobile-tab]").forEach((button) => button.classList.remove("active"));
    }
    mobileMenuTrigger.setAttribute("aria-expanded", String(isOpen));
    mobileMenuTrigger.classList.toggle("open", isOpen);
    mobileMenuTrigger.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
  });
  mobileSheet.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        pendingNavHref = href;
        setActiveNavLink(href);
        schedulePendingNavScrollFinish(1200);
      }
      if (link.dataset.mobileTab) {
        aktifkanTabLab(link.dataset.mobileTab);
        const ctas = link.closest(".mobile-sheet-ctas");
        if (ctas) {
          ctas.dataset.userSelected = "true";
          ctas.classList.remove("no-selection");
          ctas.querySelectorAll("[data-mobile-tab]").forEach((button) => {
            button.classList.toggle("active", button === link);
          });
        }
      } else {
        const ctas = mobileSheet.querySelector(".mobile-sheet-ctas");
        if (ctas) {
          ctas.dataset.userSelected = "false";
          ctas.classList.add("no-selection");
          ctas.querySelectorAll("[data-mobile-tab]").forEach((button) => button.classList.remove("active"));
        }
      }
      tutupMobileSheet();
    });
  });

  document.addEventListener("click", (event) => {
    if (!mobileSheet.classList.contains("open")) return;
    if (navbarWrapper && navbarWrapper.contains(event.target)) return;
    tutupMobileSheet();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth <= 1024) return;
    tutupMobileSheet();
  }, { passive: true });
}

// 2. Dark / Light Theme Toggle
const htmlEl = document.documentElement;
const themeBtn = document.getElementById("themeBtn");
const faviconLink = document.getElementById("favicon");
const savedTheme = localStorage.getItem("shacurity-theme");
if (savedTheme) htmlEl.setAttribute("data-theme", savedTheme);
const updateFavicon = (theme) => {
  if (faviconLink) {
    faviconLink.href = theme === "light" ? "logohplightmode.png" : "logohpdarkmode.png";
  }
};
updateFavicon(htmlEl.getAttribute("data-theme"));

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const next = htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
    htmlEl.setAttribute("data-theme", next);
    localStorage.setItem("shacurity-theme", next);
    updateFavicon(next);
  });
}

// 3. Lab Switcher & Feature Card Launchers
function aktifkanTabLab(paneId) {
  document.querySelectorAll(".lab-tab-btn").forEach((b) => {
    const active = b.dataset.labTab === paneId;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".lab-pane").forEach((pane) => {
    pane.classList.toggle("active", pane.id === paneId);
  });

  requestAnimationFrame(() => {
    const activeButton = document.querySelector(`.lab-tab-btn[data-lab-tab="${paneId}"]`);
    const switcher = activeButton ? activeButton.closest(".lab-switcher") : null;
    if (!activeButton || !switcher) return;

    const switchRect = switcher.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    switcher.style.setProperty("--liquid-left", `${buttonRect.left - switchRect.left}px`);
    switcher.style.setProperty("--liquid-width", `${buttonRect.width}px`);
    switcher.style.setProperty("--liquid-top", `${buttonRect.top - switchRect.top}px`);
    switcher.style.setProperty("--liquid-height", `${buttonRect.height}px`);
  });

  const mobileCtas = document.querySelector(".mobile-sheet-ctas");
  if (mobileCtas) {
    const mobileIndexes = {
      paneRaporDomain: 0,
      paneCekEmail: 1,
      paneCekFile: 2
    };
    const index = mobileIndexes[paneId] ?? 0;
    mobileCtas.style.setProperty("--mobile-liquid-index", String(index));
    if (mobileCtas.dataset.userSelected === "true") {
      mobileCtas.classList.remove("no-selection");
      mobileCtas.querySelectorAll("[data-mobile-tab]").forEach((button) => {
        button.classList.toggle("active", button.dataset.mobileTab === paneId);
      });
    }
  }
}

document.querySelectorAll(".lab-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => aktifkanTabLab(btn.dataset.labTab));
});

requestAnimationFrame(() => {
  const activeButton = document.querySelector(".lab-tab-btn.active");
  const switcher = activeButton ? activeButton.closest(".lab-switcher") : null;
  if (activeButton && switcher) {
    const switchRect = switcher.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    switcher.style.setProperty("--liquid-left", `${buttonRect.left - switchRect.left}px`);
    switcher.style.setProperty("--liquid-width", `${buttonRect.width}px`);
    switcher.style.setProperty("--liquid-top", `${buttonRect.top - switchRect.top}px`);
    switcher.style.setProperty("--liquid-height", `${buttonRect.height}px`);
  }

  const mobileCtas = document.querySelector(".mobile-sheet-ctas");
  if (mobileCtas) {
    mobileCtas.classList.add("no-selection");
    mobileCtas.querySelectorAll("[data-mobile-tab]").forEach((button) => button.classList.remove("active"));
  }
});

document.querySelectorAll("[data-open-lab]").forEach((el) => {
  el.addEventListener("click", () => {
    const paneId = el.dataset.openLab;
    aktifkanTabLab(paneId);
    const labSection = document.getElementById("lab-keamanan");
    if (labSection) labSection.scrollIntoView({ behavior: "smooth" });
  });
});

// 4. Feature Card Visual Animations
const domainDemoBar = document.getElementById("domainDemoBar");
const domainDemoBadges = document.getElementById("domainDemoBadges");
const demoDomainSamples = [
  {
    html: '<span style="color:var(--blue);font-weight:700;">infokhs.umm.ac.id</span>.<span style="color:var(--green);font-weight:700;">akun-verifikasi</span>.<span style="color:var(--amber);font-weight:700;">example</span>',
    badges: '<span class="mini-tag">Utama: akun-verifikasi.example</span><span class="mini-tag warn">Domain Lain di Subdomain</span><span class="mini-tag warn">6 Bagian</span>'
  },
  {
    html: '<span style="color:var(--green);font-weight:700;">praktikum-umm</span>.<span style="color:var(--amber);font-weight:700;">github.io</span>',
    badges: '<span class="mini-tag">Akhiran: github.io</span><span class="mini-tag warn">Jenis: PRIVATE</span><span class="mini-tag warn">Tanda Hubung (-)</span>'
  },
  {
    html: '<span style="color:var(--blue);font-weight:700;">www</span>.<span style="color:var(--green);font-weight:700;">bbc</span>.<span style="color:var(--amber);font-weight:700;">co.uk</span>',
    badges: '<span class="mini-tag ok">Utama: bbc.co.uk</span><span class="mini-tag ok">Akhiran: co.uk (ICANN)</span>'
  }
];
let domainSampleIdx = 0;
setInterval(() => {
  domainSampleIdx = (domainSampleIdx + 1) % demoDomainSamples.length;
  if (domainDemoBar && domainDemoBadges) {
    domainDemoBar.innerHTML = demoDomainSamples[domainSampleIdx].html;
    domainDemoBadges.innerHTML = demoDomainSamples[domainSampleIdx].badges;
  }
}, 3400);

const perfDetailText = document.getElementById("perfDetailText");
document.querySelectorAll(".perf-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".perf-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    if (perfDetailText) perfDetailText.innerHTML = tab.dataset.detail;
  });
});

(function animateGauges() {
  const targets = [100, 99, 100, 100];
  const arcs = document.querySelectorAll(".gauge-arc");
  const nums = document.querySelectorAll(".gauge-num");
  const circumference = 125.6;

  arcs.forEach((arc, idx) => {
    const target = targets[idx];
    let current = 0;
    const step = () => {
      current += 4;
      if (current > target) current = target;
      if (nums[idx]) nums[idx].textContent = current;
      arc.style.strokeDashoffset = circumference - (current / 100) * circumference;
      if (current < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
})();

const pipeSteps = document.querySelectorAll(".pipe-step");
const termOutput = document.getElementById("termOutput");
const termLines = [
  "&#9888; Ekstensi ganda terdeteksi: .pdf.exe",
  "&#9888; Magic bytes: 4D 5A (Windows PE EXE)",
  "&#10003; SHA-256 dihitung lokal di browser",
  "&#10003; Alasan penilaian siap dibaca!"
];
let pipeIndex = 0;
setInterval(() => {
  pipeSteps.forEach((step, idx) => {
    step.classList.remove("current", "done");
    if (idx < pipeIndex) step.classList.add("done");
    if (idx === pipeIndex) step.classList.add("current");
  });
  if (termOutput) {
    termOutput.innerHTML = termLines.slice(0, pipeIndex + 1).join("<br/>") + ' <span class="term-cursor"></span>';
  }
  pipeIndex = (pipeIndex + 1) % 4;
}, 1800);

const globeCanvas = document.getElementById("globeCanvas");
if (globeCanvas) {
  const ctx = globeCanvas.getContext("2d");
  let angle = 0;
  const hubs = [
    { lat: 0.2, lon: 0.4 }, { lat: -0.4, lon: 1.2 }, { lat: 0.6, lon: 2.1 },
    { lat: -0.1, lon: 3.0 }, { lat: 0.45, lon: 3.9 }, { lat: -0.5, lon: 4.7 },
    { lat: 0.15, lon: 5.5 }, { lat: 0.7, lon: 0.9 }, { lat: -0.3, lon: 2.5 },
    { lat: 0.35, lon: 5.0 }
  ];

  function drawGlobe() {
    const w = globeCanvas.width;
    const h = globeCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = 60;
    const isDark = htmlEl.getAttribute("data-theme") === "dark";

    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    [-0.5, 0, 0.5].forEach((lat) => {
      const ry = Math.cos(lat) * r;
      const yOff = Math.sin(lat) * r;
      ctx.beginPath();
      ctx.ellipse(cx, cy + yOff, ry, ry * 0.28, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
      ctx.stroke();
    });

    for (let i = 0; i < 4; i++) {
      const a = angle + (i * Math.PI) / 4;
      const rx = Math.abs(Math.cos(a)) * r;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, r, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
      ctx.stroke();
    }

    hubs.forEach((hub) => {
      const lon = hub.lon + angle;
      const z = Math.sin(lon) * Math.cos(hub.lat);
      if (z > -0.15) {
        const x = cx + Math.cos(lon) * Math.cos(hub.lat) * r;
        const y = cy + Math.sin(hub.lat) * r;
        ctx.beginPath();
        ctx.arc(x, y, z > 0.3 ? 3.2 : 2, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();
      }
    });

    angle += 0.012;
    requestAnimationFrame(drawGlobe);
  }
  drawGlobe();
}

// 5. Heuristik lokal untuk domain dan tautan
const PHISHING_RULES = {
  suspiciousTlds: [
    "xyz", "top", "click", "work", "tk", "ml", "ga", "cf", "gq",
    "zip", "mov", "rest", "surf", "loan", "win", "bid", "icu", "buzz"
  ],
  urgencyKeywords: [
    "login", "signin", "sign-in", "verifikasi", "verify", "update",
    "blokir", "suspend", "suspended", "otp", "password", "sandi",
    "hadiah", "bansos", "klaim", "undi", "undian", "resi", "paket",
    "tagihan", "akun", "keamanan", "security", "darurat", "urgent",
    "konfirmasi", "aktivasi", "unlock", "restore"
  ],
  protectedBrands: [
    { nama: "BRI", kata: ["bri", "brimo", "ibank-bri"], resmi: ["bri.co.id"] },
    { nama: "BCA", kata: ["bca", "klikbca", "mybca"], resmi: ["bca.co.id", "klikbca.com"] },
    { nama: "Mandiri", kata: ["mandiri", "livin"], resmi: ["bankmandiri.co.id", "bankmandiri.id"] },
    { nama: "BNI", kata: ["bni", "wondr"], resmi: ["bni.co.id"] },
    { nama: "DANA", kata: ["dana"], resmi: ["dana.id"] },
    { nama: "OVO", kata: ["ovo"], resmi: ["ovo.id"] },
    { nama: "GoPay / Gojek", kata: ["gopay", "gojek"], resmi: ["gopay.co.id", "gojek.com"] },
    { nama: "Shopee", kata: ["shopee", "shopeepay"], resmi: ["shopee.co.id", "shopee.com"] },
    { nama: "Google", kata: ["google", "gmail", "accounts-google"], resmi: ["google.com", "google.co.id", "accounts.google.com"] },
    { nama: "Microsoft", kata: ["microsoft", "office365", "outlook"], resmi: ["microsoft.com", "live.com", "office.com"] },
    { nama: "Instagram", kata: ["instagram"], resmi: ["instagram.com"] },
    { nama: "WhatsApp", kata: ["whatsapp"], resmi: ["whatsapp.com"] },
    { nama: "Facebook", kata: ["facebook"], resmi: ["facebook.com"] },
    { nama: "UMM", kata: ["umm", "infokhs"], resmi: ["umm.ac.id"] },
    { nama: "BPJS", kata: ["bpjs", "bpjskesehatan"], resmi: ["bpjs-kesehatan.go.id", "bpjsketenagakerjaan.go.id"] },
    { nama: "JNE / J&T", kata: ["jne", "jnt", "jet"], resmi: ["jne.co.id", "jet.co.id"] }
  ]
};

function hitungRisikoLinkTerpadu(rawInput, hostname, pslResult) {
  let skor = 0;
  const temuan = [];
  let parsed = null;

  try {
    const teks = String(rawInput || "").trim();
    parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(teks) ? teks : `http://${teks}`);
  } catch (_) {
    return { skor: 0, temuan: [] };
  }

  if (parsed.username || parsed.password || String(rawInput).includes("@")) {
    skor += 40;
    temuan.push("Manipulasi karakter @ pada URL");
  }

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":")) {
    skor += 35;
    temuan.push("Host menggunakan alamat IP langsung");
  }

  const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(String(rawInput || "").trim());
  if (hasExplicitScheme && parsed.protocol === "http:") {
    skor += 15;
    temuan.push("Koneksi menggunakan HTTP tanpa HTTPS");
  }

  if (parsed.port && !["80", "443"].includes(parsed.port)) {
    skor += 15;
    temuan.push(`Menggunakan port non-standar :${parsed.port}`);
  }

  if (pslResult.jenisAkhiran === "PRIVATE") {
    skor += 15;
    temuan.push(`Akhiran hosting publik/PRIVATE (${pslResult.akhiranPublik})`);
  }

  const domainDalamSubdomain = deteksiDomainDiSubdomain(pslResult.subdomain);
  if (domainDalamSubdomain.length > 0) {
    skor += 35;
    temuan.push(`Nama domain lain diselipkan di subdomain: ${domainDalamSubdomain.join(", ")}`);
  }

  if (typeof PHISHING_RULES !== "undefined") {
    const tld = pslResult.akhiranPublik.split(".").pop();
    if (PHISHING_RULES.suspiciousTlds.includes(tld)) {
      skor += 20;
      temuan.push(`Ekstensi .${tld} sering disalahgunakan`);
    }

    const gabungan = `${pslResult.subdomain}.${pslResult.labelTerdaftar}`.toLowerCase();
    PHISHING_RULES.protectedBrands.forEach((brand) => {
      if (brand.resmi.includes(pslResult.domainUtama)) return;
      const cocokKata = brand.kata.find((kata) => {
        const regex = new RegExp(`(^|[.-])${kata.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([.-]|$)`, "i");
        return regex.test(gabungan);
      });
      if (cocokKata) {
        skor += 35;
        temuan.push(`Indikasi penyamaran merek ${brand.nama}`);
      }
    });

    const teksUrl = `${hostname}${parsed.pathname}${parsed.search}`.toLowerCase();
    const kataUmpan = PHISHING_RULES.urgencyKeywords.filter((kata) => teksUrl.includes(kata));
    if (kataUmpan.length > 0) {
      skor += kataUmpan.length >= 2 ? 20 : 10;
      temuan.push(`Kata umpan sensitif: ${kataUmpan.slice(0, 4).join(", ")}`);
    }
  }

  if (hostname.includes("xn--")) {
    skor += 30;
    temuan.push("Domain Punycode/homograph (xn--)");
  }

  if (pslResult.subdomainLabels.length >= 3) {
    skor += 15;
    temuan.push(`Subdomain terlalu bertingkat (${pslResult.subdomainLabels.length} tingkat)`);
  }

  if (parsed.href.length > 105) {
    skor += 10;
    temuan.push("URL sangat panjang");
  }

  return { skor: Math.min(100, skor), temuan: [...new Set(temuan)] };
}

// 6. Pemeriksaan domain dan tautan lokal serta online
const unifiedForm = document.getElementById("unifiedForm");
const hostInput = document.getElementById("hostInput");
const submitBtn = document.getElementById("submitBtn");
const statusBanner = document.getElementById("statusBanner");
const resultsArea = document.getElementById("resultsArea");
const toggleJsonBtn = document.getElementById("toggleJsonBtn");
const toggleJsonLabel = document.getElementById("toggleJsonLabel");
const rawJsonPanel = document.getElementById("rawJsonPanel");
let masukanTerakhir = "";
let activeController = null;
let activeOnlineTimeout = null;
let activeOnlineRequestId = 0;

function setOnlineStatus(id, message, state) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.classList.remove("online-status-success", "online-status-error", "online-status-warning");
  if (state === "success") element.classList.add("online-status-success");
  if (state === "error") element.classList.add("online-status-error");
  if (state === "warning") element.classList.add("online-status-warning");
}

function formatTanggalOnline(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function hitungUmurDomainHari(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
}

function errorLayananOnline(error) {
  if (error && error.name === "AbortError") return "Permintaan dibatalkan atau melewati batas waktu.";
  return error && error.message ? error.message : "Terjadi kesalahan jaringan.";
}

function buatSinyalDenganTimeout(parentSignal, timeoutMs) {
  const controller = new AbortController();
  const abortParent = () => controller.abort();
  if (parentSignal) {
    if (parentSignal.aborted) controller.abort();
    else parentSignal.addEventListener("abort", abortParent, { once: true });
  }
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    dispose() {
      window.clearTimeout(timeoutId);
      if (parentSignal) parentSignal.removeEventListener("abort", abortParent);
    }
  };
}

async function ambilJsonOnline(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  try {
    return await response.json();
  } catch (_) {
    throw new Error("Layanan mengirim respons JSON yang tidak valid.");
  }
}

async function periksaDnsOnline(hostname, signal, requestId) {
  setOnlineStatus("dnsStatus", "Memeriksa DNS publik...");
  const request = buatSinyalDenganTimeout(signal, 8000);
  try {
    const data = await ambilJsonOnline(
      `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`,
      { signal: request.signal, headers: { Accept: "application/json" } }
    );
    if (requestId !== activeOnlineRequestId) return;
    if (data.Status !== 0 && data.Status !== 3) {
      throw new Error(`Layanan DNS mengembalikan kode ${data.Status}.`);
    }

    const addresses = Array.isArray(data.Answer)
      ? data.Answer.filter((answer) => answer.type === 1 && answer.data).map((answer) => answer.data)
      : [];
    document.getElementById("resIpAddress").textContent =
      addresses.length ? [...new Set(addresses)].join(", ") : "Alamat IPv4 tidak ditemukan";
    document.getElementById("resIpHost").textContent = `Catatan DNS A untuk ${hostname}`;
    setOnlineStatus(
      "dnsStatus",
      data.Status === 3 ? "DNS merespons: nama tidak ditemukan (NXDOMAIN)" : "DNS berhasil diperiksa",
      data.Status === 3 ? "warning" : "success"
    );
  } catch (error) {
    if (requestId !== activeOnlineRequestId) return;
    document.getElementById("resIpAddress").textContent = "Tidak tersedia";
    document.getElementById("resIpHost").textContent = "Alamat tidak dapat diperoleh dari layanan DNS.";
    setOnlineStatus("dnsStatus", `DNS gagal: ${errorLayananOnline(error)}`, "error");
  } finally {
    request.dispose();
  }
}

async function periksaRdapOnline(domainUtama, signal, requestId) {
  setOnlineStatus("rdapStatus", "Memeriksa data pendaftaran...");
  const request = buatSinyalDenganTimeout(signal, 8000);
  try {
    const data = await ambilJsonOnline(
      `https://rdap.org/domain/${encodeURIComponent(domainUtama)}`,
      { signal: request.signal, headers: { Accept: "application/rdap+json, application/json" } }
    );
    if (requestId !== activeOnlineRequestId) return;

    const events = Array.isArray(data.events) ? data.events : [];
    const registration = events.find((event) =>
      ["registration", "registered"].includes(String(event.eventAction || "").toLowerCase())
    );
    const expiration = events.find((event) =>
      ["expiration", "expired"].includes(String(event.eventAction || "").toLowerCase())
    );
    const registrationDate = registration ? formatTanggalOnline(registration.eventDate) : null;
    const expirationDate = expiration ? formatTanggalOnline(expiration.eventDate) : null;
    const ageDays = registration ? hitungUmurDomainHari(registration.eventDate) : null;

    document.getElementById("resRegDate").textContent = registrationDate || "Tanggal pendaftaran tidak tersedia";
    const ageText = ageDays === null
      ? "Umur domain tidak tersedia"
      : `Terdaftar sekitar ${ageDays >= 365 ? `${Math.floor(ageDays / 365)} tahun` : `${ageDays} hari`} yang lalu`;
    document.getElementById("resDomainAge").textContent =
      `${ageText}${expirationDate ? ` • Berlaku s.d. ${expirationDate}` : ""}`;
    setOnlineStatus("rdapStatus", "Data RDAP berhasil dimuat", "success");
  } catch (error) {
    if (requestId !== activeOnlineRequestId) return;
    document.getElementById("resRegDate").textContent = "Tidak tersedia";
    document.getElementById("resDomainAge").textContent = "Data pendaftaran tidak dapat diperoleh.";
    setOnlineStatus("rdapStatus", `RDAP gagal: ${errorLayananOnline(error)}`, "error");
  } finally {
    request.dispose();
  }
}

async function ambilLaporanSecurityHeaders(hostname, signal) {
  const url =
    `https://securityheaders.com/?q=${encodeURIComponent(`https://${hostname}`)}` +
    "&followRedirects=on";
  const response = await fetch(url, { signal, headers: { Accept: "text/html" } });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const html = await response.text();
  const reportDocument = new DOMParser().parseFromString(html, "text/html");
  const gradeElement = reportDocument.querySelector(".score");
  const grade = gradeElement ? String(gradeElement.textContent || "").trim() : "";
  if (!grade) throw new Error("Laporan header tidak ditemukan dalam respons layanan.");

  const missingSection = [...reportDocument.querySelectorAll(".reportSection")].find((section) => {
    const title = section.querySelector(".reportTitle");
    return title && /missing headers/i.test(title.textContent || "");
  });
  if (!missingSection) throw new Error("Bagian header laporan tidak ditemukan.");
  const missingHeaders = missingSection
    ? [...missingSection.querySelectorAll("th.tableLabel")]
      .map((element) => String(element.textContent || "").trim())
      .filter(Boolean)
    : [];
  const reportTimeLabel = [...reportDocument.querySelectorAll("th.tableLabel")]
    .find((element) => /^Report Time:?$/i.test(String(element.textContent || "").trim()));
  const reportTime = reportTimeLabel && reportTimeLabel.nextElementSibling
    ? String(reportTimeLabel.nextElementSibling.textContent || "").trim()
    : "";

  return { grade, missingHeaders, reportTime };
}

async function periksaSecurityHeadersOnline(hostname, signal, requestId) {
  setOnlineStatus("obsStatusTag", "Memeriksa konfigurasi HTTP...");
  const notice = document.getElementById("obsNoticeBox");
  notice.style.display = "none";
  const request = buatSinyalDenganTimeout(signal, 12000);
  try {
    const report = await ambilLaporanSecurityHeaders(hostname, request.signal);
    if (requestId !== activeOnlineRequestId) return;

    const gradeElement = document.getElementById("raporGrade");
    gradeElement.textContent = report.grade;
    gradeElement.className = "grade-badge";
    if (/^[BC]/i.test(report.grade)) gradeElement.classList.add("grade-mid");
    if (/^[DF]/i.test(report.grade)) gradeElement.classList.add("grade-low");
    document.getElementById("raporScore").textContent =
      report.reportTime ? `Laporan: ${report.reportTime}` : "Laporan online";
    document.getElementById("raporPassed").textContent = report.missingHeaders.length
      ? `${report.missingHeaders.length} header perlu diperiksa`
      : "Tidak ada header rekomendasi yang hilang dalam laporan.";
    notice.textContent = report.missingHeaders.length
      ? `Header yang dilaporkan hilang: ${report.missingHeaders.join(", ")}`
      : "Laporan tidak mencantumkan header yang hilang.";
    notice.style.display = "block";
    setOnlineStatus("obsStatusTag", "Laporan SecurityHeaders.com berhasil dimuat", "success");
  } catch (error) {
    if (requestId !== activeOnlineRequestId) return;
    document.getElementById("raporGrade").textContent = "N/A";
    document.getElementById("raporScore").textContent = "Laporan tidak tersedia";
    document.getElementById("raporPassed").textContent = "Data header belum dapat diperoleh.";
    setOnlineStatus("obsStatusTag", `SecurityHeaders.com gagal: ${errorLayananOnline(error)}`, "error");
    notice.textContent = "Layanan laporan header tidak memberikan hasil. Coba pindai ulang nanti.";
    notice.style.display = "block";
  } finally {
    request.dispose();
  }
}

function setCertificateStatus(message, isError) {
  const status = document.getElementById("certHistoryStatus");
  status.className = `cek-status-banner show${isError ? " error" : ""}`;
  status.textContent = message;
}

async function ambilRiwayatSertifikat(domainUtama, signal, requestId) {
  const url =
    `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domainUtama)}` +
    "&include_subdomains=true&expand=issuer&expand=dns_names";
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const request = buatSinyalDenganTimeout(signal, 5000);
    try {
      const response = await fetch(url, { signal: request.signal, headers: { Accept: "application/json" } });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Respons CertSpotter bukan daftar sertifikat yang valid.");
      return data;
    } catch (error) {
      lastError = error;
      if (signal.aborted || attempt === 3 || (error.status && error.status < 500 && error.status !== 429)) break;
      if (requestId === activeOnlineRequestId) {
        setCertificateStatus(`Percobaan ${attempt}/3 gagal; mencoba kembali...`, false);
      }
      await new Promise((resolve) => window.setTimeout(resolve, attempt * 400));
    } finally {
      request.dispose();
    }
  }

  throw lastError || new Error("Riwayat sertifikat tidak dapat dimuat.");
}

function tampilkanRiwayatSertifikat(issuances) {
  const tbody = document.getElementById("certHistoryTableBody");
  tbody.replaceChildren();

  const now = Date.now();
  const currentIssuances = issuances
    .filter((item) => {
      const expiration = new Date(item.not_after || "").getTime();
      return Number.isFinite(expiration) && expiration >= now;
    })
    .sort((a, b) => new Date(b.not_before || 0).getTime() - new Date(a.not_before || 0).getTime());

  document.getElementById("certHistoryCount").textContent = currentIssuances.length.toLocaleString("id-ID");
  const issuerCounts = new Map();
  currentIssuances.forEach((item) => {
    const issuer = item.issuer && (item.issuer.friendly_name || item.issuer.name)
      ? String(item.issuer.friendly_name || item.issuer.name)
      : "Tidak diketahui";
    issuerCounts.set(issuer, (issuerCounts.get(issuer) || 0) + 1);
  });
  const mostCommonIssuer = [...issuerCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  document.getElementById("certHistoryTopIssuer").textContent =
    mostCommonIssuer ? `${mostCommonIssuer[0]} (${mostCommonIssuer[1]})` : "Tidak tersedia";

  currentIssuances.slice(0, 20).forEach((item) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const issuerCell = document.createElement("td");
    const expirationCell = document.createElement("td");
    const names = Array.isArray(item.dns_names) ? item.dns_names.filter(Boolean) : [];
    nameCell.textContent = names.slice(0, 5).join(", ") +
      (names.length > 5 ? ` dan ${names.length - 5} nama lain` : "") || "Tidak diketahui";
    issuerCell.textContent = item.issuer
      ? String(item.issuer.friendly_name || item.issuer.name || "Tidak diketahui")
      : "Tidak diketahui";
    expirationCell.textContent = formatTanggalOnline(item.not_after) || "Tidak diketahui";
    row.append(nameCell, issuerCell, expirationCell);
    tbody.appendChild(row);
  });
}

async function periksaSertifikatOnline(domainUtama, signal, requestId) {
  document.getElementById("certHistoryCount").textContent = "Memuat...";
  document.getElementById("certHistoryTopIssuer").textContent = "Memuat...";
  setCertificateStatus("Memuat riwayat sertifikat (maksimal 3 percobaan)...", false);
  try {
    const issuances = await ambilRiwayatSertifikat(domainUtama, signal, requestId);
    if (requestId !== activeOnlineRequestId) return;
    tampilkanRiwayatSertifikat(issuances);
    setCertificateStatus(
      issuances.length
        ? `Berhasil dimuat. Menampilkan maksimal 20 sertifikat yang belum kedaluwarsa (dari ${issuances.length} hasil layanan).`
        : "Layanan tidak mengembalikan sertifikat untuk domain ini.",
      false
    );
  } catch (error) {
    if (requestId !== activeOnlineRequestId) return;
    document.getElementById("certHistoryCount").textContent = "Tidak tersedia";
    document.getElementById("certHistoryTopIssuer").textContent = "Tidak tersedia";
    document.getElementById("certHistoryTableBody").replaceChildren();
    setCertificateStatus(`Riwayat sertifikat gagal dimuat: ${errorLayananOnline(error)}`, true);
  }
}

function mulaiPemeriksaanOnline(hostname, domainUtama, requestId) {
  if (activeController) activeController.abort();
  if (activeOnlineTimeout) window.clearTimeout(activeOnlineTimeout);

  const controller = new AbortController();
  activeController = controller;
  activeOnlineTimeout = window.setTimeout(() => controller.abort(), 30000);

  document.getElementById("certHistoryTarget").textContent = `Domain: ${domainUtama}`;
  document.getElementById("resIpAddress").textContent = "Memeriksa...";
  document.getElementById("resIpHost").textContent = `Host: ${hostname}`;
  document.getElementById("resRegDate").textContent = "Memeriksa...";
  document.getElementById("resDomainAge").textContent = "-";
  document.getElementById("raporGrade").textContent = "...";
  document.getElementById("raporGrade").className = "grade-badge";
  document.getElementById("raporScore").textContent = "Skor sedang dimuat";
  document.getElementById("raporPassed").textContent = "Menunggu hasil pemindaian...";
  setCertificateStatus("Menunggu layanan sertifikat...", false);

  Promise.all([
    periksaDnsOnline(hostname, controller.signal, requestId),
    periksaRdapOnline(domainUtama, controller.signal, requestId),
    periksaSecurityHeadersOnline(hostname, controller.signal, requestId),
    periksaSertifikatOnline(domainUtama, controller.signal, requestId)
  ]).finally(() => {
    if (requestId === activeOnlineRequestId) {
      if (activeOnlineTimeout) window.clearTimeout(activeOnlineTimeout);
      activeOnlineTimeout = null;
      activeController = null;
    }
  });
}

function setStatus(tipe, htmlPesan) {
  statusBanner.className = "cek-status-banner show" + (tipe === "error" ? " error" : "");
  statusBanner.innerHTML = htmlPesan;
}

function sembunyikanStatus() {
  statusBanner.className = "cek-status-banner";
  statusBanner.innerHTML = "";
}

function jalankanPemeriksaanTerpadu(inputMentah) {
  const requestId = ++activeOnlineRequestId;
  if (activeController) activeController.abort();
  if (activeOnlineTimeout) window.clearTimeout(activeOnlineTimeout);
  activeController = null;
  activeOnlineTimeout = null;

  const hasilEkstraksi = ekstrakHostnameDariMasukan(inputMentah);
  if (!hasilEkstraksi.valid) {
    resultsArea.style.display = "none";
    setStatus("error", `${SVG_ICONS.alertTriangle}<span>${hasilEkstraksi.alasan}</span>`);
    return;
  }

  const { hostname, adalahUrlLengkap } = hasilEkstraksi;
  const pslResult = pecahDomainDenganPsl(hostname);

  if (pslResult.hanyaAkhiranPublik) {
    resultsArea.style.display = "none";
    const labelJenis =
      pslResult.jenisAkhiran === "ICANN"
        ? "ICANN (Registri Resmi)"
        : pslResult.jenisAkhiran === "PRIVATE"
          ? "PRIVATE (Layanan/Platform)"
          : "Label Terakhir (Fallback)";

    setStatus(
      "error",
      `${SVG_ICONS.alertTriangle}<span><strong>Masukan hanya berupa Akhiran Publik (Public Suffix):</strong> <code>${escapeHtml(pslResult.akhiranPublik)}</code> terdaftar pada daftar PSL kategori <strong>${labelJenis}</strong> sebagai akhiran publik, bukan domain utama yang siap dipakai. Tambahkan nama domain di depannya, misalnya <code>contoh.${escapeHtml(pslResult.akhiranPublik)}</code>.</span>`
    );
    return;
  }

  masukanTerakhir = inputMentah;
  rawJsonPanel.classList.remove("open");
  if (toggleJsonLabel) toggleJsonLabel.textContent = "Lihat JSON Mentah";

  const {
    labels,
    subdomainLabels,
    subdomain,
    labelTerdaftar,
    akhiranPublik,
    domainUtama,
    jenisAkhiran,
    aturanCocok
  } = pslResult;

  document.getElementById("checkedTargetLabel").textContent = `Host: ${hostname} (${labels.length} bagian)`;

  const extractedUrlNoteEl = document.getElementById("extractedUrlNote");
  if (adalahUrlLengkap) {
    extractedUrlNoteEl.style.display = "block";
    extractedUrlNoteEl.textContent = `Nama host diambil dari URL: ${hostname}`;
  } else {
    extractedUrlNoteEl.style.display = "none";
  }

  // Render Anatomi Alamat Diwarnai Per Bagian
  const segmentsContainer = document.getElementById("anatomySegments");
  const segHtmlList = [];

  if (subdomainLabels.length > 0) {
    segHtmlList.push(
      `<span class="seg-pill seg-subdomain"><span>${escapeHtml(subdomain)}</span><span class="seg-role">Subdomain</span></span>`
    );
    segHtmlList.push(`<span class="seg-dot">.</span>`);
  }

  segHtmlList.push(
    `<span class="seg-pill seg-domain-label"><span>${escapeHtml(labelTerdaftar)}</span><span class="seg-role">Label Terdaftar</span></span>`
  );
  segHtmlList.push(`<span class="seg-dot">.</span>`);
  segHtmlList.push(
    `<span class="seg-pill seg-public-suffix"><span>${escapeHtml(akhiranPublik)}</span><span class="seg-role">Akhiran Publik</span></span>`
  );
  segmentsContainer.innerHTML = segHtmlList.join("");

  // 4 Kartu PSL Wajib
  document.getElementById("resSubdomain").textContent = subdomain || "(Tidak ada subdomain)";
  document.getElementById("resSubdomainNote").textContent =
    subdomainLabels.length > 0
      ? `${subdomainLabels.length} bagian di depan domain utama`
      : "Alamat langsung menunjuk ke domain utama";

  document.getElementById("resRootDomain").textContent = domainUtama;
  document.getElementById("resRootRule").textContent = `Gabungan label terdaftar (${labelTerdaftar}) + akhiran (${akhiranPublik})`;

  document.getElementById("resPublicSuffix").textContent = akhiranPublik;
  document.getElementById("resMatchedRuleNote").textContent = aturanCocok
    ? `Aturan PSL cocok terpanjang: "${aturanCocok}"`
    : "Tidak ada di daftar ringkas — fallback label terakhir";

  const suffixTypeWrap = document.getElementById("resSuffixTypeWrap");
  const suffixTypeNote = document.getElementById("resSuffixTypeNote");
  if (jenisAkhiran === "ICANN") {
    suffixTypeWrap.innerHTML = `<span class="suffix-type-badge icann">ICANN</span>`;
    suffixTypeNote.textContent = "Registri domain publik resmi di bawah koordinasi ICANN.";
  } else if (jenisAkhiran === "PRIVATE") {
    suffixTypeWrap.innerHTML = `<span class="suffix-type-badge private">PRIVATE</span>`;
    suffixTypeNote.textContent = "Akhiran layanan/platform yang memungkinkan siapa saja mendaftarkan alamat di bawahnya.";
  } else {
    suffixTypeWrap.innerHTML = `<span class="suffix-type-badge fallback">Label Terakhir (Fallback)</span>`;
    suffixTypeNote.textContent = "Akhiran tidak terdaftar dalam PSL lokal ringkas; batas domain utama mungkin tidak tepat.";
  }

  // Evaluasi 5 Tanda Waspada Struktur Alamat
  const tandaWaspadaPsl = [];

  const domainDalamSubdomain = deteksiDomainDiSubdomain(subdomain);
  if (domainDalamSubdomain.length > 0) {
    tandaWaspadaPsl.push({
      level: "danger",
      teks: `Tulisan domain lain di bagian subdomain: Ditemukan pola domain "${domainDalamSubdomain.join(", ")}" di dalam subdomain (${subdomain}), padahal domain utama sebenarnya adalah "${domainUtama}".`
    });
  }

  if (domainUtama.includes("-")) {
    tandaWaspadaPsl.push({
      level: "warn",
      teks: `Tanda hubung (-) pada domain utama: "${domainUtama}" mengandung tanda hubung yang sering digunakan pada alamat tiruan atau nama proyek baru.`
    });
  }

  if (hostname.includes("xn--")) {
    tandaWaspadaPsl.push({
      level: "danger",
      teks: `Mengandung "xn--" (Punycode): Alamat memakai pengodean karakter internasional yang dapat menyerupai huruf Latin biasa.`
    });
  }

  if (labels.length >= 5) {
    tandaWaspadaPsl.push({
      level: "warn",
      teks: `Alamat memiliki 5 bagian atau lebih: Terdeteksi ${labels.length} bagian (${labels.join(" . ")}). Susunan bertingkat panjang dapat menyamarkan domain utama di bagian kanan.`
    });
  }

  if (jenisAkhiran === "PRIVATE") {
    tandaWaspadaPsl.push({
      level: "warn",
      teks: `Akhiran PRIVATE (${akhiranPublik}): Akhiran ini dikelola penyedia platform sehingga siapa saja dapat membuat alamat "${domainUtama}". Pastikan pemiliknya terverifikasi.`
    });
  }

  function renderDaftarWaspada(listGabungan) {
    const warningsList = document.getElementById("resWarningsList");
    warningsList.innerHTML = "";
    document.getElementById("resWarningCount").textContent =
      listGabungan.length > 0 ? `${listGabungan.length} tanda waspada` : "0 tanda waspada";

    if (listGabungan.length === 0) {
      const li = document.createElement("li");
      li.className = "warning-pill safe";
      li.innerHTML = `${SVG_ICONS.checkCircle}<span>Tidak terdeteksi tanda waspada pada struktur subdomain, domain utama, maupun jenis akhiran publik. (Catatan: tanda ini hanya alat bantu, bukan bukti pasti).</span>`;
      warningsList.appendChild(li);
    } else {
      listGabungan.forEach((item) => {
        const li = document.createElement("li");
        li.className = `warning-pill ${item.level === "danger" ? "danger" : ""}`;
        li.innerHTML = `${SVG_ICONS.alertTriangle}<span>${escapeHtml(item.teks)}</span>`;
        warningsList.appendChild(li);
      });
    }
  }

  renderDaftarWaspada(tandaWaspadaPsl);
  resultsArea.style.display = "block";

  const risikoLink = hitungRisikoLinkTerpadu(inputMentah, hostname, pslResult);
  const riskSummary = document.getElementById("unifiedRiskSummary");
  const riskTitle = document.getElementById("unifiedRiskTitle");
  const riskText = document.getElementById("unifiedRiskText");
  const riskBadge = document.getElementById("unifiedRiskBadge");
  const riskMeter = document.getElementById("unifiedRiskMeter");

  if (riskSummary) {
    riskSummary.style.display = "grid";
    let kelas = "TIDAK ADA POLA LOKAL YANG MENONJOL";
    let deskripsi = "Skor pola lokal adalah indikator untuk diperiksa, bukan peluang atau bukti phishing.";
    let warna = "var(--green)";
    let badgeClass = "";

    if (risikoLink.skor >= 55) {
      kelas = "BANYAK INDIKATOR PERLU DIPERIKSA";
      deskripsi = "Ditemukan beberapa pola lokal. Verifikasi alamat melalui situs resmi sebelum memasukkan data.";
      warna = "var(--red)";
      badgeClass = "grade-low";
    } else if (risikoLink.skor >= 25) {
      kelas = "PERLU WASPADA";
      deskripsi = "Tautan memiliki pola yang perlu diperiksa secara manual.";
      warna = "var(--amber)";
      badgeClass = "grade-mid";
    }

    if (risikoLink.temuan.length > 0) {
      deskripsi += ` Temuan utama: ${risikoLink.temuan.slice(0, 3).join("; ")}.`;
    }

    riskTitle.textContent = kelas;
    riskText.textContent = deskripsi;
    riskBadge.textContent = `INDIKATOR ${risikoLink.skor}/100`;
    riskBadge.className = `grade-badge ${badgeClass}`.trim();
    if (riskMeter) {
      riskMeter.style.width = `${Math.max(6, risikoLink.skor)}%`;
      riskMeter.style.backgroundColor = warna;
    }
  }

  sembunyikanStatus();
  document.getElementById("footerHostSummary").textContent =
    `Subdomain: ${subdomain || "-"} • Domain Utama: ${domainUtama} • Akhiran: ${akhiranPublik} (${jenisAkhiran})`;

  rawJsonPanel.textContent = JSON.stringify(
    {
      masukan_awal: inputMentah,
      host: hostname,
      pemecahan_psl: {
        subdomain: subdomain || null,
        domain_utama: domainUtama,
        akhiran_publik: akhiranPublik,
        jenis_akhiran: jenisAkhiran,
        aturan_psl_cocok: aturanCocok,
        mode_psl: pslStore.mode
      },
      tanda_waspada_lokal: tandaWaspadaPsl.map((w) => w.teks),
      skor_indikator_lokal: risikoLink.skor,
      pemeriksaan_online: "lihat status pada panel hasil"
    },
    null,
    2
  );

  mulaiPemeriksaanOnline(hostname, domainUtama, requestId);
}

if (unifiedForm) {
  unifiedForm.addEventListener("submit", (e) => {
    e.preventDefault();
    jalankanPemeriksaanTerpadu(hostInput.value);
  });
}

document.querySelectorAll("[data-example]").forEach((btn) => {
  btn.addEventListener("click", () => {
    hostInput.value = btn.dataset.example;
    jalankanPemeriksaanTerpadu(btn.dataset.example);
  });
});

const rescanBtn = document.getElementById("rescanBtn");
if (rescanBtn) {
  rescanBtn.addEventListener("click", () => {
    if (!masukanTerakhir) return;
    jalankanPemeriksaanTerpadu(masukanTerakhir);
  });
}

if (toggleJsonBtn) {
  toggleJsonBtn.addEventListener("click", () => {
    const terbuka = rawJsonPanel.classList.toggle("open");
    if (toggleJsonLabel) {
      toggleJsonLabel.textContent = terbuka ? "Sembunyikan JSON Mentah" : "Lihat JSON Mentah";
    }
  });
}

// 7. FAQ Accordion
document.querySelectorAll(".faq-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const wasOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item").forEach((el) => {
      el.classList.remove("open");
      const question = el.querySelector(".faq-btn");
      const answer = el.querySelector(".faq-body");
      question.setAttribute("aria-expanded", "false");
      answer.setAttribute("aria-hidden", "true");
    });
    if (!wasOpen) {
      item.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      item.querySelector(".faq-body").setAttribute("aria-hidden", "false");
    }
  });
});

// 8. Giant Wordmark Cursor Spotlight
const wordmarkBox = document.getElementById("wordmarkBox");
const wordmarkGlow = document.getElementById("wordmarkGlow");
if (wordmarkBox && wordmarkGlow) {
  wordmarkBox.addEventListener("mousemove", (e) => {
    const rect = wordmarkBox.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1200;
    const y = ((e.clientY - rect.top) / rect.height) * 230;
    wordmarkGlow.setAttribute("cx", x.toFixed(0));
    wordmarkGlow.setAttribute("cy", y.toFixed(0));
  });
}