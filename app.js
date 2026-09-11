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
// =====================================================================

var sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

var NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
var NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
var NAMA_BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
var HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// ---- state (depo/farmasi) ----
var tanggalAktif = new Date();
var bulanKalenderAktif = new Date();
var kalHariDataTerakhir = {};
var pasienListTerakhirTanggal = [];
var tanggalTerakhirUntukTertunda = '';
var patientListDimuat = false;
var tertundaDimuat = false;
var dashboardDimuat = false;
var obatDatalistDimuat = false;
var modeGrafikPasienAktif = 'bulan';
var currentObatList = [];
var pasienListTerakhirTertunda = [];
var currentStokRows = [];

// ---- state khusus tab Daftar Pasien (dulu "Riwayat") — farmasi ----
var allPatientNames = [];
var riwayatPasienAktif = null;
var pasienListTerakhirRiwayat = [];
var currentObatListRiwayat = [];

// cache: seluruh jadwal farmasi (schedules + items + nama pasien)
var allSchedulesCache = null;

// cache: daftar nama obat unik (farmasi)
var daftarNamaObatSharedCache = null;

// ---- state (PERAWAT) — terpisah total dari state farmasi di atas ----
var currentUserRole = null;
var nurseTanggalAktif = new Date();
var nurseBulanKalenderAktif = new Date();
var nurseKalHariDataTerakhir = {};
var nursePasienListTerakhirTanggal = [];
var nursePatientListDimuat = false;
var nurseAllPatientNames = [];
var nurseRiwayatPasienAktif = null;
var nursePasienListTerakhirRiwayat = [];
var nurseAllSchedulesCache = null;

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
  var warna = { 'Tertunda': '#E23B57', 'Sudah Kemo': '#1E9C6B', 'Hari Ini': '#0E9488', 'Belum Kemo': '#7C8CA0' };
  var w = warna[status] || '#7C8CA0';
  return '<span style="border:1px solid ' + w + '; background:' + w + '1F; color:' + w +
    '; padding:2px 9px; border-radius:10px; font-size:11px; font-weight:600; font-family:var(--font-mono); white-space:nowrap;">' +
    '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:' + w + '; margin-right:5px;"></span>' +
    status + '</span>';
}

// =====================================================================
// AUTH
// =====================================================================
// Pemetaan ID login sederhana -> akun Supabase asli.
// Tambahkan baris baru di sini kalau mau bikin ID lain.
var LOGIN_ID_MAP = {
  'depo': 'depo@klinik.local',
  'perawat': 'perawat@klinik.local',
  'admin': 'admin@klinik.local'
};

function handleLogin() {
  var idInput = document.getElementById('loginEmail').value.trim();
  var password = document.getElementById('loginPassword').value;
  var errEl = document.getElementById('loginError');
  errEl.textContent = '';
  if (!idInput || !password) { errEl.textContent = 'Isi ID dan kata sandi.'; return; }

  var email = LOGIN_ID_MAP[idInput.toLowerCase()];
  if (!email) { errEl.textContent = 'ID tidak dikenali.'; return; }

  document.getElementById('loginBtn').disabled = true;
  document.getElementById('loginBtn').textContent = 'Masuk...';

  sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
    document.getElementById('loginBtn').disabled = false;
    document.getElementById('loginBtn').textContent = 'Masuk';
    if (res.error) { errEl.textContent = 'ID atau kata sandi salah.'; return; }
    showApp(res.data.user);
  });
}

function handleLogout() {
  sb.auth.signOut().then(function () {
    allSchedulesCache = null;
    nurseAllSchedulesCache = null;
    currentUserRole = null;
    document.getElementById('appScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'block';
  });
}

// =====================================================================
// ROLE -> MENU
// depo   : tab farmasi (kalender, kebutuhan obat, daftar pasien, tertunda,
//          dashboard, cari obat, daftarkan pasien)
// perawat: tab perawat (kalender perawat, list pasien kemoterapi perawat,
//          daftarkan pasien perawat)
// admin  : semua tab di atas sekaligus
// =====================================================================
var TAB_ROLES = {
  kalender: ['depo', 'admin'],
  rentang: ['depo', 'admin'],
  riwayat: ['depo', 'admin'],
  tertunda: ['depo', 'admin'],
  dashboard: ['depo', 'admin'],
  cariobat: ['depo', 'admin'],
  tambah: ['depo', 'admin'],
  kalenderPerawat: ['perawat', 'admin'],
  riwayatPerawat: ['perawat', 'admin'],
  tambahPerawat: ['perawat', 'admin']
};

function applyRoleUI(role) {
  Object.keys(TAB_ROLES).forEach(function (t) {
    var btn = document.getElementById('tabBtn' + capitalize(t));
    if (btn) btn.style.display = (TAB_ROLES[t].indexOf(role) !== -1) ? '' : 'none';
  });
  var lblFarmasi = document.getElementById('sidebarLabelFarmasi');
  var lblPerawat = document.getElementById('sidebarLabelPerawat');
  if (lblFarmasi) lblFarmasi.style.display = (role === 'depo' || role === 'admin') ? '' : 'none';
  if (lblPerawat) lblPerawat.style.display = (role === 'perawat' || role === 'admin') ? '' : 'none';
}

function showApp(user) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';
  document.getElementById('headerUserEmail').textContent = user.email || '';

  sb.from('profiles').select('role').eq('id', user.id).maybeSingle().then(function (res) {
    if (res.error || !res.data) {
      document.getElementById('headerUserEmail').textContent =
        (user.email || '') + ' (role belum diset — hubungi admin)';
      return;
    }
    currentUserRole = res.data.role;
    applyRoleUI(currentUserRole);

    tanggalAktif = new Date();
    nurseTanggalAktif = new Date();
    document.getElementById('kalTanggalJump').value = toIsoDate(tanggalAktif);
    var kalPerawatJump = document.getElementById('kalPerawatTanggalJump');
    if (kalPerawatJump) kalPerawatJump.value = toIsoDate(nurseTanggalAktif);

    if (currentUserRole === 'perawat') {
      switchTab('kalenderPerawat');
    } else {
      switchTab('kalender');
    }
  });
}

// Cek sesi saat halaman dibuka (biar tidak perlu login ulang tiap refresh)
sb.auth.getSession().then(function (res) {
  if (res.data && res.data.session) {
    showApp(res.data.session.user);
  }
});
document.getElementById('loginPassword').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') handleLogin();
});

// =====================================================================
// DATA LOADING (FARMASI) — satu query besar, dipakai ulang oleh semua tab
// =====================================================================
function loadAllSchedules(forceReload) {
  if (allSchedulesCache && !forceReload) return Promise.resolve(allSchedulesCache);

  return sb.from('schedules')
    .select('id, patient_id, tanggal, siklus, keterangan, patients(nama), schedule_items(id, obat, jumlah)')
    .then(function (res) {
      if (res.error) throw res.error;
      var list = (res.data || []).map(function (row) {
        var parts = row.tanggal.split('-'); // yyyy-mm-dd dari Postgres
        var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return {
          id: row.id,
          patient_id: row.patient_id,
          nama: row.patients ? row.patients.nama : '(tanpa nama)',
          dateObj: d,
          tanggal: formatDDMMYYYY(d),
          siklus: row.siklus || '',
          keterangan: row.keterangan || '',
          items: (row.schedule_items || []).map(function (it) { return { obat: it.obat, jumlah: Number(it.jumlah) || 0 }; })
        };
      });
      allSchedulesCache = list;
      return list;
    });
}

function invalidateCacheAndReload() {
  allSchedulesCache = null;
  daftarNamaObatSharedCache = null;
  patientListDimuat = false;
  tertundaDimuat = false;
  dashboardDimuat = false;
  obatDatalistDimuat = false;
}

// =====================================================================
// DAFTAR NAMA OBAT — sumber tunggal untuk semua datalist obat (farmasi)
// =====================================================================
function muatDaftarNamaObat(forceReload) {
  if (daftarNamaObatSharedCache && !forceReload) return Promise.resolve(daftarNamaObatSharedCache);
  return loadAllSchedules().then(function (list) {
    var namaObatSet = {};
    list.forEach(function (s) {
      s.items.forEach(function (it) { if (it.obat) namaObatSet[it.obat] = true; });
    });
    var sorted = Object.keys(namaObatSet).sort();
    daftarNamaObatSharedCache = sorted;
    return sorted;
  });
}

function isiDatalistObat(idDatalist) {
  return muatDaftarNamaObat().then(function (namaList) {
    var dl = document.getElementById(idDatalist);
    if (!dl) return;
    dl.innerHTML = '';
    namaList.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o;
      dl.appendChild(opt);
    });
  });
}

// =====================================================================
// Simpan beberapa siklus jadwal sekaligus (farmasi) — dipakai bersama
// oleh tab "Daftarkan Pasien" dan form Tambah Jadwal Baru di "Daftar Pasien"
// =====================================================================
function simpanBeberapaSiklusJadwal(patientId, tanggalAwalObj, siklusAwal, siklusAkhir, interval, obatValid) {
  var siklusAwalNum = parseInt(siklusAwal, 10);
  var siklusAkhirNum = parseInt(siklusAkhir, 10);
  var totalSiklus = (!isNaN(siklusAwalNum) && !isNaN(siklusAkhirNum)) ? (siklusAkhirNum - siklusAwalNum + 1) : 1;
  if (totalSiklus < 1) totalSiklus = 1;

  var scheduleInserts = [];
  for (var c = 0; c < totalSiklus; c++) {
    var tglSiklus = new Date(tanggalAwalObj.getTime() + c * (interval || 0) * 86400000);
    var siklusLabel = isNaN(siklusAwalNum) ? siklusAwal : String(siklusAwalNum + c);
    scheduleInserts.push({ patient_id: patientId, tanggal: toIsoDate(tglSiklus), siklus: siklusLabel });
  }

  return sb.from('schedules').insert(scheduleInserts).select('id').then(function (res) {
    if (res.error) throw res.error;
    var scheduleIds = res.data.map(function (r) { return r.id; });
    var itemRows = [];
    scheduleIds.forEach(function (sid) {
      obatValid.forEach(function (o) {
        itemRows.push({ schedule_id: sid, obat: o.obat.trim(), jumlah: o.jumlah === '' ? null : Number(o.jumlah) });
      });
    });
    return sb.from('schedule_items').insert(itemRows).then(function (r2) {
      if (r2.error) throw r2.error;
      return scheduleIds.length;
    });
  });
}

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

  var scheduleInserts = [];
  for (var c = 0; c < totalSiklus; c++) {
    var tglSiklus = new Date(tanggalMulaiObj.getTime() + c * (interval || 0) * 86400000);
    var siklusLabel = isNaN(siklusAwalNum) ? siklusAwal : String(siklusAwalNum + c);
    scheduleInserts.push({
      patient_id: patientId,
      tanggal_mulai: toIsoDate(tglSiklus),
      siklus: siklusLabel,
      lama_hari: lamaHari || 1
    });
  }

  return sb.from('nurse_schedules').insert(scheduleInserts).then(function (res) {
    if (res.error) throw res.error;
    return scheduleInserts.length;
  });
}

