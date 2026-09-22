// =====================================================================
// farmasi.js — modul FARMASI (depo), dipisahkan dari app.js pada Sesi 4.
// Berisi: state farmasi, data loading (loadAllSchedules dkk.), daftar
// nama obat, simpanBeberapaSiklusJadwal, dan TAB 1-7 (Kalender,
// Kebutuhan Obat, Daftar Pasien, Pasien Tertunda, Dashboard, Cari Obat,
// Daftarkan Pasien) beserta event listener terkait.
// Murni pindah lokasi — tidak ada logika/query yang berubah.
//
// UPDATE: ditambahkan fitur "Input Pemakaian Obat" (mengurangi stok)
// pada TAB 2: Kebutuhan Obat — lihat state currentPemakaianRows dan
// fungsi tambahBarisPemakaianKosong / hapusBarisPemakaian /
// renderPemakaianRowsTable / submitPemakaianObat di bawah.
//
// FIX: submitPemakaianObat() diperbaiki supaya tidak lagi menyisipkan
// baris stock_entries dengan jumlah minus (yang melanggar check
// constraint "stock_entries_jumlah_check"). Sekarang fungsi ini
// menghitung stok baru, lalu mengganti seluruh baris lama obat
// tersebut dengan satu baris berisi total stok terbaru (>= 0).
//
// UPDATE 2: ditambahkan deteksi "Perlu Dijadwalkan Ulang (30 Hari ke
// Depan)" di TAB 5: Dashboard — lihat fungsi cariPasienPerluDijadwalkan30Hari()
// dan blok render terkait di renderDashboard(). Deteksi ini murni
// dihitung dari data schedules + patients.interval_hari (tidak
// bergantung pada view v_patient_summary), sehingga independen dari
// logika "Berpotensi Belum Follow-up" yang sudah ada sebelumnya.
//
// UPDATE 3: ditambahkan kotak "Cari Obat & Stok Saat Ini" di TAB 2:
// Kebutuhan Obat — mengikuti pola yang sama seperti TAB 6: Cari Obat
// (langsung menampilkan semua nama obat + total stok saat ini begitu
// diketik, tanpa perlu isi rentang tanggal / klik tombol apa pun).
// Lihat state kebutuhanObatAllList dan fungsi
// muatDaftarObatStokKebutuhan() / renderDaftarObatKebutuhanSearch() di
// bawah. Tidak mengubah logika muatKebutuhanRentang() yang sudah ada.
// =====================================================================

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
var currentPemakaianRows = [];

// ---- state khusus tab Cari Obat (farmasi) ----
var obatAllListCariObat = [];
var obatAktifCariObat = null;

// ---- state khusus tab Daftar Pasien (dulu "Riwayat") — farmasi ----
var allPatientNames = [];
var riwayatPasienAktif = null;
var pasienListTerakhirRiwayat = [];
var currentObatListRiwayat = [];

// ---- state khusus kotak "Cari Obat & Stok Saat Ini" di TAB 2 (farmasi) ----
var kebutuhanObatAllList = [];

// cache: seluruh jadwal farmasi (schedules + items + nama pasien)
var allSchedulesCache = null;

