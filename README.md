# Budget Tracker - Tugas Akhir RevoU

Aplikasi pelacak keuangan pribadi berbasis web dibuat dengan HTML, CSS, dan JavaScript murni tanpa framework atau library eksternal. Semua data disimpan di browser menggunakan localStorage, tidak butuh server maupun database.

---

## Teknologi

| Bagian | Teknologi |
|--------|-----------|
| Struktur | HTML5 |
| Tampilan | CSS3 (Variables, glassmorphism, dark mode, responsive) |
| Logika | Vanilla JavaScript ES6 |
| Data | localStorage browser |
| Grafik | SVG murni (tanpa Chart.js) |
| Font | Inter (Google Fonts) |

Tidak ada npm, build step, atau backend. Cukup buka index.html di browser.

---

## Struktur Proyek

`\nCodingCamp-11November26-RizkyAlamsyah/\n|-- index.html      # Struktur halaman & semua elemen UI\n|-- css/\n|   -- style.css   # Seluruh styling, tema, responsivitas\n|-- js/\n|   -- app.js      # Seluruh logika aplikasi\n|-- assets/         # Folder untuk logo (opsional)\n-- README.md       # Dokumen ini\n`\n

---

## Fitur Utama

- **Dashboard** - Kartu ringkasan income/expense/balance bulan ini, grafik donut pengeluaran per kategori, bar chart income vs expense 6 bulan terakhir.
- **Tambah Transaksi** - Form input tipe (income/expense), jumlah, tanggal, kategori, deskripsi, catatan, dan metode pembayaran.
- **Budget Settings** - Atur batas pengeluaran bulanan keseluruhan dan per kategori. Banner peringatan otomatis muncul jika batas terlampaui.
- **Manage Categories** - Tambah atau hapus kategori (kategori default tidak bisa dihapus).
- **Halaman Transactions** - Lihat semua transaksi, filter berdasarkan tipe/kategori/bulan, sort, edit, dan hapus.
- **Halaman Summary** - Navigasi per bulan, breakdown per kategori, grafik donut bulanan, progress bar budget (safe/warn/over).
- **Tema Light/Dark** - Toggle tema tersimpan di localStorage, tidak ada flash saat reload.
- **Responsive** - Layout menyesuaikan di tablet dan mobile.

---

## Cara Menjalankan

1. Buka file index.html langsung di browser (double-click), atau gunakan Live Server di VS Code.
2. Aplikasi langsung masuk ke **Dashboard** - tidak ada halaman login.
3. Mulai tambahkan transaksi menggunakan form di Dashboard.

Data tersimpan di localStorage. Jika cache browser dibersihkan, data akan hilang.

---

## Arsitektur dan Alur Kerja

### Single Page Application (SPA)

Semua halaman ada di satu file index.html. Yang tampil diatur lewat class CSS:
- .page - display: none (tersembunyi)
- .page.active - display: flex (tampil)

Pindah halaman tidak me-reload browser. Fungsi switchTab(tabId) mengganti class active dan memanggil fungsi render halaman tujuan.

### Alur Inisialisasi

Halaman dibuka
- <head> inline script: pasang tema dari localStorage
- DOMContentLoaded:
  - initTheme() - terapkan tema & pasang tombol toggle
  - initDashboard() - pasang event listener form & render
  - initTransactions() - pasang listener filter & modal edit
  - initSummary() - pasang listener navigasi bulan
  - switchTab('page-dashboard') - tampilkan dashboard

### Penyimpanan Data

| Data | Key localStorage |
|------|-----------------|
| Transaksi | bt_transactions |
| Kategori | bt_categories |
| Budget | bt_budget_limits |
| Tema | bt_theme |

---

## Penjelasan Per File

### index.html

Hanya berisi struktur dan elemen UI, tidak ada logika. Isinya:
- <head>: meta tag, inline script tema, link ke style.css
- <body>:
  - Navbar: brand, link tab (Dashboard/Transactions/Summary), tombol toggle tema
  - #page-dashboard: kartu ringkasan, grafik, form tambah transaksi, budget settings, manage categories, tabel recent transactions
  - #page-transactions: filter & sort, tabel semua transaksi dengan tombol Edit/Delete
  - #page-summary: navigasi bulan, kartu bulan, tabel breakdown kategori, grafik donut, progress bar budget
  - #editModal: modal pop-up untuk edit transaksi
  - footer
  - <script src='js/app.js'> di paling bawah

### css/style.css

Mengatur seluruh tampilan:
- CSS Custom Properties di :root (light mode) dan [data-theme='dark'] (dark mode). Ganti tema = ganti satu atribut, semua warna ikut berubah
- Background animasi: radial-gradient orb + animasi bgShift + tekstur noise
- Komponen: navbar, kartu ringkasan, grafik, form, tombol, tabel, modal, progress bar
- Budget warning banner dengan animasi pulse merah
- Baris tabel menyala kuning/merah saat mendekati/melebihi budget
- Responsive: breakpoint tablet 1024px dan mobile 640px

### js/app.js

Satu-satunya file logika, ditulis dengan 'use strict'. Bagian-bagiannya:

**Konstanta**: STORAGE_KEYS, DEFAULT_CATEGORIES, DONUT_COLORS

**Data Layer**: getTransactions/saveTransactions, getCategories/saveCategories, getBudgetLimits/saveBudgetLimits, getTheme/saveTheme

**Utilitas**: formatCurrency (Rupiah), formatDate, filterByMonth, calcTotals, escapeHtml (cegah XSS), getLast6Months

**Tema**: applyTheme(), initTheme()

**Grafik SVG murni**:
- renderDonutChart() - donut chart pengeluaran per kategori menggunakan <circle> stroke-dasharray
- renderBarChart() - bar chart income vs expense 6 bulan menggunakan <rect>

**Dashboard**: initDashboard() pasang listener, renderDashboard() render ulang semua komponen

**Transactions**: initTransactions(), renderAllTransactions(), openEditModal(), closeEditModal()

**Summary**: initSummary(), renderSummary(), renderSummaryTable(), renderBudgetProgressBars()

**Router SPA**: switchTab(tabId) - sembunyikan semua .page, tampilkan yang dipilih, panggil render

---

## Konsep Penting

**localStorage sebagai database** - Menyimpan key-value string di browser. Objek JS disimpan lewat JSON.stringify dan dibaca dengan JSON.parse. Tidak butuh server, tapi data hilang jika cache dibersihkan.

**Single Page Application (SPA)** - Semua halaman ada di satu HTML. Pindah halaman hanya mengganti class CSS, tidak ada reload, terasa cepat.

**CSS Variables dan Dark Mode** - Semua warna di :root (light) dan override di [data-theme='dark']. Ganti tema = ganti satu atribut di <html>.

**SVG Charts tanpa Library** - Grafik donut dan bar digambar manual dengan elemen SVG. Tidak butuh Chart.js, aplikasi tetap ringan.

**Glassmorphism** - Background semi-transparan + backdrop-filter: blur() di atas gradient beranimasi, konsisten lewat class .glass.

**XSS Prevention** - Semua input yang ditampilkan ke HTML dilewatkan escapeHtml() untuk mencegah injeksi kode.

---

## Kredit

BudgetTracker - RevoU Coding Camp Final Project. Dibangun dengan HTML, CSS, dan JavaScript murni.