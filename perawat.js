// =====================================================================
// Jadwal Kemoterapi — logika aplikasi (Supabase)
// Versi dengan ROLE (depo / perawat / admin) + modul PERAWAT terpisah.
// Data farmasi (patients/schedules/...) dan data perawat
// (nurse_patients/nurse_schedules) disimpan di tabel yang BERBEDA dan
// diproteksi RLS berbasis role (lihat migrasi_role_dan_perawat.sql).
//
// PERUBAHAN PADA VERSI INI:
// - Tab "Riwayat Pasien" perawat sekarang tampil sebagai "List Pasien
//   Kemoterapi" di sidebar (lihat index.html). ID/fungsi JS tidak
//   diubah supaya tidak perlu migrasi apa pun.
// - Form "Daftarkan Pasien" perawat sekarang mendukung multi-siklus:
//   isi "Siklus Awal", "Sampai Siklus", dan "Interval (hari)" untuk
//   otomatis membuat beberapa baris nurse_schedules sekaligus,
//   masing-masing berjarak `interval` hari — langsung muncul di
//   kalender perawat.
// - Tab "Cari Obat" (farmasi) diubah total: begitu tab dibuka langsung
//   tampil daftar semua nama obat + stok saat ini (bisa di-filter
//   dengan mengetik). Klik salah satu obat untuk melihat detail:
//   jadwal pemakaian TERDEKAT (diurutkan dari yang paling dekat
//   dengan hari ini, bukan sekadar "paling baru diinput") beserta
//   total kebutuhannya, lalu riwayat pemakaian yang sudah lewat.
//
// PERUBAHAN TAMPILAN (markup-only, tidak ada logika/query yang berubah):
// - Ditambahkan beberapa fungsi HELPER TAMPILAN di dekat escapeHtml():
//   getInisial(), warnaStatus(), renderAvatarInisial(), renderIkonBtn(),
//   renderProgressBarStok(). Semua murni menyusun string HTML.
// - renderBadge() sekarang memakai warnaStatus() (perilaku sama persis).
// - Kartu pasien (renderJadwalTanggal, renderTertunda,
//   renderJadwalTanggalPerawat) sekarang pakai avatar inisial + border
//   kiri berwarna status + tombol berikon. onclick, nama fungsi, dan
//   parameter SEMUA tetap sama persis dengan sebelumnya.
// - Bagian "Stok Obat Kritis" di dashboard dan "Kebutuhan Obat vs Stok"
//   di tab Kebutuhan Obat sekarang pakai progress bar, bukan teks polos.
// =====================================================================

// NAMA_HARI, NAMA_BULAN, NAMA_BULAN_SINGKAT, HARI_SINGKAT -> dipindah ke helpers.js


// ---- state farmasi, data loading, daftar nama obat, simpanBeberapaSiklusJadwal,
// dan TAB 1-7 (Kalender/Kebutuhan Obat/Daftar Pasien/Tertunda/Dashboard/
// Cari Obat/Daftarkan Pasien) -> dipindah ke farmasi.js (Sesi 4)

// ---- state (PERAWAT) — terpisah total dari state farmasi di atas ----
var currentUserRole = null;
var currentUserId = null;
var nurseTanggalAktif = new Date();
var nurseBulanKalenderAktif = new Date();
var nurseKalHariDataTerakhir = {};
var nursePasienListTerakhirTanggal = [];
var nursePatientListDimuat = false;
var nurseAllPatientNames = [];
var nurseRiwayatPasienAktif = null;
var nursePasienListTerakhirRiwayat = [];
var nursePasienAktifData = null; // {id, nama, no_rm, diagnosa, dpjp} milik pasien yang sedang dibuka
var nurseAllSchedulesCache = null;

// pad2, formatTampilan, formatDDMMYYYY, toIsoDate, dateOnly, escapeHtml,
// warnaStatus, getInisial, renderAvatarInisial, renderIkonBtn,
// renderIkonBtnBulat, renderProgressBarStok, hitungStatus, renderBadge
// -> semua dipindah ke helpers.js (murni pindah lokasi, isi tidak diubah)

// AUTH, ROLE->MENU (LOGIN_ID_MAP, handleLogin, handleLogout, TAB_ROLES,
// applyRoleUI, showApp), switchTab, capitalize, getSession check, dan
// listener #loginPassword -> semua dipindah ke auth.js

// =====================================================================
// Simpan beberapa siklus jadwal RAWAT INAP PERAWAT sekaligus
// (nurse_schedules) — dipakai oleh tab "Daftarkan Pasien" perawat dan
// form Tambah Jadwal Baru di "List Pasien Kemoterapi" perawat.
// Setiap siklus dibuat sebagai satu baris nurse_schedules dengan
// tanggal_mulai berjarak `interval` hari dari siklus sebelumnya, dan
// otomatis muncul di kalender perawat sesuai lama_hari-nya masing-masing.
// =====================================================================
function simpanBeberapaSiklusJadwalPerawat(patientId, tanggalMulaiObj, siklusAwal, siklusAkhir, interval, lamaHari) {
  var siklusAwalNum = parseInt(siklusAwal, 10);
  var siklusAkhirNum = parseInt(siklusAkhir, 10);
  var totalSiklus = (!isNaN(siklusAwalNum) && !isNaN(siklusAkhirNum)) ? (siklusAkhirNum - siklusAwalNum + 1) : 1;
  if (totalSiklus < 1) totalSiklus = 1;

  // Perawat ruangan (perawat_ruangan): input masuk sebagai "menunggu_verifikasi"
  // dan belum tampil di kalender sampai diverifikasi oleh perawat_kemo/perawat/admin.
  // Role lain (perawat/perawat_kemo/admin) tetap otomatis "terverifikasi" seperti biasa.
  var statusAwal = (currentUserRole === 'perawat_ruangan') ? 'menunggu_verifikasi' : 'terverifikasi';

  var scheduleInserts = [];
  for (var c = 0; c < totalSiklus; c++) {
    var tglSiklus = new Date(tanggalMulaiObj.getTime() + c * (interval || 0) * 86400000);
    var siklusLabel = isNaN(siklusAwalNum) ? siklusAwal : String(siklusAwalNum + c);
    scheduleInserts.push({
      patient_id: patientId,
      tanggal_mulai: toIsoDate(tglSiklus),
      siklus: siklusLabel,
      lama_hari: lamaHari || 1,
      status_verifikasi: statusAwal,
      diinput_oleh: currentUserId,
      diinput_oleh_role: currentUserRole
    });
  }

  return sb.from('nurse_schedules').insert(scheduleInserts).then(function (res) {
    if (res.error) throw res.error;
    return scheduleInserts.length;
  });
}

// =====================================================================
// =====================================================================
// MODUL PERAWAT — data terpisah total dari farmasi (nurse_patients /
// nurse_schedules). Satu baris nurse_schedules = satu siklus rawat inap,
// ditampilkan di kalender sebagai beberapa hari (H1, H2, ... Hn) sesuai
// lama_hari.
// =====================================================================
// =====================================================================

// Status verifikasi (lihat migrasi_verifikasi_ruangan.sql) override status
// tampilan biasa (hitungStatus) selama jadwal itu belum/tidak terverifikasi.
// Kalau kolomnya belum ada di database (migrasi belum dijalankan), Supabase
// hanya tidak mengembalikan field tsb, jadi statusVerifikasi bernilai
// undefined dan fungsi ini otomatis jatuh ke perilaku lama (hitungStatus biasa).
function statusTampilanPerawat(dateObj, keterangan, statusVerifikasi) {
  if (statusVerifikasi === 'menunggu_verifikasi') return 'Menunggu Verifikasi';
  if (statusVerifikasi === 'ditolak') return 'Ditolak';
  return hitungStatus(dateObj, keterangan);
}