// cache: daftar nama obat unik (farmasi)
var daftarNamaObatSharedCache = null;

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
  return Promise.all([
    loadAllSchedules(),
    sb.from('stock_entries').select('obat')
  ]).then(function (results) {
    var list = results[0];
    var stokRes = results[1];
    var namaObatSet = {};
    list.forEach(function (s) {
      s.items.forEach(function (it) { if (it.obat) namaObatSet[it.obat] = true; });
    });
    if (stokRes && !stokRes.error && stokRes.data) {
      stokRes.data.forEach(function (row) { if (row.obat) namaObatSet[row.obat] = true; });
    }
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
  setLoading('loadingKalender', true, 'kalender');

  loadAllSchedules().then(function (list) {
    setLoading('loadingKalender', false);
    var hariData = {};
    list.forEach(function (s) {
      if (s.dateObj.getFullYear() !== tahun || (s.dateObj.getMonth() + 1) !== bulan) return;
      var hari = s.dateObj.getDate();
      if (!hariData[hari]) hariData[hari] = { entriMap: {} };
      var teks = (s.siklus && s.siklus !== '-') ? (s.nama + ' ' + s.siklus) : s.nama;
      var isTertunda = s.keterangan.toLowerCase().indexOf('tertunda') !== -1;
      // kalau nama+siklus yang sama muncul lebih dari sekali, tandai tertunda kalau salah satunya tertunda
      hariData[hari].entriMap[teks] = (hariData[hari].entriMap[teks] || false) || isTertunda;
    });
    var hasil = {};
    Object.keys(hariData).forEach(function (h) {
      var teksList = Object.keys(hariData[h].entriMap).sort();
      hasil[h] = { daftarPasien: teksList.map(function (teks) { return { teks: teks, tertunda: hariData[h].entriMap[teks] }; }) };
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
    if (isBulanIni && hariIni.getDate() === tgl) kelas += ' hari-ini';
    if (isBulanTerpilih && tanggalAktif.getDate() === tgl) kelas += ' terpilih';

    html += '<div class="' + kelas + '" onclick="pilihTanggalKalender(' + tgl + ')"><div class="kal-tgl-num">' + tgl + '</div>';
    if (info) info.daftarPasien.forEach(function (entri) {
      html += '<div class="kal-entri">' + escapeHtml(entri.teks) + (entri.tertunda ? '<span class="kal-entri-titik-tertunda"></span>' : '') + '</div>';
    });
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
  setLoading('loadingKalDetail', true, 'list');
  document.getElementById('loadingKalDetail').innerText = 'Memuat jadwal...';
  document.getElementById('kalDetailContainer').innerHTML = '';

  loadAllSchedules().then(function (list) {
    setLoading('loadingKalDetail', false);
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
    document.getElementById('kalDetailContainer').innerHTML = '<div class="empty"><i class="ti ti-folder" aria-hidden="true"></i>Tidak ada jadwal kemoterapi pada tanggal ini.</div>';
    return;
  }

  var html = '<div class="ringkasan-jumlah">' + detail.pasienList.length + ' pasien terjadwal</div>';
  detail.pasienList.forEach(function (p, i) {
    var warnaBorder = warnaStatus(p.status);
    html += '<div class="card" style="border-left:4px solid ' + warnaBorder + ';">';
    html += '<div class="nama-row">' + renderAvatarInisial(p.nama, p.status) +
      '<div class="nama-info"><div class="nama">' + escapeHtml(p.nama) + '</div>' +
      '<div class="sub-info">Siklus ' + escapeHtml(p.siklus || '-') + '</div></div>' +
      renderBadge(p.status) + '</div>';

    p.obatList.forEach(function (o) {
      html += '<div class="obat-item obat-link-item"><span><i class="ti ti-link" aria-hidden="true"></i> ' + escapeHtml(o.obat) + '</span><span class="obat-jumlah">' + o.jumlah + '</span></div>';
    });

    html += '<div style="display:flex; gap:6px; margin-top:8px; align-items:stretch;">';
    if (p.status === 'Tertunda') {
      html += renderIkonBtn('ti-rotate', 'Batalkan', 'btn-neutral', 'toggleTertundaTanggal(' + i + ', false)', 'flex:1;');
    } else {
      html += renderIkonBtn('ti-clock-pause', 'Tandai Tertunda', 'btn-danger', 'toggleTertundaTanggal(' + i + ', true)', 'flex:1;');
    }
    html += renderIkonBtn('ti-pencil', 'Ubah', 'btn-accent', 'toggleUbahTanggalForm(' + i + ')', 'flex:1;');
    html += renderIkonBtnBulat('ti-trash', 'hapusJadwalTanggal(' + i + ')', 'Hapus Jadwal');
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
  setLoading('loadingKalDetail', true);
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
    setLoading('loadingKalDetail', false);
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

  setLoading('loadingKalDetail', true);
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
    setLoading('loadingKalDetail', false);
    alert('Gagal: ' + err.message);
  });
}

function hapusJadwalTanggal(i) {
  var p = pasienListTerakhirTanggal[i];
  if (!p) return;
  var konfirmasi = window.confirm('Yakin mau menghapus jadwal ' + p.nama + ' (Siklus ' + p.siklus + ') pada ' + tanggalTerakhirUntukTertunda + '?\n\nTindakan ini tidak bisa dibatalkan.');
  if (!konfirmasi) return;

  setLoading('loadingKalDetail', true);
  document.getElementById('loadingKalDetail').innerText = 'Menghapus...';

  sb.from('schedules').delete().eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateCacheAndReload();
    muatDetailTanggal();
  }).catch(function (err) {
    setLoading('loadingKalDetail', false);
    alert('Gagal: ' + err.message);
  });
}

// =====================================================================
// TAB 2: KEBUTUHAN OBAT (FARMASI)
// =====================================================================

// ---------------------------------------------------------------------
// TAMBAHAN: Cari Obat & Stok Saat Ini — mirip pola di TAB 6: Cari Obat.
// Begitu diketik di #kebutuhanObatSearchInput, langsung difilter dari
// kebutuhanObatAllList (nama obat + total stok saat ini), tanpa perlu
// mengisi rentang tanggal atau klik tombol apa pun. Data dimuat sekali
// di bawah (lihat pemanggilan di akhir bagian TAB 2 ini) dan di-refresh
// ulang tiap kali stok/pemakaian diupdate lewat submitUpdateStok() /
// submitPemakaianObat().
// ---------------------------------------------------------------------
function muatDaftarObatStokKebutuhan() {
  setLoading('loadingKebutuhanObatSearch', true, 'list');
  document.getElementById('daftarObatKebutuhanSearch').innerHTML = '';

  Promise.all([
    muatDaftarNamaObat(),
    sb.from('stock_entries').select('obat, jumlah')
  ]).then(function (results) {
    var namaList = results[0];
    var stokRes = results[1];
    setLoading('loadingKebutuhanObatSearch', false);

    var stokMap = {};
    if (stokRes && !stokRes.error && stokRes.data) {
      stokRes.data.forEach(function (row) {
        var key = (row.obat || '').toLowerCase();
        stokMap[key] = (stokMap[key] || 0) + Number(row.jumlah || 0);
      });
    }

    kebutuhanObatAllList = namaList.map(function (nama) {
      return { obat: nama, stok: stokMap[nama.toLowerCase()] || 0 };
    });

    renderDaftarObatKebutuhanSearch(document.getElementById('kebutuhanObatSearchInput').value);
  }).catch(function (err) {
    setLoading('loadingKebutuhanObatSearch', false);
    document.getElementById('daftarObatKebutuhanSearch').innerHTML = 'Gagal memuat: ' + escapeHtml(err.message);
  });
}

function renderDaftarObatKebutuhanSearch(filter) {
  var container = document.getElementById('daftarObatKebutuhanSearch');
  if (!container) return;
  var f = (filter || '').trim().toLowerCase();
  var filtered = kebutuhanObatAllList.filter(function (o) { return o.obat.toLowerCase().indexOf(f) !== -1; });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty"><i class="ti ti-folder" aria-hidden="true"></i>Tidak ada obat yang cocok.</div>';
    return;
  }

  var html = '<div class="pasien-list-card">';
  filtered.forEach(function (o) {
    html += '<div class="pasien-item"><span><i class="ti ti-pill" aria-hidden="true" style="color:var(--accent); margin-right:6px;"></i>' + escapeHtml(o.obat) + '</span>' +
      '<span class="obat-jumlah" style="font-size:13px;">Stok ' + o.stok + '</span></div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

document.getElementById('kebutuhanObatSearchInput').addEventListener('input', function () {
  renderDaftarObatKebutuhanSearch(this.value);
});
// ---------------------------------------------------------------------
// END TAMBAHAN
// ---------------------------------------------------------------------

function muatKebutuhanRentang() {
  var isoMulai = document.getElementById('rentangMulai').value;
  var isoAkhir = document.getElementById('rentangAkhir').value;
  if (!isoMulai || !isoAkhir) {
    document.getElementById('ringkasanRentang').innerText = 'Isi kedua tanggal terlebih dahulu.';
    return;
  }
  setLoading('loadingRentang', true, 'tabel');
  document.getElementById('ringkasanRentang').innerHTML = '';
  document.getElementById('contentRentang').innerHTML = '';

  Promise.all([
    loadAllSchedules(),
    sb.from('stock_entries').select('obat, jumlah')
  ]).then(function (results) {
    var list = results[0];
    var stokRes = results[1];
    setLoading('loadingRentang', false);
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
    var stokNamaAsli = {};
    if (stokRes && !stokRes.error && stokRes.data) {
      stokRes.data.forEach(function (row) {
        var key = (row.obat || '').toLowerCase();
        stokMap[key] = (stokMap[key] || 0) + Number(row.jumlah || 0);
        if (!stokNamaAsli[key]) stokNamaAsli[key] = row.obat;
      });
    }

    // Obat yang sudah ada catatan stoknya tapi belum dipakai di jadwal rentang ini
    // tetap dimasukkan, supaya stok yang baru diinput tidak "hilang" dari daftar.
    Object.keys(stokMap).forEach(function (k) {
      if (!groups[k]) groups[k] = { obat: stokNamaAsli[k], totalJumlah: 0, pasienSet: {} };
    });

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
    setLoading('loadingRentang', false);
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
    html += '<div style="padding:8px 0; border-top:1px solid var(--border);">' +
      '<div class="total-item" style="padding:0 0 6px;"><span>' + escapeHtml(item.obat) + '</span>' +
      '<span style="color:' + warna + '; font-weight:700;">' +
      (kurang ? ('Kurang ' + Math.abs(item.selisih) + ' (pesan)') : ('Sisa +' + item.selisih)) +
      '</span></div>' +
      renderProgressBarStok(item.stok, item.totalJumlah) +
      '</div>';
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
  currentStokRows.push({ obat: '', jumlah: '' });
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
    return (r.obat || '').trim() !== '' && r.jumlah !== '' && !isNaN(Number(r.jumlah)) && Number(r.jumlah) >= 0;
  });
  if (valid.length === 0) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Isi minimal satu baris (obat, jumlah stok saat ini) dengan benar.';
    return;
  }

  document.getElementById('stokMasukSubmitBtn').disabled = true;
  statusEl.textContent = 'Menyimpan...';

  var tanggalOtomatis = toIsoDate(new Date());

  var deletePromises = valid.map(function (r) {
    return sb.from('stock_entries').delete().ilike('obat', r.obat.trim());
  });

  Promise.all(deletePromises).then(function (delResults) {
    var failedDelete = delResults.find(function (r) { return r.error; });
    if (failedDelete) throw failedDelete.error;

    var rows = valid.map(function (r) { return { obat: r.obat.trim(), tanggal: tanggalOtomatis, jumlah: Number(r.jumlah) }; });
    return sb.from('stock_entries').insert(rows);
  }).then(function (res) {
    document.getElementById('stokMasukSubmitBtn').disabled = false;
    if (res.error) { statusEl.className = 'status-msg error'; statusEl.textContent = 'Gagal: ' + res.error.message; return; }
    statusEl.className = 'status-msg ok';
    statusEl.textContent = 'Stok berhasil diupdate.';
    currentStokRows = [{ obat: '', jumlah: '' }];
    renderStokRowsTable();
    invalidateCacheAndReload();
    isiDatalistObat('daftarObatDatalistTambah');
    muatDaftarObatStokKebutuhan();
    if (document.getElementById('rentangMulai').value && document.getElementById('rentangAkhir').value) muatKebutuhanRentang();
  }).catch(function (err) {
    document.getElementById('stokMasukSubmitBtn').disabled = false;
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Gagal: ' + err.message;
  });
}

// =====================================================================
// TAMBAHAN: INPUT PEMAKAIAN OBAT (mengurangi stok) — TAB 2: KEBUTUHAN OBAT
// =====================================================================
function tambahBarisPemakaianKosong() {
  currentPemakaianRows.push({ obat: '', jumlah: '' });
  renderPemakaianRowsTable();
}

function hapusBarisPemakaian(i) {
  currentPemakaianRows.splice(i, 1);
  renderPemakaianRowsTable();
}

function renderPemakaianRowsTable() {
  var container = document.getElementById('pemakaianRowsContainer');
  if (!container) return;
  var html = '';
  currentPemakaianRows.forEach(function (item, i) {
    html += '<div class="obat-row">' +
      '<input list="daftarObatDatalistTambah" data-i="' + i + '" data-f="obat" placeholder="Nama obat" value="' + escapeHtml(item.obat || '') + '">' +
      '<input type="number" min="0" data-i="' + i + '" data-f="jumlah" placeholder="Jumlah dipakai" value="' + escapeHtml(item.jumlah != null ? String(item.jumlah) : '') + '">' +
      '<button type="button" onclick="hapusBarisPemakaian(' + i + ')">×</button></div>';
  });
  container.innerHTML = html;
  container.querySelectorAll('.obat-row input').forEach(function (inp) {
    var handler = function () {
      var i = parseInt(this.getAttribute('data-i'), 10);
      var f = this.getAttribute('data-f');
      currentPemakaianRows[i][f] = this.value;
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
  });
}

function submitPemakaianObat() {
  var statusEl = document.getElementById('pemakaianStatus');
  statusEl.className = 'status-msg';
  statusEl.textContent = '';

  var valid = currentPemakaianRows.filter(function (r) {
    return (r.obat || '').trim() !== '' && r.jumlah !== '' && !isNaN(Number(r.jumlah)) && Number(r.jumlah) > 0;
  });
  if (valid.length === 0) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Isi minimal satu baris (obat, jumlah pemakaian) dengan benar.';
    return;
  }

  document.getElementById('pemakaianSubmitBtn').disabled = true;
  statusEl.textContent = 'Memeriksa stok...';

  var dibatalkan = false;

  sb.from('stock_entries').select('obat, jumlah').then(function (stokRes) {
    if (stokRes.error) throw stokRes.error;
    var stokMap = {};
    var namaAsliMap = {};
    (stokRes.data || []).forEach(function (row) {
      var key = (row.obat || '').toLowerCase();
      stokMap[key] = (stokMap[key] || 0) + Number(row.jumlah || 0);
      if (!namaAsliMap[key]) namaAsliMap[key] = row.obat;
    });

    var kurang = [];
    var updates = []; // { obat, key, stokBaru, namaAsli }
    valid.forEach(function (r) {
      var key = r.obat.trim().toLowerCase();
      var stokSaatIni = stokMap[key] || 0;
      var stokBaru = stokSaatIni - Number(r.jumlah);
      if (stokBaru < 0) {
        kurang.push(r.obat.trim() + ' (stok ' + stokSaatIni + ', dipakai ' + r.jumlah + ')');
      }
      updates.push({ obat: r.obat.trim(), key: key, stokBaru: stokBaru, namaAsli: namaAsliMap[key] || r.obat.trim() });
    });

    if (kurang.length > 0) {
      var lanjut = window.confirm(
        'Stok tidak cukup untuk: ' + kurang.join(', ') + '.\n\n' +
        'Database tidak mengizinkan stok minus, jadi kalau dilanjutkan, stok obat tersebut akan diset menjadi 0 (bukan minus). Tetap lanjutkan?'
      );
      if (!lanjut) {
        dibatalkan = true;
        return null;
      }
    }

    statusEl.textContent = 'Menyimpan pemakaian...';

    // Hapus dulu semua entri stok lama utk obat-obat yang diupdate,
    // lalu insert satu baris baru berisi TOTAL stok terbaru (selalu >= 0),
    // supaya tidak melanggar check constraint stock_entries_jumlah_check.
    var deletePromises = updates.map(function (u) {
      return sb.from('stock_entries').delete().ilike('obat', u.obat);
    });

    return Promise.all(deletePromises).then(function (delResults) {
      var failedDelete = delResults.find(function (r) { return r.error; });
      if (failedDelete) throw failedDelete.error;

      var tanggalOtomatis = toIsoDate(new Date());
      var rows = updates.map(function (u) {
        return { obat: u.namaAsli, tanggal: tanggalOtomatis, jumlah: Math.max(0, u.stokBaru) };
      });
      return sb.from('stock_entries').insert(rows);
    });
  }).then(function (res) {
    document.getElementById('pemakaianSubmitBtn').disabled = false;
    if (dibatalkan) { statusEl.textContent = ''; return; }
    if (res && res.error) { statusEl.className = 'status-msg error'; statusEl.textContent = 'Gagal: ' + res.error.message; return; }
    statusEl.className = 'status-msg ok';
    statusEl.textContent = 'Pemakaian berhasil dicatat, stok terupdate.';
    currentPemakaianRows = [{ obat: '', jumlah: '' }];
    renderPemakaianRowsTable();
    invalidateCacheAndReload();
    isiDatalistObat('daftarObatDatalistTambah');
    muatDaftarObatStokKebutuhan();
    if (document.getElementById('rentangMulai').value && document.getElementById('rentangAkhir').value) muatKebutuhanRentang();
  }).catch(function (err) {
    document.getElementById('pemakaianSubmitBtn').disabled = false;
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Gagal: ' + err.message;
  });
}

// =====================================================================
// TAB 3: DAFTAR PASIEN (FARMASI)
// =====================================================================
function muatDaftarPasien() {
  setLoading('loadingRiwayatList', true, 'list');
  sb.from('patients').select('nama').order('nama').then(function (res) {
    setLoading('loadingRiwayatList', false);
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
    container.innerHTML = '<div class="empty"><i class="ti ti-folder" aria-hidden="true"></i>Tidak ada pasien yang cocok.</div>';
    return;
  }

  var html = '<div class="pasien-card-list">';
  filtered.forEach(function (nama, idx) {
    html += '<div class="card card-pasien-row" data-idx="' + idx + '">' + renderAvatarInisial(nama, 'Belum Kemo') +
      '<div class="nama-info"><div class="nama" style="margin-bottom:0;">' + escapeHtml(nama) + '</div></div>' +
      '<i class="ti ti-chevron-right" aria-hidden="true" style="color:var(--muted); font-size:18px; flex-shrink:0;"></i></div>';
  });
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.card-pasien-row').forEach(function (el) {
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
  setLoading('loadingRiwayat', true, 'riwayat');
  document.getElementById('loadingRiwayat').innerText = 'Memuat riwayat...';

  loadAllSchedules().then(function (list) {
    setLoading('loadingRiwayat', false);
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
    html += renderIkonBtn('ti-pencil', 'Ubah Tanggal', 'btn-accent', 'toggleUbahTanggalRiwayat(' + i + ')', 'flex:1;');
    html += renderIkonBtn('ti-trash', 'Hapus Jadwal', 'btn-danger', 'hapusJadwalRiwayat(' + i + ')', 'flex:1;');
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

  setLoading('loadingRiwayat', true);
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
    setLoading('loadingRiwayat', false);
    alert('Gagal: ' + err.message);
  });
}

function hapusJadwalRiwayat(i) {
  var p = pasienListTerakhirRiwayat[i];
  if (!p) return;
  var konfirmasi = window.confirm('Yakin mau menghapus jadwal (Siklus ' + p.siklus + ') pada ' + p.tanggal + '?\n\nTindakan ini tidak bisa dibatalkan.');
  if (!konfirmasi) return;

  setLoading('loadingRiwayat', true);
  document.getElementById('loadingRiwayat').innerText = 'Menghapus...';

  sb.from('schedules').delete().eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateCacheAndReload();
    muatRiwayatPasienDetail(riwayatPasienAktif);
  }).catch(function (err) {
    setLoading('loadingRiwayat', false);
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
  setLoading('loadingTertunda', true, 'kartu');
  document.getElementById('ringkasanTertunda').innerHTML = '';
  document.getElementById('contentTertunda').innerHTML = '';

  loadAllSchedules().then(function (list) {
    tertundaDimuat = true;
    setLoading('loadingTertunda', false);
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
    setLoading('loadingTertunda', false);
    document.getElementById('ringkasanTertunda').innerText = 'Gagal memuat: ' + err.message;
  });
}

function renderTertunda(detail) {
  pasienListTerakhirTertunda = detail.pasienList;

  if (!detail.pasienList || detail.pasienList.length === 0) {
    document.getElementById('ringkasanTertunda').innerHTML = 'Tidak ada pasien yang berstatus Tertunda saat ini. <i class="ti ti-circle-check" aria-hidden="true" style="color:var(--success); vertical-align:-2px;"></i>';
    return;
  }
  document.getElementById('ringkasanTertunda').innerHTML = detail.pasienList.length + ' pasien berstatus Tertunda';
  var html = '';
  detail.pasienList.forEach(function (p, i) {
    var warnaBorder = warnaStatus('Tertunda');
    html += '<div class="card" style="border-left:4px solid ' + warnaBorder + ';">';
    html += '<div class="nama-row">' + renderAvatarInisial(p.nama, 'Tertunda') +
      '<div class="nama-info"><div class="nama">' + escapeHtml(p.nama) + '</div>' +
      '<div class="sub-info">Siklus ' + escapeHtml(p.siklus) + ' &middot; Jadwal asal ' + p.tanggalAsal + '</div></div>' +
      renderBadge('Tertunda') + '</div>';

    p.obatList.forEach(function (o) { html += '<div class="obat-item obat-link-item"><span><i class="ti ti-link" aria-hidden="true"></i> ' + escapeHtml(o.obat) + '</span><span class="obat-jumlah">' + o.jumlah + '</span></div>'; });

    html += '<div style="display:flex; gap:6px; margin-top:8px; align-items:stretch;">';
    html += renderIkonBtn('ti-rotate', 'Batalkan Tunda', 'btn-neutral', 'batalkanTundaTertunda(' + i + ')', 'flex:1;');
    html += renderIkonBtn('ti-pencil', 'Ubah', 'btn-accent', 'toggleUbahTanggalTertunda(' + i + ')', 'flex:1;');
    html += renderIkonBtnBulat('ti-trash', 'hapusJadwalTertunda(' + i + ')', 'Hapus Jadwal');
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
  setLoading('loadingTertunda', true);
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
    setLoading('loadingTertunda', false);
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

  setLoading('loadingTertunda', true);
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
    setLoading('loadingTertunda', false);
    alert('Gagal: ' + err.message);
  });
}

function hapusJadwalTertunda(i) {
  var p = pasienListTerakhirTertunda[i];
  if (!p) return;
  var konfirmasi = window.confirm('Yakin mau menghapus jadwal ' + p.nama + ' (Siklus ' + p.siklus + ') pada ' + p.tanggalAsal + '?\n\nTindakan ini tidak bisa dibatalkan.');
  if (!konfirmasi) return;

  setLoading('loadingTertunda', true);
  document.getElementById('loadingTertunda').innerText = 'Menghapus...';

  sb.from('schedules').delete().eq('id', p.id).then(function (res) {
    if (res.error) throw res.error;
    invalidateCacheAndReload();
    muatPasienTertunda();
  }).catch(function (err) {
    setLoading('loadingTertunda', false);
    alert('Gagal: ' + err.message);
  });
}

// =====================================================================
// TAB 5: DASHBOARD (FARMASI)
// =====================================================================

// ---------------------------------------------------------------------
// TAMBAHAN: Deteksi pasien yang belum dijadwalkan ulang setelah siklus
// terakhirnya, KHUSUS untuk perkiraan jadwal berikutnya yang jatuh dalam
// 30 hari ke depan (hari ini s/d +30 hari).
//
// Dihitung murni dari: jadwal terakhir tiap pasien (allSchedulesCache)
// + patients.interval_hari. TIDAK bergantung pada view v_patient_summary,
// sehingga independen dari logika "Berpotensi Belum Follow-up" yang sudah
// ada sebelumnya (yang mendeteksi kasus yang SUDAH lewat/terlambat).
//
// Ada 2 kategori pasien yang masuk daftar ini:
// 1) Punya interval_hari, dan perkiraan jadwal berikutnya (tanggal terakhir
//    + interval) jatuh dalam 30 hari ke depan, tapi belum ada jadwal baru.
// 2) Total jadwalnya HANYA SATU KALI SAJA (belum pernah dijadwalkan lagi
//    sama sekali sejak kemo pertama & satu-satunya), jadwal itu sudah
//    lewat, dan tidak ada jadwal lain dalam 30 hari ke depan. Kategori ini
//    tetap dimasukkan walau interval_hari belum diisi, karena justru
//    itulah kasus yang paling rawan "terlewat" tanpa follow-up.
// ---------------------------------------------------------------------
function cariPasienPerluDijadwalkan30Hari() {
  return Promise.all([
    loadAllSchedules(),
    sb.from('patients').select('id, nama, interval_hari')
  ]).then(function (results) {
    var list = results[0];
    var patientsRes = results[1];
    if (patientsRes.error) throw patientsRes.error;

    var hariIni = dateOnly(new Date());
    var batasAkhir = new Date(hariIni.getTime() + 30 * 86400000);

    // jadwal terakhir + jumlah total jadwal per pasien (berdasarkan patient_id)
    var terakhirPerPasien = {};
    var jumlahJadwalPerPasien = {};
    list.forEach(function (s) {
      var key = s.patient_id;
      jumlahJadwalPerPasien[key] = (jumlahJadwalPerPasien[key] || 0) + 1;
      if (!terakhirPerPasien[key] || s.dateObj.getTime() > terakhirPerPasien[key].dateObj.getTime()) {
        terakhirPerPasien[key] = s;
      }
    });

    var hasil = [];
    var sudahMasuk = {}; // supaya tidak dobel antara kategori 1 & 2

    (patientsRes.data || []).forEach(function (p) {
      var last = terakhirPerPasien[p.id];
      if (!last) return; // belum pernah kemo sama sekali, di luar cakupan fitur ini

      var sudahAdaJadwalBaru = list.some(function (s) {
        return s.patient_id === p.id && s.dateObj.getTime() > last.dateObj.getTime();
      });
      if (sudahAdaJadwalBaru) return; // sudah dijadwalkan ulang

      // ----- Kategori 1: berdasarkan interval_hari -----
      if (p.interval_hari) {
        var perkiraan = new Date(last.dateObj.getTime() + p.interval_hari * 86400000);
        var perkiraanD = dateOnly(perkiraan);
        if (perkiraanD.getTime() >= hariIni.getTime() && perkiraanD.getTime() <= batasAkhir.getTime()) {
          var sisaHari = Math.round((perkiraanD.getTime() - hariIni.getTime()) / 86400000);
          hasil.push({
            nama: p.nama,
            patientId: p.id,
            tanggalTerakhir: last.tanggal,
            perkiraanBerikutnya: formatDDMMYYYY(perkiraanD),
            sisaHari: sisaHari,
            catatan: null
          });
          sudahMasuk[p.id] = true;
        }
      }

      // ----- Kategori 2: total jadwal cuma 1x, sudah lewat, tanpa follow-up -----
      if (!sudahMasuk[p.id] && jumlahJadwalPerPasien[p.id] === 1 && dateOnly(last.dateObj).getTime() < hariIni.getTime()) {
        hasil.push({
          nama: p.nama,
          patientId: p.id,
          tanggalTerakhir: last.tanggal,
          perkiraanBerikutnya: '-',
          sisaHari: null,
          catatan: 'Baru 1x kemo tercatat, belum ada jadwal lanjutan'
        });
        sudahMasuk[p.id] = true;
      }
    });

    // urutkan: yang punya sisaHari (kategori 1) naik dulu (paling dekat di atas),
    // lalu kategori 2 (tanpa perkiraan) di bagian bawah.
    hasil.sort(function (a, b) {
      if (a.sisaHari == null && b.sisaHari == null) return 0;
      if (a.sisaHari == null) return 1;
      if (b.sisaHari == null) return -1;
      return a.sisaHari - b.sisaHari;
    });
    return hasil;
  });
}

function muatDashboard() {
  setLoading('loadingDashboard', true, 'dashboard');
  document.getElementById('contentDashboard').innerHTML = '';

  Promise.all([
    loadAllSchedules(),
    sb.from('v_patient_summary').select('nama, perkiraan_kemo_berikutnya'),
    sb.from('stock_entries').select('obat, jumlah'),
    cariPasienPerluDijadwalkan30Hari()
  ]).then(function (results) {
    var list = results[0];
    var summaryRes = results[1];
    var stokRes = results[2];
    var perluDijadwalkan30Hari = results[3];
    dashboardDimuat = true;
    setLoading('loadingDashboard', false);

    var hariIni = dateOnly(new Date());
    var besok = new Date(hariIni.getTime() + 86400000);
    var akhir7Hari = new Date(hariIni.getTime() + 6 * 86400000);
    var awalMinggu = new Date(hariIni.getTime() - 6 * 86400000);
    var awalBulan = new Date(hariIni.getFullYear(), hariIni.getMonth(), 1);
    var akhirBulan = new Date(hariIni.getFullYear(), hariIni.getMonth() + 1, 0);

    var pasienMinggu = {}, pasienBulan = {}, tertundaSet = {};
    var kebutuhan7Hari = {};
    list.forEach(function (s) {
      var d = dateOnly(s.dateObj);
      if (d.getTime() >= awalMinggu.getTime() && d.getTime() <= hariIni.getTime()) pasienMinggu[s.nama] = true;
      if (d.getTime() >= awalBulan.getTime() && d.getTime() <= akhirBulan.getTime()) pasienBulan[s.nama] = true;
      if (s.keterangan.toLowerCase().indexOf('tertunda') !== -1) tertundaSet[s.nama + '|' + s.tanggal] = true;

      // Kumpulkan kebutuhan obat 7 hari ke depan (hari ini s/d +6 hari) untuk cek stok kritis
      if (d.getTime() >= hariIni.getTime() && d.getTime() <= akhir7Hari.getTime()) {
        s.items.forEach(function (it) {
          var key = it.obat.toLowerCase();
          if (!kebutuhan7Hari[key]) kebutuhan7Hari[key] = { obat: it.obat, totalJumlah: 0 };
          kebutuhan7Hari[key].totalJumlah += it.jumlah;
        });
      }
    });

    // Stok kritis: obat yang stok saat ini < kebutuhan 7 hari ke depan
    var stokMap = {};
    if (stokRes && !stokRes.error && stokRes.data) {
      stokRes.data.forEach(function (row) {
        var key = (row.obat || '').toLowerCase();
        stokMap[key] = (stokMap[key] || 0) + Number(row.jumlah || 0);
      });
    }
    var stokKritis = Object.keys(kebutuhan7Hari).map(function (k) {
      var butuh = kebutuhan7Hari[k].totalJumlah;
      var stok = stokMap[k] || 0;
      return { obat: kebutuhan7Hari[k].obat, butuh: butuh, stok: stok, kurang: stok - butuh };
    }).filter(function (item) { return item.kurang < 0; })
      .sort(function (a, b) { return a.kurang - b.kurang; }); // paling kritis (paling negatif) di atas

    // Ringkasan jadwal hari ini & besok
    function ringkasJadwalTanggal(target) {
      var arr = list.filter(function (s) { return dateOnly(s.dateObj).getTime() === target.getTime(); });
      var totalObat = {};
      arr.forEach(function (s) {
        s.items.forEach(function (it) {
          var key = it.obat.toLowerCase();
          if (!totalObat[key]) totalObat[key] = { obat: it.obat, totalJumlah: 0 };
          totalObat[key].totalJumlah += it.jumlah;
        });
      });
      return {
        jumlahPasien: arr.length,
        totalObat: Object.keys(totalObat).map(function (k) { return totalObat[k]; }).sort(function (a, b) { return a.obat.localeCompare(b.obat); })
      };
    }
    var ringkasanHariIni = ringkasJadwalTanggal(hariIni);
    var ringkasanBesok = ringkasJadwalTanggal(besok);

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
      stokKritis: stokKritis,
      ringkasanHariIni: ringkasanHariIni,
      ringkasanBesok: ringkasanBesok,
      pasienBerpotensiHilang: pasienBerpotensiHilang,
      perluDijadwalkan30Hari: perluDijadwalkan30Hari
    });
    muatGrafikPasien(modeGrafikPasienAktif);
  }).catch(function (err) {
    setLoading('loadingDashboard', false);
    document.getElementById('contentDashboard').innerHTML = 'Gagal memuat: ' + escapeHtml(err.message);
  });
}

function renderDashboard(r) {
  var html = '<div style="display:flex; gap:10px; margin-bottom:14px;">';
  html += '<div class="card" style="flex:1; text-align:center;"><div style="font-size:26px; font-weight:700; color:var(--accent-dim); font-family:var(--font-mono);">' + r.totalPasienMingguIni + '</div><div style="font-size:12px; color:var(--muted);">Pasien Minggu Ini</div></div>';
  html += '<div class="card" style="flex:1; text-align:center;"><div style="font-size:26px; font-weight:700; color:var(--success); font-family:var(--font-mono);">' + r.totalPasienBulanIni + '</div><div style="font-size:12px; color:var(--muted);">Pasien Bulan Ini</div></div>';
  html += '<div class="card" style="flex:1; text-align:center;"><div style="font-size:26px; font-weight:700; color:var(--danger); font-family:var(--font-mono);">' + r.totalTertunda + '</div><div style="font-size:12px; color:var(--muted);">Tertunda</div></div>';
  html += '</div>';

  // ===== Ringkasan Jadwal Hari Ini & Besok =====
  html += '<div style="display:flex; gap:10px; margin-bottom:14px;">';
  html += '<div class="card" style="flex:1; margin-bottom:0;">';
  html += '<div class="nama" style="font-size:14px; display:flex; justify-content:space-between; align-items:center;"><span>Jadwal Hari Ini</span><span style="font-family:var(--font-mono); color:var(--accent-dim); font-weight:700;">' + r.ringkasanHariIni.jumlahPasien + ' pasien</span></div>';
  if (r.ringkasanHariIni.totalObat.length === 0) {
    html += '<div style="font-size:12px; color:var(--muted);">Tidak ada jadwal.</div>';
  } else {
    r.ringkasanHariIni.totalObat.forEach(function (t) {
      html += '<div class="obat-item"><span>' + escapeHtml(t.obat) + '</span><span class="obat-jumlah">' + t.totalJumlah + '</span></div>';
    });
  }
  html += '</div>';

  html += '<div class="card" style="flex:1; margin-bottom:0;">';
  html += '<div class="nama" style="font-size:14px; display:flex; justify-content:space-between; align-items:center;"><span>Jadwal Besok</span><span style="font-family:var(--font-mono); color:var(--accent-dim); font-weight:700;">' + r.ringkasanBesok.jumlahPasien + ' pasien</span></div>';
  if (r.ringkasanBesok.totalObat.length === 0) {
    html += '<div style="font-size:12px; color:var(--muted);">Tidak ada jadwal.</div>';
  } else {
    r.ringkasanBesok.totalObat.forEach(function (t) {
      html += '<div class="obat-item"><span>' + escapeHtml(t.obat) + '</span><span class="obat-jumlah">' + t.totalJumlah + '</span></div>';
    });
  }
  html += '</div>';
  html += '</div>';

  // ===== Stok Obat Kritis (7 Hari ke Depan) =====
  if (r.stokKritis.length > 0) {
    html += '<div class="card" style="margin-bottom:14px; border-left:4px solid var(--danger);">';
    html += '<div class="nama" style="font-size:14px;"><i class="ti ti-alert-triangle" aria-hidden="true" style="color:var(--danger); vertical-align:-2px;"></i> Stok Obat Kritis (' + r.stokKritis.length + ')</div>';
    html += '<div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Stok saat ini tidak cukup untuk kebutuhan 7 hari ke depan &mdash; segera pesan.</div>';
    r.stokKritis.forEach(function (item) {
      html += '<div style="padding:8px 0; border-top:1px solid var(--border);">' +
        '<div class="total-item" style="padding:0 0 4px;"><span>' + escapeHtml(item.obat) + '</span></div>' +
        renderProgressBarStok(item.stok, item.butuh) +
        '</div>';
    });
    html += '</div>';
  } else {
    html += '<div class="card" style="margin-bottom:14px; border-left:4px solid var(--success);">';
    html += '<div class="nama" style="font-size:14px;"><i class="ti ti-circle-check" aria-hidden="true" style="color:var(--success); vertical-align:-2px;"></i> Stok Obat Aman</div>';
    html += '<div style="font-size:12px; color:var(--muted);">Stok saat ini mencukupi kebutuhan 7 hari ke depan.</div>';
    html += '</div>';
  }

  // ===== TAMBAHAN: Perlu Dijadwalkan Ulang (30 Hari ke Depan) =====
  // Warna KUNING/ORANYE (--warning, fallback ke --accent) dipakai supaya
  // beda urgensi dengan "Berpotensi Belum Follow-up" (merah, sudah lewat).
  // Kuning = perkiraan jadwal berikutnya masih akan datang dalam 30 hari,
  // jadi sifatnya perencanaan, bukan darurat.
  if (r.perluDijadwalkan30Hari && r.perluDijadwalkan30Hari.length > 0) {
    html += '<div class="card" style="margin-bottom:14px; border-left:4px solid var(--warning, var(--accent));">';
    html += '<div class="nama" style="font-size:14px;"><i class="ti ti-calendar-due" aria-hidden="true" style="color:var(--warning, var(--accent)); vertical-align:-2px;"></i> Perlu Dijadwalkan Ulang &ndash; 30 Hari ke Depan (' + r.perluDijadwalkan30Hari.length + ')</div>';
    html += '<div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Perkiraan jadwal berikutnya jatuh dalam 30 hari ke depan (atau baru 1x kemo & belum ada jadwal lanjutan), tapi belum ada jadwal baru. Klik nama pasien untuk membuka detailnya.</div>';
    r.perluDijadwalkan30Hari.forEach(function (p, i) {
      var kananHtml = (p.sisaHari != null)
        ? ('<span style="color:var(--warning, var(--accent)); font-weight:700;">' + p.sisaHari + ' hari lagi</span>')
        : ('<span style="color:var(--warning, var(--accent)); font-weight:700; font-size:11px;">Belum ada perkiraan</span>');
      var subInfo = p.catatan
        ? ('Kemo (satu-satunya): ' + p.tanggalTerakhir + ' &middot; ' + escapeHtml(p.catatan))
        : ('Kemo terakhir: ' + p.tanggalTerakhir + ' &middot; Perkiraan berikutnya: ' + p.perkiraanBerikutnya);
      html += '<div class="dash-pasien-link" data-idx="' + i + '" style="padding:8px 0; border-top:1px solid var(--border); cursor:pointer;">' +
        '<div class="total-item" style="padding:0;"><span style="color:var(--accent-dim); text-decoration:underline;">' + escapeHtml(p.nama) + '</span>' +
        kananHtml + '</div>' +
        '<div style="font-size:11px; color:var(--muted); margin-top:2px;">' + subInfo + '</div>' +
        '</div>';
    });
    html += '</div>';
  }

  html += '<div class="total-section"><h2>Jumlah Pasien Kemo</h2>';
  html += '<div style="display:flex; gap:8px; margin-bottom:12px;">';
  html += '<button onclick="muatGrafikPasien(\'bulan\')" id="btnGrafikBulan" style="flex:1; border:none; border-radius:16px; padding:8px; font-size:12px; font-weight:600;">Per Bulan</button>';
  html += '<button onclick="muatGrafikPasien(\'minggu\')" id="btnGrafikMinggu" style="flex:1; border:none; border-radius:16px; padding:8px; font-size:12px; font-weight:600;">Per Minggu</button>';
  html += '</div>';
  html += '<div id="loadingGrafikPasien" style="text-align:center; color:var(--muted); font-size:12px; padding:10px; display:none;">Memuat...</div>';
  html += '<div id="loadingGrafikPasienSkeleton" class="skel-container" style="display:none;"></div>';
  html += '<div id="grafikPasienContainer"></div></div>';

  if (r.pasienBerpotensiHilang.length > 0) {
    html += '<div class="card" style="margin-top:14px; border-left:4px solid var(--danger);">';
    html += '<div class="nama" style="font-size:14px;"><i class="ti ti-alert-triangle" aria-hidden="true" style="color:var(--danger); vertical-align:-2px;"></i> Berpotensi Belum Follow-up (' + r.pasienBerpotensiHilang.length + ')</div>';
    html += '<div style="font-size:12px; color:var(--muted); margin-bottom:8px;">Perkiraan jadwal berikutnya sudah lewat &gt;7 hari, belum ada jadwal baru</div>';
    r.pasienBerpotensiHilang.forEach(function (p) {
      html += '<div class="obat-item"><span>' + escapeHtml(p.nama) + '</span><span style="color:var(--danger); font-weight:600;">' + p.terlambatHari + ' hari</span></div>';
    });
    html += '</div>';
  }

  document.getElementById('contentDashboard').innerHTML = html;
  setActiveGrafikButton();

  // pasang klik untuk baris "Perlu Dijadwalkan Ulang" -> buka Daftar Pasien
  document.querySelectorAll('#contentDashboard .dash-pasien-link').forEach(function (el) {
    el.addEventListener('click', function () {
      var idx = parseInt(this.getAttribute('data-idx'), 10);
      var p = r.perluDijadwalkan30Hari[idx];
      if (p) bukaPasienDariDashboard(p.nama);
    });
  });
}

// ---------------------------------------------------------------------
// TAMBAHAN: navigasi dari Dashboard -> tab "Daftar Pasien" -> langsung
// buka detail riwayat pasien yang bersangkutan.
// ---------------------------------------------------------------------
function bukaPasienDariDashboard(nama) {
  if (typeof switchTab === 'function') switchTab('riwayat');
  // beri jeda singkat supaya elemen tab Daftar Pasien sudah tampil
  // sebelum kita paksa masuk ke tampilan detail.
  setTimeout(function () { pilihPasienRiwayat(nama); }, 50);
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
  setLoading('loadingGrafikPasien', true, 'grafik');
  containerEl.innerHTML = '';

  loadAllSchedules().then(function (list) {
    setLoading('loadingGrafikPasien', false);
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
// Begitu tab dibuka: langsung tampil daftar semua nama obat + stok saat
// ini (list, bisa langsung difilter dengan mengetik — tanpa perlu Enter).
// Klik salah satu obat untuk melihat detail: jadwal pemakaian TERDEKAT
// (dari hari ini ke depan, diurutkan naik supaya yang paling dekat
// selalu tampil paling atas) beserta total kebutuhannya, lalu riwayat
// pemakaian yang sudah lewat.
// =====================================================================
function muatDaftarObatUntukPencarian() {
  setLoading('loadingCariObatList', true, 'list');
  document.getElementById('daftarObatCariObat').innerHTML = '';

  Promise.all([
    muatDaftarNamaObat(),
    sb.from('stock_entries').select('obat, jumlah')
  ]).then(function (results) {
    var namaList = results[0];
    var stokRes = results[1];
    setLoading('loadingCariObatList', false);
    obatDatalistDimuat = true;

    var stokMap = {};
    if (stokRes && !stokRes.error && stokRes.data) {
      stokRes.data.forEach(function (row) {
        var key = (row.obat || '').toLowerCase();
        stokMap[key] = (stokMap[key] || 0) + Number(row.jumlah || 0);
      });
    }

    obatAllListCariObat = namaList.map(function (nama) {
      return { obat: nama, stok: stokMap[nama.toLowerCase()] || 0 };
    });

    renderDaftarObatCariObat(document.getElementById('obatSearchInput').value);
  }).catch(function (err) {
    setLoading('loadingCariObatList', false);
    document.getElementById('daftarObatCariObat').innerHTML = 'Gagal memuat: ' + escapeHtml(err.message);
  });
}

function renderDaftarObatCariObat(filter) {
  var container = document.getElementById('daftarObatCariObat');
  if (!container) return;
  var f = (filter || '').trim().toLowerCase();
  var filtered = obatAllListCariObat.filter(function (o) { return o.obat.toLowerCase().indexOf(f) !== -1; });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty"><i class="ti ti-folder" aria-hidden="true"></i>Tidak ada obat yang cocok.</div>';
    return;
  }

  var html = '<div class="pasien-list-card">';
  filtered.forEach(function (o, idx) {
    html += '<div class="pasien-item" data-idx="' + idx + '"><span><i class="ti ti-pill" aria-hidden="true" style="color:var(--accent); margin-right:6px;"></i>' + escapeHtml(o.obat) + '</span>' +
      '<span class="obat-jumlah" style="font-size:13px;">Stok ' + o.stok + '</span></div>';
  });
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.pasien-item').forEach(function (el) {
    el.addEventListener('click', function () {
      var idx = parseInt(this.getAttribute('data-idx'), 10);
      pilihObatCariObat(filtered[idx].obat);
    });
  });
}

document.getElementById('obatSearchInput').addEventListener('input', function () {
  renderDaftarObatCariObat(this.value);
});

function pilihObatCariObat(obat) {
  obatAktifCariObat = obat;
  document.getElementById('cariObatListWrap').style.display = 'none';
  document.getElementById('cariObatDetailWrap').style.display = 'block';
  document.getElementById('cariObatDetailNama').textContent = obat;
  muatDetailObatCariObat(obat);
}

function kembaliKeDaftarObat() {
  obatAktifCariObat = null;
  document.getElementById('cariObatDetailWrap').style.display = 'none';
  document.getElementById('cariObatListWrap').style.display = 'block';
}

function muatDetailObatCariObat(obat) {
  document.getElementById('contentCariObat').innerHTML = '';
  document.getElementById('ringkasanCariObat').innerHTML = '';
  setLoading('loadingCariObat', true, 'riwayat');
  document.getElementById('loadingCariObat').innerText = 'Memuat detail...';

  Promise.all([
    loadAllSchedules(),
    sb.from('stock_entries').select('jumlah').ilike('obat', obat)
  ]).then(function (results) {
    var list = results[0];
    var stokRes = results[1];
    setLoading('loadingCariObat', false);

    var stokSaatIni = 0;
    if (stokRes && !stokRes.error && stokRes.data) {
      stokRes.data.forEach(function (row) { stokSaatIni += Number(row.jumlah || 0); });
    }

    var hariIni = dateOnly(new Date());
    var daftarPemakaian = [];
    list.forEach(function (s) {
      s.items.forEach(function (it) {
        if (it.obat.toLowerCase() !== obat.toLowerCase()) return;
        daftarPemakaian.push({ nama: s.nama, siklus: s.siklus, tanggal: s.tanggal, jumlah: it.jumlah, dateObj: s.dateObj });
      });
    });

    // Pisahkan jadwal yang akan datang (>= hari ini) dari yang sudah lewat,
    // supaya jadwal PALING DEKAT dengan hari ini selalu tampil paling atas —
    // bukan sekadar jadwal yang paling baru diinput/terjadi.
    var akanDatang = daftarPemakaian.filter(function (d) { return dateOnly(d.dateObj).getTime() >= hariIni.getTime(); });
    var sudahLewat = daftarPemakaian.filter(function (d) { return dateOnly(d.dateObj).getTime() < hariIni.getTime(); });

    akanDatang.sort(function (a, b) { return a.dateObj.getTime() - b.dateObj.getTime(); }); // naik: paling dekat di atas
    sudahLewat.sort(function (a, b) { return b.dateObj.getTime() - a.dateObj.getTime(); }); // turun: riwayat terbaru di atas

    var totalKebutuhanAkanDatang = akanDatang.reduce(function (sum, d) { return sum + d.jumlah; }, 0);

    renderDetailObatCariObat({
      obat: obat,
      stok: stokSaatIni,
      akanDatang: akanDatang,
      sudahLewat: sudahLewat,
      totalKebutuhanAkanDatang: totalKebutuhanAkanDatang
    });
  }).catch(function (err) {
    setLoading('loadingCariObat', false);
    document.getElementById('ringkasanCariObat').innerText = 'Gagal memuat: ' + err.message;
  });
}

function renderDetailObatCariObat(res) {
  var ringkasanHtml = 'Stok saat ini: <strong>' + res.stok + '</strong>';
  if (res.akanDatang.length > 0) {
    ringkasanHtml += ' &middot; Pemakaian terdekat: <strong>' + res.akanDatang[0].tanggal + '</strong> (butuh ' + res.akanDatang[0].jumlah + ')';
  } else {
    ringkasanHtml += ' &middot; Tidak ada jadwal pemakaian akan datang';
  }
  document.getElementById('ringkasanCariObat').innerHTML = ringkasanHtml;

  var html = '';

  if (res.akanDatang.length > 0) {
    html += '<div class="total-section"><h2>Jadwal Pemakaian Akan Datang (' + res.akanDatang.length + ')</h2>';
    html += '<div class="total-item" style="font-weight:700;"><span>Total kebutuhan (akan datang)</span><span>' + res.totalKebutuhanAkanDatang + '</span></div>';
    html += '</div>';

    html += '<div style="margin-top:12px;">';
    res.akanDatang.forEach(function (item, i) {
      var label = (i === 0) ? '<span style="font-size:11px; font-weight:700; color:var(--accent-dim); text-transform:uppercase; letter-spacing:0.3px;">Terdekat</span>' : '';
      html += '<div class="card">' +
        '<div class="nama" style="display:flex; justify-content:space-between; align-items:center;">' +
        '<span>' + escapeHtml(item.nama) + '</span>' + label + '</div>' +
        '<div style="font-size:12px; color:var(--muted); margin-bottom:4px;">Siklus ' + escapeHtml(item.siklus) + '</div>' +
        '<div class="obat-item"><span>' + item.tanggal + '</span><span class="obat-jumlah">' + item.jumlah + '</span></div></div>';
    });
    html += '</div>';
  } else {
    html += '<div class="empty"><i class="ti ti-folder" aria-hidden="true"></i>Tidak ada jadwal pemakaian akan datang untuk obat ini.</div>';
  }

  if (res.sudahLewat.length > 0) {
    html += '<div class="total-section" style="margin-top:16px;"><h2>Riwayat Pemakaian (Sudah Lewat)</h2></div>';
    html += '<div style="margin-top:12px;">';
    res.sudahLewat.forEach(function (item) {
      html += '<div class="card"><div class="nama" style="font-size:14px;">' + escapeHtml(item.nama) +
        ' <span style="font-size:12px; color:var(--muted); font-weight:normal;">Siklus ' + escapeHtml(item.siklus) + '</span></div>' +
        '<div class="obat-item"><span>' + item.tanggal + '</span><span class="obat-jumlah">' + item.jumlah + '</span></div></div>';
    });
    html += '</div>';
  }

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
// TAMBAHAN: muat daftar "Cari Obat & Stok Saat Ini" (Tab 2) begitu
// halaman selesai diparse — supaya langsung terisi tanpa harus
// menunggu app.js memanggil sesuatu saat tab "Kebutuhan Obat" dibuka.
// Aman dipanggil sedini ini karena hanya mengisi konten di dalam div
// tab yang statusnya display:none (tidak mengganggu tab lain).
// =====================================================================
muatDaftarObatStokKebutuhan();