// =====================================================================
// Tab switching (menangani tab farmasi + tab perawat)
// =====================================================================
function switchTab(nama) {
  var tabs = Object.keys(TAB_ROLES);
  tabs.forEach(function (t) {
    var contentEl = document.getElementById('tab' + capitalize(t));
    var btnEl = document.getElementById('tabBtn' + capitalize(t));
    if (contentEl) contentEl.style.display = (nama === t) ? 'block' : 'none';
    if (btnEl) btnEl.classList.toggle('active', nama === t);
  });

  if (nama === 'rentang') {
    if (!document.getElementById('rentangMulai').value) {
      var hariIni = new Date();
      var seminggu = new Date();
      seminggu.setDate(seminggu.getDate() - 6);
      document.getElementById('rentangMulai').value = toIsoDate(seminggu);
      document.getElementById('rentangAkhir').value = toIsoDate(hariIni);
    }
    if (currentStokRows.length === 0) {
      currentStokRows = [{ obat: '', tanggal: toIsoDate(new Date()), jumlah: '' }];
      renderStokRowsTable();
    }
    isiDatalistObat('daftarObatDatalistTambah');
  }
  if (nama === 'riwayat' && !patientListDimuat) muatDaftarPasien();
  if (nama === 'tertunda' && !tertundaDimuat) muatPasienTertunda();
  if (nama === 'dashboard' && !dashboardDimuat) muatDashboard();
  if (nama === 'kalender') muatKalender();
  if (nama === 'cariobat' && !obatDatalistDimuat) muatDaftarObatUntukPencarian();
  if (nama === 'tambah') muatDataUntukTambah();

  if (nama === 'kalenderPerawat') muatKalenderPerawat();
  if (nama === 'riwayatPerawat' && !nursePatientListDimuat) muatDaftarPasienPerawat();
  if (nama === 'tambahPerawat') muatDataUntukTambahPerawat();
}
function capitalize(s) {
  if (s === 'cariobat') return 'CariObat';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// =====================================================================
// TAB 1: KALENDER (FARMASI)
// =====================================================================
function kalKeHariIni() {
  tanggalAktif = new Date();
  bulanKalenderAktif = new Date();
  document.getElementById('kalTanggalJump').value = toIsoDate(tanggalAktif);
  muatKalender();
  muatDetailTanggal();
}
document.getElementById('kalTanggalJump').addEventListener('change', function () {
  var iso = this.value;
  if (!iso) return;
  var parts = iso.split('-');
  tanggalAktif = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  bulanKalenderAktif = new Date(tanggalAktif.getFullYear(), tanggalAktif.getMonth(), 1);
  muatKalender();
  muatDetailTanggal();
});

function gantiBulanKalender(delta) {
  bulanKalenderAktif.setMonth(bulanKalenderAktif.getMonth() + delta);
  muatKalender();
}

function muatKalender() {
  var tahun = bulanKalenderAktif.getFullYear();
  var bulan = bulanKalenderAktif.getMonth() + 1;
  document.getElementById('kalBulanLabel').innerText = NAMA_BULAN[bulan - 1] + ' ' + tahun;
  document.getElementById('loadingKalender').style.display = 'block';

  loadAllSchedules().then(function (list) {
    document.getElementById('loadingKalender').style.display = 'none';
    var hariData = {};
    list.forEach(function (s) {
      if (s.dateObj.getFullYear() !== tahun || (s.dateObj.getMonth() + 1) !== bulan) return;
      var hari = s.dateObj.getDate();
      if (!hariData[hari]) hariData[hari] = { entriSet: {}, adaTertunda: false };
      var teks = (s.siklus && s.siklus !== '-') ? (s.nama + ' ' + s.siklus) : s.nama;
      hariData[hari].entriSet[teks] = true;
      if (s.keterangan.toLowerCase().indexOf('tertunda') !== -1) hariData[hari].adaTertunda = true;
    });
    var hasil = {};
    Object.keys(hariData).forEach(function (h) {
      hasil[h] = { daftarPasien: Object.keys(hariData[h].entriSet).sort(), adaTertunda: hariData[h].adaTertunda };
    });
    kalHariDataTerakhir = hasil;
    renderKalenderGrid(tahun, bulan, hasil);
  }).catch(function (err) {
    document.getElementById('loadingKalender').innerText = 'Gagal memuat: ' + err.message;
  });
}

function renderKalenderGrid(tahun, bulan, hariData) {
  document.getElementById('kalHariLabelRow').innerHTML = HARI_SINGKAT.map(function (h) { return '<div class="kal-hari-label">' + h + '</div>'; }).join('');

  var jumlahHari = new Date(tahun, bulan, 0).getDate();
  var hariPertama = new Date(tahun, bulan - 1, 1).getDay();
  var hariIni = new Date();
  var isBulanIni = (hariIni.getFullYear() === tahun && (hariIni.getMonth() + 1) === bulan);
  var isBulanTerpilih = (tanggalAktif.getFullYear() === tahun && (tanggalAktif.getMonth() + 1) === bulan);

  var html = '';
  for (var i = 0; i < hariPertama; i++) html += '<div class="kal-cell kosong"></div>';
  for (var tgl = 1; tgl <= jumlahHari; tgl++) {
    var info = hariData[tgl];
    var kelas = 'kal-cell';
    if (info) kelas += ' ada-jadwal';
    if (info && info.adaTertunda) kelas += ' ada-tertunda';
    if (isBulanIni && hariIni.getDate() === tgl) kelas += ' hari-ini';
    if (isBulanTerpilih && tanggalAktif.getDate() === tgl) kelas += ' terpilih';

    html += '<div class="' + kelas + '" onclick="pilihTanggalKalender(' + tgl + ')"><div class="kal-tgl-num">' + tgl + '</div>';
    if (info) info.daftarPasien.forEach(function (entri) { html += '<div class="kal-entri">' + escapeHtml(entri) + '</div>'; });
    html += '</div>';
  }
  document.getElementById('kalGrid').innerHTML = html;
}

function pilihTanggalKalender(tgl) {
  tanggalAktif = new Date(bulanKalenderAktif.getFullYear(), bulanKalenderAktif.getMonth(), tgl);
  renderKalenderGrid(bulanKalenderAktif.getFullYear(), bulanKalenderAktif.getMonth() + 1, kalHariDataTerakhir);
  muatDetailTanggal();
}

function muatDetailTanggal() {
  document.getElementById('kalTanggalJump').value = toIsoDate(tanggalAktif);
  document.getElementById('kalDetailLabel').innerText = formatTampilan(tanggalAktif);
  document.getElementById('loadingKalDetail').style.display = 'block';
  document.getElementById('loadingKalDetail').innerText = 'Memuat jadwal...';
  document.getElementById('kalDetailContainer').innerHTML = '';

  loadAllSchedules().then(function (list) {
    document.getElementById('loadingKalDetail').style.display = 'none';
    var target = dateOnly(tanggalAktif).getTime();
    var matches = list.filter(function (s) { return dateOnly(s.dateObj).getTime() === target; });
    var totalGroups = {};
    matches.forEach(function (s) {
      s.items.forEach(function (it) {
        var key = it.obat.toLowerCase();
        if (!totalGroups[key]) totalGroups[key] = { obat: it.obat, totalJumlah: 0 };
        totalGroups[key].totalJumlah += it.jumlah;
      });
    });
    var totalObat = Object.keys(totalGroups).map(function (k) { return totalGroups[k]; }).sort(function (a, b) { return a.obat.localeCompare(b.obat); });
    var pasienList = matches.map(function (s) {
      return { id: s.id, nama: s.nama, siklus: s.siklus, obatList: s.items, status: hitungStatus(s.dateObj, s.keterangan) };
    });
    renderJadwalTanggal({ tanggal: formatDDMMYYYY(tanggalAktif), pasienList: pasienList, totalObat: totalObat });
  }).catch(function (err) {
    document.getElementById('loadingKalDetail').innerText = 'Gagal memuat: ' + err.message;
  });
}

function renderJadwalTanggal(detail) {
  pasienListTerakhirTanggal = detail.pasienList;
  tanggalTerakhirUntukTertunda = detail.tanggal;

  if (!detail.pasienList || detail.pasienList.length === 0) {
    document.getElementById('kalDetailContainer').innerHTML = '<div class="empty">Tidak ada jadwal kemoterapi pada tanggal ini.</div>';
    return;
  }

  var html = '<div class="ringkasan-jumlah">' + detail.pasienList.length + ' pasien terjadwal</div>';
  detail.pasienList.forEach(function (p, i) {
    html += '<div class="card"><div class="nama" style="display:flex; justify-content:space-between; align-items:center;">' +
      '<span>' + escapeHtml(p.nama) + '</span>' + renderBadge(p.status) + '</div>';
    p.obatList.forEach(function (o) {
      html += '<div class="obat-item"><span>' + escapeHtml(o.obat) + '</span><span class="obat-jumlah">' + o.jumlah + '</span></div>';
    });

    if (p.status === 'Tertunda') {
      html += '<button type="button" onclick="toggleTertundaTanggal(' + i + ', false)" class="btn-neutral" style="margin-top:8px;">Batalkan Tanda Tertunda</button>';
    } else {
      html += '<button type="button" onclick="toggleTertundaTanggal(' + i + ', true)" class="btn-danger" style="margin-top:8px;">Tandai Tertunda</button>';
    }

    html += '<div style="display:flex; gap:6px; margin-top:6px;">';
    html += '<button type="button" onclick="toggleUbahTanggalForm(' + i + ')" class="btn-accent" style="flex:1;">Ubah Tanggal</button>';
    html += '<button type="button" onclick="hapusJadwalTanggal(' + i + ')" style="flex:1; background:var(--danger); color:white; border:none; border-radius:16px; padding:8px 6px; font-size:12px;">Hapus Jadwal</button>';
    html += '</div>';

    html += '<div id="ubahTanggalForm' + i + '" style="display:none; margin-top:8px; background:var(--surface-2); border-radius:8px; padding:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Tanggal Baru</label>';
    html += '<input type="date" id="tanggalBaruInput' + i + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<label style="display:flex; align-items:center; gap:6px; font-size:11px;">';
    html += '<input type="checkbox" id="geserBerikutnyaCek' + i + '" checked style="width:auto; margin:0;"> Geser juga jadwal berikutnya (selisih hari sama)';
    html += '</label>';
    html += '<button type="button" onclick="simpanUbahTanggal(' + i + ')" style="margin-top:8px; width:100%; background:var(--success); color:#fff; border:none; border-radius:16px; padding:8px; font-size:12px; font-weight:600;">Simpan Tanggal Baru</button>';
    html += '</div>';
    html += '</div>';
  });

  html += '<div class="total-section"><h2>Total Kebutuhan Obat</h2>';
  detail.totalObat.forEach(function (t) { html += '<div class="total-item"><span>' + escapeHtml(t.obat) + '</span><span>' + t.totalJumlah + '</span></div>'; });
  html += '</div>';

  document.getElementById('kalDetailContainer').innerHTML = html;
}

function toggleTertundaTanggal(i, jadiTertunda) {
  var p = pasienListTerakhirTanggal[i];
  if (!p) return;
  document.getElementById('loadingKalDetail').style.display = 'block';
  document.getElementById('loadingKalDetail').innerText = jadiTertunda ? 'Menandai...' : 'Membatalkan tanda...';

  loadAllSchedules().then(function (list) {
    var s = list.find(function (x) { return x.id === p.id; });
    var ketBaru;
    var ketLama = s ? s.keterangan : '';
    if (jadiTertunda) {
      ketBaru = ketLama.toLowerCase().indexOf('tertunda') !== -1 ? ketLama : (ketLama ? ('Tertunda; ' + ketLama) : 'Tertunda');
    } else {
      ketBaru = ketLama.replace(/tertunda\s*;?\s*/gi, '').replace(/;\s*$/, '').trim();
    }
    return sb.from('schedules').update({ keterangan: ketBaru }).eq('id', p.id);
  }).then(function (res) {
    if (res && res.error) throw res.error;
    invalidateCacheAndReload();
    muatDetailTanggal();
  }).catch(function (err) {
    document.getElementById('loadingKalDetail').style.display = 'none';
    alert('Gagal: ' + err.message);
  });
}

function toggleUbahTanggalForm(i) {
  var el = document.getElementById('ubahTanggalForm' + i);
  el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}

function simpanUbahTanggal(i) {
  var p = pasienListTerakhirTanggal[i];
  if (!p) return;
  var iso = document.getElementById('tanggalBaruInput' + i).value;
  if (!iso) { alert('Pilih tanggal baru terlebih dahulu.'); return; }
  var geser = document.getElementById('geserBerikutnyaCek' + i).checked;

  document.getElementById('loadingKalDetail').style.display = 'block';
  document.getElementById('loadingKalDetail').innerText = 'Menyimpan perubahan tanggal...';

  var tanggalLamaObj = dateOnly(tanggalAktif);
  var parts = iso.split('-');
  var tanggalBaruObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  var deltaDays = Math.round((tanggalBaruObj.getTime() - tanggalLamaObj.getTime()) / 86400000);

  loadAllSchedules().then(function (list) {
    var updates = [sb.from('schedules').update({ tanggal: iso }).eq('id', p.id)];
    if (geser && deltaDays !== 0) {
      var current = list.find(function (x) { return x.id === p.id; });
      var thisPatientId = current ? current.patient_id : null;
      list.forEach(function (s) {
        if (s.id === p.id) return;
        if (s.patient_id !== thisPatientId) return;
        if (dateOnly(s.dateObj).getTime() > tanggalLamaObj.getTime()) {
          var geseredDate = new Date(s.dateObj.getTime() + deltaDays * 86400000);
          updates.push(sb.from('schedules').update({ tanggal: toIsoDate(geseredDate) }).eq('id', s.id));
        }
      });
    }
    return Promise.all(updates);
  }).then(function (results) {
    var failed = results.find(function (r) { return r.error; });
    if (failed) throw failed.error;
    invalidateCacheAndReload();
    muatDetailTanggal();
  }).catch(function (err) {
    document.getElementById('loadingKalDetail').style.display = 'none';
    alert('Gagal: ' + err.message);
  });
}

function hapusJadwalTanggal(i) {
  var p = pasienListTerakhirTanggal[i];
  if (!p) return;
  var konfirmasi = window.confirm('Yakin mau menghapus jadwal ' + p.nama + ' (Siklus ' + p.siklus + ') pada ' + tanggalTerakhirUntukTertunda + '?\n\nTindakan ini tidak bisa dibatalkan.');
  if (!konfirmasi) return;

  document.getElementById('loadingKalDetail').style.display = 'block';
  document.getElementById('loadingKalDetail').innerText = 'Menghapus...';

  sb.from('schedules').delete().eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateCacheAndReload();
    muatDetailTanggal();
  }).catch(function (err) {
    document.getElementById('loadingKalDetail').style.display = 'none';
    alert('Gagal: ' + err.message);
  });
}

