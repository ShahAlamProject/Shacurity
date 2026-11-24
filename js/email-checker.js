/* ==========================================================================
   EMAIL-CHECKER.JS — Validasi Format & Indikator Email Lokal
   ========================================================================== */

const EMAIL_BRANDS = [
  { nama: "BCA", kata: ["bca", "klikbca", "mybca"], resmi: ["bca.co.id", "klikbca.com"] },
  { nama: "UMM", kata: ["umm", "infokhs"], resmi: ["umm.ac.id"] },
  { nama: "Google", kata: ["google", "gmail"], resmi: ["google.com", "google.co.id"] },
  { nama: "Microsoft", kata: ["microsoft", "outlook", "office365"], resmi: ["microsoft.com", "outlook.com", "office.com"] },
  { nama: "Shopee", kata: ["shopee"], resmi: ["shopee.co.id", "shopee.com"] }
];

const EMAIL_DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "33mail.com",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.com",
  "maildrop.cc",
  "mailinator.com",
  "minuteinbox.com",
  "mohmal.com",
  "mytemp.email",
  "sharklasers.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmail.com",
  "tempail.com",
  "throwawaymail.com",
  "trashmail.com",
  "yopmail.com"
]);

const emailCheckerForm = document.getElementById("emailCheckerForm");
const emailInput = document.getElementById("emailInput");
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
  const email = String(rawEmail || "").trim();
  if (!email) return { valid: false, alasan: "Masukkan alamat email terlebih dahulu." };
  if (email.length > 254) return { valid: false, alasan: "Alamat email melebihi 254 karakter." };
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
    return { valid: false, alasan: "Format email tidak valid. Gunakan format <code>nama@domain.contoh</code>." };
  }

  const atIndex = email.lastIndexOf("@");
  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1).toLowerCase();
  if (!localPart || localPart.length > 64 || localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return { valid: false, alasan: "Bagian nama email tidak valid." };
  }

  const labels = domain.split(".");
  if (
    labels.some((label) =>
      label.length === 0 ||
      label.length > 63 ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
    )
  ) {
    return { valid: false, alasan: "Nama domain email mengandung label DNS yang tidak valid." };
  }

  return { valid: true, email: `${localPart}@${domain}`, localPart, domain };
}

function cekEmail(rawEmail) {
  const hasil = validasiFormatEmail(rawEmail);
  if (!hasil.valid) {
    if (emailResultArea) emailResultArea.style.display = "none";
    setEmailStatus("error", `${SVG_ICONS.alertTriangle}<span>${hasil.alasan}</span>`);
    return;
  }

  let skor = 0;
  const indikator = [];

  if (EMAIL_DISPOSABLE_DOMAINS.has(hasil.domain)) {
    skor += 50;
    indikator.push({
      level: "danger",
      text: "Domain ada di daftar lokal email sekali pakai terbatas. Ini sinyal untuk diperiksa, bukan bukti penyalahgunaan."
    });
  }

  if (typeof pecahDomainDenganPsl === "function") {
    const psl = pecahDomainDenganPsl(hasil.domain);
    if (!psl.hanyaAkhiranPublik && psl.jenisAkhiran === "PRIVATE") {
      skor += 15;
      indikator.push({ level: "warn", text: `Akhiran ${psl.akhiranPublik} adalah platform hosting; pemilik alamat perlu diverifikasi.` });
    }
  }

  const gabungan = `${hasil.localPart}.${hasil.domain}`.toLowerCase();
  EMAIL_BRANDS.forEach((brand) => {
    if (brand.resmi.includes(hasil.domain)) return;
    const cocok = brand.kata.find((kata) => gabungan.includes(kata));
    if (cocok) {
      skor += 30;
      indikator.push({
        level: "danger",
        text: `Mengandung kata "${cocok}" terkait ${brand.nama}, tetapi domainnya bukan salah satu domain resmi yang dikenal aplikasi.`
      });
    }
  });

  if (
    hasil.localPart.toLowerCase().includes("otp") ||
    hasil.localPart.toLowerCase().includes("verifikasi") ||
    (hasil.localPart.toLowerCase().includes("admin") && hasil.localPart.length < 8)
  ) {
    skor += 10;
    indikator.push({ level: "warn", text: "Nama sebelum @ memakai kata yang sering muncul pada pesan verifikasi atau administrasi." });
  }

  skor = Math.min(100, skor);
  let statusClass = "safe";
  let title = "TIDAK ADA POLA LOKAL YANG MENONJOL";
  let subtitle = "Pemeriksaan format dan daftar lokal terbatas saja; DNS dan kepemilikan email tidak diperiksa.";
  let badgeClass = "";

  if (skor >= 55) {
    statusClass = "danger";
    title = "BEBERAPA INDIKATOR PERLU DIPERIKSA";
    subtitle = "Verifikasi alamat melalui situs atau kanal resmi sebelum merespons.";
    badgeClass = "grade-low";
  } else if (skor >= 25) {
    statusClass = "warn";
    title = "PERLU DIPERIKSA";
    subtitle = "Ditemukan pola lokal yang perlu diverifikasi secara manual.";
    badgeClass = "grade-mid";
  }

  document.getElementById("emailVerdictBanner").className = `file-verdict-banner ${statusClass}`;
  document.getElementById("emailVerdictTitle").textContent = title;
  document.getElementById("emailVerdictSubtitle").textContent = subtitle;
  const badge = document.getElementById("emailRiskBadge");
  badge.className = `grade-badge ${badgeClass}`.trim();
  badge.textContent = `INDIKATOR ${skor}/100`;

  document.getElementById("emailLocalPart").textContent = hasil.localPart;
  document.getElementById("emailDomainValue").textContent = hasil.domain;
  document.getElementById("emailDomainType").textContent =
    EMAIL_DISPOSABLE_DOMAINS.has(hasil.domain) ? "Tercantum" : "Tidak tercantum";
  document.getElementById("emailDomainNote").textContent =
    "Daftar lokal terbatas; tidak tercantum bukan jaminan aman.";
  document.getElementById("emailDisposableListCount").textContent =
    EMAIL_DISPOSABLE_DOMAINS.size.toLocaleString("id-ID");

  const list = document.getElementById("emailIndicatorsList");
  list.innerHTML = "";
  if (indikator.length === 0) {
    indikator.push({ level: "safe", text: "Tidak ada pola yang cocok dengan indikator lokal terbatas." });
  }
  indikator.forEach((item) => {
    const li = document.createElement("li");
    li.className = `warning-pill ${item.level === "danger" ? "danger" : item.level === "safe" ? "safe" : ""}`;
    li.innerHTML = `${item.level === "safe" ? SVG_ICONS.checkCircle : SVG_ICONS.alertTriangle}<span>${escapeHtml(item.text)}</span>`;
    list.appendChild(li);
  });

  if (emailResultArea) emailResultArea.style.display = "block";
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
