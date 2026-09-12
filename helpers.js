// =====================================================================
// helpers.js — Alat bantu tampilan (pure UI helpers)
// Dipindahkan dari app.js tanpa perubahan logika, murni pemisahan file.
// =====================================================================

var NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
var NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
var NAMA_BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
var HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function pad2(n) { return (n < 10 ? '0' : '') + n; }
function formatTampilan(d) { return NAMA_HARI[d.getDay()] + ', ' + pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear(); }
function formatDDMMYYYY(d) { return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear(); }
function toIsoDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function dateOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// =====================================================================
// HELPER TAMPILAN (murni menyusun string HTML — tidak ada query/logika
// data di sini sama sekali). Ditambahkan supaya kartu-kartu pasien bisa
// menampilkan avatar inisial, border status, tombol berikon, dan
// progress bar stok tanpa mengubah alur data di fungsi-fungsi lain.
// =====================================================================
function warnaStatus(status) {
  var warna = { 'Tertunda': '#E23B57', 'Sudah Kemo': '#1E9C6B', 'Hari Ini': '#0E9488', 'Belum Kemo': '#7C8CA0' };
  return warna[status] || '#7C8CA0';
}

function getInisial(nama) {
  var bersih = (nama || '').trim();
  if (!bersih) return '?';
  var parts = bersih.split(/\s+/);
  var a = parts[0] ? parts[0].charAt(0) : '';
  var b = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (a + b).toUpperCase();
}

function renderAvatarInisial(nama, status) {
  var w = warnaStatus(status);
  return '<div class="avatar-inisial" style="background:' + w + '1F; color:' + w + '; border:1px solid ' + w + '40;">' +
    escapeHtml(getInisial(nama)) + '</div>';
}

// Tombol aksi kecil dengan ikon Tabler di depan teksnya. `kelas` tetap
// memakai class tombol yang sudah ada (btn-neutral/btn-accent/btn-danger/
// btn-primary/btn-secondary) supaya semua styling & shadow ikut otomatis.
function renderIkonBtn(icon, label, kelas, onclickAttr, styleTambahan) {
  return '<button type="button" onclick="' + onclickAttr + '" class="' + kelas + '"' +
    (styleTambahan ? (' style="' + styleTambahan + '"') : '') + '>' +
    '<i class="ti ' + icon + '" aria-hidden="true"></i> ' + label + '</button>';
}

// Tombol hapus bulat kecil (ikon saja), dipakai menggantikan tombol
// "Hapus Jadwal" lebar supaya sejalan dengan referensi desain.
function renderIkonBtnBulat(icon, onclickAttr, judul) {
  return '<button type="button" onclick="' + onclickAttr + '" class="btn-icon-circle" title="' + escapeHtml(judul || '') + '">' +
    '<i class="ti ' + icon + '" aria-hidden="true"></i></button>';
}

// Progress bar stok vs kebutuhan. `stok` dan `butuh` angka non-negatif.
function renderProgressBarStok(stok, butuh) {
  var b = butuh > 0 ? butuh : 0;
  var persen = b > 0 ? Math.max(0, Math.min(100, (stok / b) * 100)) : 100;
  var kurang = stok < b;
  var warna = kurang ? (persen < 40 ? 'var(--danger)' : '#F5A524') : 'var(--success)';
  return '<div class="progress-row">' +
    '<div class="progress-track"><div class="progress-fill" style="width:' + persen + '%; background:' + warna + ';"></div></div>' +
    '<div class="progress-label">' + stok + ' / ' + b + '</div>' +
    '</div>';
}

// ===== Status kemo (sama untuk farmasi & perawat) =====
function hitungStatus(tanggalDate, keterangan) {
  var ket = (keterangan || '').toString().toLowerCase();
  if (ket.indexOf('tertunda') !== -1) return 'Tertunda';
  var hariIni = dateOnly(new Date());
  var tgl = dateOnly(tanggalDate);
  if (tgl.getTime() < hariIni.getTime()) return 'Sudah Kemo';
  if (tgl.getTime() === hariIni.getTime()) return 'Hari Ini';
  return 'Belum Kemo';
}

function renderBadge(status) {
  var w = warnaStatus(status);
  return '<span class="status-badge" style="border:1px solid ' + w + '; background:' + w + '1F; color:' + w +
    '; padding:2px 9px; border-radius:10px; font-size:11px; font-weight:600; font-family:var(--font-mono); white-space:nowrap;">' +
    '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:' + w + '; margin-right:5px;"></span>' +
    status + '</span>';
}

// =====================================================================
// SKELETON LOADER — helper baru, tidak mengubah fungsi/logika yang ada.
//
// Cara pakai: setiap ID loading lama (mis. "loadingKalender") sekarang
// punya pasangan sibling div baru di HTML dengan id + "Skeleton"
// (mis. "loadingKalenderSkeleton"), lihat index.html.
//
// setLoading(id, show, skeletonTipe)
//   - setLoading(id, true)            -> perilaku SAMA seperti dulu:
//         document.getElementById(id).style.display = 'block';
//         dipakai untuk status aksi cepat (mis. "Menghapus...",
//         "Menyimpan perubahan...") yang teksnya sudah diatur terpisah
//         lewat innerText di kode lain (TIDAK disentuh sama sekali).
//   - setLoading(id, true, 'tipe')    -> menyembunyikan div teks lama,
//         menampilkan skeleton (id+"Skeleton") sesuai 'tipe', dipakai
//         untuk fetch data awal (buka tab / ganti bulan / ganti pasien).
//   - setLoading(id, false)           -> menyembunyikan KEDUANYA
//         (div teks lama & skeleton, kalau skeleton-nya ada).
// =====================================================================