// =====================================================================
// TAB 2: KEBUTUHAN OBAT (FARMASI)
// =====================================================================
function muatKebutuhanRentang() {
  var isoMulai = document.getElementById('rentangMulai').value;
  var isoAkhir = document.getElementById('rentangAkhir').value;
  if (!isoMulai || !isoAkhir) {
    document.getElementById('ringkasanRentang').innerText = 'Isi kedua tanggal terlebih dahulu.';
    return;
  }
  document.getElementById('loadingRentang').style.display = 'block';
  document.getElementById('ringkasanRentang').innerHTML = '';
  document.getElementById('contentRentang').innerHTML = '';

  Promise.all([
    loadAllSchedules(),
    sb.from('stock_entries').select('obat, jumlah')
  ]).then(function (results) {
    var list = results[0];
    var stokRes = results[1];
    document.getElementById('loadingRentang').style.display = 'none';
    var mulai = new Date(isoMulai + 'T00:00:00');
    var akhir = new Date(isoAkhir + 'T00:00:00');
    var groups = {};
    var pasienSet = {};
    var tanggalSet = {};
    list.forEach(function (s) {
      var t = dateOnly(s.dateObj).getTime();
      if (t < mulai.getTime() || t > akhir.getTime()) return;
      pasienSet[s.nama] = true;
      tanggalSet[s.tanggal] = true;
      s.items.forEach(function (it) {
        var key = it.obat.toLowerCase();
        if (!groups[key]) groups[key] = { obat: it.obat, totalJumlah: 0, pasienSet: {} };
        groups[key].totalJumlah += it.jumlah;
        groups[key].pasienSet[s.nama] = true;
      });
    });

    var stokMap = {};
    if (stokRes && !stokRes.error && stokRes.data) {
      stokRes.data.forEach(function (row) {
        var key = (row.obat || '').toLowerCase();
        stokMap[key] = (stokMap[key] || 0) + Number(row.jumlah || 0);
      });
    }

    var items = Object.keys(groups).map(function (k) {
      var g = groups[k];
      var stokTersedia = stokMap[k] || 0;
      return {
        obat: g.obat,
        totalJumlah: g.totalJumlah,
        pasienList: Object.keys(g.pasienSet),
        stok: stokTersedia,
        selisih: stokTersedia - g.totalJumlah
      };
    }).sort(function (a, b) { return a.obat.localeCompare(b.obat); });

    renderRentang({
      tanggalMulai: formatDDMMYYYY(mulai), tanggalAkhir: formatDDMMYYYY(akhir),
      items: items, totalPasien: Object.keys(pasienSet).length, totalHariAdaJadwal: Object.keys(tanggalSet).length
    });
  }).catch(function (err) {
    document.getElementById('loadingRentang').style.display = 'none';
    document.getElementById('ringkasanRentang').innerText = 'Gagal memuat: ' + err.message;
  });
}

function renderRentang(detail) {
  if (!detail.items || detail.items.length === 0) {
    document.getElementById('ringkasanRentang').innerHTML = 'Tidak ada jadwal kemoterapi dari ' + detail.tanggalMulai + ' sampai ' + detail.tanggalAkhir + '.';
    return;
  }
  document.getElementById('ringkasanRentang').innerHTML = detail.tanggalMulai + ' &ndash; ' + detail.tanggalAkhir + ': ' + detail.totalPasien + ' pasien, ' + detail.totalHariAdaJadwal + ' hari ada jadwal';

  var html = '<div class="total-section"><h2>Kebutuhan Obat vs Stok</h2>';
  detail.items.forEach(function (item) {
    var kurang = item.selisih < 0;
    var warna = kurang ? 'var(--danger)' : 'var(--success)';
    html += '<div class="total-item" style="align-items:center;">' +
      '<span>' + escapeHtml(item.obat) + '</span>' +
      '<span style="text-align:right;">Butuh ' + item.totalJumlah + ' &middot; Stok ' + item.stok +
      ' &middot; <span style="color:' + warna + '; font-weight:700;">' +
      (kurang ? ('Kurang ' + Math.abs(item.selisih) + ' (pesan)') : ('Sisa +' + item.selisih)) +
      '</span></span></div>';
  });
  html += '</div><div style="margin-top:16px;">';
  detail.items.forEach(function (item) {
    html += '<div class="card"><div class="nama" style="font-size:14px;">' + escapeHtml(item.obat) + '</div>' +
      '<div style="font-size:12px; color:var(--muted);">Dipakai oleh: ' + escapeHtml(item.pasienList.join(', ')) + '</div></div>';
  });
  html += '</div>';
  document.getElementById('contentRentang').innerHTML = html;
}

function tambahBarisStokKosong() {
  currentStokRows.push({ obat: '', tanggal: toIsoDate(new Date()), jumlah: '' });
  renderStokRowsTable();
}
function hapusBarisStok(i) {
  currentStokRows.splice(i, 1);
  renderStokRowsTable();
}
function renderStokRowsTable() {
  var container = document.getElementById('stokRowsContainer');
  if (!container) return;
  var html = '';
  currentStokRows.forEach(function (item, i) {
    html += '<div class="obat-row">' +
      '<input list="daftarObatDatalistTambah" data-i="' + i + '" data-f="obat" placeholder="Nama obat" value="' + escapeHtml(item.obat || '') + '">' +
      '<input type="date" data-i="' + i + '" data-f="tanggal" style="flex:1;" value="' + escapeHtml(item.tanggal || '') + '">' +
      '<input type="number" data-i="' + i + '" data-f="jumlah" placeholder="Stok saat ini" value="' + escapeHtml(item.jumlah != null ? String(item.jumlah) : '') + '">' +
      '<button type="button" onclick="hapusBarisStok(' + i + ')">×</button></div>';
  });
  container.innerHTML = html;
  container.querySelectorAll('.obat-row input').forEach(function (inp) {
    var handler = function () {
      var i = parseInt(this.getAttribute('data-i'), 10);
      var f = this.getAttribute('data-f');
      currentStokRows[i][f] = this.value;
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
  });
}

function submitUpdateStok() {
  var statusEl = document.getElementById('stokMasukStatus');
  statusEl.className = 'status-msg';
  statusEl.textContent = '';

  var valid = currentStokRows.filter(function (r) {
    return (r.obat || '').trim() !== '' && r.tanggal && r.jumlah !== '' && !isNaN(Number(r.jumlah)) && Number(r.jumlah) >= 0;
  });
  if (valid.length === 0) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Isi minimal satu baris (obat, tanggal, jumlah stok saat ini) dengan benar.';
    return;
  }

  document.getElementById('stokMasukSubmitBtn').disabled = true;
  statusEl.textContent = 'Menyimpan...';

  var deletePromises = valid.map(function (r) {
    return sb.from('stock_entries').delete().ilike('obat', r.obat.trim());
  });

  Promise.all(deletePromises).then(function (delResults) {
    var failedDelete = delResults.find(function (r) { return r.error; });
    if (failedDelete) throw failedDelete.error;

    var rows = valid.map(function (r) { return { obat: r.obat.trim(), tanggal: r.tanggal, jumlah: Number(r.jumlah) }; });
    return sb.from('stock_entries').insert(rows);
  }).then(function (res) {
    document.getElementById('stokMasukSubmitBtn').disabled = false;
    if (res.error) { statusEl.className = 'status-msg error'; statusEl.textContent = 'Gagal: ' + res.error.message; return; }
    statusEl.className = 'status-msg ok';
    statusEl.textContent = 'Stok berhasil diupdate.';
    currentStokRows = [{ obat: '', tanggal: toIsoDate(new Date()), jumlah: '' }];
    renderStokRowsTable();
    invalidateCacheAndReload();
    isiDatalistObat('daftarObatDatalistTambah');
    if (document.getElementById('rentangMulai').value && document.getElementById('rentangAkhir').value) muatKebutuhanRentang();
  }).catch(function (err) {
    document.getElementById('stokMasukSubmitBtn').disabled = false;
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Gagal: ' + err.message;
  });
}

// =====================================================================
// TAB 3: DAFTAR PASIEN (FARMASI)
// =====================================================================
function muatDaftarPasien() {
  document.getElementById('loadingRiwayatList').style.display = 'block';
  sb.from('patients').select('nama').order('nama').then(function (res) {
    document.getElementById('loadingRiwayatList').style.display = 'none';
    if (res.error) {
      document.getElementById('daftarPasienRiwayat').innerHTML = 'Gagal memuat: ' + escapeHtml(res.error.message);
      return;
    }
    patientListDimuat = true;
    allPatientNames = res.data.map(function (row) { return row.nama; });
    renderDaftarPasienRiwayat(document.getElementById('riwayatSearchInput').value);
  });
}