function loadAllNurseSchedules(forceReload) {
  if (nurseAllSchedulesCache && !forceReload) return Promise.resolve(nurseAllSchedulesCache);

  return sb.from('nurse_schedules')
    .select('id, patient_id, tanggal_mulai, siklus, lama_hari, keterangan, status_verifikasi, diinput_oleh, diinput_oleh_role, diverifikasi_oleh, diverifikasi_at, catatan_verifikasi, nurse_patients(nama, no_rm, diagnosa, dpjp)')
    .then(function (res) {
      if (res.error) throw res.error;
      var list = (res.data || []).map(function (row) {
        var parts = row.tanggal_mulai.split('-');
        var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return {
          id: row.id,
          patient_id: row.patient_id,
          nama: row.nurse_patients ? row.nurse_patients.nama : '(tanpa nama)',
          noRm: row.nurse_patients ? (row.nurse_patients.no_rm || '') : '',
          diagnosa: row.nurse_patients ? (row.nurse_patients.diagnosa || '') : '',
          dpjp: row.nurse_patients ? (row.nurse_patients.dpjp || '') : '',
          dateObjMulai: d,
          tanggalMulai: formatDDMMYYYY(d),
          siklus: row.siklus || '',
          lamaHari: row.lama_hari || 1,
          keterangan: row.keterangan || '',
          // Default 'terverifikasi' kalau kolomnya belum ada/kosong (baris
          // lama sebelum migrasi verifikasi dijalankan) supaya tetap tampil
          // di kalender seperti perilaku sebelumnya.
          statusVerifikasi: row.status_verifikasi || 'terverifikasi',
          diinputOleh: row.diinput_oleh || null,
          diinputOlehRole: row.diinput_oleh_role || '',
          diverifikasiOleh: row.diverifikasi_oleh || null,
          diverifikasiAt: row.diverifikasi_at || null,
          catatanVerifikasi: row.catatan_verifikasi || ''
        };
      });
      nurseAllSchedulesCache = list;
      return list;
    });
}

function invalidateNurseCacheAndReload() {
  nurseAllSchedulesCache = null;
  nursePatientListDimuat = false;
}

// ---------------------------------------------------------------------
// TAB PERAWAT 1: KALENDER
// ---------------------------------------------------------------------
function kalPerawatKeHariIni() {
  nurseTanggalAktif = new Date();
  nurseBulanKalenderAktif = new Date();
  document.getElementById('kalPerawatTanggalJump').value = toIsoDate(nurseTanggalAktif);
  muatKalenderPerawat();
  muatDetailTanggalPerawat();
}
var elKalPerawatJump = document.getElementById('kalPerawatTanggalJump');
if (elKalPerawatJump) {
  elKalPerawatJump.addEventListener('change', function () {
    var iso = this.value;
    if (!iso) return;
    var parts = iso.split('-');
    nurseTanggalAktif = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    nurseBulanKalenderAktif = new Date(nurseTanggalAktif.getFullYear(), nurseTanggalAktif.getMonth(), 1);
    muatKalenderPerawat();
    muatDetailTanggalPerawat();
  });
}

function gantiBulanKalenderPerawat(delta) {
  nurseBulanKalenderAktif.setMonth(nurseBulanKalenderAktif.getMonth() + delta);
  muatKalenderPerawat();
}

function muatKalenderPerawat() {
  var tahun = nurseBulanKalenderAktif.getFullYear();
  var bulan = nurseBulanKalenderAktif.getMonth() + 1;
  document.getElementById('kalPerawatBulanLabel').innerText = NAMA_BULAN[bulan - 1] + ' ' + tahun;
  setLoading('loadingKalenderPerawat', true, 'kalender');

  loadAllNurseSchedules().then(function (list) {
    setLoading('loadingKalenderPerawat', false);
    var hariData = {};
    list.forEach(function (s) {
      // Jadwal yang masih menunggu verifikasi (atau ditolak) belum boleh
      // tampil di kalender perawat — lihat migrasi_verifikasi_ruangan.sql.
      if (s.statusVerifikasi !== 'terverifikasi') return;
      for (var h = 0; h < s.lamaHari; h++) {
        var tglSel = new Date(s.dateObjMulai.getTime() + h * 86400000);
        if (tglSel.getFullYear() !== tahun || (tglSel.getMonth() + 1) !== bulan) continue;
        var hari = tglSel.getDate();
        if (!hariData[hari]) hariData[hari] = { entriMap: {} };
        var teks = s.nama + (s.siklus ? (' — Siklus ' + s.siklus) : '') + ' (H' + (h + 1) + ')';
        var isTertunda = s.keterangan.toLowerCase().indexOf('tertunda') !== -1;
        hariData[hari].entriMap[teks] = (hariData[hari].entriMap[teks] || false) || isTertunda;
      }
    });
    var hasil = {};
    Object.keys(hariData).forEach(function (h) {
      var teksList = Object.keys(hariData[h].entriMap).sort();
      hasil[h] = { daftarPasien: teksList.map(function (teks) { return { teks: teks, tertunda: hariData[h].entriMap[teks] }; }) };
    });
    nurseKalHariDataTerakhir = hasil;
    renderKalenderPerawatGrid(tahun, bulan, hasil);
  }).catch(function (err) {
    document.getElementById('loadingKalenderPerawat').innerText = 'Gagal memuat: ' + err.message;
  });
}

function renderKalenderPerawatGrid(tahun, bulan, hariData) {
  document.getElementById('kalPerawatHariLabelRow').innerHTML = HARI_SINGKAT.map(function (h) { return '<div class="kal-hari-label">' + h + '</div>'; }).join('');

  var jumlahHari = new Date(tahun, bulan, 0).getDate();
  var hariPertama = new Date(tahun, bulan - 1, 1).getDay();
  var hariIni = new Date();
  var isBulanIni = (hariIni.getFullYear() === tahun && (hariIni.getMonth() + 1) === bulan);
  var isBulanTerpilih = (nurseTanggalAktif.getFullYear() === tahun && (nurseTanggalAktif.getMonth() + 1) === bulan);

  var html = '';
  for (var i = 0; i < hariPertama; i++) html += '<div class="kal-cell kosong"></div>';
  for (var tgl = 1; tgl <= jumlahHari; tgl++) {
    var info = hariData[tgl];
    var kelas = 'kal-cell';
    if (info) kelas += ' ada-jadwal';
    if (isBulanIni && hariIni.getDate() === tgl) kelas += ' hari-ini';
    if (isBulanTerpilih && nurseTanggalAktif.getDate() === tgl) kelas += ' terpilih';

    html += '<div class="' + kelas + '" onclick="pilihTanggalKalenderPerawat(' + tgl + ')"><div class="kal-tgl-num">' + tgl + '</div>';
    if (info) info.daftarPasien.forEach(function (entri) {
      html += '<div class="kal-entri">' + escapeHtml(entri.teks) + (entri.tertunda ? '<span class="kal-entri-titik-tertunda"></span>' : '') + '</div>';
    });
    html += '</div>';
  }
  document.getElementById('kalPerawatGrid').innerHTML = html;
}

