/* ── SPK ELSA — main.js (Complete Rebuild) ─────────────────────────── */
'use strict';

// ── FORMAT HELPERS ───────────────────────────────────────────────────
const fmtIDR = v => {
  if (v == null || isNaN(v)) return '—';
  const a = Math.abs(v);
  const s = v < 0 ? '-' : '';
  if (a >= 1e9) return s + (a/1e9).toFixed(2) + ' T';
  if (a >= 1e6) return s + (a/1e6).toFixed(2) + ' M';
  return s + Number(Math.round(a)).toLocaleString('id-ID');
};
const fmtPct  = (v, d=4) => v == null ? '—' : Number(v).toFixed(d) + '%';
const fmtPct2 = (v, d=2) => fmtPct(v, d);
const fmtDelta = (v, suf='pp') => {
  if (v == null) return '—';
  const s = v >= 0 ? '+' : '';
  return `${s}${Number(v).toFixed(4)}${suf}`;
};
const fmtDeltaIDR = v => {
  if (v == null) return '—';
  const s = v >= 0 ? '+' : '-';
  return s + fmtIDR(Math.abs(v));
};
const fmtPctChange = (v25, v24) => {
  if (!v24) return '—';
  const p = (v25 - v24) / Math.abs(v24) * 100;
  const cls = p >= 0 ? 'pos' : 'neg';
  return `<span class="${cls}">${p >= 0 ? '+' : ''}${p.toFixed(2)}%</span>`;
};
const trend = v => v >= 0 ? '<span class="pos">↑ Naik</span>' : '<span class="neg">↓ Turun</span>';

// ── STATE ────────────────────────────────────────────────────────────
let spkData = null;
let charts  = {};
let alpha   = 0.60;

// ── FETCH ────────────────────────────────────────────────────────────
async function fetchSPK(a) {
  const res = await fetch(`/api/spk?alpha=${a}`);
  spkData   = await res.json();
  return spkData;
}

// ── RENDER STAT ROW ──────────────────────────────────────────────────
function renderStatRow(d) {
  const inp = d.data_input;
  const stats = [
    { label:'Revenue FY2025', val: fmtIDR(inp.revenue.FY2025),
      delta: ((inp.revenue.FY2025-inp.revenue.FY2024)/Math.abs(inp.revenue.FY2024)*100).toFixed(1)+'%', pos:true, cls:'blue' },
    { label:'Laba Bersih FY2025', val: fmtIDR(inp.net_income.FY2025),
      delta: ((inp.net_income.FY2025-inp.net_income.FY2024)/Math.abs(inp.net_income.FY2024)*100).toFixed(1)+'%',
      pos: inp.net_income.FY2025>=inp.net_income.FY2024, cls:'green' },
    { label:'Total Aset FY2025', val: fmtIDR(inp.total_aset.FY2025),
      delta: ((inp.total_aset.FY2025-inp.total_aset.FY2024)/Math.abs(inp.total_aset.FY2024)*100).toFixed(1)+'%', pos:true, cls:'purple' },
    { label:'GPM Forecast \'26', val: fmtPct2(d.rasio_2026.GPM),
      delta: fmtDelta(d.ses_detail.GPM.delta_25_26,'pp'), pos:d.ses_detail.GPM.delta_25_26>=0, cls:'orange' },
    { label:'NPM Forecast \'26', val: fmtPct2(d.rasio_2026.NPM),
      delta: fmtDelta(d.ses_detail.NPM.delta_25_26,'pp'), pos:d.ses_detail.NPM.delta_25_26>=0, cls:'teal' },
    { label:'Rekomendasi SPK', val: d.keputusan,
      delta:`Skor ${d.skor}%`, pos: d.keputusan==='BELI', cls:'red' },
  ];
  document.getElementById('statRow').innerHTML = stats.map(s => `
    <div class="stat-card ${s.cls}">
      <div class="sc-label">${s.label}</div>
      <div class="sc-val">${s.val}</div>
      <div class="sc-delta ${s.pos?'pos':'neg'}">${s.delta}</div>
    </div>`).join('');
}

