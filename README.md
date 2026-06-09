# cuan-atau-nyangkut

SPK sederhana untuk membantu membaca sinyal **BELI / TAHAN / JUAL** saham PT Elnusa Tbk (ELSA) berdasarkan rasio profitabilitas dan metode **Simple Exponential Smoothing (SES)**.

Project ini dibuat sebagai prototype analisis keputusan saham: data laporan keuangan dihitung menjadi rasio, diproyeksikan ke FY2026, lalu dibandingkan dengan threshold untuk menghasilkan rekomendasi.

## Fitur

- Menghitung rasio profitabilitas: GPM, NPM, ROA, dan ROE.
- Forecast rasio FY2026 menggunakan Simple Exponential Smoothing.
- Slider alpha untuk melihat pengaruh smoothing factor.
- Evaluasi threshold menjadi zona BELI, TAHAN, atau JUAL.
- Visualisasi tabel dan grafik menggunakan Chart.js.
- API JSON untuk mengambil hasil perhitungan SPK.

## Tech Stack

- Python
- Flask
- HTML
- CSS
- JavaScript
- Chart.js

## Cara Menjalankan

Masuk ke folder project:

```powershell
cd "ELSA_Predict"
```

Install Flask jika belum ada:

```powershell
pip install flask
```

Jalankan aplikasi:

```powershell
python app.py
```

Buka browser:

```text
http://127.0.0.1:5000
```

## Endpoint API

Ambil hasil SPK default:

```text
GET /api/spk
```

Ambil hasil SPK dengan nilai alpha tertentu:

```text
GET /api/spk?alpha=0.6
```

Ambil daftar threshold:

```text
GET /api/threshold
```

## Struktur Project

```text
spk_elsa/
+-- app.py
+-- templates/
|   +-- index.html
+-- static/
|   +-- css/
|   |   +-- style.css
|   +-- js/
|       +-- main.js
|       +-- script.js
+-- README.md
```

## Alur Perhitungan

1. Input data laporan keuangan FY2024 dan FY2025.
2. Hitung rasio aktual: GPM, NPM, ROA, dan ROE.
3. Forecast rasio FY2026 dengan Simple Exponential Smoothing.
4. Bandingkan hasil forecast dengan threshold.
5. Tentukan rekomendasi akhir memakai majority vote.

## Catatan

Project ini adalah sistem pendukung keputusan, bukan rekomendasi investasi profesional. Hasil analisis perlu divalidasi lagi dengan data pasar, kondisi industri, risiko makro, dan laporan keuangan terbaru.

Grafik menggunakan Chart.js dari CDN, jadi koneksi internet dibutuhkan agar visualisasi tampil sempurna.

## Status

Prototype edukasi dan analisis skripsi. Masih bisa dikembangkan dengan data historis lebih panjang, validasi error forecasting, dan dokumentasi sumber data yang lebih lengkap.