function renderDaftarPasienRiwayat(filter) {
  var container = document.getElementById('daftarPasienRiwayat');
  if (!container) return;
  var f = (filter || '').trim().toLowerCase();
  var filtered = allPatientNames.filter(function (n) { return n.toLowerCase().indexOf(f) !== -1; });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty">Tidak ada pasien yang cocok.</div>';
    return;
  }

  var html = '<div class="pasien-list-card">';
  filtered.forEach(function (nama, idx) {
    html += '<div class="pasien-item" data-idx="' + idx + '"><span>' + escapeHtml(nama) + '</span><span style="color:var(--muted);">&rsaquo;</span></div>';
  });
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.pasien-item').forEach(function (el) {
    el.addEventListener('click', function () {
      var idx = parseInt(this.getAttribute('data-idx'), 10);
      pilihPasienRiwayat(filtered[idx]);
    });
  });
}

document.getElementById('riwayatSearchInput').addEventListener('input', function () {
  renderDaftarPasienRiwayat(this.value);
});

function pilihPasienRiwayat(nama) {
  riwayatPasienAktif = nama;
  document.getElementById('riwayatListWrap').style.display = 'none';
  document.getElementById('riwayatDetailWrap').style.display = 'block';
  document.getElementById('riwayatDetailNama').textContent = nama;
  muatRiwayatPasienDetail(nama);
}

function kembaliKeDaftarPasien() {
  riwayatPasienAktif = null;
  document.getElementById('riwayatDetailWrap').style.display = 'none';
  document.getElementById('riwayatListWrap').style.display = 'block';
}

function muatRiwayatPasienDetail(nama) {
  document.getElementById('contentRiwayat').innerHTML = '';
  document.getElementById('ringkasanRiwayat').innerHTML = '';
  document.getElementById('loadingRiwayat').style.display = 'block';
  document.getElementById('loadingRiwayat').innerText = 'Memuat riwayat...';

  loadAllSchedules().then(function (list) {
    document.getElementById('loadingRiwayat').style.display = 'none';
    var mine = list.filter(function (s) { return s.nama.toLowerCase() === nama.toLowerCase(); });
    mine.sort(function (a, b) { return a.dateObj.getTime() - b.dateObj.getTime(); });

    pasienListTerakhirRiwayat = mine.map(function (s) {
      return { id: s.id, patient_id: s.patient_id, tanggal: s.tanggal, dateObj: s.dateObj, siklus: s.siklus, items: s.items, status: hitungStatus(s.dateObj, s.keterangan) };
    });

    renderRiwayat(nama, pasienListTerakhirRiwayat);
    siapkanFormTambahRiwayat(nama, mine);
  }).catch(function (err) {
    document.getElementById('loadingRiwayat').innerText = 'Gagal memuat: ' + err.message;
  });
}

function renderRiwayat(nama, list) {
  if (!list || list.length === 0) {
    document.getElementById('ringkasanRiwayat').innerHTML = 'Belum ada riwayat kemo untuk ' + escapeHtml(nama) + '.';
    document.getElementById('contentRiwayat').innerHTML = '';
    return;
  }
  document.getElementById('ringkasanRiwayat').innerHTML = 'Total ' + list.length + ' kali jadwal (dari paling lama ke paling baru)';

  var html = '';
  list.forEach(function (item, i) {
    var isTerakhir = (i === list.length - 1);
    var obatRingkas = item.items.map(function (it) { return it.obat + (it.jumlah !== '' && it.jumlah != null ? ' (' + it.jumlah + ')' : ''); }).join(', ');

    html += '<div class="timeline-item' + (isTerakhir ? ' terakhir' : '') + '">' +
      '<div class="timeline-tanggal" style="display:flex; justify-content:space-between; align-items:center;">' +
      '<span>' + item.tanggal + (isTerakhir ? ' (Terakhir)' : '') + '</span>' + renderBadge(item.status) + '</div>' +
      '<div class="timeline-siklus">Siklus ' + escapeHtml(item.siklus) + '</div>' +
      '<div class="timeline-obat">' + escapeHtml(obatRingkas) + '</div>';

    html += '<div style="display:flex; gap:6px; margin-top:8px;">';
    html += '<button type="button" onclick="toggleUbahTanggalRiwayat(' + i + ')" class="btn-accent" style="flex:1;">Ubah Tanggal</button>';
    html += '<button type="button" onclick="hapusJadwalRiwayat(' + i + ')" class="btn-danger" style="flex:1;">Hapus Jadwal</button>';
    html += '</div>';

    html += '<div id="ubahTanggalRiwayat' + i + '" style="display:none; margin-top:8px; background:var(--surface-2); border-radius:8px; padding:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Tanggal Baru</label>';
    html += '<input type="date" id="tanggalBaruRiwayat' + i + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<label style="display:flex; align-items:center; gap:6px; font-size:11px; margin-bottom:8px;">';
    html += '<input type="checkbox" id="geserBerikutnyaRiwayat' + i + '" checked style="width:auto; margin:0;"> Geser juga jadwal berikutnya (selisih hari sama, jadwal sebelumnya tidak berubah)';
    html += '</label>';
    html += '<button type="button" onclick="simpanUbahTanggalRiwayat(' + i + ')" class="btn-primary" style="margin-bottom:0;">Simpan Tanggal Baru</button>';
    html += '</div>';

    html += '</div>';
  });

  document.getElementById('contentRiwayat').innerHTML = html;
}

function toggleUbahTanggalRiwayat(i) {
  var el = document.getElementById('ubahTanggalRiwayat' + i);
  el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}

function simpanUbahTanggalRiwayat(i) {
  var p = pasienListTerakhirRiwayat[i];
  if (!p) return;
  var iso = document.getElementById('tanggalBaruRiwayat' + i).value;
  if (!iso) { alert('Pilih tanggal baru terlebih dahulu.'); return; }
  var geser = document.getElementById('geserBerikutnyaRiwayat' + i).checked;

  document.getElementById('loadingRiwayat').style.display = 'block';
  document.getElementById('loadingRiwayat').innerText = 'Menyimpan perubahan tanggal...';

  var tanggalLamaObj = dateOnly(p.dateObj);
  var parts = iso.split('-');
  var tanggalBaruObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  var deltaDays = Math.round((tanggalBaruObj.getTime() - tanggalLamaObj.getTime()) / 86400000);

  loadAllSchedules().then(function (list) {
    var updates = [sb.from('schedules').update({ tanggal: iso }).eq('id', p.id)];
    if (geser && deltaDays !== 0) {
      list.forEach(function (s) {
        if (s.id === p.id) return;
        if (s.patient_id !== p.patient_id) return;
        if (dateOnly(s.dateObj).getTime() > tanggalLamaObj.getTime()) {
          var geseredDate = new Date(s.dateObj.getTime() + deltaDays * 86400000);
          updates.push(sb.from('schedules').update({ tanggal: toIsoDate(geseredDate) }).eq('id', s.id));
        }
      });
    }
    return Promise.all(updates);
  }).then(function (results) {
    var failed = results.find(function (r) { return r.error; });
    if (failed) throw failed.error;
    invalidateCacheAndReload();
    muatRiwayatPasienDetail(riwayatPasienAktif);
  }).catch(function (err) {
    document.getElementById('loadingRiwayat').style.display = 'none';
    alert('Gagal: ' + err.message);
  });
}

function hapusJadwalRiwayat(i) {
  var p = pasienListTerakhirRiwayat[i];
  if (!p) return;
  var konfirmasi = window.confirm('Yakin mau menghapus jadwal (Siklus ' + p.siklus + ') pada ' + p.tanggal + '?\n\nTindakan ini tidak bisa dibatalkan.');
  if (!konfirmasi) return;

  document.getElementById('loadingRiwayat').style.display = 'block';
  document.getElementById('loadingRiwayat').innerText = 'Menghapus...';

  sb.from('schedules').delete().eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateCacheAndReload();
    muatRiwayatPasienDetail(riwayatPasienAktif);
  }).catch(function (err) {
    document.getElementById('loadingRiwayat').style.display = 'none';
    alert('Gagal: ' + err.message);
  });
}

function siapkanFormTambahRiwayat(nama, mineSortedAsc) {
  document.getElementById('riwayatTambahStatus').className = 'status-msg';
  document.getElementById('riwayatTambahStatus').textContent = '';
  document.getElementById('riwayatTambahTanggal').value = '';
  document.getElementById('riwayatTambahSiklusAkhir').value = '';
  document.getElementById('riwayatTambahInterval').value = '';
  isiDatalistObat('daftarObatDatalistTambah');

  if (!mineSortedAsc || mineSortedAsc.length === 0) {
    document.getElementById('riwayatTambahSiklusAwal').value = '1';
    currentObatListRiwayat = [{ obat: '', jumlah: '' }];
    renderObatTableRiwayat(currentObatListRiwayat);
    return;
  }

  var last = mineSortedAsc[mineSortedAsc.length - 1];
  var siklusNum = parseInt(last.siklus, 10);
  document.getElementById('riwayatTambahSiklusAwal').value = isNaN(siklusNum) ? '' : (siklusNum + 1);
  currentObatListRiwayat = last.items.map(function (it) { return { obat: it.obat, jumlah: it.jumlah }; });
  if (currentObatListRiwayat.length === 0) currentObatListRiwayat = [{ obat: '', jumlah: '' }];
  renderObatTableRiwayat(currentObatListRiwayat);

  sb.from('patients').select('interval_hari').ilike('nama', nama).maybeSingle().then(function (res) {
    if (res.data && res.data.interval_hari) document.getElementById('riwayatTambahInterval').value = res.data.interval_hari;
  });
}

function tambahBarisObatRiwayatKosong() {
  currentObatListRiwayat.push({ obat: '', jumlah: '' });
  renderObatTableRiwayat(currentObatListRiwayat);
}
function hapusBarisObatRiwayat(i) {
  currentObatListRiwayat.splice(i, 1);
  renderObatTableRiwayat(currentObatListRiwayat);
}
function renderObatTableRiwayat(list) {
  var html = '';
  list.forEach(function (item, i) {
    html += '<div class="obat-row">' +
      '<input list="daftarObatDatalistTambah" data-i="' + i + '" data-f="obat" placeholder="Nama obat" value="' + escapeHtml(item.obat || '') + '">' +
      '<input type="number" data-i="' + i + '" data-f="jumlah" placeholder="Jumlah" value="' + escapeHtml(item.jumlah != null ? String(item.jumlah) : '') + '">' +
      '<button type="button" onclick="hapusBarisObatRiwayat(' + i + ')">×</button></div>';
  });
  document.getElementById('riwayatObatContainer').innerHTML = html;
  document.querySelectorAll('#riwayatObatContainer .obat-row input').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var i = parseInt(this.getAttribute('data-i'), 10);
      var f = this.getAttribute('data-f');
      currentObatListRiwayat[i][f] = this.value;
    });
  });
}