function pilihTanggalKalenderPerawat(tgl) {
  nurseTanggalAktif = new Date(nurseBulanKalenderAktif.getFullYear(), nurseBulanKalenderAktif.getMonth(), tgl);
  renderKalenderPerawatGrid(nurseBulanKalenderAktif.getFullYear(), nurseBulanKalenderAktif.getMonth() + 1, nurseKalHariDataTerakhir);
  muatDetailTanggalPerawat();
}

function muatDetailTanggalPerawat() {
  document.getElementById('kalPerawatTanggalJump').value = toIsoDate(nurseTanggalAktif);
  document.getElementById('kalPerawatDetailLabel').innerText = formatTampilan(nurseTanggalAktif);
  setLoading('loadingKalPerawatDetail', true, 'list');
  document.getElementById('loadingKalPerawatDetail').innerText = 'Memuat jadwal...';
  document.getElementById('kalPerawatDetailContainer').innerHTML = '';

  loadAllNurseSchedules().then(function (list) {
    setLoading('loadingKalPerawatDetail', false);
    var target = dateOnly(nurseTanggalAktif).getTime();
    var matches = [];
    list.forEach(function (s) {
      // Sama seperti kalender: jadwal menunggu verifikasi/ditolak belum
      // muncul di detail tanggal.
      if (s.statusVerifikasi !== 'terverifikasi') return;
      for (var h = 0; h < s.lamaHari; h++) {
        var tglSel = dateOnly(new Date(s.dateObjMulai.getTime() + h * 86400000));
        if (tglSel.getTime() === target) {
          matches.push({
            id: s.id, patient_id: s.patient_id, nama: s.nama, noRm: s.noRm, diagnosa: s.diagnosa, dpjp: s.dpjp,
            siklus: s.siklus, hariKe: h + 1, lamaHari: s.lamaHari,
            dateObjMulai: s.dateObjMulai, keterangan: s.keterangan,
            status: hitungStatus(tglSel, s.keterangan)
          });
        }
      }
    });
    renderJadwalTanggalPerawat(matches);
  }).catch(function (err) {
    document.getElementById('loadingKalPerawatDetail').innerText = 'Gagal memuat: ' + err.message;
  });
}

function renderJadwalTanggalPerawat(matches) {
  nursePasienListTerakhirTanggal = matches;

  if (!matches || matches.length === 0) {
    document.getElementById('kalPerawatDetailContainer').innerHTML = '<div class="empty"><i class="ti ti-folder" aria-hidden="true"></i>Tidak ada jadwal kemoterapi pada tanggal ini.</div>';
    return;
  }

  var html = '<div class="ringkasan-jumlah">' + matches.length + ' pasien terjadwal</div>';
  matches.forEach(function (p, i) {
    var warnaBorder = warnaStatus(p.status);
    html += '<div class="card" style="border-left:4px solid ' + warnaBorder + ';">';
    html += '<div class="nama-row">' + renderAvatarInisial(p.nama, p.status) +
      '<div class="nama-info"><div class="nama">' + escapeHtml(p.nama) + '</div>' +
      '<div class="sub-info">' +
      (p.noRm ? ('RM ' + escapeHtml(p.noRm) + ' &middot; ') : '') +
      (p.diagnosa ? (escapeHtml(p.diagnosa) + ' &middot; ') : '') +
      (p.dpjp ? ('DPJP: ' + escapeHtml(p.dpjp)) : '') +
      '</div></div>' + renderBadge(p.status) + '</div>';
    html += '<div class="obat-item"><span>Siklus ' + escapeHtml(p.siklus || '-') + '</span><span class="obat-jumlah">H' + p.hariKe + ' dari ' + p.lamaHari + '</span></div>';

    html += '<div style="display:flex; gap:6px; margin-top:8px; align-items:stretch;">';
    if (p.status === 'Tertunda') {
      html += renderIkonBtn('ti-rotate', 'Batalkan', 'btn-neutral', 'toggleTertundaPerawat(' + i + ', false)', 'flex:1;');
    } else {
      html += renderIkonBtn('ti-clock-pause', 'Tandai Tertunda', 'btn-danger', 'toggleTertundaPerawat(' + i + ', true)', 'flex:1;');
    }
    html += renderIkonBtn('ti-pencil', 'Ubah', 'btn-accent', 'toggleUbahTanggalPerawat(' + i + ')', 'flex:1;');
    html += renderIkonBtnBulat('ti-trash', 'hapusJadwalPerawatDariKalender(' + i + ')', 'Hapus Jadwal');
    html += '</div>';

    html += '<div id="ubahTanggalPerawat' + i + '" style="display:none; margin-top:8px; background:var(--surface-2); border-radius:8px; padding:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Tanggal Mulai Baru</label>';
    html += '<input type="date" id="tanggalBaruPerawat' + i + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Lama Hari</label>';
    html += '<input type="number" id="lamaHariBaruPerawat' + i + '" min="1" value="' + p.lamaHari + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<label style="display:flex; align-items:center; gap:6px; font-size:11px; margin-bottom:8px;">';
    html += '<input type="checkbox" id="geserBerikutnyaPerawat' + i + '" checked style="width:auto; margin:0;"> Geser juga jadwal berikutnya (selisih hari sama, sesuai interval)';
    html += '</label>';
    html += '<button type="button" onclick="simpanUbahJadwalPerawat(' + i + ')" style="width:100%; background:var(--success); color:#fff; border:none; border-radius:16px; padding:8px; font-size:12px; font-weight:600;">Simpan</button>';
    html += '</div>';
    html += '</div>';
  });

  document.getElementById('kalPerawatDetailContainer').innerHTML = html;
}

function toggleTertundaPerawat(i, jadiTertunda) {
  var p = nursePasienListTerakhirTanggal[i];
  if (!p) return;
  setLoading('loadingKalPerawatDetail', true);
  document.getElementById('loadingKalPerawatDetail').innerText = jadiTertunda ? 'Menandai...' : 'Membatalkan tanda...';

  var ketLama = p.keterangan || '';
  var ketBaru;
  if (jadiTertunda) {
    ketBaru = ketLama.toLowerCase().indexOf('tertunda') !== -1 ? ketLama : (ketLama ? ('Tertunda; ' + ketLama) : 'Tertunda');
  } else {
    ketBaru = ketLama.replace(/tertunda\s*;?\s*/gi, '').replace(/;\s*$/, '').trim();
  }

  sb.from('nurse_schedules').update({ keterangan: ketBaru }).eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateNurseCacheAndReload();
    muatDetailTanggalPerawat();
  }).catch(function (err) {
    setLoading('loadingKalPerawatDetail', false);
    alert('Gagal: ' + err.message);
  });
}

function toggleUbahTanggalPerawat(i) {
  var el = document.getElementById('ubahTanggalPerawat' + i);
  el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}

