/* ==========================================================================
   PSL.JS — Public Suffix List (MPL-2.0) & Algoritma Pemecah Struktur Domain
   ==========================================================================
   Atribusi Public Suffix List (PSL):
   Data aturan di bawah ini berasal dari Public Suffix List yang dikelola
   oleh komunitas di https://publicsuffix.org dan tersedia di:
   https://raw.githubusercontent.com/publicsuffix/list/main/public_suffix_list.dat
   Dilisensikan di bawah Mozilla Public License 2.0 (MPL-2.0):
   https://www.mozilla.org/en-US/MPL/2.0/
   ========================================================================== */

const EMBEDDED_PSL_DATA = {
  ICANN: [
    "com",
    "net",
    "org",
    "example",
    "id",
    "ac.id",
    "co.id",
    "go.id",
    "or.id",
    "sch.id",
    "web.id",
    "my.id",
    "uk",
    "co.uk",
    "ac.uk"
  ],
  PRIVATE: [
    "github.io",
    "pages.dev",
    "vercel.app",
    "netlify.app"
  ]
};

const pslStore = {
  rules: new Map(),
  exceptions: new Map(),
  mode: "embedded",
  totalCount: 0
};

function muatAturanRingkasBawaan() {
  pslStore.rules.clear();
  pslStore.exceptions.clear();

  EMBEDDED_PSL_DATA.ICANN.forEach((rule) => pslStore.rules.set(rule.toLowerCase(), "ICANN"));
  EMBEDDED_PSL_DATA.PRIVATE.forEach((rule) => pslStore.rules.set(rule.toLowerCase(), "PRIVATE"));

  pslStore.mode = "embedded";
  pslStore.totalCount = pslStore.rules.size + pslStore.exceptions.size;
  perbaruiBadgePsl();
}

function perbaruiBadgePsl() {
  const badge = document.getElementById("pslStatusBadge");
  const note = document.getElementById("pslSourceNote");
  if (!badge || !note) return;

  badge.className = "psl-count-badge";
  badge.textContent = `Daftar lokal ringkas (${pslStore.totalCount} aturan)`;
  note.textContent = "Tanpa koneksi jaringan; akhiran lain memakai fallback";
}