function submitTambahJadwalRiwayat() {
  var nama = riwayatPasienAktif;
  if (!nama) return;

  var isoTanggal = document.getElementById('riwayatTambahTanggal').value;
  var siklusAwal = document.getElementById('riwayatTambahSiklusAwal').value.trim() || '1';
  var siklusAkhir = document.getElementById('riwayatTambahSiklusAkhir').value.trim() || siklusAwal;
  var interval = parseInt(document.getElementById('riwayatTambahInterval').value, 10);
  var statusEl = document.getElementById('riwayatTambahStatus');
  statusEl.className = 'status-msg';
  statusEl.textContent = '';

  if (!isoTanggal) { statusEl.className = 'status-msg error'; statusEl.textContent = 'Tanggal wajib diisi.'; return; }
  var obatValid = currentObatListRiwayat.filter(function (o) { return (o.obat || '').toString().trim() !== ''; });
  if (obatValid.length === 0) { statusEl.className = 'status-msg error'; statusEl.textContent = 'Isi minimal satu obat terlebih dahulu.'; return; }

  var siklusAwalNum = parseInt(siklusAwal, 10);
  var siklusAkhirNum = parseInt(siklusAkhir, 10);
  var totalSiklusCek = (!isNaN(siklusAwalNum) && !isNaN(siklusAkhirNum)) ? (siklusAkhirNum - siklusAwalNum + 1) : 1;
  if (totalSiklusCek > 1 && (!interval || interval < 1)) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Interval (hari) wajib diisi untuk membuat lebih dari 1 siklus sekaligus.';
    return;
  }

  document.getElementById('riwayatTambahSubmitBtn').disabled = true;
  statusEl.textContent = 'Menyimpan...';

  var tanggalAwalObj = new Date(isoTanggal + 'T00:00:00');

  sb.from('patients').select('id').ilike('nama', nama).maybeSingle().then(function (res) {
    if (!res.data) throw new Error('Data pasien tidak ditemukan.');
    var patientId = res.data.id;
    if (interval) sb.from('patients').update({ interval_hari: interval }).eq('id', patientId).then(function () {});
    return simpanBeberapaSiklusJadwal(patientId, tanggalAwalObj, siklusAwal, siklusAkhir, interval, obatValid);
  }).then(function (jumlahSiklusDibuat) {
    document.getElementById('riwayatTambahSubmitBtn').disabled = false;
    statusEl.className = 'status-msg ok';
    statusEl.textContent = 'Berhasil! ' + jumlahSiklusDibuat + ' siklus tersimpan.';
    invalidateCacheAndReload();
    document.getElementById('riwayatTambahSiklusAkhir').value = '';
    muatRiwayatPasienDetail(nama);
  }).catch(function (err) {
    document.getElementById('riwayatTambahSubmitBtn').disabled = false;
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Gagal: ' + err.message;
  });
}

// =====================================================================
// TAB 4: PASIEN TERTUNDA (FARMASI)
// =====================================================================
function muatPasienTertunda() {
  document.getElementById('loadingTertunda').style.display = 'block';
  document.getElementById('ringkasanTertunda').innerHTML = '';
  document.getElementById('contentTertunda').innerHTML = '';

  loadAllSchedules().then(function (list) {
    tertundaDimuat = true;
    document.getElementById('loadingTertunda').style.display = 'none';
    var tertunda = list.filter(function (s) { return s.keterangan.toLowerCase().indexOf('tertunda') !== -1; });
    tertunda.sort(function (a, b) { return a.dateObj.getTime() - b.dateObj.getTime(); });

    var totalGroups = {};
    tertunda.forEach(function (s) {
      s.items.forEach(function (it) {
        var key = it.obat.toLowerCase();
        if (!totalGroups[key]) totalGroups[key] = { obat: it.obat, totalJumlah: 0 };
        totalGroups[key].totalJumlah += it.jumlah;
      });
    });
    var totalObat = Object.keys(totalGroups).map(function (k) { return totalGroups[k]; }).sort(function (a, b) { return a.obat.localeCompare(b.obat); });
    var pasienList = tertunda.map(function (s) {
      return { id: s.id, patient_id: s.patient_id, nama: s.nama, tanggalAsal: s.tanggal, dateObj: s.dateObj, siklus: s.siklus, obatList: s.items };
    });

    renderTertunda({ pasienList: pasienList, totalObat: totalObat });
  }).catch(function (err) {
    document.getElementById('loadingTertunda').style.display = 'none';
    document.getElementById('ringkasanTertunda').innerText = 'Gagal memuat: ' + err.message;
  });
}

function renderTertunda(detail) {
  pasienListTerakhirTertunda = detail.pasienList;

  if (!detail.pasienList || detail.pasienList.length === 0) {
    document.getElementById('ringkasanTertunda').innerHTML = 'Tidak ada pasien yang berstatus Tertunda saat ini. 👍';
    return;
  }
  document.getElementById('ringkasanTertunda').innerHTML = detail.pasienList.length + ' pasien berstatus Tertunda';
  var html = '';
  detail.pasienList.forEach(function (p, i) {
    html += '<div class="card"><div class="nama" style="display:flex; justify-content:space-between; align-items:center;">' +
      '<span>' + escapeHtml(p.nama) + '</span>' + renderBadge('Tertunda') + '</div>' +
      '<div style="font-size:12px; color:var(--muted); margin-bottom:6px;">Jadwal asal: ' + p.tanggalAsal + ' (Siklus ' + escapeHtml(p.siklus) + ')</div>';
    p.obatList.forEach(function (o) { html += '<div class="obat-item"><span>' + escapeHtml(o.obat) + '</span><span class="obat-jumlah">' + o.jumlah + '</span></div>'; });

    html += '<div style="display:flex; gap:6px; margin-top:8px;">';
    html += '<button type="button" onclick="batalkanTundaTertunda(' + i + ')" class="btn-neutral" style="flex:1;">Batalkan Tunda</button>';
    html += '<button type="button" onclick="toggleUbahTanggalTertunda(' + i + ')" class="btn-accent" style="flex:1;">Ubah Jadwal</button>';
    html += '<button type="button" onclick="hapusJadwalTertunda(' + i + ')" class="btn-danger" style="flex:1;">Hapus Jadwal</button>';
    html += '</div>';

    html += '<div id="ubahTanggalTertunda' + i + '" style="display:none; margin-top:8px; background:var(--surface-2); border-radius:8px; padding:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Tanggal Baru</label>';
    html += '<input type="date" id="tanggalBaruTertunda' + i + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<label style="display:flex; align-items:center; gap:6px; font-size:11px; margin-bottom:6px;">';
    html += '<input type="checkbox" id="hapusTundaSetelahUbah' + i + '" checked style="width:auto; margin:0;"> Hapus tanda tertunda setelah dijadwal ulang';
    html += '</label>';
    html += '<label style="display:flex; align-items:center; gap:6px; font-size:11px;">';
    html += '<input type="checkbox" id="geserBerikutnyaTertunda' + i + '" checked style="width:auto; margin:0;"> Geser juga jadwal berikutnya (selisih hari sama, jadwal sebelumnya tidak berubah)';
    html += '</label>';
    html += '<button type="button" onclick="simpanUbahTanggalTertunda(' + i + ')" class="btn-primary" style="margin-top:8px;">Simpan Tanggal Baru</button>';
    html += '</div>';

    html += '</div>';
  });
  html += '<div class="total-section"><h2>Total Kebutuhan Obat (Jika Semua Dijadwalkan Ulang)</h2>';
  detail.totalObat.forEach(function (t) { html += '<div class="total-item"><span>' + escapeHtml(t.obat) + '</span><span>' + t.totalJumlah + '</span></div>'; });
  html += '</div>';
  document.getElementById('contentTertunda').innerHTML = html;
}

function batalkanTundaTertunda(i) {
  var p = pasienListTerakhirTertunda[i];
  if (!p) return;
  document.getElementById('loadingTertunda').style.display = 'block';
  document.getElementById('loadingTertunda').innerText = 'Membatalkan tanda...';

  loadAllSchedules().then(function (list) {
    var s = list.find(function (x) { return x.id === p.id; });
    var ketLama = s ? s.keterangan : '';
    var ketBaru = ketLama.replace(/tertunda\s*;?\s*/gi, '').replace(/;\s*$/, '').trim();
    return sb.from('schedules').update({ keterangan: ketBaru }).eq('id', p.id);
  }).then(function (res) {
    if (res && res.error) throw res.error;
    invalidateCacheAndReload();
    muatPasienTertunda();
  }).catch(function (err) {
    document.getElementById('loadingTertunda').style.display = 'none';
    alert('Gagal: ' + err.message);
  });
}

function toggleUbahTanggalTertunda(i) {
  var el = document.getElementById('ubahTanggalTertunda' + i);
  el.style.display = (el.style.display === 'none') ? 'block' : 'none';
}

function simpanUbahTanggalTertunda(i) {
  var p = pasienListTerakhirTertunda[i];
  if (!p) return;
  var iso = document.getElementById('tanggalBaruTertunda' + i).value;
  if (!iso) { alert('Pilih tanggal baru terlebih dahulu.'); return; }
  var hapusTunda = document.getElementById('hapusTundaSetelahUbah' + i).checked;
  var geser = document.getElementById('geserBerikutnyaTertunda' + i).checked;

  document.getElementById('loadingTertunda').style.display = 'block';
  document.getElementById('loadingTertunda').innerText = 'Menyimpan perubahan...';

  var tanggalLamaObj = dateOnly(p.dateObj);
  var parts = iso.split('-');
  var tanggalBaruObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  var deltaDays = Math.round((tanggalBaruObj.getTime() - tanggalLamaObj.getTime()) / 86400000);

  loadAllSchedules().then(function (list) {
    var s = list.find(function (x) { return x.id === p.id; });
    var ketBaru = s ? s.keterangan : '';
    if (hapusTunda) ketBaru = ketBaru.replace(/tertunda\s*;?\s*/gi, '').replace(/;\s*$/, '').trim();

    var updates = [sb.from('schedules').update({ tanggal: iso, keterangan: ketBaru }).eq('id', p.id)];
    if (geser && deltaDays !== 0) {
      list.forEach(function (row) {
        if (row.id === p.id) return;
        if (row.patient_id !== p.patient_id) return;
        if (dateOnly(row.dateObj).getTime() > tanggalLamaObj.getTime()) {
          var geseredDate = new Date(row.dateObj.getTime() + deltaDays * 86400000);
          updates.push(sb.from('schedules').update({ tanggal: toIsoDate(geseredDate) }).eq('id', row.id));
        }
      });
    }
    return Promise.all(updates);
  }).then(function (results) {
    var failed = results.find(function (r) { return r.error; });
    if (failed) throw failed.error;
    invalidateCacheAndReload();
    muatPasienTertunda();
  }).catch(function (err) {
    document.getElementById('loadingTertunda').style.display = 'none';
    alert('Gagal: ' + err.message);
  });
}

function hapusJadwalTertunda(i) {
  var p = pasienListTerakhirTertunda[i];
  if (!p) return;
  var konfirmasi = window.confirm('Yakin mau menghapus jadwal ' + p.nama + ' (Siklus ' + p.siklus + ') pada ' + p.tanggalAsal + '?\n\nTindakan ini tidak bisa dibatalkan.');
  if (!konfirmasi) return;

  document.getElementById('loadingTertunda').style.display = 'block';
  document.getElementById('loadingTertunda').innerText = 'Menghapus...';

  sb.from('schedules').delete().eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateCacheAndReload();
    muatPasienTertunda();
  }).catch(function (err) {
    document.getElementById('loadingTertunda').style.display = 'none';
    alert('Gagal: ' + err.message);
  });
}