function simpanUbahJadwalPerawat(i) {
  var p = nursePasienListTerakhirTanggal[i];
  if (!p) return;
  var iso = document.getElementById('tanggalBaruPerawat' + i).value;
  var lamaHariBaru = parseInt(document.getElementById('lamaHariBaruPerawat' + i).value, 10);
  if (!iso) { alert('Pilih tanggal mulai baru terlebih dahulu.'); return; }
  if (!lamaHariBaru || lamaHariBaru < 1) { alert('Lama hari minimal 1.'); return; }
  var geser = document.getElementById('geserBerikutnyaPerawat' + i).checked;

  setLoading('loadingKalPerawatDetail', true);
  document.getElementById('loadingKalPerawatDetail').innerText = 'Menyimpan perubahan...';

  var tanggalLamaObj = dateOnly(p.dateObjMulai);
  var parts = iso.split('-');
  var tanggalBaruObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  var deltaDays = Math.round((tanggalBaruObj.getTime() - tanggalLamaObj.getTime()) / 86400000);

  loadAllNurseSchedules().then(function (list) {
    var updates = [sb.from('nurse_schedules').update({ tanggal_mulai: iso, lama_hari: lamaHariBaru }).eq('id', p.id)];
    if (geser && deltaDays !== 0) {
      list.forEach(function (s) {
        if (s.id === p.id) return;
        if (s.patient_id !== p.patient_id) return;
        if (dateOnly(s.dateObjMulai).getTime() > tanggalLamaObj.getTime()) {
          var geseredDate = new Date(s.dateObjMulai.getTime() + deltaDays * 86400000);
          updates.push(sb.from('nurse_schedules').update({ tanggal_mulai: toIsoDate(geseredDate) }).eq('id', s.id));
        }
      });
    }
    return Promise.all(updates);
  }).then(function (results) {
    var failed = results.find(function (r) { return r.error; });
    if (failed) throw failed.error;
    invalidateNurseCacheAndReload();
    muatDetailTanggalPerawat();
  }).catch(function (err) {
    setLoading('loadingKalPerawatDetail', false);
    alert('Gagal: ' + err.message);
  });
}

function hapusJadwalPerawatDariKalender(i) {
  var p = nursePasienListTerakhirTanggal[i];
  if (!p) return;
  var konfirmasi = window.confirm('Yakin mau menghapus jadwal ' + p.nama + ' (Siklus ' + p.siklus + ')?\n\nSeluruh rentang hari (H1-H' + p.lamaHari + ') untuk siklus ini akan terhapus. Tindakan ini tidak bisa dibatalkan.');
  if (!konfirmasi) return;

  setLoading('loadingKalPerawatDetail', true);
  document.getElementById('loadingKalPerawatDetail').innerText = 'Menghapus...';

  sb.from('nurse_schedules').delete().eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateNurseCacheAndReload();
    muatDetailTanggalPerawat();
  }).catch(function (err) {
    setLoading('loadingKalPerawatDetail', false);
    alert('Gagal: ' + err.message);
  });
}

// ---------------------------------------------------------------------
// TAB PERAWAT 2: LIST PASIEN KEMOTERAPI
// (dulu bernama "Riwayat Pasien" — ID/fungsi JS tidak diubah, hanya
// label yang tampil ke user diganti di index.html)
// ---------------------------------------------------------------------
// Memuat List Pasien Kemoterapi (perawat).
// - Diurutkan abjad dari query ('nama'), langsung tampil begitu tab dibuka
//   (tidak perlu diketik/dicari dulu).
// - Hanya menampilkan pasien yang MASIH punya minimal 1 baris nurse_schedules
//   (pasien yang seluruh jadwalnya sudah dihapus tidak ikut muncul).
// - Menyimpan no_rm supaya bisa ikut dicari lewat kotak pencarian.
function muatDaftarPasienPerawat() {
  setLoading('loadingRiwayatPerawatList', true, 'list');
  Promise.all([
    sb.from('nurse_patients').select('id, nama, no_rm').order('nama'),
    loadAllNurseSchedules()
  ]).then(function (results) {
    var patientsRes = results[0];
    var schedules = results[1];
    setLoading('loadingRiwayatPerawatList', false);
    if (patientsRes.error) {
      document.getElementById('daftarPasienRiwayatPerawat').innerHTML = 'Gagal memuat: ' + escapeHtml(patientsRes.error.message);
      return;
    }
    nursePatientListDimuat = true;

    var idPasienBerjadwal = {};
    schedules.forEach(function (s) { idPasienBerjadwal[s.patient_id] = true; });

    nurseAllPatientNames = (patientsRes.data || [])
      .filter(function (row) { return idPasienBerjadwal[row.id]; }) // buang pasien tanpa jadwal aktif
      .map(function (row) { return { id: row.id, nama: row.nama, noRm: row.no_rm || '' }; });

    renderDaftarPasienRiwayatPerawat(document.getElementById('riwayatPerawatSearchInput').value);
  }).catch(function (err) {
    setLoading('loadingRiwayatPerawatList', false);
    document.getElementById('daftarPasienRiwayatPerawat').innerHTML = 'Gagal memuat: ' + escapeHtml(err.message);
  });
}

function renderDaftarPasienRiwayatPerawat(filter) {
  var container = document.getElementById('daftarPasienRiwayatPerawat');
  if (!container) return;
  var f = (filter || '').trim().toLowerCase();
  // Cocokkan berdasarkan nama ATAU No. RM
  var filtered = nurseAllPatientNames.filter(function (p) {
    return p.nama.toLowerCase().indexOf(f) !== -1 || (p.noRm || '').toLowerCase().indexOf(f) !== -1;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty"><i class="ti ti-folder" aria-hidden="true"></i>Tidak ada pasien yang cocok.</div>';
    return;
  }

  var html = '<div class="pasien-card-list">';
  filtered.forEach(function (p, idx) {
    html += '<div class="card card-pasien-row" data-idx="' + idx + '">' + renderAvatarInisial(p.nama, 'Belum Kemo') +
      '<div class="nama-info"><div class="nama" style="margin-bottom:0;">' + escapeHtml(p.nama) + '</div>' +
      (p.noRm ? ('<div class="sub-info">RM ' + escapeHtml(p.noRm) + '</div>') : '') + '</div>' +
      '<i class="ti ti-chevron-right" aria-hidden="true" style="color:var(--muted); font-size:18px; flex-shrink:0;"></i></div>';
  });
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.card-pasien-row').forEach(function (el) {
    el.addEventListener('click', function () {
      var idx = parseInt(this.getAttribute('data-idx'), 10);
      pilihPasienRiwayatPerawat(filtered[idx].nama);
    });
  });
}

var elRiwayatPerawatSearch = document.getElementById('riwayatPerawatSearchInput');
if (elRiwayatPerawatSearch) {
  elRiwayatPerawatSearch.addEventListener('input', function () {
    renderDaftarPasienRiwayatPerawat(this.value);
  });
}

function pilihPasienRiwayatPerawat(nama) {
  nurseRiwayatPasienAktif = nama;
  document.getElementById('riwayatPerawatListWrap').style.display = 'none';
  document.getElementById('riwayatPerawatDetailWrap').style.display = 'block';
  document.getElementById('riwayatPerawatDetailNama').textContent = nama;
  muatRiwayatPasienDetailPerawat(nama);
}

function kembaliKeDaftarPasienPerawat() {
  nurseRiwayatPasienAktif = null;
  document.getElementById('riwayatPerawatDetailWrap').style.display = 'none';
  document.getElementById('riwayatPerawatListWrap').style.display = 'block';
  // Kalau data sudah invalid (misal baru saja hapus jadwal terakhir pasien),
  // muat ulang supaya pasien yang sudah tidak ada jadwalnya langsung hilang dari list.
  if (!nursePatientListDimuat) {
    muatDaftarPasienPerawat();
  } else {
    renderDaftarPasienRiwayatPerawat(document.getElementById('riwayatPerawatSearchInput').value);
  }
}

