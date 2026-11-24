/* ==========================================================================
   APP.JS — Pengendali UI, Tema, Animasi Visual & Integrasi API RDAP/DNS/MDN
   ========================================================================== */

// 0. Terms and Conditions Gate
const termsOverlay = document.getElementById("termsOverlay");
const termsCheckbox = document.getElementById("termsCheckbox");
const termsAcceptBtn = document.getElementById("termsAcceptBtn");
if (termsOverlay && termsCheckbox && termsAcceptBtn) {
  let termsAccepted = false;
  try {
    termsAccepted = localStorage.getItem("shacurity-terms-v1") === "accepted";
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
      localStorage.setItem("shacurity-terms-v1", "accepted");
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
const setActiveNavLink = (href) => {
  let activeIndex = -1;
  primaryNavLinks.forEach((link, index) => {
    if (link.getAttribute("href") === href) {
      link.setAttribute("aria-current", "page");
      activeIndex = index;
    } else {
      link.removeAttribute("aria-current");
    }
  });
  if (primaryNav && activeIndex >= 0) {
    primaryNav.style.setProperty("--active-nav-offset", `${activeIndex * 50}px`);
    primaryNav.classList.add("has-active");
  } else if (primaryNav) {
    primaryNav.style.removeProperty("--active-nav-offset");
    primaryNav.classList.remove("has-active");
  }
};

if (window.location.hash) setActiveNavLink(window.location.hash);
primaryNavLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveNavLink(link.getAttribute("href")));
});
window.addEventListener("hashchange", () => setActiveNavLink(window.location.hash));

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
const savedTheme = localStorage.getItem("shacurity-theme");
if (savedTheme) htmlEl.setAttribute("data-theme", savedTheme);

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const next = htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
    htmlEl.setAttribute("data-theme", next);
    localStorage.setItem("shacurity-theme", next);
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

// 5. Helper Metadata & Rapor MDN Observatory
function adalahDomainGoogle(host) {
  return /(^|\.)(google\.[a-z.]+|youtube\.com|youtu\.be|gmail\.com|gstatic\.com|googleapis\.com)$/i.test(host);
}

function hitungRisikoLinkTerpadu(rawInput, hostname, pslResult, umurHari) {
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

  if (parsed.protocol === "http:") {
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

  if (umurHari !== null && umurHari < 30) {
    skor += 30;
    temuan.push(`Domain sangat baru (${umurHari} hari)`);
  } else if (umurHari !== null && umurHari < 180) {
    skor += 15;
    temuan.push(`Domain relatif baru (${umurHari} hari)`);
  }

  if (parsed.href.length > 105) {
    skor += 10;
    temuan.push("URL sangat panjang");
  }

  return { skor: Math.min(100, skor), temuan: [...new Set(temuan)] };
}

function keteranganNilai(grade) {
  const g = (grade || "").toUpperCase();
  if (g.startsWith("A")) return "Sangat Baik";
  if (g.startsWith("B")) return "Baik";
  if (g.startsWith("C")) return "Cukup";
  if (g.startsWith("D")) return "Kurang";
  if (g.startsWith("F")) return "Perlu Perbaikan";
  return "Hasil Pindai";
}

function rapikanNamaTes(slug) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (huruf) => huruf.toUpperCase());
}

// 6. Pemeriksaan Terpadu DomainUtama (PSL) + RDAP + DNS + MDN Observatory
const unifiedForm = document.getElementById("unifiedForm");
const hostInput = document.getElementById("hostInput");
const submitBtn = document.getElementById("submitBtn");
const statusBanner = document.getElementById("statusBanner");
const resultsArea = document.getElementById("resultsArea");
const toggleJsonBtn = document.getElementById("toggleJsonBtn");
const toggleJsonLabel = document.getElementById("toggleJsonLabel");
const rawJsonPanel = document.getElementById("rawJsonPanel");
const loadFullPslBtn = document.getElementById("loadFullPslBtn");
const loadFullPslLabel = document.getElementById("loadFullPslLabel");
let masukanTerakhir = "";
let activeController = null;