// =====================================================================
// TAB 5: DASHBOARD (FARMASI)
// =====================================================================
function muatDashboard() {
  document.getElementById('loadingDashboard').style.display = 'block';
  document.getElementById('contentDashboard').innerHTML = '';

  Promise.all([loadAllSchedules(), sb.from('v_patient_summary').select('nama, perkiraan_kemo_berikutnya')]).then(function (results) {
    var list = results[0];
    var summaryRes = results[1];
    dashboardDimuat = true;
    document.getElementById('loadingDashboard').style.display = 'none';

    var hariIni = dateOnly(new Date());
    var awalMinggu = new Date(hariIni.getTime() - 6 * 86400000);
    var awalBulan = new Date(hariIni.getFullYear(), hariIni.getMonth(), 1);
    var akhirBulan = new Date(hariIni.getFullYear(), hariIni.getMonth() + 1, 0);

    var pasienMinggu = {}, pasienBulan = {}, tertundaSet = {};
    list.forEach(function (s) {
      var d = dateOnly(s.dateObj);
      if (d.getTime() >= awalMinggu.getTime() && d.getTime() <= hariIni.getTime()) pasienMinggu[s.nama] = true;
      if (d.getTime() >= awalBulan.getTime() && d.getTime() <= akhirBulan.getTime()) pasienBulan[s.nama] = true;
      if (s.keterangan.toLowerCase().indexOf('tertunda') !== -1) tertundaSet[s.nama + '|' + s.tanggal] = true;
    });

    var pasienBerpotensiHilang = [];
    if (!summaryRes.error && summaryRes.data) {
      summaryRes.data.forEach(function (row) {
        if (!row.perkiraan_kemo_berikutnya) return;
        var perkiraanD = new Date(row.perkiraan_kemo_berikutnya + 'T00:00:00');
        var selisihHari = Math.floor((hariIni.getTime() - perkiraanD.getTime()) / 86400000);
        if (selisihHari > 7) {
          var adaJadwalAkanDatang = list.some(function (s) { return s.nama.toLowerCase() === row.nama.toLowerCase() && dateOnly(s.dateObj).getTime() >= hariIni.getTime(); });
          if (!adaJadwalAkanDatang) pasienBerpotensiHilang.push({ nama: row.nama, terlambatHari: selisihHari });
        }
      });
      pasienBerpotensiHilang.sort(function (a, b) { return b.terlambatHari - a.terlambatHari; });
    }

    renderDashboard({
      totalPasienMingguIni: Object.keys(pasienMinggu).length,
      totalPasienBulanIni: Object.keys(pasienBulan).length,
      totalTertunda: Object.keys(tertundaSet).length,
      pasienBerpotensiHilang: pasienBerpotensiHilang
    });
    muatGrafikPasien(modeGrafikPasienAktif);
  }).catch(function (err) {
    document.getElementById('loadingDashboard').style.display = 'none';
    document.getElementById('contentDashboard').innerHTML = 'Gagal memuat: ' + escapeHtml(err.message);
  });
}

function renderDashboard(r) {
  var html = '<div style="display:flex; gap:10px; margin-bottom:14px;">';
  html += '<div class="card" style="flex:1; text-align:center;"><div style="font-size:26px; font-weight:700; color:var(--accent-dim); font-family:var(--font-mono);">' + r.totalPasienMingguIni + '</div><div style="font-size:12px; color:var(--muted);">Pasien Minggu Ini</div></div>';
  html += '<div class="card" style="flex:1; text-align:center;"><div style="font-size:26px; font-weight:700; color:var(--success); font-family:var(--font-mono);">' + r.totalPasienBulanIni + '</div><div style="font-size:12px; color:var(--muted);">Pasien Bulan Ini</div></div>';
  html += '<div class="card" style="flex:1; text-align:center;"><div style="font-size:26px; font-weight:700; color:var(--danger); font-family:var(--font-mono);">' + r.totalTertunda + '</div><div style="font-size:12px; color:var(--muted);">Tertunda</div></div>';
  html += '</div>';

  html += '<div class="total-section"><h2>Jumlah Pasien Kemo</h2>';
  html += '<div style="display:flex; gap:8px; margin-bottom:12px;">';
  html += '<button onclick="muatGrafikPasien(\'bulan\')" id="btnGrafikBulan" style="flex:1; border:none; border-radius:16px; padding:8px; font-size:12px; font-weight:600;">Per Bulan</button>';
  html += '<button onclick="muatGrafikPasien(\'minggu\')" id="btnGrafikMinggu" style="flex:1; border:none; border-radius:16px; padding:8px; font-size:12px; font-weight:600;">Per Minggu</button>';
  html += '</div>';
  html += '<div id="loadingGrafikPasien" style="text-align:center; color:var(--muted); font-size:12px; padding:10px; display:none;">Memuat...</div>';
  html += '<div id="grafikPasienContainer"></div></div>';

  if (r.pasienBerpotensiHilang.length > 0) {
    html += '<div class="card" style="margin-top:14px; border-left:4px solid var(--danger);">';
    html += '<div class="nama" style="font-size:14px;">⚠️ Berpotensi Belum Follow-up (' + r.pasienBerpotensiHilang.length + ')</div>';
    html += '<div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Perkiraan jadwal berikutnya sudah lewat &gt;7 hari, belum ada jadwal baru</div>';
    r.pasienBerpotensiHilang.forEach(function (p) {
      html += '<div class="obat-item"><span>' + escapeHtml(p.nama) + '</span><span style="color:var(--danger); font-weight:600;">' + p.terlambatHari + ' hari</span></div>';
    });
    html += '</div>';
  }

  document.getElementById('contentDashboard').innerHTML = html;
  setActiveGrafikButton();
}

function setActiveGrafikButton() {
  var btnBulan = document.getElementById('btnGrafikBulan');
  var btnMinggu = document.getElementById('btnGrafikMinggu');
  if (!btnBulan || !btnMinggu) return;
  btnBulan.style.background = (modeGrafikPasienAktif === 'bulan') ? 'var(--accent)' : 'var(--surface-2)';
  btnBulan.style.color = (modeGrafikPasienAktif === 'bulan') ? 'var(--accent-contrast)' : 'var(--label)';
  btnMinggu.style.background = (modeGrafikPasienAktif === 'minggu') ? 'var(--accent)' : 'var(--surface-2)';
  btnMinggu.style.color = (modeGrafikPasienAktif === 'minggu') ? 'var(--accent-contrast)' : 'var(--label)';
}

function muatGrafikPasien(mode) {
  modeGrafikPasienAktif = mode;
  setActiveGrafikButton();
  var loadingEl = document.getElementById('loadingGrafikPasien');
  var containerEl = document.getElementById('grafikPasienContainer');
  if (!loadingEl || !containerEl) return;
  loadingEl.style.display = 'block';
  containerEl.innerHTML = '';

  loadAllSchedules().then(function (list) {
    loadingEl.style.display = 'none';
    var hariIni = dateOnly(new Date());
    var labels = [], values = [];

    if (mode === 'minggu') {
      var jumlahPeriode = 8;
      var buckets = [];
      for (var i = jumlahPeriode - 1; i >= 0; i--) {
        var akhir = new Date(hariIni.getTime() - i * 7 * 86400000);
        var mulai = new Date(akhir.getTime() - 6 * 86400000);
        buckets.push({ mulai: mulai, akhir: akhir, pasienSet: {} });
      }
      list.forEach(function (s) {
        var d = dateOnly(s.dateObj);
        for (var b = 0; b < buckets.length; b++) {
          if (d.getTime() >= buckets[b].mulai.getTime() && d.getTime() <= buckets[b].akhir.getTime()) { buckets[b].pasienSet[s.nama] = true; break; }
        }
      });
      labels = buckets.map(function (b) { return pad2(b.mulai.getDate()) + '/' + pad2(b.mulai.getMonth() + 1) + '-' + pad2(b.akhir.getDate()) + '/' + pad2(b.akhir.getMonth() + 1); });
      values = buckets.map(function (b) { return Object.keys(b.pasienSet).length; });
    } else {
      var jumlahPeriode2 = 6;
      var bBuckets = [];
      for (var i2 = jumlahPeriode2 - 1; i2 >= 0; i2--) {
        var d2 = new Date(hariIni.getFullYear(), hariIni.getMonth() - i2, 1);
        bBuckets.push({ tahun: d2.getFullYear(), bulan: d2.getMonth() + 1, pasienSet: {} });
      }
      list.forEach(function (s) {
        for (var b2 = 0; b2 < bBuckets.length; b2++) {
          if (s.dateObj.getFullYear() === bBuckets[b2].tahun && (s.dateObj.getMonth() + 1) === bBuckets[b2].bulan) { bBuckets[b2].pasienSet[s.nama] = true; break; }
        }
      });
      labels = bBuckets.map(function (b) { return NAMA_BULAN_SINGKAT[b.bulan - 1] + ' ' + b.tahun; });
      values = bBuckets.map(function (b) { return Object.keys(b.pasienSet).length; });
    }
    renderGrafikPasien({ labels: labels, values: values });
  });
}

function renderGrafikPasien(data) {
  var containerEl = document.getElementById('grafikPasienContainer');
  if (!containerEl) return;
  if (!data.values || data.values.length === 0) {
    containerEl.innerHTML = '<div style="text-align:center; color:var(--muted); font-size:12px; padding:10px;">Belum ada data.</div>';
    return;
  }
  var maxVal = Math.max.apply(null, data.values.concat([1]));
  var html = '<div style="display:flex; align-items:flex-end; gap:6px; height:140px;">';
  data.values.forEach(function (v) {
    var tinggiPersen = (v / maxVal) * 100;
    html += '<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">' +
      '<div style="font-size:11px; font-weight:600; margin-bottom:2px;">' + v + '</div>' +
      '<div style="width:100%; background:linear-gradient(180deg, var(--accent), var(--accent-dim)); border-radius:4px 4px 0 0; height:' + tinggiPersen + '%; min-height:2px; box-shadow:0 2px 6px rgba(14,148,136,0.25);"></div></div>';
  });
  html += '</div><div style="display:flex; gap:6px; margin-top:6px;">';
  data.labels.forEach(function (l) { html += '<div style="flex:1; text-align:center; font-size:9px; color:var(--muted);">' + escapeHtml(l) + '</div>'; });
  html += '</div>';
  containerEl.innerHTML = html;
}

// =====================================================================
// TAB 6: CARI OBAT (FARMASI)
// =====================================================================
function muatDaftarObatUntukPencarian() {
  isiDatalistObat('daftarObatDatalistMobile').then(function () {
    obatDatalistDimuat = true;
  });
}
document.getElementById('obatSearchInput').addEventListener('change', function () {
  var namaObat = this.value.trim();
  document.getElementById('contentCariObat').innerHTML = '';
  document.getElementById('ringkasanCariObat').innerHTML = '';
  if (!namaObat) return;
  document.getElementById('loadingCariObat').style.display = 'block';

  loadAllSchedules().then(function (list) {
    document.getElementById('loadingCariObat').style.display = 'none';
    var daftar = [];
    var totalPemakaian = 0;
    var hariIni = dateOnly(new Date());
    list.forEach(function (s) {
      s.items.forEach(function (it) {
        if (it.obat.toLowerCase() !== namaObat.toLowerCase()) return;
        daftar.push({ nama: s.nama, siklus: s.siklus, tanggal: s.tanggal, jumlah: it.jumlah, dateObj: s.dateObj });
        totalPemakaian += it.jumlah;
      });
    });
    daftar.sort(function (a, b) { return Math.abs(a.dateObj.getTime() - hariIni.getTime()) - Math.abs(b.dateObj.getTime() - hariIni.getTime()); });
    renderHasilCariObat({ obat: namaObat, daftar: daftar, totalPemakaian: totalPemakaian });
  }).catch(function (err) {
    document.getElementById('loadingCariObat').style.display = 'none';
    document.getElementById('ringkasanCariObat').innerText = 'Gagal memuat: ' + err.message;
  });
});

