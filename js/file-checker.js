/* ==========================================================================
   FILE-CHECKER.JS — Analisis Lokal Magic Bytes, Ekstensi Ganda & Hash File
   ========================================================================== */

const filePickerInput = document.getElementById("filePickerInput");
const fileDropzone = document.getElementById("fileDropzone");
const fileResultArea = document.getElementById("fileResultArea");
const copyShaBtn = document.getElementById("copyShaBtn");
let currentFileSha = "";

function formatUkuranFile(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

function deteksiMagicBytes(uint8) {
  if (uint8.length >= 2 && uint8[0] === 0x4d && uint8[1] === 0x5a) {
    return { tipe: "EXE / DLL (Windows PE Executable)", kategori: "executable" };
  }
  if (uint8.length >= 4 && uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46) {
    return { tipe: "PDF Document (%PDF)", kategori: "document" };
  }
  if (uint8.length >= 4 && uint8[0] === 0x50 && uint8[1] === 0x4b && uint8[2] === 0x03 && uint8[3] === 0x04) {
    return { tipe: "ZIP / APK / DOCX / XLSX (Arsip PK)", kategori: "archive_or_package" };
  }
  if (uint8.length >= 8 && uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4e && uint8[3] === 0x47) {
    return { tipe: "PNG Image", kategori: "image" };
  }
  if (uint8.length >= 3 && uint8[0] === 0xff && uint8[1] === 0xd8 && uint8[2] === 0xff) {
    return { tipe: "JPEG Image", kategori: "image" };
  }
  if (uint8.length >= 4 && uint8[0] === 0x7f && uint8[1] === 0x45 && uint8[2] === 0x4c && uint8[3] === 0x46) {
    return { tipe: "ELF Binary (Linux/Android Executable)", kategori: "executable" };
  }
  if (uint8.length >= 6 && uint8[0] === 0x52 && uint8[1] === 0x61 && uint8[2] === 0x72 && uint8[3] === 0x21) {
    return { tipe: "RAR Archive", kategori: "archive" };
  }
  return { tipe: "Teks / Biner Umum", kategori: "unknown" };
}

async function analisisFile(namaFile, ukuranBytes, tipeMime, arrayBuffer) {
  const uint8 = new Uint8Array(arrayBuffer);
  const md5 = hitungMd5Hex(arrayBuffer);
  const sha256 = await hitungSha256Hex(arrayBuffer);
  currentFileSha = sha256;

  const bagianNama = namaFile.toLowerCase().split(".");
  const ekstensiAkhir = bagianNama.length > 1 ? bagianNama[bagianNama.length - 1] : "(tanpa ekstensi)";
  const ekstensiSebelumnya = bagianNama.length > 2 ? bagianNama[bagianNama.length - 2] : null;
  const sig = deteksiMagicBytes(uint8);

  const ekstensiSkripBerbahaya = ["msi", "bat", "cmd", "scr", "ps1", "vbs", "js", "jse", "wsf", "jar", "apk", "com", "pif", "lnk", "iso", "img", "sh"];
  const ekstensiProgramStandar = ["exe"];
  const ekstensiMakro = ["docm", "xlsm", "pptm", "dotm"];
  const ekstensiDokumenUmum = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "jpg", "jpeg", "png", "gif"];
  const ekstensiArsip = ["zip", "rar", "7z", "tar", "gz"];

  const peringatan = [];
  let tingkatRisiko = "safe";
  const alasanRingkas = [];

  const adaEkstensiGanda = Boolean(
    ekstensiSebelumnya &&
    ekstensiDokumenUmum.includes(ekstensiSebelumnya) &&
    (ekstensiSkripBerbahaya.includes(ekstensiAkhir) || ekstensiProgramStandar.includes(ekstensiAkhir))
  );

  if (adaEkstensiGanda) {
    tingkatRisiko = "danger";
    alasanRingkas.push(`nama file memakai ekstensi ganda (.${ekstensiSebelumnya}.${ekstensiAkhir}) untuk menyamarkan program eksekusi seolah-olah dokumen biasa`);
    peringatan.push({
      level: "danger",
      teks: `Alasan — Ekstensi Ganda Menyamarkan Tipe (.${ekstensiSebelumnya}.${ekstensiAkhir}): Sistem operasi menjalankan ekstensi paling belakang (.${ekstensiAkhir}), sedangkan ".${ekstensiSebelumnya}" hanya umpan visual agar pengguna mengira ini dokumen.`
    });
  }

  if (sig.kategori === "executable" && !["exe", "dll", "scr", "com", "elf"].includes(ekstensiAkhir)) {
    tingkatRisiko = "danger";
    alasanRingkas.push(`header biner (magic bytes) di dalam file menunjukkan program mesin (${sig.tipe}) meskipun namanya diberi ekstensi .${ekstensiAkhir}`);
    peringatan.push({
      level: "danger",
      teks: `Alasan — Pemalsuan Tipe Biner (Magic Bytes Mismatch): Byte awal file adalah kode mesin ${sig.tipe}, bukan struktur ".${ekstensiAkhir}".`
    });
  }

  if (ekstensiSkripBerbahaya.includes(ekstensiAkhir)) {
    if (tingkatRisiko !== "danger") tingkatRisiko = "danger";
    if (ekstensiAkhir === "apk") {
      alasanRingkas.push(`format .apk adalah paket instalasi aplikasi Android yang dapat meminta izin baca SMS/OTP dan notifikasi perbankan`);
      peringatan.push({
        level: "danger",
        teks: "Alasan — Paket Instalasi Android (.apk): File APK di luar Google Play Store sering disalahgunakan dalam modus penipuan undangan/resi untuk mencuri kode OTP SMS."
      });
    } else {
      alasanRingkas.push(`ekstensi .${ekstensiAkhir} adalah skrip/paket sistem yang langsung menjalankan perintah otomatis saat dibuka`);
      peringatan.push({
        level: "danger",
        teks: `Alasan — Format Skrip/Paket Sistem (.${ekstensiAkhir}): File ini menjalankan instruksi sistem secara otomatis dan jarang dibagikan sebagai lampiran percakapan biasa.`
      });
    }
  }

  if (ekstensiProgramStandar.includes(ekstensiAkhir) && !adaEkstensiGanda) {
    if (tingkatRisiko === "safe") tingkatRisiko = "warn";
    alasanRingkas.push(`format .exe adalah program aplikasi Windows yang dapat menjalankan perintah sistem secara langsung, namun aman jika diunduh dari situs resmi pengembang terpercaya`);
    peringatan.push({
      level: "warn",
      teks: "Alasan — Program Aplikasi Windows (.exe): Header biner cocok (Windows PE Executable) dan tidak memakai ekstensi ganda. Jika Anda mengunduhnya dari situs resmi pengembang terpercaya serta Digital Signature-nya valid, file ini aman dipasang. Sebaliknya, jangan jalankan jika dikirim lewat tautan acak."
    });
  }

  if (ekstensiMakro.includes(ekstensiAkhir)) {
    if (tingkatRisiko === "safe") tingkatRisiko = "warn";
    alasanRingkas.push(`format .${ekstensiAkhir} mendukung skrip Macro VBA yang dapat berjalan otomatis jika tombol Enable Macros ditekan`);
    peringatan.push({
      level: "warn",
      teks: `Alasan — Dokumen Bermakro (.${ekstensiAkhir}): Jangan menekan tombol "Enable Content / Enable Macros" bila dokumen berasal dari pengirim yang tidak dikenal.`
    });
  }

  if (ekstensiArsip.includes(ekstensiAkhir)) {
    if (tingkatRisiko === "safe") tingkatRisiko = "warn";
    alasanRingkas.push(`format .${ekstensiAkhir} adalah arsip terkompresi yang dapat membungkus file program di dalamnya`);
    peringatan.push({
      level: "warn",
      teks: `Alasan — File Arsip Terkompresi (.${ekstensiAkhir}): Periksa ekstensi asli setiap file di dalamnya setelah diekstrak.`
    });
  }

  if (ukuranBytes === 0) {
    if (tingkatRisiko === "safe") tingkatRisiko = "warn";
    alasanRingkas.push(`ukuran file 0 byte sehingga tidak berisi data valid`);
    peringatan.push({
      level: "warn",
      teks: "Alasan — File Kosong (0 Byte): File tidak memiliki isi biner, kemungkinan gagal diunduh atau rusak."
    });
  }

  const verdictBanner = document.getElementById("fileVerdictBanner");
  const verdictTitle = document.getElementById("fileVerdictTitle");
  const verdictSub = document.getElementById("fileVerdictSubtitle");
  const riskBadge = document.getElementById("fileRiskBadge");
  const reasonNarrative = document.getElementById("fileReasonNarrative");

  verdictBanner.className = `file-verdict-banner ${tingkatRisiko}`;
  riskBadge.className = "grade-badge";

  if (tingkatRisiko === "danger") {
    verdictTitle.textContent = "BERISIKO TINGGI / MENCURIGAKAN";
    verdictSub.textContent = "Ditemukan penyamaran ekstensi/biner atau format skrip berisiko.";
    riskBadge.textContent = "TINGGI";
    riskBadge.classList.add("grade-low");
    reasonNarrative.innerHTML = `<strong>Mengapa file ini dinilai Berisiko Tinggi?</strong> Karena ${escapeHtml(alasanRingkas.join("; "))}.`;
  } else if (tingkatRisiko === "warn") {
    verdictTitle.textContent = "PERLU VERIFIKASI SUMBER";
    verdictSub.textContent = "Tidak ditemukan penyamaran tipe file, namun format ini memiliki kemampuan eksekusi/ekstraksi.";
    riskBadge.textContent = "VERIFIKASI";
    riskBadge.classList.add("grade-mid");
    reasonNarrative.innerHTML = `<strong>Mengapa statusnya Perlu Verifikasi Sumber?</strong> Karena ${escapeHtml(alasanRingkas.join("; "))}.`;
  } else {
    verdictTitle.textContent = "AMAN / RISIKO RENDAH";
    verdictSub.textContent = "Format dokumen atau media standar tanpa tanda penyamaran.";
    riskBadge.textContent = "AMAN";
    reasonNarrative.innerHTML = `<strong>Mengapa file ini dinilai Aman (Risiko Rendah)?</strong><br/>1. <strong>Header Biner Cocok:</strong> Tanda tangan biner (<em>magic bytes</em>: <code>${escapeHtml(sig.tipe)}</code>) sesuai dengan ekstensi nama file <code>.${escapeHtml(ekstensiAkhir)}</code>.<br/>2. <strong>Bukan Format Eksekusi:</strong> File ini bukan program aplikasi maupun skrip sistem, serta tidak memakai ekstensi ganda tersembunyi.`;
  }

  document.getElementById("fileNameVal").textContent = namaFile;
  document.getElementById("fileSizeVal").textContent = `Ukuran: ${formatUkuranFile(ukuranBytes)} (${ukuranBytes.toLocaleString("id-ID")} byte)`;
  document.getElementById("fileSignatureVal").textContent = `.${ekstensiAkhir} → ${sig.tipe}`;
  document.getElementById("fileMimeVal").textContent = `MIME Browser: ${tipeMime || "application/octet-stream"}`;

  document.getElementById("fileMd5Val").textContent = md5;
  document.getElementById("fileSha256Val").textContent = sha256;
  const vtLink = document.getElementById("vtLookupLink");
  if (/^[a-f0-9]{64}$/i.test(sha256)) {
    vtLink.href = `https://www.virustotal.com/gui/file/${sha256}`;
  }

  const fileWarningsList = document.getElementById("fileWarningsList");
  fileWarningsList.innerHTML = "";
  if (peringatan.length === 0) {
    const li = document.createElement("li");
    li.className = "warning-pill safe";
    li.innerHTML = `${SVG_ICONS.checkCircle}<span>Semua indikator struktur lokal lolos: tidak ada ekstensi ganda, tidak ada pemalsuan magic bytes, dan bukan file installer/skrip.</span>`;
    fileWarningsList.appendChild(li);
  } else {
    peringatan.forEach((item) => {
      const li = document.createElement("li");
      li.className = `warning-pill ${item.level === "danger" ? "danger" : ""}`;
      li.innerHTML = `${SVG_ICONS.alertTriangle}<span>${escapeHtml(item.teks)}</span>`;
      fileWarningsList.appendChild(li);
    });
  }

  fileResultArea.style.display = "block";
}

