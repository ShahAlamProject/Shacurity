# Shacurity

**Shacurity** adalah aplikasi web edukasi keamanan digital untuk membantu memeriksa domain, tautan, email, dan file. Aplikasi menampilkan indikator risiko beserta alasan dan keterbatasan pemeriksaannya—hasilnya bukan jaminan bahwa suatu domain, email, atau file aman.

## Fitur

- **Cek Domain & Link** — menguraikan URL menjadi subdomain, domain utama, dan akhiran publik menggunakan daftar Public Suffix List lokal. Pemeriksaan juga mencari pola mencurigakan, lalu mengambil data DNS, pendaftaran domain (RDAP), konfigurasi header HTTP, dan riwayat sertifikat dari layanan eksternal.
- **Cek Email** — memvalidasi format email dan memeriksa sejumlah pola serta daftar terbatas domain email sekali pakai. Tidak memeriksa DNS atau memastikan kotak masuk tersedia.
- **Cek File** — memeriksa file di browser, mencocokkan magic bytes dengan ekstensi, menandai ekstensi ganda dan pola uji EICAR, serta menghitung hash SHA-256.
- **Panduan keamanan** — menyediakan FAQ dan penjelasan agar hasil pemeriksaan dapat dipahami dengan konteks yang tepat.
- **Antarmuka responsif** — mendukung tema gelap/terang serta navigasi desktop dan perangkat mobile.

## Privasi dan batas pemeriksaan

- **Email dan file diperiksa secara lokal di browser**; aplikasi tidak mengirim alamat email atau file ke layanan pemeriksaan.
- **Cek Domain & Link memerlukan koneksi internet.** Host/domain yang diperiksa dikirim ke layanan DNS publik, RDAP, SecurityHeaders.com, dan CertSpotter. URL lengkap, termasuk path, tidak dikirim sebagai bagian dari pemeriksaan tersebut.
- Hasil pemeriksaan memakai heuristik dan data yang tersedia. Daftar lokal dapat terbatas atau tidak mutakhir, dan hasil dapat keliru atau tidak lengkap.
- Pemeriksaan file bukan pemindaian antivirus. Hash SHA-256 hanya membantu identifikasi atau verifikasi file; hash bukan bukti file aman.
- Jangan gunakan hasil sebagai satu-satunya dasar keputusan keamanan. Verifikasi informasi melalui sumber resmi dan jangan memeriksa data atau file yang tidak berhak Anda gunakan.

## Menjalankan secara lokal

Shacurity adalah aplikasi frontend statis dan tidak memerlukan proses build atau backend.

1. Clone atau unduh repositori ini.
2. Jalankan server web statis dari folder proyek. Contohnya, jika Python tersedia:

   ```powershell
   py -m http.server 8000
   ```

3. Buka `http://localhost:8000` di browser.

## Struktur proyek

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── email-checker.js
│   ├── file-checker.js
│   ├── psl.js
│   └── utils.js
└── log*.png
```

Public Suffix List yang disertakan sebagai data lokal ringkas memiliki atribusi dan lisensi Mozilla Public License 2.0 (MPL-2.0), sebagaimana dijelaskan di `js/psl.js`. Keterangan tersebut berlaku untuk data PSL yang digunakan, bukan pernyataan lisensi untuk seluruh proyek.