function muatRiwayatPasienDetailPerawat(nama) {
  document.getElementById('contentRiwayatPerawat').innerHTML = '';
  document.getElementById('ringkasanRiwayatPerawat').innerHTML = '';
  document.getElementById('editDataPasienRiwayatPerawat').innerHTML = '';
  setLoading('loadingRiwayatPerawat', true, 'riwayat');
  document.getElementById('loadingRiwayatPerawat').innerText = 'Memuat riwayat...';

  Promise.all([
    loadAllNurseSchedules(),
    sb.from('nurse_patients').select('id, nama, no_rm, diagnosa, dpjp').ilike('nama', nama).maybeSingle()
  ]).then(function (results) {
    var list = results[0];
    var patientRes = results[1];
    setLoading('loadingRiwayatPerawat', false);

    nursePasienAktifData = patientRes.data || null;
    renderEditDataPasienPerawat(nursePasienAktifData);

    var mine = list.filter(function (s) { return s.nama.toLowerCase() === nama.toLowerCase(); });
    mine.sort(function (a, b) { return a.dateObjMulai.getTime() - b.dateObjMulai.getTime(); });

    nursePasienListTerakhirRiwayat = mine.map(function (s) {
      return {
        id: s.id, patient_id: s.patient_id, tanggalMulai: s.tanggalMulai, dateObjMulai: s.dateObjMulai,
        siklus: s.siklus, lamaHari: s.lamaHari, keterangan: s.keterangan,
        noRm: s.noRm, diagnosa: s.diagnosa, dpjp: s.dpjp,
        statusVerifikasi: s.statusVerifikasi, catatanVerifikasi: s.catatanVerifikasi,
        status: statusTampilanPerawat(s.dateObjMulai, s.keterangan, s.statusVerifikasi)
      };
    });

    renderRiwayatPerawat(nama, nursePasienListTerakhirRiwayat);
    siapkanFormTambahRiwayatPerawat(nama, mine);
  }).catch(function (err) {
    document.getElementById('loadingRiwayatPerawat').innerText = 'Gagal memuat: ' + err.message;
  });
}

// ---------------------------------------------------------------------
// Form edit DATA PASIEN (nama, No. RM, Diagnosa, DPJP) — tampil di atas
// riwayat, bisa diedit langsung tanpa lewat form "Daftarkan Pasien".
// ---------------------------------------------------------------------
function renderEditDataPasienPerawat(data) {
  var container = document.getElementById('editDataPasienRiwayatPerawat');
  if (!container) return;
  if (!data) { container.innerHTML = ''; return; }

  var html = '<div class="card" id="editDataPasienForm" style="display:none;">';
  html += '<div class="nama" style="font-size:14px; margin-bottom:8px;">Edit Data Pasien</div>';
  html += '<label class="field-label">Nama</label>';
  html += '<input type="text" id="editPasienNama" value="' + escapeHtml(data.nama || '') + '">';
  html += '<div class="form-row-2"><div><label class="field-label">No. RM</label>' +
    '<input type="text" id="editPasienNoRm" value="' + escapeHtml(data.no_rm || '') + '"></div>' +
    '<div><label class="field-label">DPJP</label>' +
    '<input type="text" id="editPasienDpjp" value="' + escapeHtml(data.dpjp || '') + '"></div></div>';
  html += '<label class="field-label">Diagnosa</label>';
  html += '<input type="text" id="editPasienDiagnosa" value="' + escapeHtml(data.diagnosa || '') + '">';
  html += '<div id="editDataPasienStatus" class="status-msg"></div>';
  html += '<button type="button" class="btn-primary" onclick="simpanEditDataPasienPerawat()">Simpan Data Pasien</button>';
  html += '</div>';

  container.innerHTML = renderIkonBtn('ti-pencil', 'Edit Data Pasien', 'btn-accent', 'toggleEditDataPasienPerawat()', 'margin-bottom:10px;') + html;
}

function toggleEditDataPasienPerawat() {
  var el = document.getElementById('editDataPasienForm');
  if (!el) return;
  el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}

function simpanEditDataPasienPerawat() {
  if (!nursePasienAktifData) return;
  var namaBaru = document.getElementById('editPasienNama').value.trim();
  var noRmBaru = document.getElementById('editPasienNoRm').value.trim();
  var diagnosaBaru = document.getElementById('editPasienDiagnosa').value.trim();
  var dpjpBaru = document.getElementById('editPasienDpjp').value.trim();
  var statusEl = document.getElementById('editDataPasienStatus');

  if (!namaBaru) { statusEl.className = 'status-msg error'; statusEl.textContent = 'Nama tidak boleh kosong.'; return; }

  statusEl.className = 'status-msg';
  statusEl.textContent = 'Menyimpan...';

  sb.from('nurse_patients').update({
    nama: namaBaru, no_rm: noRmBaru || null, diagnosa: diagnosaBaru || null, dpjp: dpjpBaru || null
  }).eq('id', nursePasienAktifData.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateNurseCacheAndReload();
    nurseRiwayatPasienAktif = namaBaru;
    document.getElementById('riwayatPerawatDetailNama').textContent = namaBaru;
    muatRiwayatPasienDetailPerawat(namaBaru);
  }).catch(function (err) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Gagal: ' + err.message;
  });
}

function renderRiwayatPerawat(nama, list) {
  if (!list || list.length === 0) {
    document.getElementById('ringkasanRiwayatPerawat').innerHTML = 'Belum ada riwayat kemo untuk ' + escapeHtml(nama) + '.';
    document.getElementById('contentRiwayatPerawat').innerHTML = '';
    return;
  }
  var info = list[list.length - 1];
  document.getElementById('ringkasanRiwayatPerawat').innerHTML = 'Total ' + list.length + ' kali jadwal &middot; ' +
    (info.noRm ? ('No. RM ' + escapeHtml(info.noRm) + ' &middot; ') : '') +
    (info.diagnosa ? (escapeHtml(info.diagnosa) + ' &middot; ') : '') +
    (info.dpjp ? ('DPJP: ' + escapeHtml(info.dpjp)) : '');

  var html = '';
  list.forEach(function (item, i) {
    var isTerakhir = (i === list.length - 1);
    var tglAkhirObj = new Date(item.dateObjMulai.getTime() + (item.lamaHari - 1) * 86400000);
    var rentang = item.tanggalMulai + (item.lamaHari > 1 ? (' s/d ' + formatDDMMYYYY(tglAkhirObj)) : '') + ' (' + item.lamaHari + ' hari)';

    html += '<div class="timeline-item' + (isTerakhir ? ' terakhir' : '') + '">' +
      '<div class="timeline-tanggal" style="display:flex; justify-content:space-between; align-items:center;">' +
      '<span>' + rentang + (isTerakhir ? ' (Terakhir)' : '') + '</span>' + renderBadge(item.status) + '</div>' +
      '<div class="timeline-siklus">Siklus ' + escapeHtml(item.siklus) + '</div>';

    if (item.status === 'Menunggu Verifikasi') {
      html += '<div style="font-size:11px; color:var(--muted); margin-top:4px;"><i class="ti ti-info-circle" aria-hidden="true"></i> Belum tampil di kalender perawat &mdash; menunggu verifikasi perawat ruangan kemo.</div>';
    } else if (item.status === 'Ditolak') {
      html += '<div style="font-size:11px; color:var(--danger); margin-top:4px;"><i class="ti ti-alert-circle" aria-hidden="true"></i> Ditolak' +
        (item.catatanVerifikasi ? (': ' + escapeHtml(item.catatanVerifikasi)) : '.') + '</div>';
    }

    html += '<div style="display:flex; gap:6px; margin-top:8px;">';
    html += renderIkonBtn('ti-pencil', 'Ubah Jadwal', 'btn-accent', 'toggleUbahTanggalRiwayatPerawat(' + i + ')', 'flex:1;');
    html += renderIkonBtn('ti-trash', 'Hapus Jadwal', 'btn-danger', 'hapusJadwalRiwayatPerawat(' + i + ')', 'flex:1;');
    html += '</div>';

    html += '<div id="ubahTanggalRiwayatPerawat' + i + '" style="display:none; margin-top:8px; background:var(--surface-2); border-radius:8px; padding:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Siklus</label>';
    html += '<input type="text" id="siklusBaruRiwayatPerawat' + i + '" value="' + escapeHtml(item.siklus || '') + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Tanggal Mulai Baru</label>';
    html += '<input type="date" id="tanggalBaruRiwayatPerawat' + i + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Lama Hari</label>';
    html += '<input type="number" id="lamaHariBaruRiwayatPerawat' + i + '" min="1" value="' + item.lamaHari + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<label style="display:flex; align-items:center; gap:6px; font-size:11px; margin-bottom:8px;">';
    html += '<input type="checkbox" id="geserBerikutnyaRiwayatPerawat' + i + '" checked style="width:auto; margin:0;"> Geser juga jadwal berikutnya (selisih hari sama, sesuai interval)';
    html += '</label>';
    html += '<button type="button" onclick="simpanUbahTanggalRiwayatPerawat(' + i + ')" class="btn-primary" style="margin-bottom:0;">Simpan</button>';
    html += '</div>';

    html += '</div>';
  });

  document.getElementById('contentRiwayatPerawat').innerHTML = html;
}

