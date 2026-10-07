# Webcare Invoice Generator Studio

Aplikasi Web Invoice Generator resmi untuk **PT. WEBCARE DIGITAL INDONESIA**.

## ✨ Fitur Utama
- **Template 100% Identik:** Menggunakan format, logo, stempel basah, tanda tangan, nomor rekening Bank BCA, dan tata letak resmi PT. Webcare Digital Indonesia.
- **Form Input Dinamis:**
  - Ubah Nomor Invoice, Tanggal, dan Data Klien (Nama, Perusahaan, Kontak).
  - Tambah / Hapus Item Tagihan secara dinamis.
  - Perhitungan otomatis Subtotal & Total dalam format Rupiah.
- **Logika Pelunasan Pintar:**
  - Jika uang yang dibayarkan **Lunas (≥ Total)**: Baris sisa kurang di bawah "Sudah Di bayar" otomatis ditiadakan.
  - Jika uang yang dibayarkan **Kurang (< Total)**: Otomatis muncul baris **"Kurang : Rp ..."** di bawah "Sudah Di bayar".
- **Ekspor & Cetak:**
  - **Print Langsung:** Output cetak `@media print` terkonfigurasi khusus ukuran pas A4 (210mm x 297mm).
  - **Download PDF:** Ekspor instan langsung ke file `.pdf`.
  - **Download PNG:** Simpan gambar invoice resolusi tinggi.

## 🚀 Cara Deploy ke Vercel (Gratis & Cepat)
Aplikasi ini dibuat murni menggunakan HTML5, CSS3, dan Vanilla JavaScript tanpa build tools yang rumit, sehingga dapat langsung di-deploy ke Vercel dalam hitungan detik.

### Langkah-langkah:
1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```
2. **Deploy di Vercel:**
   - Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
   - Klik **"Add New..."** -> **"Project"**.
   - Pilih repository yang baru saja Anda push.
   - Klik **"Deploy"** (tanpa perlu ubah pengaturan apa pun).
   - Selesai! Website Anda langsung online dan mendapatkan link publik (misal: `https://webcare-invoice.vercel.app`).