function renderHasilCariObat(res) {
  if (!res.daftar || res.daftar.length === 0) {
    document.getElementById('ringkasanCariObat').innerHTML = 'Tidak ditemukan pemakaian untuk "' + escapeHtml(res.obat) + '".';
    return;
  }
  document.getElementById('ringkasanCariObat').innerHTML = res.daftar.length + ' kali pemakaian "' + escapeHtml(res.obat) + '" (total ' + res.totalPemakaian + '), dari yang paling baru';
  var html = '';
  res.daftar.forEach(function (item) {
    html += '<div class="card"><div class="nama" style="display:flex; justify-content:space-between; align-items:center;">' +
      '<span>' + escapeHtml(item.nama) + '</span><span style="font-size:12px; color:var(--muted); font-weight:normal;">Siklus ' + escapeHtml(item.siklus) + '</span></div>' +
      '<div class="obat-item"><span>' + item.tanggal + '</span><span class="obat-jumlah">' + item.jumlah + '</span></div></div>';
  });
  document.getElementById('contentCariObat').innerHTML = html;
}

// =====================================================================
// TAB 7: DAFTARKAN PASIEN (FARMASI)
// =====================================================================
function muatDataUntukTambah() {
  sb.from('patients').select('nama').order('nama').then(function (res) {
    if (res.error) return;
    var dl = document.getElementById('patientDatalistTambah');
    dl.innerHTML = '';
    res.data.forEach(function (row) {
      var opt = document.createElement('option');
      opt.value = row.nama;
      dl.appendChild(opt);
    });
  });
  isiDatalistObat('daftarObatDatalistTambah');
  if (currentObatList.length === 0) {
    currentObatList = [{ obat: '', jumlah: '' }];
    renderObatTable(currentObatList);
  }
}

document.getElementById('tambahPatientSelect').addEventListener('change', function () {
  var nama = this.value.trim();
  var infoEl = document.getElementById('regimenInfo');
  infoEl.innerHTML = '';
  document.getElementById('tambahSiklusAkhir').value = '';
  if (!nama) return;

  Promise.all([
    sb.from('patients').select('interval_hari').ilike('nama', nama).maybeSingle(),
    loadAllSchedules()
  ]).then(function (results) {
    var patientRow = results[0].data;
    if (patientRow && patientRow.interval_hari) document.getElementById('tambahInterval').value = patientRow.interval_hari;

    var list = results[1];
    var mine = list.filter(function (s) { return s.nama.toLowerCase() === nama.toLowerCase(); });
    if (mine.length === 0) {
      infoEl.innerHTML = 'Belum ada histori kemo untuk pasien ini (pasien baru). Silakan isi obat secara manual di bawah.';
      document.getElementById('tambahSiklusAwal').value = '1';
      currentObatList = [{ obat: '', jumlah: '' }];
      renderObatTable(currentObatList);
      return;
    }
    mine.sort(function (a, b) { return b.dateObj.getTime() - a.dateObj.getTime(); });
    var last = mine[0];
    infoEl.innerHTML = 'Kemo terakhir: ' + last.tanggal + ' (Siklus ' + escapeHtml(last.siklus) + '). Regimen di bawah otomatis dipindahkan, tinggal atur tanggal & siklus lalu simpan.';
    var siklusNum = parseInt(last.siklus, 10);
    document.getElementById('tambahSiklusAwal').value = isNaN(siklusNum) ? '' : (siklusNum + 1);
    currentObatList = last.items.map(function (it) { return { obat: it.obat, jumlah: it.jumlah }; });
    if (currentObatList.length === 0) currentObatList = [{ obat: '', jumlah: '' }];
    renderObatTable(currentObatList);
  });
});

document.getElementById('tambahTanggal').addEventListener('change', function () {
  var nama = document.getElementById('tambahPatientSelect').value.trim();
  var warnDiv = document.getElementById('intervalWarning');
  warnDiv.style.display = 'none';
  warnDiv.innerText = '';
  if (!nama || !this.value) return;

  var tanggalBaruObj = new Date(this.value + 'T00:00:00');
  loadAllSchedules().then(function (list) {
    var mine = list.filter(function (s) { return s.nama.toLowerCase() === nama.toLowerCase(); });
    if (mine.length === 0) return;
    mine.sort(function (a, b) { return b.dateObj.getTime() - a.dateObj.getTime(); });
    var last = mine[0];
    var selisih = Math.round((tanggalBaruObj.getTime() - last.dateObj.getTime()) / 86400000);
    return sb.from('patients').select('interval_hari').ilike('nama', nama).maybeSingle().then(function (res) {
      var interval = res.data ? res.data.interval_hari : null;
      if (interval && selisih !== interval && selisih > 0) {
        warnDiv.innerText = 'Interval biasanya ' + interval + ' hari untuk pasien ini, tapi jadwal ini berselisih ' + selisih + ' hari dari kemo terakhir (' + last.tanggal + '). Cek kembali kalau ini tidak disengaja.';
        warnDiv.style.display = 'block';
      }
    });
  });
});

function tambahBarisObatKosong() {
  currentObatList.push({ obat: '', jumlah: '' });
  renderObatTable(currentObatList);
}
function hapusBarisObat(i) {
  currentObatList.splice(i, 1);
  renderObatTable(currentObatList);
}
function renderObatTable(list) {
  var html = '';
  list.forEach(function (item, i) {
    html += '<div class="obat-row">' +
      '<input list="daftarObatDatalistTambah" data-i="' + i + '" data-f="obat" placeholder="Nama obat" value="' + escapeHtml(item.obat || '') + '">' +
      '<input type="number" data-i="' + i + '" data-f="jumlah" placeholder="Jumlah" value="' + escapeHtml(item.jumlah != null ? String(item.jumlah) : '') + '">' +
      '<button type="button" onclick="hapusBarisObat(' + i + ')">×</button></div>';
  });
  document.getElementById('obatContainer').innerHTML = html;
  document.querySelectorAll('#obatContainer .obat-row input').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var i = parseInt(this.getAttribute('data-i'), 10);
      var f = this.getAttribute('data-f');
      currentObatList[i][f] = this.value;
    });
  });
}