function toggleUbahTanggalRiwayatPerawat(i) {
  var el = document.getElementById('ubahTanggalRiwayatPerawat' + i);
  el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}

function simpanUbahTanggalRiwayatPerawat(i) {
  var p = nursePasienListTerakhirRiwayat[i];
  if (!p) return;
  var siklusBaru = document.getElementById('siklusBaruRiwayatPerawat' + i).value.trim();
  var iso = document.getElementById('tanggalBaruRiwayatPerawat' + i).value;
  var lamaHariBaru = parseInt(document.getElementById('lamaHariBaruRiwayatPerawat' + i).value, 10);
  if (!iso) { alert('Pilih tanggal mulai baru terlebih dahulu.'); return; }
  if (!lamaHariBaru || lamaHariBaru < 1) { alert('Lama hari minimal 1.'); return; }
  var geser = document.getElementById('geserBerikutnyaRiwayatPerawat' + i).checked;

  setLoading('loadingRiwayatPerawat', true);
  document.getElementById('loadingRiwayatPerawat').innerText = 'Menyimpan perubahan...';

  var tanggalLamaObj = dateOnly(p.dateObjMulai);
  var parts = iso.split('-');
  var tanggalBaruObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  var deltaDays = Math.round((tanggalBaruObj.getTime() - tanggalLamaObj.getTime()) / 86400000);

  loadAllNurseSchedules().then(function (list) {
    var updates = [sb.from('nurse_schedules').update({ tanggal_mulai: iso, lama_hari: lamaHariBaru, siklus: siklusBaru || null }).eq('id', p.id)];
    if (geser && deltaDays !== 0) {
      list.forEach(function (s) {
        if (s.id === p.id) return;
        if (s.patient_id !== p.patient_id) return;
        if (dateOnly(s.dateObjMulai).getTime() > tanggalLamaObj.getTime()) {
          var geseredDate = new Date(s.dateObjMulai.getTime() + deltaDays * 86400000);
          updates.push(sb.from('nurse_schedules').update({ tanggal_mulai: toIsoDate(geseredDate) }).eq('id', s.id));
        }
      });
    }
    return Promise.all(updates);
  }).then(function (results) {
    var failed = results.find(function (r) { return r.error; });
    if (failed) throw failed.error;
    invalidateNurseCacheAndReload();
    muatRiwayatPasienDetailPerawat(nurseRiwayatPasienAktif);
  }).catch(function (err) {
    setLoading('loadingRiwayatPerawat', false);
    alert('Gagal: ' + err.message);
  });
}

function hapusJadwalRiwayatPerawat(i) {
  var p = nursePasienListTerakhirRiwayat[i];
  if (!p) return;
  var konfirmasi = window.confirm('Yakin mau menghapus jadwal (Siklus ' + p.siklus + ') mulai ' + p.tanggalMulai + '?\n\nTindakan ini tidak bisa dibatalkan.');
  if (!konfirmasi) return;

  setLoading('loadingRiwayatPerawat', true);
  document.getElementById('loadingRiwayatPerawat').innerText = 'Menghapus...';

  sb.from('nurse_schedules').delete().eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateNurseCacheAndReload();
    muatRiwayatPasienDetailPerawat(nurseRiwayatPasienAktif);
  }).catch(function (err) {
    setLoading('loadingRiwayatPerawat', false);
    alert('Gagal: ' + err.message);
  });
}

function siapkanFormTambahRiwayatPerawat(nama, mineSortedAsc) {
  document.getElementById('riwayatPerawatTambahStatus').className = 'status-msg';
  document.getElementById('riwayatPerawatTambahStatus').textContent = '';
  document.getElementById('riwayatPerawatTambahTanggal').value = '';
  document.getElementById('riwayatPerawatTambahLamaHari').value = '1';
  document.getElementById('riwayatPerawatTambahSiklus').value = '';

  var elSiklusAkhir = document.getElementById('riwayatPerawatTambahSiklusAkhir');
  if (elSiklusAkhir) elSiklusAkhir.value = '';
  var elInterval = document.getElementById('riwayatPerawatTambahInterval');
  if (elInterval) elInterval.value = '';

  if (mineSortedAsc && mineSortedAsc.length > 0) {
    var last = mineSortedAsc[mineSortedAsc.length - 1];
    var siklusNum = parseInt(last.siklus, 10);
    document.getElementById('riwayatPerawatTambahSiklus').value = isNaN(siklusNum) ? '' : String(siklusNum + 1);
  } else {
    document.getElementById('riwayatPerawatTambahSiklus').value = '1';
  }
}