if (loadFullPslBtn) {
  loadFullPslBtn.addEventListener("click", async () => {
    loadFullPslBtn.disabled = true;
    loadFullPslLabel.textContent = "Memuat PSL Lengkap...";

    try {
      const res = await fetch("https://raw.githubusercontent.com/publicsuffix/list/main/public_suffix_list.dat");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const teksDat = await res.text();
      parseDanTerapkanPslDat(teksDat);
      loadFullPslLabel.textContent = `PSL Lengkap Aktif (${pslStore.totalCount.toLocaleString("id-ID")})`;
      showToast(`Berhasil memuat ${pslStore.totalCount.toLocaleString("id-ID")} aturan Public Suffix List!`);

      if (masukanTerakhir) {
        jalankanPemeriksaanTerpadu(masukanTerakhir, false);
      }
    } catch (_) {
      muatAturanRingkasBawaan();
      loadFullPslLabel.textContent = "Muat Ulang PSL Lengkap";
      showToast("Gagal memuat PSL dari internet. Tetap memakai daftar ringkas bawaan (19 aturan).");
    } finally {
      loadFullPslBtn.disabled = false;
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

async function ambilDataObservatory(host, signal, paksaSegar) {
  const cacheKey = `shacurity_obs_${host}`;
  if (!paksaSegar) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (cached && Date.now() - cached.savedAt < 15 * 60 * 1000) {
        return { ok: true, data: cached.data, fromCache: true };
      }
    } catch (_) {}
  }

  const endpointAnalyze = `https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=${encodeURIComponent(host)}`;
  let res = await fetch(endpointAnalyze, { signal });

  if (res.status === 404) {
    await fetch(
      `https://observatory-api.mdn.mozilla.net/api/v2/scan?host=${encodeURIComponent(host)}`,
      { method: "POST", signal }
    );
    res = await fetch(endpointAnalyze, { signal });
  }

  const data = await res.json().catch(() => null);

  if (res.status === 422) return { ok: false, status: 422, data };
  if (!res.ok || !data) return { ok: false, status: res.status, data };

  const scan = data.scan ? data.scan : data;
  if (scan.error) return { ok: false, status: 422, data: scan };

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), data }));
  } catch (_) {}

  return { ok: true, data, fromCache: false };
}