// ---- Generator bentuk 1: LIST (avatar + garis) ----
function skeletonBarisList(jumlah) {
  var n = jumlah || 5;
  var html = '<div class="skel-list">';
  for (var i = 0; i < n; i++) {
    html += '<div class="skel-row">' +
      '<div class="skel-avatar skeleton-shimmer"></div>' +
      '<div class="skel-row-lines">' +
        '<div class="skel-line skeleton-shimmer" style="width:' + (55 + (i % 3) * 10) + '%;"></div>' +
        '<div class="skel-line skel-line-sm skeleton-shimmer" style="width:' + (30 + (i % 4) * 8) + '%;"></div>' +
      '</div></div>';
  }
  html += '</div>';
  return html;
}

// ---- Generator bentuk 2: KALENDER (grid bulan) ----
function skeletonKalender() {
  var html = '<div class="skel-cal-grid">';
  for (var i = 0; i < 35; i++) html += '<div class="skel-cal-cell skeleton-shimmer"></div>';
  html += '</div>';
  return html;
}

// ---- Generator bentuk 3: RIWAYAT (kartu timeline) ----
function skeletonRiwayat(jumlah) {
  var n = jumlah || 3;
  var html = '<div class="skel-list">';
  for (var i = 0; i < n; i++) {
    html += '<div class="skel-card">' +
      '<div class="skel-line skeleton-shimmer" style="width:35%; height:12px; margin-bottom:10px;"></div>' +
      '<div class="skel-line skeleton-shimmer" style="width:70%; margin-bottom:6px;"></div>' +
      '<div class="skel-line skel-line-sm skeleton-shimmer" style="width:50%;"></div>' +
    '</div>';
  }
  html += '</div>';
  return html;
}

// ---- Generator bentuk 4: KARTU (border kiri + avatar + tombol) ----
function skeletonKartu(jumlah) {
  var n = jumlah || 2;
  var html = '<div class="skel-list">';
  for (var i = 0; i < n; i++) {
    html += '<div class="skel-card skel-card-border">' +
      '<div class="skel-row" style="border:none; padding:0; margin-bottom:10px;">' +
        '<div class="skel-avatar skeleton-shimmer"></div>' +
        '<div class="skel-row-lines">' +
          '<div class="skel-line skeleton-shimmer" style="width:60%;"></div>' +
          '<div class="skel-line skel-line-sm skeleton-shimmer" style="width:40%;"></div>' +
        '</div></div>' +
      '<div class="skel-line skeleton-shimmer" style="width:90%; margin-bottom:12px;"></div>' +
      '<div class="skel-btn-row">' +
        '<div class="skel-btn skeleton-shimmer"></div>' +
        '<div class="skel-btn skeleton-shimmer"></div>' +
      '</div></div>';
  }
  html += '</div>';
  return html;
}

// ---- Generator bentuk 5: TABEL (nama obat + progress bar) ----
function skeletonTabel(jumlah) {
  var n = jumlah || 4;
  var html = '<div class="skel-list">';
  for (var i = 0; i < n; i++) {
    html += '<div class="skel-tabel-row">' +
      '<div class="skel-line skeleton-shimmer"></div>' +
      '<div class="skel-progress skeleton-shimmer"></div>' +
    '</div>';
  }
  html += '</div>';
  return html;
}

// ---- Generator bentuk 6: DASHBOARD (kotak statistik + kartu) ----
function skeletonDashboard() {
  var html = '<div class="skel-dash-stats">';
  for (var i = 0; i < 3; i++) html += '<div class="skel-dash-stat skeleton-shimmer"></div>';
  html += '</div>';
  html += '<div class="skel-card" style="margin-top:12px;">' +
    '<div class="skel-line skeleton-shimmer" style="width:45%; margin-bottom:10px;"></div>' +
    '<div class="skel-line skel-line-sm skeleton-shimmer" style="width:80%;"></div>' +
  '</div>';
  return html;
}

// ---- Generator bentuk 7: GRAFIK (batang chart) ----
function skeletonGrafik() {
  var tinggi = [40, 65, 50, 80, 55, 70, 45, 60];
  var html = '<div class="skel-grafik">';
  tinggi.forEach(function (h) {
    html += '<div class="skel-bar skeleton-shimmer" style="height:' + h + '%;"></div>';
  });
  html += '</div>';
  return html;
}

// Peta nama tipe -> generator, dipakai internal oleh setLoading()
var SKELETON_GENERATORS = {
  'list': function () { return skeletonBarisList(5); },
  'kalender': skeletonKalender,
  'riwayat': function () { return skeletonRiwayat(3); },
  'kartu': function () { return skeletonKartu(2); },
  'tabel': function () { return skeletonTabel(4); },
  'dashboard': skeletonDashboard,
  'grafik': skeletonGrafik
};

function setLoading(id, show, skeletonTipe) {
  var el = document.getElementById(id);
  var skelEl = document.getElementById(id + 'Skeleton');

  if (show && skeletonTipe) {
    // Mode skeleton: sembunyikan div teks lama, tampilkan skeleton.
    if (el) el.style.display = 'none';
    if (skelEl) {
      var generator = SKELETON_GENERATORS[skeletonTipe];
      skelEl.innerHTML = generator ? generator() : '';
      skelEl.style.display = 'block';
    }
    return;
  }

  if (show) {
    // Mode teks biasa (aksi cepat: hapus/simpan/tandai) — sama seperti
    // perilaku asli sebelum ada skeleton.
    if (el) el.style.display = 'block';
    if (skelEl) skelEl.style.display = 'none';
    return;
  }

  // show === false -> sembunyikan keduanya
  if (el) el.style.display = 'none';
  if (skelEl) skelEl.style.display = 'none';
}
