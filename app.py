"""
╔══════════════════════════════════════════════════════════════════════╗
║  SPK PEMILIHAN SAHAM — PT ELNUSA TBK (ELSA)                        ║
║  Metode  : Simple Exponential Smoothing (SES)                       ║
║  Kriteria: Rasio Profitabilitas & Solvabilitas                      ║
║  Output  : Rekomendasi BELI / TAHAN / JUAL                          ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from flask import Flask, render_template, jsonify, request
from collections import Counter
import math

app = Flask(__name__)

# ── DATA KEUANGAN AKTUAL ─────────────────────────────────────────────
DATA = {
    "revenue":       {"FY2024": 13_393_013, "FY2025": 14_498_139},
    "cogs":          {"FY2024": 12_068_115, "FY2025": 13_051_005},
    "gross_profit":  {"FY2024":  1_324_898, "FY2025":  1_447_134},
    "net_income":    {"FY2024":    713_672, "FY2025":    718_412},
    "total_aset":    {"FY2024": 10_628_300, "FY2025": 10_961_040},
    "total_ekuitas": {"FY2024":  4_903_474, "FY2025":  5_314_162},
    "total_liab":    {"FY2024":  5_724_826, "FY2025":  5_646_878},
    "aset_lancar":   {"FY2024":  7_062_456, "FY2025":  7_820_852},
    "liab_lancar":   {"FY2024":  5_411_187, "FY2025":  5_266_159},
    "kas":           {"FY2024":  2_949_057, "FY2025":  2_698_503},
    "cfo":           {"FY2024":  1_747_142, "FY2025":  1_691_120},
    "capex":         {"FY2024":    404_472, "FY2025":    465_172},
}

# ── THRESHOLD ────────────────────────────────────────────────────────
THRESHOLD = {
    "GPM": {"label": "Gross Profit Margin",  "rumus": "Laba Bruto / Revenue × 100",         "beli": 12.0, "tahan": 8.0,  "satuan": "%", "kategori": "Profitabilitas"},
    "NPM": {"label": "Net Profit Margin",    "rumus": "Laba Bersih / Revenue × 100",         "beli":  6.0, "tahan": 3.0,  "satuan": "%", "kategori": "Profitabilitas"},
    "ROA": {"label": "Return on Assets",     "rumus": "Laba Bersih / Total Aset × 100",      "beli":  8.0, "tahan": 4.0,  "satuan": "%", "kategori": "Profitabilitas"},
    "ROE": {"label": "Return on Equity",     "rumus": "Laba Bersih / Total Ekuitas × 100",   "beli": 15.0, "tahan": 8.0,  "satuan": "%", "kategori": "Profitabilitas"},
}

# ── HELPER FUNCTIONS ─────────────────────────────────────────────────
def r(v, d=4): return round(v, d)

def hitung_rasio(d24, d25):
    def calc(rev, gp, ni, aset, ekuitas):
        return {
            "GPM": r(gp  / rev     * 100),
            "NPM": r(ni  / rev     * 100),
            "ROA": r(ni  / aset    * 100),
            "ROE": r(ni  / ekuitas * 100),
        }
    return (
        calc(d24["revenue"], d24["gross_profit"], d24["net_income"], d24["total_aset"], d24["total_ekuitas"]),
        calc(d25["revenue"], d25["gross_profit"], d25["net_income"], d25["total_aset"], d25["total_ekuitas"]),
    )

def ses(alpha, y25, y24):
    return r(alpha * y25 + (1 - alpha) * y24)

def zona(val, th):
    if val >= th["beli"]:  return "BELI"
    if val >= th["tahan"]: return "TAHAN"
    return "JUAL"

def error_metrics(y24, y25, y26_forecast):
    """Hitung MAE, MSE, RMSE, MAPE sebagai validasi model"""
    actual = [y24, y25]
    # gunakan nilai aktual tahun lalu sebagai naive forecast untuk pembanding
    errors = []
    for i, (a, f) in enumerate(zip([y25], [y26_forecast])):
        e = a - f
        errors.append({"actual": a, "forecast": f, "error": r(e, 4),
                       "abs_error": r(abs(e), 4),
                       "sq_error":  r(e**2, 6),
                       "pct_error": r(abs(e)/abs(a)*100, 4) if a != 0 else 0})
    return errors

def run_spk(alpha=0.6):
    d = DATA
    d24 = {k: v["FY2024"] for k, v in d.items()}
    d25 = {k: v["FY2025"] for k, v in d.items()}

    # Step 2 — Rasio aktual
    r24, r25 = hitung_rasio(d24, d25)

    # Step 3 — SES Forecast + detail
    r26, ses_detail = {}, {}
    for k in THRESHOLD:
        bag1 = r(alpha * r25[k])
        bag2 = r((1 - alpha) * r24[k])
        f26  = r(bag1 + bag2)
        r26[k] = f26
        ses_detail[k] = {
            "y24": r24[k], "y25": r25[k],
            "alpha": alpha,
            "bag1": bag1, "bag2": bag2,
            "forecast": f26,
            "delta_25_26": r(f26 - r25[k]),
            "delta_24_25": r(r25[k] - r24[k]),
        }

    # Step 4 — Evaluasi
    eval_result = {}
    for k in THRESHOLD:
        z = zona(r26[k], THRESHOLD[k])
        th = THRESHOLD[k]
        if z == "BELI":
            ket = f"Melebihi threshold beli (≥ {th['beli']}%)"
        elif z == "TAHAN":
            ket = f"Di antara {th['tahan']}% – {th['beli']}%"
        else:
            ket = f"Di bawah threshold tahan (< {th['tahan']}%)"
        eval_result[k] = {"zona": z, "keterangan": ket,
                          "nilai": r26[k], "threshold": th}

    # Step 5 — Agregasi
    zona_list = [v["zona"] for v in eval_result.values()]
    ctr = Counter(zona_list)
    beli  = ctr.get("BELI",  0)
    tahan = ctr.get("TAHAN", 0)
    jual  = ctr.get("JUAL",  0)
    total = len(THRESHOLD)

    if beli > tahan and beli > jual:
        keputusan = "BELI"
        alasan = f"{beli} dari {total} rasio berada di zona BELI — profitabilitas memenuhi standar industri."
    elif jual > beli and jual > tahan:
        keputusan = "JUAL"
        alasan = f"{jual} dari {total} rasio berada di zona JUAL — profitabilitas di bawah standar industri."
    else:
        keputusan = "TAHAN"
        alasan = f"Tidak ada zona mayoritas (BELI:{beli}, TAHAN:{tahan}, JUAL:{jual}) — prinsip kehati-hatian."

    skor = r(beli / total * 100, 1)

    # Rasio tambahan informatif (tidak masuk keputusan)
    info_rasio = {
        "current_ratio_24": r(d24["aset_lancar"] / d24["liab_lancar"], 4),
        "current_ratio_25": r(d25["aset_lancar"] / d25["liab_lancar"], 4),
        "der_24": r(d24["total_liab"] / d24["total_ekuitas"], 4),
        "der_25": r(d25["total_liab"] / d25["total_ekuitas"], 4),
        "fcf_24": d24["cfo"] - d24["capex"],
        "fcf_25": d25["cfo"] - d25["capex"],
    }

    return {
        "alpha": alpha,
        "data_input": {k: {"FY2024": d24[k], "FY2025": d25[k]} for k in d},
        "rasio_2024": r24,
        "rasio_2025": r25,
        "rasio_2026": r26,
        "ses_detail": ses_detail,
        "evaluasi":   eval_result,
        "threshold":  THRESHOLD,
        "counter":    {"BELI": beli, "TAHAN": tahan, "JUAL": jual},
        "total":      total,
        "keputusan":  keputusan,
        "alasan":     alasan,
        "skor":       skor,
        "info_rasio": info_rasio,
    }

# ── ROUTES ───────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/spk")
def api_spk():
    alpha = float(request.args.get("alpha", 0.6))
    alpha = max(0.01, min(0.99, round(alpha, 2)))
    return jsonify(run_spk(alpha))

@app.route("/api/threshold")
def api_threshold():
    return jsonify(THRESHOLD)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