// ── RENDER VERDICT HERO ──────────────────────────────────────────────
function renderVerdictHero(d) {
  const kep = d.keputusan;
  const ico = {BELI:'▲', TAHAN:'◆', JUAL:'▼'}[kep];
  const clr = {BELI:'#86EFAC', TAHAN:'#FDE68A', JUAL:'#FCA5A5'}[kep];

  document.getElementById('vhIcon').textContent = ico;
  document.getElementById('vhIcon').style.background = {BELI:'rgba(134,239,172,.2)',TAHAN:'rgba(253,230,138,.2)',JUAL:'rgba(252,165,165,.2)'}[kep];
  document.getElementById('vhIcon').style.color = clr;
  document.getElementById('vhKeputusan').textContent = kep;
  document.getElementById('vhKeputusan').style.color = clr;
  document.getElementById('vhAlasan').textContent = d.alasan;

  const items = document.querySelectorAll('.vh-score-item');
  ['beli','tahan','jual'].forEach((z, i) => {
    const el = document.getElementById('vh' + z.charAt(0).toUpperCase() + z.slice(1));
    el.querySelector('span').textContent = d.counter[z.toUpperCase()] || 0;
  });
  document.getElementById('footerAlpha').textContent = Number(d.alpha).toFixed(2);
}

// ── RENDER STEP 1 ────────────────────────────────────────────────────
function renderStep1(d) {
  const inp = d.data_input;
  const IS_ITEMS = [
    ['revenue',      'Pendapatan Usaha (Revenue)',     'Total penjualan dan jasa'],
    ['cogs',         'Beban Pokok Penjualan',          'Biaya langsung menghasilkan revenue'],
    ['gross_profit', 'Laba Bruto',                     'Revenue − COGS'],
    ['net_income',   'Laba Bersih (Net Income)',        'Laba setelah pajak dan semua beban'],
  ];
  const BS_ITEMS = [
    ['total_aset',    'Total Aset',                    'Jumlah keseluruhan aset perusahaan'],
    ['total_ekuitas', 'Total Ekuitas',                 'Hak pemilik atas aset perusahaan'],
    ['total_liab',    'Total Liabilitas',               'Jumlah kewajiban perusahaan'],
    ['aset_lancar',   'Aset Lancar',                   'Aset dapat dicairkan < 1 tahun'],
    ['liab_lancar',   'Liabilitas Lancar',              'Kewajiban jatuh tempo < 1 tahun'],
    ['kas',           'Kas & Setara Kas',               'Uang tunai dan instrumen likuid'],
    ['cfo',           'Arus Kas Operasi (CFO)',          'Kas dari aktivitas bisnis utama'],
    ['capex',         'Capital Expenditure (CapEx)',    'Belanja modal / aset tetap'],
  ];

  const mkRow = ([key, label, ket]) => {
    const v24 = inp[key]?.FY2024 ?? 0;
    const v25 = inp[key]?.FY2025 ?? 0;
    return `<tr>
      <td>${label}</td>
      <td style="color:#6B7280;font-size:.78rem">${ket}</td>
      <td class="mono">${fmtIDR(v24)}</td>
      <td class="mono">${fmtIDR(v25)}</td>
      <td>${fmtPctChange(v25, v24)}</td>
    </tr>`;
  };
  document.getElementById('tblIS').innerHTML = IS_ITEMS.map(mkRow).join('');
  document.getElementById('tblBS').innerHTML = BS_ITEMS.map(mkRow).join('');
}