function submitTambahJadwal() {
  var nama = document.getElementById('tambahPatientSelect').value.trim();
  var isoTanggal = document.getElementById('tambahTanggal').value;
  var siklusAwal = document.getElementById('tambahSiklusAwal').value.trim() || '1';
  var siklusAkhir = document.getElementById('tambahSiklusAkhir').value.trim() || siklusAwal;
  var interval = parseInt(document.getElementById('tambahInterval').value, 10);
  var statusEl = document.getElementById('tambahStatus');
  statusEl.className = 'status-msg';
  statusEl.textContent = '';

  if (!nama || !isoTanggal) { statusEl.className = 'status-msg error'; statusEl.textContent = 'Nama pasien dan tanggal wajib diisi.'; return; }
  var obatValid = currentObatList.filter(function (o) { return (o.obat || '').toString().trim() !== ''; });
  if (obatValid.length === 0) { statusEl.className = 'status-msg error'; statusEl.textContent = 'Isi minimal satu obat terlebih dahulu.'; return; }

  var siklusAwalNum = parseInt(siklusAwal, 10);
  var siklusAkhirNum = parseInt(siklusAkhir, 10);
  var totalSiklus = (!isNaN(siklusAwalNum) && !isNaN(siklusAkhirNum)) ? (siklusAkhirNum - siklusAwalNum + 1) : 1;
  if (totalSiklus > 1 && (!interval || interval < 1)) {
    statusEl.className = 'status-msg error'; statusEl.textContent = 'Interval (hari) wajib diisi untuk membuat lebih dari 1 siklus sekaligus.'; return;
  }

  document.getElementById('tambahSubmitBtn').disabled = true;
  statusEl.textContent = 'Menyimpan...';

  var tanggalAwalObj = new Date(isoTanggal + 'T00:00:00');

  sb.from('patients').select('id').ilike('nama', nama).maybeSingle().then(function (res) {
    if (res.data) return res.data.id;
    return sb.from('patients').insert({ nama: nama, interval_hari: interval || null }).select('id').single().then(function (r) {
      if (r.error) throw r.error;
      return r.data.id;
    });
  }).then(function (patientId) {
    if (interval) sb.from('patients').update({ interval_hari: interval }).eq('id', patientId).then(function () {});
    return simpanBeberapaSiklusJadwal(patientId, tanggalAwalObj, siklusAwal, siklusAkhir, interval, obatValid);
  }).then(function (jumlahSiklusDibuat) {
    document.getElementById('tambahSubmitBtn').disabled = false;
    statusEl.className = 'status-msg ok';
    statusEl.textContent = 'Berhasil! ' + jumlahSiklusDibuat + ' siklus tersimpan.';
    invalidateCacheAndReload();
    document.getElementById('tambahSiklusAkhir').value = '';
  }).catch(function (err) {
    document.getElementById('tambahSubmitBtn').disabled = false;
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Gagal: ' + err.message;
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

function loadAllNurseSchedules(forceReload) {
  if (nurseAllSchedulesCache && !forceReload) return Promise.resolve(nurseAllSchedulesCache);

  return sb.from('nurse_schedules')
    .select('id, patient_id, tanggal_mulai, siklus, lama_hari, keterangan, nurse_patients(nama, no_rm, diagnosa, dpjp)')
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
          keterangan: row.keterangan || ''
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
  document.getElementById('loadingKalenderPerawat').style.display = 'block';

  loadAllNurseSchedules().then(function (list) {
    document.getElementById('loadingKalenderPerawat').style.display = 'none';
    var hariData = {};
    list.forEach(function (s) {
      for (var h = 0; h < s.lamaHari; h++) {
        var tglSel = new Date(s.dateObjMulai.getTime() + h * 86400000);
        if (tglSel.getFullYear() !== tahun || (tglSel.getMonth() + 1) !== bulan) continue;
        var hari = tglSel.getDate();
        if (!hariData[hari]) hariData[hari] = { entriSet: {}, adaTertunda: false };
        var teks = s.nama + (s.siklus ? (' — Siklus ' + s.siklus) : '') + ' (H' + (h + 1) + ')';
        hariData[hari].entriSet[teks] = true;
        if (s.keterangan.toLowerCase().indexOf('tertunda') !== -1) hariData[hari].adaTertunda = true;
      }
    });
    var hasil = {};
    Object.keys(hariData).forEach(function (h) {
      hasil[h] = { daftarPasien: Object.keys(hariData[h].entriSet).sort(), adaTertunda: hariData[h].adaTertunda };
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
    if (info && info.adaTertunda) kelas += ' ada-tertunda';
    if (isBulanIni && hariIni.getDate() === tgl) kelas += ' hari-ini';
    if (isBulanTerpilih && nurseTanggalAktif.getDate() === tgl) kelas += ' terpilih';

    html += '<div class="' + kelas + '" onclick="pilihTanggalKalenderPerawat(' + tgl + ')"><div class="kal-tgl-num">' + tgl + '</div>';
    if (info) info.daftarPasien.forEach(function (entri) { html += '<div class="kal-entri">' + escapeHtml(entri) + '</div>'; });
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
  document.getElementById('loadingKalPerawatDetail').style.display = 'block';
  document.getElementById('loadingKalPerawatDetail').innerText = 'Memuat jadwal...';
  document.getElementById('kalPerawatDetailContainer').innerHTML = '';

  loadAllNurseSchedules().then(function (list) {
    document.getElementById('loadingKalPerawatDetail').style.display = 'none';
    var target = dateOnly(nurseTanggalAktif).getTime();
    var matches = [];
    list.forEach(function (s) {
      for (var h = 0; h < s.lamaHari; h++) {
        var tglSel = dateOnly(new Date(s.dateObjMulai.getTime() + h * 86400000));
        if (tglSel.getTime() === target) {
          matches.push({
            id: s.id, nama: s.nama, noRm: s.noRm, diagnosa: s.diagnosa, dpjp: s.dpjp,
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
    document.getElementById('kalPerawatDetailContainer').innerHTML = '<div class="empty">Tidak ada jadwal kemoterapi pada tanggal ini.</div>';
    return;
  }

  var html = '<div class="ringkasan-jumlah">' + matches.length + ' pasien terjadwal</div>';
  matches.forEach(function (p, i) {
    html += '<div class="card"><div class="nama" style="display:flex; justify-content:space-between; align-items:center;">' +
      '<span>' + escapeHtml(p.nama) + '</span>' + renderBadge(p.status) + '</div>';
    html += '<div style="font-size:12px; color:var(--muted); margin-bottom:6px;">' +
      (p.noRm ? ('No. RM ' + escapeHtml(p.noRm) + ' &middot; ') : '') +
      (p.diagnosa ? (escapeHtml(p.diagnosa) + ' &middot; ') : '') +
      (p.dpjp ? ('DPJP: ' + escapeHtml(p.dpjp)) : '') + '</div>';
    html += '<div class="obat-item"><span>Siklus ' + escapeHtml(p.siklus || '-') + '</span><span class="obat-jumlah">H' + p.hariKe + ' dari ' + p.lamaHari + '</span></div>';

    if (p.status === 'Tertunda') {
      html += '<button type="button" onclick="toggleTertundaPerawat(' + i + ', false)" class="btn-neutral" style="margin-top:8px;">Batalkan Tanda Tertunda</button>';
    } else {
      html += '<button type="button" onclick="toggleTertundaPerawat(' + i + ', true)" class="btn-danger" style="margin-top:8px;">Tandai Tertunda</button>';
    }

    html += '<div style="display:flex; gap:6px; margin-top:6px;">';
    html += '<button type="button" onclick="toggleUbahTanggalPerawat(' + i + ')" class="btn-accent" style="flex:1;">Ubah Jadwal</button>';
    html += '<button type="button" onclick="hapusJadwalPerawatDariKalender(' + i + ')" style="flex:1; background:var(--danger); color:white; border:none; border-radius:16px; padding:8px 6px; font-size:12px;">Hapus Jadwal</button>';
    html += '</div>';

    html += '<div id="ubahTanggalPerawat' + i + '" style="display:none; margin-top:8px; background:var(--surface-2); border-radius:8px; padding:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Tanggal Mulai Baru</label>';
    html += '<input type="date" id="tanggalBaruPerawat' + i + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Lama Hari</label>';
    html += '<input type="number" id="lamaHariBaruPerawat' + i + '" min="1" value="' + p.lamaHari + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<button type="button" onclick="simpanUbahJadwalPerawat(' + i + ')" style="width:100%; background:var(--success); color:#fff; border:none; border-radius:16px; padding:8px; font-size:12px; font-weight:600;">Simpan</button>';
    html += '</div>';
    html += '</div>';
  });

  document.getElementById('kalPerawatDetailContainer').innerHTML = html;
}

function toggleTertundaPerawat(i, jadiTertunda) {
  var p = nursePasienListTerakhirTanggal[i];
  if (!p) return;
  document.getElementById('loadingKalPerawatDetail').style.display = 'block';
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
    document.getElementById('loadingKalPerawatDetail').style.display = 'none';
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

  document.getElementById('loadingKalPerawatDetail').style.display = 'block';
  document.getElementById('loadingKalPerawatDetail').innerText = 'Menyimpan perubahan...';

  sb.from('nurse_schedules').update({ tanggal_mulai: iso, lama_hari: lamaHariBaru }).eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateNurseCacheAndReload();
    muatDetailTanggalPerawat();
  }).catch(function (err) {
    document.getElementById('loadingKalPerawatDetail').style.display = 'none';
    alert('Gagal: ' + err.message);
  });
}

function hapusJadwalPerawatDariKalender(i) {
  var p = nursePasienListTerakhirTanggal[i];
  if (!p) return;
  var konfirmasi = window.confirm('Yakin mau menghapus jadwal ' + p.nama + ' (Siklus ' + p.siklus + ')?\n\nSeluruh rentang hari (H1-H' + p.lamaHari + ') untuk siklus ini akan terhapus. Tindakan ini tidak bisa dibatalkan.');
  if (!konfirmasi) return;

  document.getElementById('loadingKalPerawatDetail').style.display = 'block';
  document.getElementById('loadingKalPerawatDetail').innerText = 'Menghapus...';

  sb.from('nurse_schedules').delete().eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateNurseCacheAndReload();
    muatDetailTanggalPerawat();
  }).catch(function (err) {
    document.getElementById('loadingKalPerawatDetail').style.display = 'none';
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
  document.getElementById('loadingRiwayatPerawatList').style.display = 'block';
  Promise.all([
    sb.from('nurse_patients').select('id, nama, no_rm').order('nama'),
    loadAllNurseSchedules()
  ]).then(function (results) {
    var patientsRes = results[0];
    var schedules = results[1];
    document.getElementById('loadingRiwayatPerawatList').style.display = 'none';
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
    document.getElementById('loadingRiwayatPerawatList').style.display = 'none';
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
    container.innerHTML = '<div class="empty">Tidak ada pasien yang cocok.</div>';
    return;
  }

  var html = '<div class="pasien-list-card">';
  filtered.forEach(function (p, idx) {
    html += '<div class="pasien-item" data-idx="' + idx + '"><span>' + escapeHtml(p.nama) +
      (p.noRm ? ' <span style="color:var(--muted); font-size:12px;">&middot; RM ' + escapeHtml(p.noRm) + '</span>' : '') +
      '</span><span style="color:var(--muted);">&rsaquo;</span></div>';
  });
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.pasien-item').forEach(function (el) {
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
  document.getElementById('loadingRiwayatPerawat').style.display = 'block';
  document.getElementById('loadingRiwayatPerawat').innerText = 'Memuat riwayat...';

  loadAllNurseSchedules().then(function (list) {
    document.getElementById('loadingRiwayatPerawat').style.display = 'none';
    var mine = list.filter(function (s) { return s.nama.toLowerCase() === nama.toLowerCase(); });
    mine.sort(function (a, b) { return a.dateObjMulai.getTime() - b.dateObjMulai.getTime(); });

    nursePasienListTerakhirRiwayat = mine.map(function (s) {
      return {
        id: s.id, patient_id: s.patient_id, tanggalMulai: s.tanggalMulai, dateObjMulai: s.dateObjMulai,
        siklus: s.siklus, lamaHari: s.lamaHari, keterangan: s.keterangan,
        noRm: s.noRm, diagnosa: s.diagnosa, dpjp: s.dpjp,
        status: hitungStatus(s.dateObjMulai, s.keterangan)
      };
    });

    renderRiwayatPerawat(nama, nursePasienListTerakhirRiwayat);
    siapkanFormTambahRiwayatPerawat(nama, mine);
  }).catch(function (err) {
    document.getElementById('loadingRiwayatPerawat').innerText = 'Gagal memuat: ' + err.message;
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

    html += '<div style="display:flex; gap:6px; margin-top:8px;">';
    html += '<button type="button" onclick="toggleUbahTanggalRiwayatPerawat(' + i + ')" class="btn-accent" style="flex:1;">Ubah Jadwal</button>';
    html += '<button type="button" onclick="hapusJadwalRiwayatPerawat(' + i + ')" class="btn-danger" style="flex:1;">Hapus Jadwal</button>';
    html += '</div>';

    html += '<div id="ubahTanggalRiwayatPerawat' + i + '" style="display:none; margin-top:8px; background:var(--surface-2); border-radius:8px; padding:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Tanggal Mulai Baru</label>';
    html += '<input type="date" id="tanggalBaruRiwayatPerawat' + i + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
    html += '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:3px;">Lama Hari</label>';
    html += '<input type="number" id="lamaHariBaruRiwayatPerawat' + i + '" min="1" value="' + item.lamaHari + '" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-strong); font-size:13px; margin-bottom:8px;">';
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
  var iso = document.getElementById('tanggalBaruRiwayatPerawat' + i).value;
  var lamaHariBaru = parseInt(document.getElementById('lamaHariBaruRiwayatPerawat' + i).value, 10);
  if (!iso) { alert('Pilih tanggal mulai baru terlebih dahulu.'); return; }
  if (!lamaHariBaru || lamaHariBaru < 1) { alert('Lama hari minimal 1.'); return; }

  document.getElementById('loadingRiwayatPerawat').style.display = 'block';
  document.getElementById('loadingRiwayatPerawat').innerText = 'Menyimpan perubahan...';

  sb.from('nurse_schedules').update({ tanggal_mulai: iso, lama_hari: lamaHariBaru }).eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateNurseCacheAndReload();
    muatRiwayatPasienDetailPerawat(nurseRiwayatPasienAktif);
  }).catch(function (err) {
    document.getElementById('loadingRiwayatPerawat').style.display = 'none';
    alert('Gagal: ' + err.message);
  });
}

function hapusJadwalRiwayatPerawat(i) {
  var p = nursePasienListTerakhirRiwayat[i];
  if (!p) return;
  var konfirmasi = window.confirm('Yakin mau menghapus jadwal (Siklus ' + p.siklus + ') mulai ' + p.tanggalMulai + '?\n\nTindakan ini tidak bisa dibatalkan.');
  if (!konfirmasi) return;

  document.getElementById('loadingRiwayatPerawat').style.display = 'block';
  document.getElementById('loadingRiwayatPerawat').innerText = 'Menghapus...';

  sb.from('nurse_schedules').delete().eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateNurseCacheAndReload();
    muatRiwayatPasienDetailPerawat(nurseRiwayatPasienAktif);
  }).catch(function (err) {
    document.getElementById('loadingRiwayatPerawat').style.display = 'none';
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
    statusEl.textContent = 'Berhasil! ' + jumlahSiklusDibuat + ' siklus tersimpan.';
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
    statusEl.textContent = 'Berhasil! ' + jumlahSiklusDibuat + ' siklus tersimpan.';
    invalidateNurseCacheAndReload();
    document.getElementById('tambahPerawatSiklus').value = '';
    if (elSiklusAkhir) elSiklusAkhir.value = '';
  }).catch(function (err) {
    document.getElementById('tambahPerawatSubmitBtn').disabled = false;
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Gagal: ' + err.message;
  });
}

// Muat tab pertama saat halaman dibuka (jika sudah login lewat sesi tersimpan)
document.getElementById('kalTanggalJump').value = toIsoDate(tanggalAktif);
var elKalPerawatJump2 = document.getElementById('kalPerawatTanggalJump');
if (elKalPerawatJump2) elKalPerawatJump2.value = toIsoDate(nurseTanggalAktif);
