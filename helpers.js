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