async function prosesFileDariUser(file) {
  if (!file) return;
  const buffer = await file.arrayBuffer();
  await analisisFile(file.name, file.size, file.type, buffer);
}

if (fileDropzone && filePickerInput) {
  fileDropzone.addEventListener("click", () => filePickerInput.click());
  fileDropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      filePickerInput.click();
    }
  });

  filePickerInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) prosesFileDariUser(e.target.files[0]);
  });

  fileDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    fileDropzone.classList.add("dragover");
  });
  fileDropzone.addEventListener("dragleave", () => fileDropzone.classList.remove("dragover"));
  fileDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    fileDropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) prosesFileDariUser(e.dataTransfer.files[0]);
  });
}

if (copyShaBtn) {
  copyShaBtn.addEventListener("click", async () => {
    if (!currentFileSha) return;
    try {
      await navigator.clipboard.writeText(currentFileSha);
      showToast("Hash SHA-256 berhasil disalin!");
    } catch (_) {
      showToast("Gagal menyalin otomatis, silakan blok teks SHA-256.");
    }
  });
}

document.querySelectorAll("[data-file-sim]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const mode = btn.dataset.fileSim;
    if (mode === "spoofed-pdf") {
      const fakeExe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]).buffer;
      await analisisFile("KHS_Mahasiswa.pdf.exe", 248320, "application/x-msdownload", fakeExe);
    } else if (mode === "trusted-exe") {
      const cleanExe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]).buffer;
      await analisisFile("Installer_Resmi_App.exe", 18420480, "application/x-msdownload", cleanExe);
    } else if (mode === "apk-undangan") {
      const fakeApk = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x08, 0x00]).buffer;
      await analisisFile("Undangan_Resmi.apk", 4812900, "application/vnd.android.package-archive", fakeApk);
    } else {
      const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]).buffer;
      await analisisFile("Panduan_Akademik.pdf", 842110, "application/pdf", fakePdf);
    }
  });
});