// Ekstraksi hostname dari URL lengkap atau domain & validasi alamat IP
function ekstrakHostnameDariMasukan(rawInput) {
  const teksAsli = String(rawInput || "").trim();
  if (!teksAsli) {
    return { valid: false, alasan: "Kolom alamat masih kosong. Masukkan URL atau nama domain untuk diperiksa." };
  }

  const adalahUrlLengkap = /^[a-z][a-z0-9+.-]*:\/\//i.test(teksAsli) || /[\/?#]/.test(teksAsli);
  let hostname = "";

  try {
    const kandidatUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(teksAsli) ? teksAsli : "http://" + teksAsli;
    const parsed = new URL(kandidatUrl);
    hostname = parsed.hostname.toLowerCase();
  } catch (_) {
    let sementara = teksAsli.toLowerCase();
    sementara = sementara.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    sementara = sementara.split("@").pop();
    sementara = sementara.split(/[\/?#]/)[0];
    sementara = sementara.replace(/:\d+$/, "");
    hostname = sementara;
  }

  hostname = hostname.replace(/\.+$/, "");

  if (!hostname) {
    return { valid: false, alasan: "Tidak dapat menemukan nama host yang valid dari masukan tersebut." };
  }

  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    const oktet = hostname.split(".").map(Number);
    const oktetValid = oktet.every((n) => n >= 0 && n <= 255);
    return {
      valid: false,
      tipeError: "ip",
      alasan: oktetValid
        ? `Masukan <code>${escapeHtml(hostname)}</code> adalah <strong>alamat IPv4</strong>, bukan nama domain. Alamat IP tidak memiliki struktur subdomain, domain utama, maupun akhiran publik (Public Suffix List).`
        : `Masukan <code>${escapeHtml(hostname)}</code> menyerupai alamat IPv4 tidak valid (angka di luar rentang 0–255), bukan nama domain.`
    };
  }

  const bersihIpv6 = hostname.replace(/^\[|\]$/g, "");
  if (bersihIpv6.includes(":")) {
    return {
      valid: false,
      tipeError: "ip",
      alasan: `Masukan <code>${escapeHtml(hostname)}</code> adalah <strong>alamat IPv6</strong>, bukan nama domain. Alamat IP menunjuk langsung ke antarmuka jaringan sehingga tidak dapat dipecah dengan Public Suffix List.`
    };
  }

  if (!hostname.includes(".") || !/^[a-z0-9.-]+$/.test(hostname) || hostname.includes("..")) {
    return {
      valid: false,
      alasan: `Format nama host <code>${escapeHtml(hostname)}</code> tidak valid. Masukkan nama domain yang benar, misalnya <code>infokhs.umm.ac.id</code> atau <code>https://www.bbc.co.uk/news</code>.`
    };
  }

  const labels = hostname.split(".");
  if (labels.some((label) => label.length > 63 || label.startsWith("-") || label.endsWith("-") || !/^[a-z0-9-]+$/i.test(label))) {
    return {
      valid: false,
      alasan: `Nama host <code>${escapeHtml(hostname)}</code> mengandung label domain yang tidak valid menurut format DNS.`
    };
  }

  return {
    valid: true,
    hostname,
    adalahUrlLengkap,
    masukanAsli: teksAsli
  };
}

// Algoritma pemecah domain PSL (aturan terpanjang + pengecualian !rule + fallback)
function pecahDomainDenganPsl(hostname) {
  const labels = hostname.split(".").filter(Boolean);
  let jumlahLabelAkhiran = 0;
  let aturanCocok = null;
  let jenisAkhiran = "FALLBACK";

  for (let i = 0; i < labels.length; i++) {
    const kandidatEksak = labels.slice(i).join(".");
    const kandidatWildcard = i + 1 < labels.length ? "*." + labels.slice(i + 1).join(".") : null;

    if (pslStore.exceptions.has(kandidatEksak)) {
      jumlahLabelAkhiran = labels.length - (i + 1);
      aturanCocok = "!" + kandidatEksak;
      jenisAkhiran = pslStore.exceptions.get(kandidatEksak);
      break;
    }

    if (pslStore.rules.has(kandidatEksak)) {
      jumlahLabelAkhiran = labels.length - i;
      aturanCocok = kandidatEksak;
      jenisAkhiran = pslStore.rules.get(kandidatEksak);
      break;
    }

    if (kandidatWildcard && pslStore.rules.has(kandidatWildcard)) {
      jumlahLabelAkhiran = labels.length - i;
      aturanCocok = kandidatWildcard;
      jenisAkhiran = pslStore.rules.get(kandidatWildcard);
      break;
    }
  }

  if (jumlahLabelAkhiran === 0) {
    jumlahLabelAkhiran = 1;
    aturanCocok = null;
    jenisAkhiran = "FALLBACK";
  }

  const akhiranLabels = labels.slice(labels.length - jumlahLabelAkhiran);
  const akhiranPublik = akhiranLabels.join(".");

  if (labels.length === jumlahLabelAkhiran) {
    return {
      hanyaAkhiranPublik: true,
      hostname,
      akhiranPublik,
      jenisAkhiran,
      aturanCocok
    };
  }

  const labelTerdaftar = labels[labels.length - jumlahLabelAkhiran - 1];
  const domainUtama = `${labelTerdaftar}.${akhiranPublik}`;
  const subdomainLabels = labels.slice(0, labels.length - jumlahLabelAkhiran - 1);
  const subdomain = subdomainLabels.join(".");

  return {
    hanyaAkhiranPublik: false,
    hostname,
    labels,
    subdomainLabels,
    subdomain,
    labelTerdaftar,
    akhiranLabels,
    akhiranPublik,
    domainUtama,
    jenisAkhiran,
    aturanCocok
  };
}

// Deteksi tulisan domain lain yang disisipkan di bagian subdomain
function deteksiDomainDiSubdomain(subdomain) {
  if (!subdomain) return [];
  const temuan = [];
  const subLabels = subdomain.split(".").filter(Boolean);

  for (let start = 0; start < subLabels.length - 1; start++) {
    for (let end = start + 2; end <= subLabels.length; end++) {
      const subSlice = subLabels.slice(start, end);

      for (let k = 1; k < subSlice.length; k++) {
        const calonAkhiran = subSlice.slice(k).join(".");
        if (pslStore.rules.has(calonAkhiran)) {
          const calonDomain = subSlice.slice(k - 1).join(".");
          if (!temuan.includes(calonDomain)) {
            temuan.push(calonDomain);
          }
        }
      }
    }
  }
  return temuan;
}

// Inisialisasi daftar ringkas bawaan saat modul dimuat
muatAturanRingkasBawaan();