// ── RENDER STEP 2 ────────────────────────────────────────────────────
function renderStep2(d) {
  const RASIO_INFO = {
    GPM: { label:'Gross Profit Margin', formula:'Laba Bruto ÷ Revenue × 100' },
    NPM: { label:'Net Profit Margin',   formula:'Laba Bersih ÷ Revenue × 100' },
    ROA: { label:'Return on Assets',    formula:'Laba Bersih ÷ Total Aset × 100' },
    ROE: { label:'Return on Equity',    formula:'Laba Bersih ÷ Total Ekuitas × 100' },
  };

  document.getElementById('formulaGrid').innerHTML = Object.entries(RASIO_INFO).map(([k, v]) => `
    <div class="fg-card">
      <div class="fg-rasio">${k} — ${v.label}</div>
      <div class="fg-formula">${v.formula}</div>
    </div>`).join('');

  document.getElementById('tblRasio').innerHTML = Object.keys(d.threshold).map(k => {
    const v24   = d.rasio_2024[k];
    const v25   = d.rasio_2025[k];
    const delta = v25 - v24;
    return `<tr>
      <td><b>${k}</b></td>
      <td style="font-size:.78rem;color:#6B7280">${RASIO_INFO[k].formula}</td>
      <td class="mono">${fmtPct(v24)}</td>
      <td class="mono">${fmtPct(v25)}</td>
      <td class="mono ${delta>=0?'pos':'neg'}">${fmtDelta(delta)}</td>
      <td>${trend(delta)}</td>
    </tr>`;
  }).join('');
}

// ── RENDER STEP 3 ────────────────────────────────────────────────────
function renderStep3(d) {
  const a = d.alpha;
  document.getElementById('sfbParams').textContent =
    `α = ${a.toFixed(2)}  |  (1−α) = ${(1-a).toFixed(2)}  |  Bobot FY2025: ${Math.round(a*100)}%  |  Bobot FY2024: ${Math.round((1-a)*100)}%`;

  document.getElementById('tblSES').innerHTML = Object.keys(d.threshold).map(k => {
    const s = d.ses_detail[k];
    const dcls = s.delta_25_26 >= 0 ? 'pos' : 'neg';
    return `<tr>
      <td><b>${k}</b></td>
      <td class="mono">${fmtPct(s.y24)}</td>
      <td class="mono">${fmtPct(s.y25)}</td>
      <td class="mono hl">${fmtPct(s.bag1)}</td>
      <td class="mono hl">${fmtPct(s.bag2)}</td>
      <td class="mono" style="font-weight:700;color:#1D4ED8">${fmtPct(s.forecast)}</td>
      <td class="mono ${dcls}">${fmtDelta(s.delta_25_26)}</td>
    </tr>`;
  }).join('');

  document.getElementById('sesCards').innerHTML = Object.keys(d.threshold).map(k => {
    const s  = d.ses_detail[k];
    const th = d.threshold[k];
    const dcls = s.delta_25_26 >= 0 ? 'pos' : 'neg';
    return `<div class="ses-card">
      <div class="ses-card-title">${k} — ${th.label}</div>
      <div class="ses-card-val">${fmtPct(s.forecast, 4)}</div>
      <div class="ses-card-rows">
        <div class="ses-card-row"><span>Y(FY2024)</span><span class="mono">${fmtPct(s.y24)}</span></div>
        <div class="ses-card-row"><span>Y(FY2025)</span><span class="mono">${fmtPct(s.y25)}</span></div>
        <div class="ses-card-row"><span>α × Y(FY2025)</span><span class="mono hl">${fmtPct(s.bag1)}</span></div>
        <div class="ses-card-row"><span>(1-α) × Y(FY2024)</span><span class="mono hl">${fmtPct(s.bag2)}</span></div>
        <div class="ses-card-row"><span>Δ FY25→26</span><span class="mono ${dcls}">${fmtDelta(s.delta_25_26)}</span></div>
      </div>
    </div>`;
  }).join('');
}