function submitTambahJadwalRiwayatPerawat() {
  var nama = nurseRiwayatPasienAktif;
  if (!nama) return;

  var isoTanggal = document.getElementById('riwayatPerawatTambahTanggal').value;
  var siklusAwal = document.getElementById('riwayatPerawatTambahSiklus').value.trim() || '1';
  var elSiklusAkhir = document.getElementById('riwayatPerawatTambahSiklusAkhir');
  var siklusAkhir = (elSiklusAkhir ? elSiklusAkhir.value.trim() : '') || siklusAwal;
  var elInterval = document.getElementById('riwayatPerawatTambahInterval');
  var interval = elInterval ? parseInt(elInterval.value, 10) : NaN;
  var lamaHari = parseInt(document.getElementById('riwayatPerawatTambahLamaHari').value, 10) || 1;
  var statusEl = document.getElementById('riwayatPerawatTambahStatus');
  statusEl.className = 'status-msg';
  statusEl.textContent = '';

  if (!isoTanggal) { statusEl.className = 'status-msg error'; statusEl.textContent = 'Tanggal mulai wajib diisi.'; return; }

  var siklusAwalNum = parseInt(siklusAwal, 10);
  var siklusAkhirNum = parseInt(siklusAkhir, 10);
  var totalSiklusCek = (!isNaN(siklusAwalNum) && !isNaN(siklusAkhirNum)) ? (siklusAkhirNum - siklusAwalNum + 1) : 1;
  if (totalSiklusCek > 1 && (!interval || interval < 1)) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Interval (hari) wajib diisi untuk membuat lebih dari 1 siklus sekaligus.';
    return;
  }

  document.getElementById('riwayatPerawatTambahSubmitBtn').disabled = true;
  statusEl.textContent = 'Menyimpan...';

  var tanggalMulaiObj = new Date(isoTanggal + 'T00:00:00');

  sb.from('nurse_patients').select('id').ilike('nama', nama).maybeSingle().then(function (res) {
    if (!res.data) throw new Error('Data pasien tidak ditemukan.');
    return simpanBeberapaSiklusJadwalPerawat(res.data.id, tanggalMulaiObj, siklusAwal, siklusAkhir, interval, lamaHari);
  }).then(function (jumlahSiklusDibuat) {
    document.getElementById('riwayatPerawatTambahSubmitBtn').disabled = false;
    statusEl.className = 'status-msg ok';
    statusEl.textContent = (currentUserRole === 'perawat_ruangan')
      ? ('Berhasil disimpan! ' + jumlahSiklusDibuat + ' siklus menunggu verifikasi perawat ruangan kemo sebelum tampil di kalender.')
      : ('Berhasil! ' + jumlahSiklusDibuat + ' siklus tersimpan.');
    invalidateNurseCacheAndReload();
    if (elSiklusAkhir) elSiklusAkhir.value = '';
    muatRiwayatPasienDetailPerawat(nama);
  }).catch(function (err) {
    document.getElementById('riwayatPerawatTambahSubmitBtn').disabled = false;
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Gagal: ' + err.message;
  });
}

// ---------------------------------------------------------------------
// TAB PERAWAT 3: DAFTARKAN PASIEN
// ---------------------------------------------------------------------
function muatDataUntukTambahPerawat() {
  sb.from('nurse_patients').select('nama').order('nama').then(function (res) {
    if (res.error) return;
    var dl = document.getElementById('nursePatientDatalistTambah');
    if (!dl) return;
    dl.innerHTML = '';
    res.data.forEach(function (row) {
      var opt = document.createElement('option');
      opt.value = row.nama;
      dl.appendChild(opt);
    });
  });
}

var elTambahPerawatNama = document.getElementById('tambahPerawatNama');
if (elTambahPerawatNama) {
  elTambahPerawatNama.addEventListener('change', function () {
    var nama = this.value.trim();
    var infoEl = document.getElementById('regimenInfoPerawat');
    infoEl.innerHTML = '';
    var elSiklusAkhir = document.getElementById('tambahPerawatSiklusAkhir');
    if (elSiklusAkhir) elSiklusAkhir.value = '';
    if (!nama) return;

    sb.from('nurse_patients').select('id, no_rm, diagnosa, dpjp').ilike('nama', nama).maybeSingle().then(function (res) {
      if (!res.data) {
        infoEl.innerHTML = 'Pasien baru — isi data lengkap di bawah.';
        return;
      }
      document.getElementById('tambahPerawatNoRm').value = res.data.no_rm || '';
      document.getElementById('tambahPerawatDiagnosa').value = res.data.diagnosa || '';
      document.getElementById('tambahPerawatDpjp').value = res.data.dpjp || '';
      infoEl.innerHTML = 'Data pasien lama ditemukan &mdash; No. RM, Diagnosa, dan DPJP otomatis diisi. Cek kembali sebelum simpan.';
    });
  });
}

// Simpan pasien baru/lama perawat + jadwal, mendukung multi-siklus
// otomatis (Siklus Awal -> Sampai Siklus, berjarak `Interval` hari),
// masing-masing langsung tercatat di nurse_schedules dan otomatis
// muncul di kalender perawat.
function submitTambahPasienPerawat() {
  var nama = document.getElementById('tambahPerawatNama').value.trim();
  var noRm = document.getElementById('tambahPerawatNoRm').value.trim();
  var diagnosa = document.getElementById('tambahPerawatDiagnosa').value.trim();
  var dpjp = document.getElementById('tambahPerawatDpjp').value.trim();
  var isoTanggal = document.getElementById('tambahPerawatTanggal').value;
  var siklusAwal = document.getElementById('tambahPerawatSiklus').value.trim() || '1';
  var elSiklusAkhir = document.getElementById('tambahPerawatSiklusAkhir');
  var siklusAkhir = (elSiklusAkhir ? elSiklusAkhir.value.trim() : '') || siklusAwal;
  var elInterval = document.getElementById('tambahPerawatInterval');
  var interval = elInterval ? parseInt(elInterval.value, 10) : NaN;
  var lamaHari = parseInt(document.getElementById('tambahPerawatLamaHari').value, 10) || 1;
  var statusEl = document.getElementById('tambahPerawatStatus');
  statusEl.className = 'status-msg';
  statusEl.textContent = '';

  if (!nama || !isoTanggal) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Nama pasien dan tanggal mulai wajib diisi.';
    return;
  }

  // Validasi interval kalau bikin lebih dari 1 siklus sekaligus
  var siklusAwalNum = parseInt(siklusAwal, 10);
  var siklusAkhirNum = parseInt(siklusAkhir, 10);
  var totalSiklus = (!isNaN(siklusAwalNum) && !isNaN(siklusAkhirNum)) ? (siklusAkhirNum - siklusAwalNum + 1) : 1;
  if (totalSiklus > 1 && (!interval || interval < 1)) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Interval (hari) wajib diisi untuk membuat lebih dari 1 siklus sekaligus.';
    return;
  }

  document.getElementById('tambahPerawatSubmitBtn').disabled = true;
  statusEl.textContent = 'Menyimpan...';

  var tanggalMulaiObj = new Date(isoTanggal + 'T00:00:00');

  sb.from('nurse_patients').select('id').ilike('nama', nama).maybeSingle().then(function (res) {
    if (res.data) {
      return sb.from('nurse_patients').update({
        no_rm: noRm || null, diagnosa: diagnosa || null, dpjp: dpjp || null
      }).eq('id', res.data.id).then(function () { return res.data.id; });
    }
    return sb.from('nurse_patients').insert({
      nama: nama, no_rm: noRm || null, diagnosa: diagnosa || null, dpjp: dpjp || null
    }).select('id').single().then(function (r) {
      if (r.error) throw r.error;
      return r.data.id;
    });
  }).then(function (patientId) {
    return simpanBeberapaSiklusJadwalPerawat(patientId, tanggalMulaiObj, siklusAwal, siklusAkhir, interval, lamaHari);
  }).then(function (jumlahSiklusDibuat) {
    document.getElementById('tambahPerawatSubmitBtn').disabled = false;
    statusEl.className = 'status-msg ok';
    statusEl.textContent = (currentUserRole === 'perawat_ruangan')
      ? ('Berhasil disimpan! ' + jumlahSiklusDibuat + ' siklus menunggu verifikasi perawat ruangan kemo sebelum tampil di kalender.')
      : ('Berhasil! ' + jumlahSiklusDibuat + ' siklus tersimpan.');
    invalidateNurseCacheAndReload();
    document.getElementById('tambahPerawatSiklus').value = '';
    if (elSiklusAkhir) elSiklusAkhir.value = '';
  }).catch(function (err) {
    document.getElementById('tambahPerawatSubmitBtn').disabled = false;
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Gagal: ' + err.message;
  });
}

