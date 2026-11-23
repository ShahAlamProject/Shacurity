/* ==========================================================================
   PHISHING-CHECKER.JS — Deteksi Link Phishing (Heuristik URL + PSL + RDAP)
   ========================================================================== */

const PHISHING_RULES = {
  shorteners: [
    "bit.ly", "tinyurl.com", "s.id", "t.co", "cutt.ly", "rb.gy",
    "is.gd", "goo.gl", "ow.ly", "buff.ly", "rebrand.ly", "shorturl.at",
    "linktr.ee", "wa.me", "intip.in", "gg.gg"
  ],
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

const phishingForm = document.getElementById("phishingForm");
const phishingUrlInput = document.getElementById("phishingUrlInput");
const phishingSubmitBtn = document.getElementById("phishingSubmitBtn");
const phishingStatusBanner = document.getElementById("phishingStatusBanner");
const phishingResultArea = document.getElementById("phishingResultArea");
const copyPhishingReportBtn = document.getElementById("copyPhishingReportBtn");
const inspectInPslBtn = document.getElementById("inspectInPslBtn");

let lastPhishingSummaryText = "";
let lastPhishingHostname = "";

function setPhishingStatus(tipe, htmlPesan) {
  if (!phishingStatusBanner) return;
  phishingStatusBanner.className = "cek-status-banner show" + (tipe === "error" ? " error" : "");
  phishingStatusBanner.innerHTML = htmlPesan;
}

function sembunyikanPhishingStatus() {
  if (!phishingStatusBanner) return;
  phishingStatusBanner.className = "cek-status-banner";
  phishingStatusBanner.innerHTML = "";
}

function parseUrlUntukPhishing(rawInput) {
  const teks = String(rawInput || "").trim();
  if (!teks) {
    return { valid: false, alasan: "Masukkan tautan (URL) yang ingin diperiksa terlebih dahulu." };
  }

  const punyaSkema = /^[a-z][a-z0-9+.-]*:\/\//i.test(teks);
  const urlLengkap = punyaSkema ? teks : "http://" + teks;

  try {
    const parsed = new URL(urlLengkap);
    const hostname = parsed.hostname.toLowerCase().replace(/\.+$/, "");
    if (!hostname) {
      return { valid: false, alasan: "Host tujuan tidak ditemukan di dalam tautan tersebut." };
    }

    return {
      valid: true,
      masukanAsli: teks,
      punyaSkema,
      protocol: parsed.protocol.toLowerCase(),
      username: parsed.username || "",
      password: parsed.password || "",
      hostname,
      port: parsed.port || "",
      pathname: parsed.pathname || "/",
      search: parsed.search || "",
      fullNormalized: parsed.href
    };
  } catch (_) {
    return {
      valid: false,
      alasan: `Format tautan <code>${escapeHtml(teks)}</code> tidak valid. Contoh format yang benar: <code>https://contoh.ac.id/login</code>.`
    };
  }
}

function deteksiTyposquatting(labelTerdaftar) {
  const polaSubstitusi = [
    { regex: /0/, ganti: "o" },
    { regex: /1/, ganti: "l" },
    { regex: /3/, ganti: "e" },
    { regex: /4/, ganti: "a" },
    { regex: /5/, ganti: "s" },
    { regex: /rn/, ganti: "m" },
    { regex: /vv/, ganti: "w" }
  ];

  const temuan = [];
  PHISHING_RULES.protectedBrands.forEach((brand) => {
    brand.kata.forEach((k) => {
      if (k.length < 3) return;
      if (labelTerdaftar.includes(k)) return;

      let normalisasi = labelTerdaftar;
      polaSubstitusi.forEach((p) => {
        normalisasi = normalisasi.replace(new RegExp(p.regex, "g"), p.ganti);
      });

      if (normalisasi.includes(k) && normalisasi !== labelTerdaftar) {
        temuan.push(`${brand.nama} ("${labelTerdaftar}" menyerupai "${k}")`);
      }
    });
  });

  return [...new Set(temuan)];
}

async function analisisLinkPhishing(rawInput) {
  const parsed = parseUrlUntukPhishing(rawInput);
  if (!parsed.valid) {
    if (phishingResultArea) phishingResultArea.style.display = "none";
    setPhishingStatus("error", `${SVG_ICONS.alertTriangle}<span>${parsed.alasan}</span>`);
    return;
  }

  if (phishingSubmitBtn) phishingSubmitBtn.disabled = true;
  setPhishingStatus(
    "loading",
    `<span class="spinner"></span><span>Menganalisis struktur tautan <strong>${escapeHtml(parsed.hostname)}</strong>, aturan PSL, serta reputasi DNS &amp; RDAP...</span>`
  );

  let skorRisiko = 0;
  const indikator = [];

  function tambahIndikator(poin, level, judul, detail) {
    skorRisiko += poin;
    indikator.push({ poin, level, judul, detail });
  }

  // 1. Cek manipulasi kredensial '@' di URL (contoh: https://umm.ac.id@penipu.xyz)
  if (parsed.username || parsed.password || parsed.masukanAsli.includes("@")) {
    tambahIndikator(
      40,
      "danger",
      "Manipulasi Karakter '@' pada URL",
      `Tautan mengandung kredensial sebelum tanda "@" (${escapeHtml(parsed.username || "teks-umpan")}@). Browser akan mengabaikan teks di depan "@" dan mengarahkan Anda ke host sebenarnya: ${parsed.hostname}.`
    );
  }

  // 2. Cek apakah host menggunakan alamat IP langsung
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname);
  const isIpv6 = parsed.hostname.startsWith("[") || parsed.hostname.includes(":");
  if (isIpv4 || isIpv6) {
    tambahIndikator(
      35,
      "danger",
      "Tautan Menggunakan Alamat IP Langsung",
      `Alamat tujuan memakai IP (${parsed.hostname}) alih-alih nama domain resmi. Situs institusi atau layanan sah hampir tidak pernah meminta login lewat alamat IP mentah.`
    );
  }

  // 3. Cek protokol HTTP tidak terenkripsi
  if (parsed.punyaSkema && parsed.protocol === "http:") {
    tambahIndikator(
      15,
      "warn",
      "Koneksi Tidak Terenkripsi (HTTP)",
      "Tautan memakai http:// tanpa SSL/TLS (HTTPS). Data yang dikirimkan berisiko disadap di jaringan publik."
    );
  }

  // 4. Cek port non-standar
  if (parsed.port && !["80", "443"].includes(parsed.port)) {
    tambahIndikator(
      15,
      "warn",
      `Menggunakan Port Non-Standar (:${parsed.port})`,
      `Tautan mengarah ke port :${parsed.port}, sering dipakai server sementara atau halaman jebakan.`
    );
  }

  // 5. Pecah domain menggunakan modul PSL (jika bukan IP)
  let domainUtama = parsed.hostname;
  let subdomain = "";
  let akhiranPublik = "-";
  let jenisAkhiran = "-";

  if (!isIpv4 && !isIpv6 && parsed.hostname.includes(".")) {
    const psl = pecahDomainDenganPsl(parsed.hostname);
    if (!psl.hanyaAkhiranPublik) {
      domainUtama = psl.domainUtama;
      subdomain = psl.subdomain;
      akhiranPublik = psl.akhiranPublik;
      jenisAkhiran = psl.jenisAkhiran;

      // 5a. Cek URL Shortener
      if (PHISHING_RULES.shorteners.includes(domainUtama)) {
        tambahIndikator(
          25,
          "warn",
          `Tautan Pemendek URL (${domainUtama})`,
          `Alamat ini menggunakan layanan pemendek tautan (${domainUtama}) yang menyembunyikan domain tujuan akhir sebelum diklik.`
        );
      }

      // 5b. Cek Akhiran PRIVATE (github.io, pages.dev, vercel.app, netlify.app, dll.)
      if (jenisAkhiran === "PRIVATE") {
        tambahIndikator(
          15,
          "warn",
          `Hosting Publik / Akhiran PRIVATE (${akhiranPublik})`,
          `Domain utama "${domainUtama}" dihosting di platform gratis/publik (${akhiranPublik}) yang dapat dibuat siapa saja.`
        );
      }

      // 5c. Cek TLD berisiko tinggi
      const tldAkhir = akhiranPublik.split(".").pop();
      if (PHISHING_RULES.suspiciousTlds.includes(tldAkhir)) {
        tambahIndikator(
          20,
          "warn",
          `Ekstensi Domain Berbiaya Murah / Sering Disalahgunakan (.${tldAkhir})`,
          `Akhiran .${tldAkhir} kerap dipakai pada kampanye phishing massal.`
        );
      }

      // 5d. Cek domain lain yang diselipkan di subdomain
      const domainDalamSub = deteksiDomainDiSubdomain(subdomain);
      if (domainDalamSub.length > 0) {
        tambahIndikator(
          35,
          "danger",
          "Penyamaran Nama Domain di Dalam Subdomain",
          `Terdeteksi pola domain "${domainDalamSub.join(", ")}" di bagian subdomain (${subdomain}), padahal pemilik asli tautan adalah "${domainUtama}".`
        );
      }

      // 5e. Cek penyamaran merek / institusi (Brand Spoofing)
      const labelUtama = psl.labelTerdaftar;
      const gabunganCekMerek = `${subdomain}.${labelUtama}`.toLowerCase();
      PHISHING_RULES.protectedBrands.forEach((brand) => {
        const adalahResmi = brand.resmi.includes(domainUtama);
        if (!adalahResmi) {
          const cocokKata = brand.kata.find((k) => {
            const regexBatas = new RegExp(`(^|[.-])${k}([.-]|$)`, "i");
            return regexBatas.test(gabunganCekMerek);
          });
          if (cocokKata) {
            tambahIndikator(
              35,
              "danger",
              `Indikasi Penyamaran Merek / Institusi (${brand.nama})`,
              `Tautan memuat kata "${cocokKata}" yang mengatasnamakan ${brand.nama}, tetapi domain utamanya adalah "${domainUtama}" (bukan domain resmi ${brand.resmi.join(" / ")}).`
            );
          }
        }
      });

      // 5f. Cek Typosquatting (penggantian angka/huruf mirip)
      const typoList = deteksiTyposquatting(labelUtama);
      if (typoList.length > 0) {
        tambahIndikator(
          30,
          "danger",
          "Indikasi Typosquatting (Manipulasi Ejaan Domain)",
          `Nama domain "${labelUtama}" menggunakan karakter pengganti yang menyerupai merek resmi: ${typoList.join(", ")}.`
        );
      }

      // 5g. Cek Punycode / IDN Homograph (xn--)
      if (parsed.hostname.includes("xn--")) {
        tambahIndikator(
          30,
          "danger",
          "Domain Punycode / Homograph (xn--)",
          "Domain menggunakan karakter non-ASCII (Punycode) yang sering dipakai meniru tampilan huruf alfabet biasa."
        );
      }

      // 5h. Terlalu banyak tingkat subdomain
      if (psl.subdomainLabels.length >= 3) {
        tambahIndikator(
          15,
          "warn",
          `Subdomain Terlalu Bertingkat (${psl.subdomainLabels.length} Tingkat)`,
          `Subdomain panjang (${subdomain}) sering digunakan agar domain utama di layar ponsel terpotong dan tidak terbaca.`
        );
      }
    }
  }

  // 6. Cek kata kunci umpan social engineering pada URL
  const teksUrlLower = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase();
  const kataUmpanCocok = PHISHING_RULES.urgencyKeywords.filter((kw) => teksUrlLower.includes(kw));
  if (kataUmpanCocok.length > 0) {
    const poinKata = kataUmpanCocok.length >= 2 ? 20 : 10;
    tambahIndikator(
      poinKata,
      kataUmpanCocok.length >= 2 ? "warn" : "warn",
      `Kata Kunci Sensitif / Umpan Terdeteksi (${kataUmpanCocok.slice(0, 4).join(", ")})`,
      "Tautan memuat kata yang sering dipakai untuk memancing korban memasukkan akun, kata sandi, atau kode OTP."
    );
  }

  // 7. Cek panjang URL ekstrem
  if (parsed.fullNormalized.length > 105) {
    tambahIndikator(
      10,
      "warn",
      `URL Sangat Panjang (${parsed.fullNormalized.length} karakter)`,
      "URL yang terlalu panjang dan penuh parameter acak sering dipakai untuk menyembunyikan tujuan pengalihan."
    );
  }

  // 8. Verifikasi DNS & Umur Domain via RDAP (jika bukan IP)
  let infoDns = "Tidak diperiksa (Alamat IP)";
  let infoUmur = "Tidak tersedia";

  if (!isIpv4 && !isIpv6 && parsed.hostname.includes(".")) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const [dnsSettled, rdapSettled] = await Promise.allSettled([
      fetch(`https://dns.google/resolve?name=${encodeURIComponent(parsed.hostname)}&type=A`, {
        signal: controller.signal
      }),
      fetch(`https://rdap.org/domain/${encodeURIComponent(domainUtama)}`, {
        headers: { Accept: "application/rdap+json, application/json" },
        signal: controller.signal
      })
    ]);

    clearTimeout(timer);

    if (dnsSettled.status === "fulfilled" && dnsSettled.value.ok) {
      const dnsJson = await dnsSettled.value.json().catch(() => null);
      const ips = (dnsJson?.Answer || []).filter((a) => a.type === 1).map((a) => a.data);
      infoDns = ips.length > 0 ? `Aktif (${ips.join(", ")})` : "Tidak ditemukan catatan DNS A aktif";
    } else {
      infoDns = "Gagal mengecek DNS publik";
    }

    if (rdapSettled.status === "fulfilled" && rdapSettled.value.ok) {
      const rdapJson = await rdapSettled.value.json().catch(() => null);
      const regEvent = (rdapJson?.events || []).find(
        (ev) => ev.eventAction === "registration" || ev.eventAction === "registered"
      );
      if (regEvent?.eventDate) {
        const umurHari = hitungUmurHari(regEvent.eventDate);
        const tglIndo = formatTanggalId(regEvent.eventDate);
        if (umurHari !== null) {
          infoUmur = `${tglIndo} (~${umurHari} hari)`;
          if (umurHari < 30) {
            tambahIndikator(
              30,
              "danger",
              `Domain Sangat Baru (${umurHari} Hari)`,
              `Domain "${domainUtama}" baru didaftarkan pada ${tglIndo}. Mayoritas situs phishing menggunakan domain berumur kurang dari 1 bulan.`
            );
          } else if (umurHari < 180) {
            tambahIndikator(
              15,
              "warn",
              `Domain Relatif Baru (${umurHari} Hari)`,
              `Domain "${domainUtama}" berumur kurang dari 6 bulan (${tglIndo}). Pastikan keaslian pemiliknya.`
            );
          }
        }
      }
    }
  }

  if (phishingSubmitBtn) phishingSubmitBtn.disabled = false;
  sembunyikanPhishingStatus();

  // Batasi skor maksimal 100
  skorRisiko = Math.min(100, skorRisiko);
  lastPhishingHostname = parsed.hostname;

  // Tentukan status akhir
  let statusKelas = "safe";
  let judulKeputusan = "AMAN / RISIKO RENDAH";
  let subKeputusan = "Tidak ditemukan indikator kuat manipulasi tautan maupun penyamaran domain.";
  let labelBadge = `RISIKO ${skorRisiko}/100`;
  let badgeExtraClass = "";
  let warnaMeter = "var(--green)";

  if (skorRisiko >= 55) {
    statusKelas = "danger";
    judulKeputusan = "TERINDIKASI PHISHING / BERISIKO TINGGI";
    subKeputusan = "Ditemukan pola penipuan tautan atau penyamaran domain. Jangan memasukkan kredensial atau OTP.";
    badgeExtraClass = "grade-low";
    warnaMeter = "var(--red)";
  } else if (skorRisiko >= 25) {
    statusKelas = "warn";
    judulKeputusan = "PERLU WASPADA / VERIFIKASI ULANG";
    subKeputusan = "Tautan memiliki beberapa karakteristik yang perlu dipastikan kebenarannya sebelum dibuka.";
    badgeExtraClass = "grade-mid";
    warnaMeter = "var(--amber)";
  }

  // Render UI Hasil
  const bannerEl = document.getElementById("phishingVerdictBanner");
  const titleEl = document.getElementById("phishingVerdictTitle");
  const subEl = document.getElementById("phishingVerdictSubtitle");
  const badgeEl = document.getElementById("phishingRiskBadge");
  const meterFillEl = document.getElementById("phishingMeterFill");

  bannerEl.className = `file-verdict-banner ${statusKelas}`;
  titleEl.textContent = judulKeputusan;
  subEl.textContent = subKeputusan;
  badgeEl.className = `grade-badge ${badgeExtraClass}`.trim();
  badgeEl.textContent = labelBadge;

  if (meterFillEl) {
    meterFillEl.style.width = `${Math.max(6, skorRisiko)}%`;
    meterFillEl.style.backgroundColor = warnaMeter;
  }

  document.getElementById("phishingTargetHost").textContent = parsed.hostname;
  document.getElementById("phishingProtocolInfo").textContent =
    `Protokol: ${parsed.protocol.replace(":", "").toUpperCase()} • Domain Utama (PSL): ${domainUtama}`;

  document.getElementById("phishingDomainAge").textContent = infoUmur;
  document.getElementById("phishingDnsInfo").textContent = `Status DNS: ${infoDns}`;

  const listEl = document.getElementById("phishingIndicatorsList");
  listEl.innerHTML = "";

  if (indikator.length === 0) {
    const li = document.createElement("li");
    li.className = "warning-pill safe";
    li.innerHTML = `${SVG_ICONS.checkCircle}<span>Tidak ditemukan manipulasi URL, penyamaran merek, kata kunci umpan berbahaya, maupun anomali struktur domain.</span>`;
    listEl.appendChild(li);
  } else {
    indikator.forEach((item) => {
      const li = document.createElement("li");
      li.className = `warning-pill ${item.level === "danger" ? "danger" : ""}`;
      li.innerHTML = `${SVG_ICONS.alertTriangle}<span><strong>${escapeHtml(item.judul)} (+${item.poin} poin):</strong> ${escapeHtml(item.detail)}</span>`;
      listEl.appendChild(li);
    });
  }

  lastPhishingSummaryText = [
    `[Shacurity — Laporan Deteksi Link Phishing]`,
    `URL Diuji: ${parsed.masukanAsli}`,
    `Host Tujuan: ${parsed.hostname}`,
    `Domain Utama (PSL): ${domainUtama}`,
    `Status: ${judulKeputusan} (Skor Risiko: ${skorRisiko}/100)`,
    `Umur Domain: ${infoUmur}`,
    `Temuan (${indikator.length}):`,
    ...(indikator.length > 0
      ? indikator.map((i, idx) => `${idx + 1}. ${i.judul} (+${i.poin}): ${i.detail}`)
      : ["- Tidak ada indikator mencurigakan."])
  ].join("\n");

  if (phishingResultArea) phishingResultArea.style.display = "block";
}

if (phishingForm) {
  phishingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    analisisLinkPhishing(phishingUrlInput.value);
  });
}

document.querySelectorAll("[data-phishing-example]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const sampleUrl = btn.dataset.phishingExample;
    if (phishingUrlInput) phishingUrlInput.value = sampleUrl;
    analisisLinkPhishing(sampleUrl);
  });
});

if (copyPhishingReportBtn) {
  copyPhishingReportBtn.addEventListener("click", async () => {
    if (!lastPhishingSummaryText) return;
    try {
      await navigator.clipboard.writeText(lastPhishingSummaryText);
      showToast("Laporan analisis phishing berhasil disalin!");
    } catch (_) {
      showToast("Gagal menyalin otomatis.");
    }
  });
}

if (inspectInPslBtn) {
  inspectInPslBtn.addEventListener("click", () => {
    if (!lastPhishingHostname) return;
    if (typeof aktifkanTabLab === "function") aktifkanTabLab("paneRaporDomain");
    if (typeof hostInput !== "undefined" && hostInput) {
      hostInput.value = lastPhishingHostname;
    }
    if (typeof jalankanPemeriksaanTerpadu === "function") {
      jalankanPemeriksaanTerpadu(lastPhishingHostname, false);
    }
  });
}