async function jalankanPemeriksaanTerpadu(inputMentah, paksaSegar = false) {
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

  if (activeController) activeController.abort();
  const controller = new AbortController();
  activeController = controller;
  const timeoutId = setTimeout(() => controller.abort(), 16000);

  masukanTerakhir = inputMentah;
  rawJsonPanel.classList.remove("open");
  if (toggleJsonLabel) toggleJsonLabel.textContent = "Lihat JSON Mentah";
  submitBtn.disabled = true;

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
    suffixTypeNote.textContent = "Tidak ditemukan di daftar ringkas; klik 'Muat Public Suffix List Lengkap' untuk cakupan penuh.";
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

  setStatus(
    "loading",
    `<span class="spinner"></span><span>Domain utama <strong>${escapeHtml(domainUtama)}</strong> berhasil dipecah. Memeriksa metadata RDAP, DNS, dan rapor HTTP MDN Observatory...</span>`
  );

  const [rdapSettled, dnsSettled, obsSettled] = await Promise.allSettled([
    fetch(`https://rdap.org/domain/${encodeURIComponent(domainUtama)}`, {
      headers: { Accept: "application/rdap+json, application/json" },
      signal: controller.signal
    }),
    fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`, {
      signal: controller.signal
    }),
    ambilDataObservatory(hostname, controller.signal, paksaSegar)
  ]);

  clearTimeout(timeoutId);
  if (activeController === controller) {
    activeController = null;
    submitBtn.disabled = false;
  }

  let rdapData = null;
  let rdapStatusHttp = "Tidak terjangkau";
  if (rdapSettled.status === "fulfilled") {
    rdapStatusHttp = `HTTP ${rdapSettled.value.status}`;
    if (rdapSettled.value.ok) rdapData = await rdapSettled.value.json().catch(() => null);
  }

  let dnsData = null;
  const daftarIp = [];
  if (dnsSettled.status === "fulfilled" && dnsSettled.value.ok) {
    dnsData = await dnsSettled.value.json().catch(() => null);
    if (dnsData && Array.isArray(dnsData.Answer)) {
      dnsData.Answer.forEach((ans) => {
        if (ans.type === 1 && ans.data) daftarIp.push(ans.data);
      });
    }
  }

  if (daftarIp.length > 0) {
    document.getElementById("resIpAddress").textContent = daftarIp.join(", ");
    document.getElementById("resIpHost").textContent = `Catatan DNS A aktif untuk ${hostname}`;
  } else {
    document.getElementById("resIpAddress").textContent = "Data tidak ditemukan";
    document.getElementById("resIpHost").textContent = `Tidak ada catatan IPv4 aktif untuk ${hostname}`;
  }

  let rawRegDate = null;
  let rawExpDate = null;
  if (rdapData && Array.isArray(rdapData.events)) {
    const regEvent = rdapData.events.find(
      (ev) => ev.eventAction === "registration" || ev.eventAction === "registered"
    );
    const expEvent = rdapData.events.find(
      (ev) => ev.eventAction === "expiration" || ev.eventAction === "expired"
    );
    if (regEvent) rawRegDate = regEvent.eventDate;
    if (expEvent) rawExpDate = expEvent.eventDate;
  }

  const teksReg = formatTanggalId(rawRegDate);
  const teksExp = formatTanggalId(rawExpDate);
  const umurHari = hitungUmurHari(rawRegDate);
  if (teksReg) {
    document.getElementById("resRegDate").textContent = teksReg;
    const tahun = Math.floor(umurHari / 365);
    document.getElementById("resDomainAge").textContent =
      `Umur ~${tahun >= 1 ? tahun + " tahun" : umurHari + " hari"}` +
      (teksExp ? ` • Berlaku s.d. ${teksExp}` : "");
  } else {
    document.getElementById("resRegDate").textContent = "Data tidak ditemukan";
    document.getElementById("resDomainAge").textContent = `Status RDAP untuk ${domainUtama}: ${rdapStatusHttp}`;
  }

  const daftarWaspadaLengkap = [...tandaWaspadaPsl];
  if (umurHari !== null && umurHari < 365) {
    daftarWaspadaLengkap.push({
      level: "warn",
      teks: `Umur domain utama baru: "${domainUtama}" didaftarkan ${umurHari} hari yang lalu (kurang dari 1 tahun).`
    });
  }
  renderDaftarWaspada(daftarWaspadaLengkap);

  const risikoLink = hitungRisikoLinkTerpadu(inputMentah, hostname, pslResult, umurHari);
  const riskSummary = document.getElementById("unifiedRiskSummary");
  const riskTitle = document.getElementById("unifiedRiskTitle");
  const riskText = document.getElementById("unifiedRiskText");
  const riskBadge = document.getElementById("unifiedRiskBadge");
  const riskMeter = document.getElementById("unifiedRiskMeter");

  if (riskSummary) {
    riskSummary.style.display = "grid";
    let kelas = "TIDAK ADA INDIKATOR KUAT";
    let deskripsi = "Pemeriksaan heuristik lokal tidak menemukan indikator kuat penyamaran atau manipulasi tautan.";
    let warna = "var(--green)";
    let badgeClass = "";

    if (risikoLink.skor >= 55) {
      kelas = "TERINDIKASI PHISHING / BERISIKO TINGGI";
      deskripsi = "Ditemukan pola penipuan atau penyamaran domain. Jangan memasukkan kredensial atau OTP.";
      warna = "var(--red)";
      badgeClass = "grade-low";
    } else if (risikoLink.skor >= 25) {
      kelas = "PERLU WASPADA";
      deskripsi = "Tautan memiliki beberapa karakteristik yang perlu diverifikasi sebelum dibuka.";
      warna = "var(--amber)";
      badgeClass = "grade-mid";
    }

    if (risikoLink.temuan.length > 0) {
      deskripsi += ` Temuan utama: ${risikoLink.temuan.slice(0, 3).join("; ")}.`;
    }

    riskTitle.textContent = kelas;
    riskText.textContent = deskripsi;
    riskBadge.textContent = `RISIKO ${risikoLink.skor}/100`;
    riskBadge.className = `grade-badge ${badgeClass}`.trim();
    if (riskMeter) {
      riskMeter.style.width = `${Math.max(6, risikoLink.skor)}%`;
      riskMeter.style.backgroundColor = warna;
    }
  }

  // Render Rapor MDN Observatory
  const obsNoticeBox = document.getElementById("obsNoticeBox");
  const obsMetricsWrapper = document.getElementById("obsMetricsWrapper");
  const obsStatusTag = document.getElementById("obsStatusTag");
  let obsRawForJson = null;

  if (obsSettled.status === "fulfilled" && obsSettled.value.ok) {
    const obsPayload = obsSettled.value.data;
    obsRawForJson = obsPayload;
    const scan = obsPayload.scan ? obsPayload.scan : obsPayload;
    const testsObj = obsPayload.tests || {};

    obsNoticeBox.style.display = "none";
    obsMetricsWrapper.style.display = "block";
    obsStatusTag.textContent = obsSettled.value.fromCache ? "Tersedia (Cache Sesi)" : "Berhasil Dimuat";
    obsStatusTag.style.color = "var(--green)";

    const nilai = scan.grade || "N/A";
    const gradeEl = document.getElementById("raporGrade");
    gradeEl.textContent = nilai;
    gradeEl.className = "grade-badge";
    if (/^[BC]/i.test(nilai)) gradeEl.classList.add("grade-mid");
    if (/^[DF]/i.test(nilai)) gradeEl.classList.add("grade-low");
    document.getElementById("raporGradeDesc").textContent = keteranganNilai(nilai);

    const skor = scan.score !== undefined && scan.score !== null ? scan.score : "-";
    document.getElementById("raporScore").textContent = `${skor} / 100`;

    const lolos = scan.tests_passed ?? scan.testsPassed ?? 0;
    const totalTes = scan.tests_quantity ?? scan.testsQuantity ?? Object.keys(testsObj).length;
    document.getElementById("raporPassed").textContent = `${lolos} / ${totalTes} Tes`;
    const persen = totalTes > 0 ? Math.round((lolos / totalTes) * 100) : 0;
    document.getElementById("raporPassedPct").textContent = `${persen}% pemeriksaan lolos`;

    const waktuPindai = scan.scanned_at || scan.scannedAt;
    document.getElementById("raporDate").textContent = formatTanggalWaktuId(waktuPindai);
    const algo = scan.algorithm_version || scan.algorithmVersion;
    document.getElementById("raporAlgo").textContent = algo ? `Algoritma Observatory v${algo}` : "MDN HTTP Observatory";

    const listContainer = document.getElementById("raporTestsList");
    listContainer.innerHTML = "";
    const entriesTes = Array.isArray(testsObj)
      ? testsObj.map((item) => [item.name || "tes", item])
      : Object.entries(testsObj);

    document.getElementById("raporTestSummary").textContent = `${entriesTes.length} parameter diperiksa`;

    entriesTes.forEach(([kodeTes, detail]) => {
      const lulus = Boolean(detail.pass);
      const mod = detail.score_modifier ?? detail.scoreModifier ?? 0;
      const modLabel = mod > 0 ? `+${mod}` : `${mod}`;
      const deskripsi = detail.score_description || detail.scoreDescription || detail.result || "-";

      const itemEl = document.createElement("div");
      itemEl.className = "obs-test-item";
      itemEl.innerHTML = `
        <div class="obs-test-top">
          <div class="obs-test-title">
            ${lulus ? SVG_ICONS.checkSmall : SVG_ICONS.xSmall}
            <span>${escapeHtml(rapikanNamaTes(kodeTes))}</span>
          </div>
          <span class="obs-pass-tag ${lulus ? "pass" : "fail"}">
            ${lulus ? "Lolos" : "Perlu Perbaikan"} (${escapeHtml(modLabel)})
          </span>
        </div>
        <div class="obs-test-desc">${formatDeskripsiMdn(deskripsi)}</div>
      `;
      listContainer.appendChild(itemEl);
    });
  } else {
    obsMetricsWrapper.style.display = "none";
    obsNoticeBox.style.display = "block";
    const statusKode = obsSettled.status === "fulfilled" ? obsSettled.value.status : "Timeout/Network";
    obsRawForJson = obsSettled.status === "fulfilled" ? obsSettled.value.data : { error: statusKode };
    obsStatusTag.textContent = `Tidak Dipindai (${statusKode})`;
    obsStatusTag.style.color = "var(--amber)";

    let alasanObservatory = `Server MDN Observatory tidak dapat memindai <code>${escapeHtml(hostname)}</code> (<strong>${escapeHtml(String(statusKode))}</strong>) karena host tidak aktif di internet publik atau menolak pemindai otomatis.`;
    if (adalahDomainGoogle(hostname)) {
      alasanObservatory = `Server Google (<code>${escapeHtml(hostname)}</code>) membatasi pemindai otomatis dari server publik MDN Observatory sehingga MDN mengembalikan <strong>HTTP 422</strong> (bukan gangguan koneksi Anda).`;
    } else if (daftarIp.length === 0) {
      alasanObservatory = `Rapor keamanan HTTP MDN Observatory tidak tersedia karena alamat <code>${escapeHtml(hostname)}</code> tidak memiliki server aktif di DNS publik.`;
    }
    obsNoticeBox.innerHTML = alasanObservatory;
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
      tanda_waspada: daftarWaspadaLengkap.map((w) => w.teks),
      rdap: rdapData || { status: rdapStatusHttp },
      dns_google: dnsData,
      mdn_observatory: obsRawForJson
    },
    null,
    2
  );
}

if (unifiedForm) {
  unifiedForm.addEventListener("submit", (e) => {
    e.preventDefault();
    jalankanPemeriksaanTerpadu(hostInput.value, false);
  });
}

document.querySelectorAll("[data-example]").forEach((btn) => {
  btn.addEventListener("click", () => {
    hostInput.value = btn.dataset.example;
    jalankanPemeriksaanTerpadu(btn.dataset.example, false);
  });
});

const rescanBtn = document.getElementById("rescanBtn");
if (rescanBtn) {
  rescanBtn.addEventListener("click", () => {
    if (!masukanTerakhir) return;
    jalankanPemeriksaanTerpadu(masukanTerakhir, true);
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