/* ==========================================================================
   EMAIL-CHECKER.JS — Validasi Format, DNS MX/SPF/DMARC & Indikator Email
   ========================================================================== */

const EMAIL_DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com", "guerrillamail.com", "mailinator.com",
  "tempmail.com", "yopmail.com", "getnada.com", "sharklasers.com"
]);

const EMAIL_BRANDS = [
  { nama: "BCA", kata: ["bca", "klikbca", "mybca"], resmi: ["bca.co.id", "klikbca.com"] },
  { nama: "UMM", kata: ["umm", "infokhs"], resmi: ["umm.ac.id"] },
  { nama: "Google", kata: ["google", "gmail"], resmi: ["google.com", "google.co.id"] },
  { nama: "Microsoft", kata: ["microsoft", "outlook", "office365"], resmi: ["microsoft.com", "outlook.com", "office.com"] },
  { nama: "Shopee", kata: ["shopee"], resmi: ["shopee.co.id", "shopee.com"] }
];

const emailCheckerForm = document.getElementById("emailCheckerForm");
const emailInput = document.getElementById("emailInput");
const emailSubmitBtn = document.getElementById("emailSubmitBtn");
const emailStatusBanner = document.getElementById("emailStatusBanner");
const emailResultArea = document.getElementById("emailResultArea");

function setEmailStatus(type, message) {
  if (!emailStatusBanner) return;
  emailStatusBanner.className = `cek-status-banner show${type === "error" ? " error" : ""}`;
  emailStatusBanner.innerHTML = message;
}

function clearEmailStatus() {
  if (!emailStatusBanner) return;
  emailStatusBanner.className = "cek-status-banner";
  emailStatusBanner.innerHTML = "";
}

function validasiFormatEmail(rawEmail) {
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!email) return { valid: false, alasan: "Masukkan alamat email terlebih dahulu." };
  if (email.length > 254) return { valid: false, alasan: "Alamat email melebihi 254 karakter." };
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
    return { valid: false, alasan: "Format email tidak valid. Gunakan format <code>nama@domain.contoh</code>." };
  }

  const [localPart, domain] = email.split("@");
  if (!localPart || localPart.length > 64) return { valid: false, alasan: "Bagian nama email tidak valid atau melebihi 64 karakter." };
  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return { valid: false, alasan: "Bagian nama email mengandung titik berlebihan atau berada di posisi awal/akhir." };
  }
  if (domain.startsWith("-") || domain.endsWith("-") || domain.includes("..")) {
    return { valid: false, alasan: "Nama domain email mengandung format DNS yang tidak valid." };
  }
  if (domain.split(".").some((label) => label.length > 63 || !/^[a-z0-9-]+$/i.test(label))) {
    return { valid: false, alasan: "Nama domain email mengandung label DNS yang tidak valid." };
  }

  return { valid: true, email, localPart, domain };
}