// ---------------------------------------------------------------------
// TAB PERAWAT 4: VERIFIKASI PASIEN
// (khusus role 'perawat', 'perawat_kemo', 'admin' — lihat TAB_ROLES di
// auth.js). Menampilkan semua jadwal berstatus "menunggu_verifikasi"
// dari perawat ruangan, supaya bisa disetujui (langsung tampil di
// kalender) atau ditolak (dengan catatan alasan opsional).
// ---------------------------------------------------------------------
var nursePasienListTerakhirVerifikasi = [];

function muatVerifikasiPerawat() {
  setLoading('loadingVerifikasiPerawat', true, 'list');
  document.getElementById('verifikasiPerawatContainer').innerHTML = '';

  loadAllNurseSchedules(true).then(function (list) {
    setLoading('loadingVerifikasiPerawat', false);
    var pending = list.filter(function (s) { return s.statusVerifikasi === 'menunggu_verifikasi'; });
    pending.sort(function (a, b) { return a.dateObjMulai.getTime() - b.dateObjMulai.getTime(); });
    nursePasienListTerakhirVerifikasi = pending;
    renderVerifikasiPerawat(pending);
  }).catch(function (err) {
    document.getElementById('loadingVerifikasiPerawat').innerText = 'Gagal memuat: ' + err.message;
  });
}

function renderVerifikasiPerawat(list) {
  var container = document.getElementById('verifikasiPerawatContainer');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = '<div class="empty"><i class="ti ti-circle-check" aria-hidden="true"></i>Tidak ada input pasien yang menunggu verifikasi.</div>';
    return;
  }

  // Formulir bisa diedit dulu (No. RM, Diagnosa, DPJP, Siklus, Tanggal
  // Mulai, Lama Hari) sebelum diverifikasi/ditolak — nilai di kolom-kolom
  // ini yang dipakai saat tombol Verifikasi/Tolak ditekan (lihat
  // verifikasiJadwalPerawat), bukan lagi nilai asli dari perawat ruangan.
  var html = '<div class="ringkasan-jumlah">' + list.length + ' menunggu verifikasi</div>';
  list.forEach(function (p, i) {
    var warnaBorder = warnaStatus('Menunggu Verifikasi');
    html += '<div class="card" style="border-left:4px solid ' + warnaBorder + ';">';
    html += '<div class="nama-row">' + renderAvatarInisial(p.nama, 'Menunggu Verifikasi') +
      '<div class="nama-info"><div class="nama">' + escapeHtml(p.nama) + '</div>' +
      (p.diinputOlehRole ? ('<div class="sub-info">Diinput oleh role: ' + escapeHtml(p.diinputOlehRole) + '</div>') : '') +
      '</div>' + renderBadge('Menunggu Verifikasi') + '</div>';

    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">';
    html += '<div><label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">No. RM</label>' +
      '<input type="text" id="verNoRm' + i + '" value="' + escapeHtml(p.noRm || '') + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px;"></div>';
    html += '<div><label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">DPJP</label>' +
      '<input type="text" id="verDpjp' + i + '" value="' + escapeHtml(p.dpjp || '') + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px;"></div>';
    html += '</div>';
    html += '<div style="margin-top:8px;"><label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Diagnosa</label>' +
      '<input type="text" id="verDiagnosa' + i + '" value="' + escapeHtml(p.diagnosa || '') + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px;"></div>';

    html += '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:8px;">';
    html += '<div><label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Siklus</label>' +
      '<input type="text" id="verSiklus' + i + '" value="' + escapeHtml(p.siklus || '') + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px;"></div>';
    html += '<div><label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Tanggal Mulai</label>' +
      '<input type="date" id="verTanggal' + i + '" value="' + toIsoDate(p.dateObjMulai) + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px;"></div>';
    html += '<div><label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Lama Hari</label>' +
      '<input type="number" id="verLamaHari' + i + '" min="1" value="' + p.lamaHari + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px;"></div>';
    html += '</div>';

    html += '<div style="display:flex; gap:6px; margin-top:10px;">';
    html += renderIkonBtn('ti-circle-check', 'Verifikasi', 'btn-primary', 'verifikasiJadwalPerawat(' + i + ', true)', 'flex:1;');
    html += renderIkonBtn('ti-circle-x', 'Tolak', 'btn-danger', 'verifikasiJadwalPerawat(' + i + ', false)', 'flex:1;');
    html += '</div>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function verifikasiJadwalPerawat(i, disetujui) {
  var p = nursePasienListTerakhirVerifikasi[i];
  if (!p) return;

  var noRmBaru = document.getElementById('verNoRm' + i).value.trim();
  var diagnosaBaru = document.getElementById('verDiagnosa' + i).value.trim();
  var dpjpBaru = document.getElementById('verDpjp' + i).value.trim();
  var siklusBaru = document.getElementById('verSiklus' + i).value.trim();
  var isoTanggalBaru = document.getElementById('verTanggal' + i).value;
  var lamaHariBaru = parseInt(document.getElementById('verLamaHari' + i).value, 10);

  if (!isoTanggalBaru) { alert('Tanggal mulai wajib diisi.'); return; }
  if (!lamaHariBaru || lamaHariBaru < 1) { alert('Lama hari minimal 1.'); return; }

  var catatan = null;
  if (disetujui) {
    if (!window.confirm('Verifikasi jadwal ' + p.nama + ' (Siklus ' + siklusBaru + ')?\n\nJadwal ini akan langsung tampil di kalender perawat sesuai data yang sudah diedit di formulir.')) return;
  } else {
    catatan = window.prompt('Alasan penolakan (opsional, boleh dikosongkan):', '');
    if (catatan === null) return; // batal (klik Cancel)
  }

  setLoading('loadingVerifikasiPerawat', true);
  document.getElementById('loadingVerifikasiPerawat').innerText = disetujui ? 'Memverifikasi...' : 'Menolak...';

  Promise.all([
    sb.from('nurse_patients').update({
      no_rm: noRmBaru || null, diagnosa: diagnosaBaru || null, dpjp: dpjpBaru || null
    }).eq('id', p.patient_id),
    sb.from('nurse_schedules').update({
      tanggal_mulai: isoTanggalBaru,
      siklus: siklusBaru || null,
      lama_hari: lamaHariBaru,
      status_verifikasi: disetujui ? 'terverifikasi' : 'ditolak',
      diverifikasi_oleh: currentUserId,
      diverifikasi_at: new Date().toISOString(),
      catatan_verifikasi: catatan || null
    }).eq('id', p.id)
  ]).then(function (results) {
    var failed = results.find(function (r) { return r.error; });
    if (failed) throw failed.error;
    invalidateNurseCacheAndReload();
    muatVerifikasiPerawat();
  }).catch(function (err) {
    setLoading('loadingVerifikasiPerawat', false);
    alert('Gagal: ' + err.message);
  });
}

// Muat tab pertama saat halaman dibuka (jika sudah login lewat sesi tersimpan)
document.getElementById('kalTanggalJump').value = toIsoDate(tanggalAktif);
var elKalPerawatJump2 = document.getElementById('kalPerawatTanggalJump');
if (elKalPerawatJump2) elKalPerawatJump2.value = toIsoDate(nurseTanggalAktif);