// ── RENDER STEP 4 ────────────────────────────────────────────────────
function renderStep4(d) {
  document.getElementById('evalCards').innerHTML = Object.entries(d.evaluasi).map(([k, ev]) => {
    const cls   = ev.zona.toLowerCase();
    const selisih = ev.nilai - ev.threshold.beli;
    const scls    = selisih >= 0 ? 'pos' : 'neg';
    return `<div class="eval-card ${cls}">
      <div class="ec-rasio">${k} — ${ev.threshold.label}</div>
      <div class="ec-val">${fmtPct2(ev.nilai)}</div>
      <span class="zbadge ${cls}">${ev.zona}</span>
      <div class="ec-rows">
        <div class="ec-row"><span>Threshold Beli</span><span>≥ ${ev.threshold.beli}%</span></div>
        <div class="ec-row"><span>Threshold Tahan</span><span>≥ ${ev.threshold.tahan}%</span></div>
        <div class="ec-row"><span>Selisih vs Beli</span><span class="${scls}">${selisih>=0?'+':''}${selisih.toFixed(4)}pp</span></div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('tblEval').innerHTML = Object.entries(d.evaluasi).map(([k, ev]) => {
    const cls     = ev.zona.toLowerCase();
    const selisih = ev.nilai - ev.threshold.beli;
    const scls    = selisih >= 0 ? 'pos' : 'neg';
    return `<tr>
      <td><b>${k}</b> — ${ev.threshold.label}</td>
      <td class="mono" style="font-weight:700;color:#1D4ED8">${fmtPct(ev.nilai)}</td>
      <td class="mono pos">≥ ${ev.threshold.beli}%</td>
      <td class="mono" style="color:#B45309">≥ ${ev.threshold.tahan}%</td>
      <td class="mono ${scls}">${selisih>=0?'+':''}${selisih.toFixed(4)}pp</td>
      <td style="font-size:.78rem;color:#6B7280">${ev.keterangan}</td>
      <td><span class="zbadge ${cls}">${ev.zona}</span></td>
    </tr>`;
  }).join('');
}

// ── RENDER STEP 5 ────────────────────────────────────────────────────
function renderStep5(d) {
  const zonaRasio = { BELI:[], TAHAN:[], JUAL:[] };
  Object.entries(d.evaluasi).forEach(([k, ev]) => zonaRasio[ev.zona].push(k));

  document.getElementById('voteSection').innerHTML = ['BELI','TAHAN','JUAL'].map(z => {
    const cls     = z.toLowerCase();
    const cnt     = d.counter[z] || 0;
    const isWin   = z === d.keputusan;
    const rList   = zonaRasio[z].join(', ') || '—';
    return `<div class="vote-card ${cls} ${isWin?'winner':''}">
      <div class="vote-label">${z}</div>
      <div class="vote-count">${cnt}</div>
      <div class="vote-rasio-list">Rasio: ${rList}</div>
      ${isWin ? '<div class="vote-winner-tag">★ Pemenang</div>' : ''}
    </div>`;
  }).join('');

  const kep = d.keputusan;
  const cls = kep.toLowerCase();
  document.getElementById('finalVerdict').className = `final-verdict ${cls}`;
  document.getElementById('finalVerdict').innerHTML = `
    <div class="fv-pre">Rekomendasi Akhir SPK</div>
    <div class="fv-keputusan">${kep}</div>
    <div class="fv-skor">Skor Kelayakan: ${d.skor}% &nbsp;(${d.counter.BELI}/${d.total} rasio zona BELI)</div>
    <div class="fv-alasan">${d.alasan}</div>`;

  document.getElementById('tblRekap').innerHTML = Object.entries(d.evaluasi).map(([k, ev]) => {
    const s    = d.ses_detail[k];
    const cls2 = ev.zona.toLowerCase();
    const d4525 = s.delta_24_25 >= 0 ? `<span class="pos">+${s.delta_24_25.toFixed(4)}pp</span>` : `<span class="neg">${s.delta_24_25.toFixed(4)}pp</span>`;
    const d5526 = s.delta_25_26 >= 0 ? `<span class="pos">+${s.delta_25_26.toFixed(4)}pp</span>` : `<span class="neg">${s.delta_25_26.toFixed(4)}pp</span>`;
    return `<tr>
      <td><b>${k}</b></td>
      <td style="font-size:.78rem;color:#6B7280">${ev.threshold.label}</td>
      <td class="mono">${fmtPct(s.y24)}</td>
      <td class="mono">${fmtPct(s.y25)}</td>
      <td class="mono hl">${fmtPct(s.forecast)}</td>
      <td>${d4525}</td>
      <td>${d5526}</td>
      <td><span class="zbadge ${cls2}">${ev.zona}</span></td>
    </tr>`;
  }).join('');
}

// ── RENDER KESIMPULAN ────────────────────────────────────────────────
function renderKesimpulan(d) {
  const kep = d.keputusan;
  const kls = kep.toLowerCase();
  const implikasi = {
    BELI:  'Saham ELSA menunjukkan profitabilitas yang memenuhi standar industri jasa migas. Investor dapat mempertimbangkan untuk masuk posisi dengan tetap memperhatikan faktor makroekonomi dan harga minyak dunia.',
    TAHAN: 'Profitabilitas ELSA berada di level cukup namun belum optimal. Pemegang saham disarankan untuk mempertahankan posisi sambil menunggu konfirmasi perbaikan rasio pada laporan keuangan berikutnya.',
    JUAL:  'Rasio profitabilitas ELSA secara mayoritas berada di bawah threshold industri. Investor perlu mempertimbangkan kembali posisinya dan mengkaji ulang fundamental perusahaan.',
  };

  document.getElementById('kesimpulanContent').innerHTML = `
    <div class="final-verdict ${kls}" style="margin-bottom:1.2rem">
      <div class="fv-pre">Rekomendasi Final</div>
      <div class="fv-keputusan">${kep}</div>
      <div class="fv-skor">α = ${Number(d.alpha).toFixed(2)} · Skor: ${d.skor}% · ${d.counter.BELI}/${d.total} rasio zona BELI</div>
      <div class="fv-alasan">${implikasi[kep]}</div>
    </div>

    <div class="kesimp-section">
      <h3>Parameter Model</h3>
      <div class="kesimp-grid">
        <div class="kesimp-card"><div class="kc-label">Metode</div><div class="kc-val">Simple Exponential Smoothing</div></div>
        <div class="kesimp-card"><div class="kc-label">Smoothing Factor (α)</div><div class="kc-val" style="font-family:monospace">${Number(d.alpha).toFixed(2)}</div></div>
        <div class="kesimp-card"><div class="kc-label">Periode Aktual</div><div class="kc-val">FY2024 &amp; FY2025</div></div>
        <div class="kesimp-card"><div class="kc-label">Periode Forecast</div><div class="kc-val">FY2026</div></div>
        <div class="kesimp-card"><div class="kc-label">Jumlah Kriteria</div><div class="kc-val">${d.total} Rasio</div></div>
        <div class="kesimp-card"><div class="kc-label">Metode Agregasi</div><div class="kc-val">Majority Vote</div></div>
      </div>
    </div>

    <div class="kesimp-section">
      <h3>Ringkasan Hasil Forecast Rasio FY2026</h3>
      <table class="kesimp-table">
        <thead><tr><th>Rasio</th><th>FY2024</th><th>FY2025</th><th>Forecast FY2026</th><th>Threshold Beli</th><th>Selisih</th><th>Zona</th></tr></thead>
        <tbody>${Object.entries(d.evaluasi).map(([k, ev]) => {
          const s = d.ses_detail[k];
          const sel = s.forecast - ev.threshold.beli;
          const scls = sel >= 0 ? 'pos' : 'neg';
          return `<tr>
            <td><b>${k}</b></td>
            <td>${fmtPct(s.y24, 2)}</td>
            <td>${fmtPct(s.y25, 2)}</td>
            <td><b>${fmtPct(s.forecast, 2)}</b></td>
            <td>${ev.threshold.beli}%</td>
            <td class="${scls}">${sel>=0?'+':''}${sel.toFixed(2)}pp</td>
            <td><span class="zbadge ${ev.zona.toLowerCase()}">${ev.zona}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>

    <div class="kesimp-section">
      <h3>Catatan &amp; Keterbatasan Model</h3>
      <div class="info-box yellow">
        <b>⚠ Catatan Penting:</b>
        <ul style="margin-top:.4rem;padding-left:1.2rem;font-size:.82rem;line-height:1.8">
          <li>Model SES menggunakan hanya <b>2 titik data historis</b> — untuk akurasi lebih baik diperlukan minimal 5–10 periode.</li>
          <li>Threshold industri bersifat <b>indikatif</b> dan dapat bervariasi tergantung sub-sektor dan kondisi pasar.</li>
          <li>Rekomendasi SPK ini bersifat <b>pendukung keputusan</b>, bukan rekomendasi investasi profesional.</li>
          <li>Hasil forecast dapat berubah signifikan jika nilai α diubah — lakukan <b>sensitivity analysis</b>.</li>
        </ul>
      </div>
    </div>`;
}

// ── RENDER CHARTS ────────────────────────────────────────────────────
function renderCharts(d) {
  const keys    = Object.keys(d.threshold);
  const d24     = keys.map(k => d.rasio_2024[k]);
  const d25     = keys.map(k => d.rasio_2025[k]);
  const d26     = keys.map(k => d.rasio_2026[k]);
  const thBeli  = keys.map(k => d.threshold[k].beli);
  const thTahan = keys.map(k => d.threshold[k].tahan);
  const periods = ['FY2024','FY2025','FY2026 (F)'];

  const destroyChart = id => { if (charts[id]) { charts[id].destroy(); delete charts[id]; } };

  // Chart 1 — All rasio grouped bar
  destroyChart('chartAll');
  charts['chartAll'] = new Chart(document.getElementById('chartAll'), {
    data: {
      labels: keys,
      datasets: [
        { type:'bar', label:'FY2024', data:d24, backgroundColor:'#93C5E8', borderRadius:4 },
        { type:'bar', label:'FY2025', data:d25, backgroundColor:'#1D4E89', borderRadius:4 },
        { type:'bar', label:'Forecast FY2026', data:d26, backgroundColor:'rgba(201,64,64,.55)', borderColor:'#c94040', borderWidth:2, borderRadius:4 },
        { type:'line', label:'Threshold Beli',  data:thBeli,  borderColor:'#166534', borderWidth:2, borderDash:[5,3], pointRadius:4, pointBackgroundColor:'#166534', fill:false },
        { type:'line', label:'Threshold Tahan', data:thTahan, borderColor:'#8B5E00', borderWidth:2, borderDash:[3,3], pointRadius:4, pointBackgroundColor:'#8B5E00', fill:false },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:c=>`${c.dataset.label}: ${Number(c.parsed.y).toFixed(4)}%` }}},
      scales:{
        x:{ grid:{display:false}, ticks:{font:{size:12,weight:'600'}} },
        y:{ grid:{color:'rgba(0,0,0,.05)'}, ticks:{ callback:v=>v+'%', font:{size:11} }, beginAtZero:true }
      }
    }
  });

  // Chart 2 — GPM & NPM line
  destroyChart('chartPN');
  charts['chartPN'] = new Chart(document.getElementById('chartPN'), {
    type:'line',
    data:{
      labels: periods,
      datasets:[
        { label:'GPM', data:[d.rasio_2024.GPM, d.rasio_2025.GPM, d.rasio_2026.GPM],
          borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,.1)', fill:true, tension:.3, pointRadius:5 },
        { label:'NPM', data:[d.rasio_2024.NPM, d.rasio_2025.NPM, d.rasio_2026.NPM],
          borderColor:'#8B5CF6', backgroundColor:'rgba(139,92,246,.1)', fill:true, tension:.3, pointRadius:5,
          borderDash:[5,3] },
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'top',labels:{font:{size:11}}},
        tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${Number(c.parsed.y).toFixed(4)}%`}} },
      scales:{ y:{ ticks:{callback:v=>v+'%'}, beginAtZero:false } }
    }
  });

  // Chart 3 — ROA & ROE line
  destroyChart('chartAE');
  charts['chartAE'] = new Chart(document.getElementById('chartAE'), {
    type:'line',
    data:{
      labels: periods,
      datasets:[
        { label:'ROA', data:[d.rasio_2024.ROA, d.rasio_2025.ROA, d.rasio_2026.ROA],
          borderColor:'#10B981', backgroundColor:'rgba(16,185,129,.1)', fill:true, tension:.3, pointRadius:5 },
        { label:'ROE', data:[d.rasio_2024.ROE, d.rasio_2025.ROE, d.rasio_2026.ROE],
          borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,.1)', fill:true, tension:.3, pointRadius:5,
          borderDash:[5,3] },
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'top',labels:{font:{size:11}}},
        tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${Number(c.parsed.y).toFixed(4)}%`}} },
      scales:{ y:{ ticks:{callback:v=>v+'%'}, beginAtZero:false } }
    }
  });

  // Chart 4 — Radar: forecast vs threshold
  destroyChart('chartRadar');
  const radarData26   = keys.map(k => (d.rasio_2026[k] / d.threshold[k].beli * 100));
  const radarBeli     = keys.map(() => 100);
  charts['chartRadar'] = new Chart(document.getElementById('chartRadar'), {
    type:'radar',
    data:{
      labels: keys,
      datasets:[
        { label:'Forecast FY2026 (% dari threshold beli)', data:radarData26,
          borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,.2)', pointRadius:4 },
        { label:'Threshold Beli (100%)', data:radarBeli,
          borderColor:'#22C55E', backgroundColor:'rgba(34,197,94,.07)',
          borderDash:[5,3], pointRadius:0 },
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:'top',labels:{font:{size:11}}},
        tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${Number(c.parsed.r).toFixed(1)}%`}} },
      scales:{ r:{ min:0, max:120, ticks:{stepSize:20, callback:v=>v+'%'}, pointLabels:{font:{size:12,weight:'700'}} } }
    }
  });
}

// ── MAIN RENDER ──────────────────────────────────────────────────────
function renderAll(d) {
  renderVerdictHero(d);
  renderStatRow(d);
  renderStep1(d);
  renderStep2(d);
  renderStep3(d);
  renderStep4(d);
  renderStep5(d);
  renderKesimpulan(d);
  if (document.getElementById('tab-grafik').classList.contains('active')) renderCharts(d);
  syncAlphaControls(d.alpha);
}

function syncAlphaControls(a) {
  const av = Number(a).toFixed(2);
  document.getElementById('vhAlphaVal').textContent = av;
  document.getElementById('alphaVal2').textContent  = `α = ${av}`;
  document.getElementById('w25').textContent = `${Math.round(a*100)}%`;
  document.getElementById('w24').textContent = `${Math.round((1-a)*100)}%`;
  document.getElementById('footerAlpha').textContent = av;
  document.getElementById('alphaRange').value  = Math.round(a * 100);
  document.getElementById('alphaRange2').value = Math.round(a * 100);
}

// ── TAB NAVIGATION ───────────────────────────────────────────────────
document.querySelectorAll('.step-nav-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.step-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    const panel = document.getElementById('tab-' + this.dataset.tab);
    if (panel) {
      panel.classList.add('active');
      if (this.dataset.tab === 'grafik' && spkData) renderCharts(spkData);
    }
  });
});

// ── ALPHA SLIDERS ────────────────────────────────────────────────────
let debounce;
function onAlphaChange(val) {
  alpha = val / 100;
  syncAlphaControls(alpha);
  clearTimeout(debounce);
  debounce = setTimeout(async () => {
    const d = await fetchSPK(alpha);
    renderAll(d);
  }, 180);
}
document.getElementById('alphaRange').addEventListener('input',  e => onAlphaChange(+e.target.value));
document.getElementById('alphaRange2').addEventListener('input', e => onAlphaChange(+e.target.value));

// ── INIT ─────────────────────────────────────────────────────────────
(async () => {
  const d = await fetchSPK(0.6);
  renderAll(d);
})();