async function queryDns(name, type) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
      { signal: controller.signal }
    );
    if (!response.ok) throw new Error(`DNS HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function getDnsAnswers(payload) {
  if (!payload || !Array.isArray(payload.Answer)) return [];
  return payload.Answer.filter((answer) => answer.data).map((answer) => String(answer.data).replace(/^"|"$/g, ""));
}

async function cekIndikatorDns(name, type, predicate) {
  try {
    const payload = await queryDns(name, type);
    if (payload.Status !== 0 && payload.Status !== 3) {
      return { tersedia: false, ditemukan: false };
    }
    return { tersedia: true, ditemukan: getDnsAnswers(payload).some(predicate) };
  } catch (_) {
    return { tersedia: false, ditemukan: false };
  }
}

async function cekEmail(rawEmail) {
  const hasil = validasiFormatEmail(rawEmail);
  if (!hasil.valid) {
    if (emailResultArea) emailResultArea.style.display = "none";
    setEmailStatus("error", `${SVG_ICONS.alertTriangle}<span>${hasil.alasan}</span>`);
    return;
  }

  if (emailSubmitBtn) emailSubmitBtn.disabled = true;
  setEmailStatus("loading", `<span class="spinner"></span><span>Memeriksa format dan DNS email <strong>${escapeHtml(hasil.email)}</strong>...</span>`);

  let skor = 0;
  const indikator = [];
  const [mxResult, spfResult, dmarcResult] = await Promise.all([
    cekIndikatorDns(hasil.domain, "MX", () => true),
    cekIndikatorDns(hasil.domain, "TXT", (entry) => /^v=spf1\b/i.test(entry)),
    cekIndikatorDns(`_dmarc.${hasil.domain}`, "TXT", (entry) => /^v=dmarc1\b/i.test(entry))
  ]);
  const pemeriksaanDnsTidakLengkap = [mxResult, spfResult, dmarcResult].some((result) => !result.tersedia);

  if (EMAIL_DISPOSABLE_DOMAINS.has(hasil.domain)) {
    skor += 50;
    indikator.push({ level: "danger", text: "Domain Email Sementara: domain ini sering digunakan untuk identitas email sementara atau sekali pakai." });
  }

  if (typeof pecahDomainDenganPsl === "function") {
    const psl = pecahDomainDenganPsl(hasil.domain);
    if (!psl.hanyaAkhiranPublik && psl.jenisAkhiran === "PRIVATE") {
      skor += 15;
      indikator.push({ level: "warn", text: `Akhiran PRIVATE (${psl.akhiranPublik}) dapat dibuat oleh banyak pengguna platform.` });
    }
  }

  const gabungan = `${hasil.localPart}.${hasil.domain}`.toLowerCase();
  EMAIL_BRANDS.forEach((brand) => {
    if (brand.resmi.includes(hasil.domain)) return;
    const cocok = brand.kata.find((kata) => gabungan.includes(kata));
    if (cocok) {
      skor += 30;
      indikator.push({ level: "danger", text: `Indikasi penyamaran ${brand.nama}: nama/domain email mengandung kata "${cocok}" tetapi bukan domain resmi ${brand.resmi.join(" / ")}.` });
    }
  });

  if (hasil.localPart.includes("otp") || hasil.localPart.includes("verifikasi") || hasil.localPart.includes("admin") && hasil.localPart.length < 8) {
    skor += 10;
    indikator.push({ level: "warn", text: "Nama Lokal Sensitif: bagian sebelum @ mengandung kata yang lazim dipakai pada email penipuan atau umpan verifikasi." });
  }

  if (!mxResult.tersedia) {
    indikator.push({ level: "warn", text: "Catatan MX tidak dapat diperiksa karena layanan DNS tidak merespons. Hasil ini tidak dapat dipakai untuk menyimpulkan domain aman atau berbahaya." });
  } else if (!mxResult.ditemukan) {
    skor += 10;
    indikator.push({ level: "warn", text: "Catatan MX eksplisit tidak ditemukan. Ini perlu diverifikasi, tetapi bukan bukti bahwa alamat email penipuan atau tidak dapat menerima email." });
  } else {
    indikator.push({ level: "safe", text: "Catatan MX ditemukan: domain memiliki konfigurasi server penerima email." });
  }

  if (!spfResult.tersedia) indikator.push({ level: "warn", text: "Catatan SPF tidak dapat diperiksa karena layanan DNS tidak merespons." });
  else if (!spfResult.ditemukan) indikator.push({ level: "warn", text: "Catatan SPF tidak ditemukan. SPF membantu membatasi server yang berhak mengirim atas nama domain." });
  else indikator.push({ level: "safe", text: "Catatan SPF ditemukan pada DNS domain." });

  if (!dmarcResult.tersedia) indikator.push({ level: "warn", text: "Catatan DMARC tidak dapat diperiksa karena layanan DNS tidak merespons." });
  else if (!dmarcResult.ditemukan) indikator.push({ level: "warn", text: "Catatan DMARC tidak ditemukan. DMARC membantu kebijakan autentikasi dan pelaporan email." });
  else indikator.push({ level: "safe", text: "Catatan DMARC ditemukan pada DNS domain." });

  skor = Math.min(100, skor);
  let statusClass = "safe";
  let title = "INDIKATOR RISIKO RENDAH";
  let subtitle = "Tidak ditemukan indikator kuat pada format atau DNS yang berhasil diperiksa. Ini bukan jaminan email aman.";
  let badgeClass = "";

  if (pemeriksaanDnsTidakLengkap && skor < 55) {
    statusClass = "warn";
    title = "PEMERIKSAAN DNS TIDAK LENGKAP";
    subtitle = "Sebagian catatan DNS tidak dapat diverifikasi. Hasil ini belum cukup untuk menilai risiko email.";
    badgeClass = "grade-mid";
  } else if (skor >= 55) {
    statusClass = "danger";
    title = "BERISIKO TINGGI / MENCURIGAKAN";
    subtitle = "Beberapa indikator kuat menunjukkan alamat atau domain perlu diverifikasi.";
    badgeClass = "grade-low";
  } else if (skor >= 25) {
    statusClass = "warn";
    title = "PERLU VERIFIKASI";
    subtitle = "Email memiliki beberapa anomali atau pembatas autentikasi yang perlu diperiksa.";
    badgeClass = "grade-mid";
  }

  const banner = document.getElementById("emailVerdictBanner");
  const titleEl = document.getElementById("emailVerdictTitle");
  const subtitleEl = document.getElementById("emailVerdictSubtitle");
  const badge = document.getElementById("emailRiskBadge");
  if (banner) banner.className = `file-verdict-banner ${statusClass}`;
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
  if (badge) {
    badge.className = `grade-badge ${badgeClass}`.trim();
    badge.textContent = `RISIKO ${skor}/100`;
  }

  document.getElementById("emailLocalPart").textContent = hasil.localPart;
  document.getElementById("emailDomainValue").textContent = hasil.domain;

  let domainType = "Domain Publik";
  let domainNote = "Domain harus tetap diverifikasi melalui MX, RDAP, dan sumber resmi.";
  if (EMAIL_DISPOSABLE_DOMAINS.has(hasil.domain)) {
    domainType = "Domain Sementara";
    domainNote = "Domain ada dalam daftar sementara bawaan dan tidak menjamin bahwa alamat milik penipu.";
  } else if (hasil.domain.endsWith(".example") || hasil.domain.endsWith(".test") || hasil.domain.endsWith(".invalid")) {
    domainType = "Domain Contoh";
    domainNote = "TLD ini ditujukan untuk pengujian dan tidak untuk komunikasi nyata.";
  }
  document.getElementById("emailDomainType").textContent = domainType;
  document.getElementById("emailDomainNote").textContent = domainNote;

  const list = document.getElementById("emailIndicatorsList");
  list.innerHTML = "";
  indikator.forEach((item) => {
    const li = document.createElement("li");
    li.className = `warning-pill ${item.level === "danger" ? "danger" : item.level === "safe" ? "safe" : ""}`;
    li.innerHTML = `${item.level === "safe" ? SVG_ICONS.checkCircle : SVG_ICONS.alertTriangle}<span>${escapeHtml(item.text)}</span>`;
    list.appendChild(li);
  });

  if (emailResultArea) emailResultArea.style.display = "block";
  if (emailSubmitBtn) emailSubmitBtn.disabled = false;
  clearEmailStatus();
}

if (emailCheckerForm) {
  emailCheckerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    cekEmail(emailInput.value);
  });
}

document.querySelectorAll("[data-email-example]").forEach((button) => {
  button.addEventListener("click", () => {
    if (emailInput) emailInput.value = button.dataset.emailExample;
    cekEmail(button.dataset.emailExample);
  });
});
